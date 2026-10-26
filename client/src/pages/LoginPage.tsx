
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const successMessage = (
    location.state as { message?: string } | null
  )?.message;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginUser({ email: email.trim(), password });

      if (!result.accessToken) {
        throw new Error('The server did not return an access token.');
      }

      signIn(result);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Check your details and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-emerald-950 p-10 text-white md:flex">
          <Link to="/login" className="text-xl font-bold tracking-tight">
            Repair<span className="text-emerald-300 font-bold">Circle</span>
          </Link>

          <div className="max-w-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              ♻
            </div>
            <h1 className="text-4xl font-semibold leading-tight">
              Better things happen when we help each other.
            </h1>
            <p className="mt-4 leading-7 text-emerald-100/80">
              Sign in to manage your listings, connect with neighbors, and
              continue your repair or swap journey.
            </p>
          </div>

          <p className="text-xs text-emerald-100/60">
            Repair more. Share more. Waste less.
          </p>
        </section>

        <section className="px-6 py-9 sm:px-10 sm:py-12">
          <div className="mb-8 md:hidden">
            <Link to="/login" className="text-xl font-bold text-emerald-900">
              Repair<span className="text-emerald-600 font-bold">Circle</span>
            </Link>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-700">
              WELCOME BACK
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pick up where you left off in your community.
            </p>
          </div>

          {successMessage && (
            <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            New to RepairCircle?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
