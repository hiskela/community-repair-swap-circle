import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getAdminOverview, type AdminOverview } from '../../services/api';

const statCards = [
  {
    title: 'Total Users',
    value: (data: AdminOverview) => data.users.total,
    detail: (data: AdminOverview) => `${data.users.active} active`,
    icon: '👥',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    title: 'Total Listings',
    value: (data: AdminOverview) => data.listings.total,
    detail: (data: AdminOverview) => `${data.listings.open} open`,
    icon: '📦',
    color: 'bg-green-50 text-green-700',
  },
  {
    title: 'Transactions',
    value: (data: AdminOverview) => data.transactions.total,
    detail: (data: AdminOverview) => `${data.transactions.inProgress} in progress`,
    icon: '🔄',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    title: 'Pending Reports',
    value: (data: AdminOverview) => data.reports.pending,
    detail: (data: AdminOverview) => `${data.reports.total} total reports`,
    icon: '🛡️',
    color: 'bg-orange-50 text-orange-700',
  },
];

const quickLinks = [
  {
    title: 'Review Disputes',
    description: 'Review transactions that need administrator attention.',
    path: '/admin/disputes',
    icon: '⚖️',
  },
  {
    title: 'Manage Reports',
    description: 'Review reports submitted by community members.',
    path: '/admin/reports',
    icon: '🛡️',
  },
  {
    title: 'Manage Listings',
    description: 'Review and moderate community listings.',
    path: '/admin/listings',
    icon: '📦',
  },
  {
    title: 'Manage Users',
    description: 'View users and manage account status.',
    path: '/admin/users',
    icon: '👥',
  },
];

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOverview() {
      if (!token) {
        setError('Your session has expired. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const result = await getAdminOverview(token);
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard statistics.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadOverview();
  }, [token]);

  return (
<div className="min-h-screen space-y-8 bg-gray-50 p-6 text-gray-900">      <div>
        <p className="text-sm font-medium text-blue-600">
          COMMUNITY MANAGEMENT
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-500">
          Monitor activity and manage the Repair & Swap Circle community.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {error}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Community Overview
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    {card.title}
                  </p>
                  <span
                    className={`rounded-xl px-3 py-2 text-xl ${card.color}`}
                  >
                    {card.icon}
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold text-gray-900">
                  {card.value(data).toLocaleString()}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {card.detail(data)}
                </p>
              </div>
            ))}
          </div>
        ) : !error ? (
          <p className="text-gray-500">No dashboard data is available.</p>
        ) : null}
      </section>

      {data && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Transaction & Report Status
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">Transactions</h3>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">In progress</span>
                  <span className="font-semibold">{data.transactions.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-semibold">{data.transactions.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Disputed</span>
                  <span className="font-semibold text-red-600">{data.transactions.disputed}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">Reports</h3>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending review</span>
                  <span className="font-semibold text-orange-600">{data.reports.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reviewed</span>
                  <span className="font-semibold">{data.reports.reviewed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dismissed</span>
                  <span className="font-semibold">{data.reports.dismissed}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}