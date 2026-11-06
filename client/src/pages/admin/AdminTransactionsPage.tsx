import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminTransactions,
  type AdminTransaction,
} from '../../services/api';

const statuses = [
  'all',
  'agreed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
];

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function statusStyle(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'disputed':
      return 'bg-red-500/10 text-red-400';
    case 'cancelled':
      return 'bg-slate-700 text-slate-300';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-400';
    default:
      return 'bg-amber-500/10 text-amber-400';
  }
}

export default function AdminTransactionsPage() {
  const { token } = useAuth();

  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadTransactions() {
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getAdminTransactions(
        token,
        statusFilter === 'all' ? undefined : statusFilter,
      );

      setTransactions(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load transactions.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [token, statusFilter]);

  const statistics = useMemo(
    () => ({
      total: transactions.length,
      agreed: transactions.filter((item) => item.status === 'agreed').length,
      inProgress: transactions.filter(
        (item) => item.status === 'in_progress',
      ).length,
      completed: transactions.filter(
        (item) => item.status === 'completed',
      ).length,
      disputed: transactions.filter(
        (item) => item.status === 'disputed',
      ).length,
      cancelled: transactions.filter(
        (item) => item.status === 'cancelled',
      ).length,
    }),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const value = search.toLowerCase().trim();

    return transactions.filter((transaction) => {
      const listing = transaction.listing?.title || '';
      const requester = transaction.requester?.name || '';
      const provider = transaction.provider?.name || '';

      return (
        !value ||
        listing.toLowerCase().includes(value) ||
        requester.toLowerCase().includes(value) ||
        provider.toLowerCase().includes(value) ||
        transaction._id.toLowerCase().includes(value)
      );
    });
  }, [transactions, search]);

  const selectedTransaction = transactions.find(
    (transaction) => transaction._id === selectedId,
  );

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-emerald-400">
          Community Management
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Transactions
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Monitor community transactions, their participants, and progress.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total', value: statistics.total, color: 'text-white' },
          { label: 'Agreed', value: statistics.agreed, color: 'text-amber-400' },
          {
            label: 'In Progress',
            value: statistics.inProgress,
            color: 'text-blue-400',
          },
          {
            label: 'Completed',
            value: statistics.completed,
            color: 'text-emerald-400',
          },
          {
            label: 'Disputed',
            value: statistics.disputed,
            color: 'text-red-400',
          },
          {
            label: 'Cancelled',
            value: statistics.cancelled,
            color: 'text-slate-400',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search listing, participant, or transaction ID..."
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'All statuses' : formatStatus(status)}
            </option>
          ))}
        </select>

        <button
          onClick={loadTransactions}
          disabled={loading}
          className="rounded-lg border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">
            Transaction Records
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {filteredTransactions.length} transaction(s) found
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No transactions found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTransactions.map((transaction) => (
              <div key={transaction._id} className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(transaction.status)}`}
                      >
                        {formatStatus(transaction.status)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mt-3 font-semibold text-white">
                      {transaction.listing?.title || 'Listing unavailable'}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      ID: {transaction._id}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                      <span>
                        Requester: {transaction.requester?.name || 'Unknown'}
                      </span>
                      <span>
                        Provider: {transaction.provider?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedId(
                        selectedId === transaction._id
                          ? null
                          : transaction._id,
                      )
                    }
                    className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    {selectedId === transaction._id
                      ? 'Hide Details'
                      : 'View Details'}
                  </button>
                </div>

                {selectedId === transaction._id && (
                  <div className="mt-5 space-y-5 rounded-lg border border-slate-700 bg-slate-950 p-4">
                    <div>
                      <h4 className="font-semibold text-white">
                        Transaction Details
                      </h4>

                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-500">Listing</p>
                          <p className="mt-1 text-sm text-slate-200">
                            {transaction.listing?.title || 'Unavailable'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Category</p>
                          <p className="mt-1 text-sm text-slate-200">
                            {transaction.listing?.category || 'Unavailable'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Requester email
                          </p>
                          <p className="mt-1 break-all text-sm text-slate-200">
                            {transaction.requester?.email || 'Unavailable'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Provider email
                          </p>
                          <p className="mt-1 break-all text-sm text-slate-200">
                            {transaction.provider?.email || 'Unavailable'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Location</p>
                          <p className="mt-1 text-sm text-slate-200">
                            {transaction.listing?.location || 'Not specified'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Last updated
                          </p>
                          <p className="mt-1 text-sm text-slate-200">
                            {new Date(
                              transaction.updatedAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white">
                        Transaction History
                      </h4>

                      {!transaction.history?.length ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No history available.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {transaction.history.map((entry, index) => (
                            <div
                              key={`${transaction._id}-${index}`}
                              className="border-l-2 border-emerald-500/40 pl-4"
                            >
                              <p className="text-sm font-medium capitalize text-slate-200">
                                {formatStatus(entry.status)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {entry.changedBy?.name || 'System'}
                              </p>
                              {entry.note && (
                                <p className="mt-1 text-sm text-slate-400">
                                  {entry.note}
                                </p>
                              )}
                              {entry.createdAt && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div className="sr-only" aria-live="polite">
          Selected transaction {selectedTransaction._id}
        </div>
      )}
    </div>
  );
}