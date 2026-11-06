import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminActivityLogs,
  type AdminActivityLog,
} from '../../services/api';

const actionOptions = ['CREATE', 'UPDATE', 'DELETE'];
const resourceOptions = [
  'users',
  'listings',
  'offers',
  'transactions',
  'claims',
  'safety',
  'system',
];

function formatLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function actionStyle(action: string) {
  switch (action) {
    case 'CREATE':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'UPDATE':
      return 'bg-blue-500/10 text-blue-400';
    case 'DELETE':
      return 'bg-red-500/10 text-red-400';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

export default function AdminActivityLogsPage() {
  const { token } = useAuth();

  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] =
    useState<AdminActivityLog | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await getAdminActivityLogs(token, {
        page,
        limit: 20,
        action: action || undefined,
        resource: resource || undefined,
      });

      setLogs(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load activity logs.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, page, action, resource]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return logs;

    return logs.filter((log) =>
      [
        log.actorId?.name,
        log.actorId?.email,
        log.action,
        log.resource,
        log.description,
        log.endpoint,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(value)),
    );
  }, [logs, search]);

  const statistics = useMemo(
    () => ({
      displayed: logs.length,
      created: logs.filter((log) => log.action === 'CREATE').length,
      updated: logs.filter((log) => log.action === 'UPDATE').length,
      deleted: logs.filter((log) => log.action === 'DELETE').length,
    }),
    [logs],
  );

  function changeFilter(
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Community Management
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Activity Logs
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitor important actions performed across the platform.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="rounded-lg border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: 'Total Activities',
            value: total,
            color: 'text-white',
          },
          {
            label: 'Created',
            value: statistics.created,
            color: 'text-emerald-400',
          },
          {
            label: 'Updated',
            value: statistics.updated,
            color: 'text-blue-400',
          },
          {
            label: 'Deleted',
            value: statistics.deleted,
            color: 'text-red-400',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className={`mt-2 text-3xl font-bold ${item.color}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search user, action, or description..."
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
        />

        <select
          value={action}
          onChange={(event) =>
            changeFilter(setAction, event.target.value)
          }
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="">All actions</option>
          {actionOptions.map((item) => (
            <option key={item} value={item}>
              {formatLabel(item)}
            </option>
          ))}
        </select>

        <select
          value={resource}
          onChange={(event) =>
            changeFilter(setResource, event.target.value)
          }
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="">All resources</option>
          {resourceOptions.map((item) => (
            <option key={item} value={item}>
              {formatLabel(item)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">
            Platform Activity
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {filteredLogs.length} displayed on this page · {total} total
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading activity logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No activity logs found.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredLogs.map((log) => (
              <div key={log._id} className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${actionStyle(log.action)}`}
                      >
                        {formatLabel(log.action)}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatLabel(log.resource)}
                      </span>

                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="mt-3 font-medium text-white">
                      {log.description}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {log.actorId?.name || 'Unknown user'}
                      {' · '}
                      {log.actorRole}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedLog(
                        selectedLog?._id === log._id ? null : log,
                      )
                    }
                    className="shrink-0 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                  >
                    {selectedLog?._id === log._id
                      ? 'Hide Details'
                      : 'View Details'}
                  </button>
                </div>

                {selectedLog?._id === log._id && (
                  <div className="mt-5 grid gap-4 rounded-lg border border-slate-700 bg-slate-950 p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">User email</p>
                      <p className="mt-1 break-all text-sm text-slate-200">
                        {log.actorId?.email || 'Unavailable'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">User ID</p>
                      <p className="mt-1 break-all text-sm text-slate-200">
                        {log.actorId?._id || 'Unavailable'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">HTTP method</p>
                      <p className="mt-1 text-sm text-slate-200">
                        {log.method}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">IP address</p>
                      <p className="mt-1 text-sm text-slate-200">
                        {log.ipAddress || 'Unavailable'}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-500">Endpoint</p>
                      <p className="mt-1 break-all text-sm text-slate-200">
                        {log.endpoint}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-500">User agent</p>
                      <p className="mt-1 break-all text-sm text-slate-200">
                        {log.userAgent || 'Unavailable'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 p-4">
          <p className="text-xs text-slate-500">
            Page {page} of {Math.max(totalPages, 1)}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>

            <button
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1),
                )
              }
              disabled={page >= totalPages || loading || totalPages === 0}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}