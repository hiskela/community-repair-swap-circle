
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import PasswordInput from '../components/PasswordInput';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectParam = new URLSearchParams(location.search).get('redirect');
  const loginHref = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : '/login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser({ name: name.trim(), email: email.trim(), password });
      navigate(loginHref, {
        state: { message: 'Your account has been created. You can now sign in.' },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-emerald-950 p-10 text-white md:flex">
          <Link to="/register" className="text-xl font-bold tracking-tight">
            Repair<span className="text-emerald-300">Circle</span>
          </Link>

          <div className="max-w-sm">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              ♻
            </div>
            <h1 className="text-4xl font-semibold leading-tight">
              Give useful things a second life.
            </h1>
            <p className="mt-4 leading-7 text-emerald-100/80">
              Join your community to repair, exchange, and share skills instead
              of letting good things go to waste.
            </p>

            <div className="mt-8 space-y-3 text-sm text-emerald-50/90">
              <p>✓ Connect with people in your community</p>
              <p>✓ Find repair help and useful parts</p>
              <p>✓ Swap items and share your skills</p>
            </div>
          </div>

          <p className="text-xs text-emerald-100/60">
            Small repairs. Less waste. Stronger communities.
          </p>
        </section>

        <section className="px-6 py-9 sm:px-10 sm:py-12">
          <div className="mb-8 md:hidden">
            <Link to="/register" className="text-xl font-bold text-emerald-900">
              Repair<span className="text-emerald-600">Circle</span>
            </Link>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-700">
              JOIN THE CIRCLE
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Get started with your local repair and swap community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength={60}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

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
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
              />
              <p className="mt-2 text-xs text-slate-500">
                Use at least 8 characters.
              </p>
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to={loginHref}
              className="font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
