
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type DashboardData = {
  name: string;
  email: string;
  listings: number;
  sentOffers: number;
  receivedOffers: number;
  transactions: number;
  unreadNotifications: number;
};

async function fetchResource(path: string, token: string) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`${path} request failed (${response.status})`);
  }

  return response.json();
}

function getItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;

  if (data && typeof data === 'object') {
    const result = data as Record<string, unknown>;

    for (const key of ['items', 'data', 'results', 'listings', 'offers', 'transactions', 'notifications']) {
      if (Array.isArray(result[key])) return result[key] as unknown[];
    }
  }

  return [];
}

function getUnreadCount(data: unknown) {
  return getItems(data).filter((item) => {
    return (
      item !== null &&
      typeof item === 'object' &&
      (item as Record<string, unknown>).isRead === false
    );
  }).length;
}

export default function DashboardPage() {
  const { token, signOut } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData>({
    name: '',
    email: '',
    listings: 0,
    sentOffers: 0,
    receivedOffers: 0,
    transactions: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        fetchResource('/users/me', token!),
        fetchResource('/listings', token!),
        fetchResource('/offers/sent', token!),
        fetchResource('/offers/received', token!),
        fetchResource('/transactions/my', token!),
        fetchResource('/notifications', token!),
      ]);

      if (cancelled) return;

      const [profile, listings, sent, received, transactions, notifications] =
        results;

      const failed = results.some((result) => result.status === 'rejected');

      const profileData =
        profile.status === 'fulfilled' && profile.value
          ? (profile.value as Record<string, unknown>)
          : {};

      setData({
        name:
          typeof profileData.name === 'string' ? profileData.name : '',
        email:
          typeof profileData.email === 'string' ? profileData.email : '',
        listings:
          listings.status === 'fulfilled'
            ? getItems(listings.value).length
            : 0,
        sentOffers:
          sent.status === 'fulfilled' ? getItems(sent.value).length : 0,
        receivedOffers:
          received.status === 'fulfilled'
            ? getItems(received.value).length
            : 0,
        transactions:
          transactions.status === 'fulfilled'
            ? getItems(transactions.value).length
            : 0,
        unreadNotifications:
          notifications.status === 'fulfilled'
            ? getUnreadCount(notifications.value)
            : 0,
      });

      if (failed) {
        setError(
          'Some dashboard information could not be loaded. Check your backend endpoints and try again.',
        );
      }

      setLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  const stats = [
    {
      label: 'Community listings',
      value: data.listings,
      icon: '▤',
      description: 'Items shared by the community',
    },
    {
      label: 'Offers sent',
      value: data.sentOffers,
      icon: '↗',
      description: 'Offers you have made',
    },
    {
      label: 'Offers received',
      value: data.receivedOffers,
      icon: '↙',
      description: 'Offers on your listings',
    },
    {
      label: 'My transactions',
      value: data.transactions,
      icon: '⇄',
      description: 'Your repair and swap activity',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight text-emerald-950">
            Repair<span className="text-emerald-600">Circle</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-emerald-700"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-emerald-950 px-6 py-8 text-white sm:px-9 sm:py-10">
          <p className="text-sm font-medium text-emerald-300">
            YOUR COMMUNITY, YOUR IMPACT
          </p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome{data.name ? `, ${data.name}` : ' back'}!
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/80 sm:text-base">
                Find repair help, share useful items, and turn small actions
                into a stronger, more sustainable community.
              </p>
              {data.email && (
                <p className="mt-3 text-sm text-emerald-200/80">{data.email}</p>
              )}
            </div>

            <Link
              to="/listings/new"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
            >
              + Create a listing
            </Link>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center"
          >
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="shrink-0 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Your overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              A snapshot of activity across your community.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-md hover:shadow-slate-200/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">
                    {stat.icon}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? '—' : stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">Get started</h2>
            <p className="mt-1 text-sm text-slate-500">
              What would you like to do today?
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/listings"
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                  Explore listings →
                </span>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Discover items, repair requests, and useful parts.
                </p>
              </Link>

              <Link
                to="/listings/new"
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                  Share something →
                </span>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Publish an item or ask your community for repair help.
                </p>
              </Link>

              <Link
                to="/offers"
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                  Manage offers →
                </span>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Review offers you sent and received.
                </p>
              </Link>

              <Link
                to="/transactions"
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                  View transactions →
                </span>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Follow the progress of your agreements.
                </p>
              </Link>
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                {loading ? '—' : data.unreadNotifications} unread
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep track of new offers, transaction updates, and other activity.
            </p>

            <div className="mt-auto pt-6">
              <Link
                to="/notifications"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                View notifications →
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          RepairCircle · Repair more, share more, waste less.
        </footer>
      </main>
    </div>
  );
}
