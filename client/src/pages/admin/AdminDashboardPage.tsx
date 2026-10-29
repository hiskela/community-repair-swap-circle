
import { useAuth } from '../../auth/AuthContext';

export default function AdminDashboardPage() {
  const { role, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Community Repair & Swap Circle
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-slate-400">
          Welcome to the administration area.
        </p>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Current role</p>
          <p className="mt-2 text-xl font-semibold capitalize text-emerald-400">
            {role}
          </p>
        </div>

        <button
          onClick={signOut}
          className="mt-6 rounded-lg bg-red-600 px-5 py-2 font-medium hover:bg-red-700"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
