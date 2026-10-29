
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const navigation = [
  { label: 'Overview', path: '/admin', icon: '◫', end: true },
  { label: 'Disputes', path: '/admin/disputes', icon: '⚖' },
  { label: 'Reports', path: '/admin/reports', icon: '⚑' },
  { label: 'Listings', path: '/admin/listings', icon: '▤' },
  { label: 'Users', path: '/admin/users', icon: '♙' },
  { label: 'Transactions', path: '/admin/transactions', icon: '⇄' },
  { label: 'Activity Log', path: '/admin/activity', icon: '◷' },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <aside className="w-full border-b border-slate-800 bg-slate-900 p-5 md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Repair & Swap
          </p>
          <h1 className="mt-2 text-xl font-bold">Admin Console</h1>
          <p className="mt-1 text-sm text-slate-400">
            Community management
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="mt-6 w-full rounded-lg border border-slate-700 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-red-500 hover:text-red-400"
        >
          Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
