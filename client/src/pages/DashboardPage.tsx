
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { signOut } = useAuth();

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome to Repair & Swap Circle
        </h1>
        <p className="mt-3 text-slate-600">
          Your account is connected. We'll build your listings dashboard next.
        </p>
        <button
          onClick={signOut}
          className="mt-6 rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-700"
        >
          Log out
        </button>
      </section>
    </main>
  );
}
