
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

const initialData: DashboardData = {
  name: '',
  email: '',
  listings: 0,
  sentOffers: 0,
  receivedOffers: 0,
  transactions: 0,
  unreadNotifications: 0,
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

    for (const key of [
      'items',
      'data',
      'results',
      'listings',
      'offers',
      'transactions',
      'notifications',
    ]) {
      if (Array.isArray(result[key])) return result[key] as unknown[];
    }
  }

  return [];
}

function getUnreadCount(data: unknown) {
  return getItems(data).filter(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      (item as Record<string, unknown>).isRead === false,
  ).length;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData>(initialData);
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

      const profileData =
        profile.status === 'fulfilled' && profile.value
          ? (profile.value as Record<string, unknown>)
          : {};

      setData({
        name: typeof profileData.name === 'string' ? profileData.name : '',
        email: typeof profileData.email === 'string' ? profileData.email : '',
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

      if (results.some((result) => result.status === 'rejected')) {
        setError(
          'Some information could not be loaded. Please try again.',
        );
      }

      setLoading(false);
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const stats = [
    {
      label: 'Listings',
      value: data.listings,
      icon: '▤',
      description: 'Items and repair requests',
      to: '/listings',
    },
    {
      label: 'Sent offers',
      value: data.sentOffers,
      icon: '↗',
      description: 'Offers you have made',
      to: '/offers/sent',
    },
    {
      label: 'Received offers',
      value: data.receivedOffers,
      icon: '↙',
      description: 'Offers on your listings',
      to: '/offers/received',
    },
    {
      label: 'My transactions',
      value: data.transactions,
      icon: '⇄',
      description: 'Your repair and swap agreements',
      to: '/transactions',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Community Repair & Swap Circle
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome{data.name ? `, ${data.name}` : ' back'}!
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100 sm:text-base">
                Repair useful items, share what you no longer need, and
                connect with people in your community.
              </p>

              {data.email && (
                <p className="mt-3 text-sm text-emerald-200">
                  {data.email}
                </p>
              )}
            </div>

            <Link
              to="/listings/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-900"
            >
              <span className="text-lg">+</span>
              Create listing
            </Link>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => navigate(0)}
              className="shrink-0 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Your activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A quick look at your community activity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.to}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-600">
                    {stat.label}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700 transition group-hover:bg-emerald-100">
                    {stat.icon}
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {loading ? '—' : stat.value}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {stat.description}
                </p>

                <p className="mt-4 text-sm font-semibold text-emerald-700">
                  View details <span aria-hidden="true">→</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-900">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose what you want to do next.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                to="/listings"
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="font-semibold text-slate-900 group-hover:text-emerald-800">
                  Browse listings →
                </span>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Find items, repair requests, and useful parts.
                </p>
              </Link>

              <Link
                to="/offers/received"
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="font-semibold text-slate-900 group-hover:text-emerald-800">
                  Review received offers →
                </span>
                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Review offers and respond to other members.
                </p>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700">
                ♧
              </span>
              <div>
                <h2 className="font-bold text-slate-900">
                  Community impact
                </h2>
                <p className="text-sm text-slate-500">
                  Small actions make a difference.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Repairing and swapping helps useful items stay in use and
              reduces unnecessary waste.
            </p>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                Unread notifications
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {loading ? '—' : data.unreadNotifications}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Updates about your offers and transactions.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          Repair & Swap Circle · Repair more, share more, waste less.
        </footer>
      </div>
    </main>
  );
}
