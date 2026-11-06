import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminReports,
  moderateAdminReport,
  type AdminReport,
} from '../../services/api';

type ReportStatus = 'pending' | 'reviewed' | 'dismissed';

function getReporterName(reporter: AdminReport['reporter']) {
  return typeof reporter === 'string'
    ? 'Unknown reporter'
    : reporter.name || reporter.email || 'Unknown reporter';
}

function getReporterEmail(reporter: AdminReport['reporter']) {
  return typeof reporter === 'string' ? '' : reporter.email || '';
}

function getTargetId(targetId: AdminReport['targetId']) {
  return typeof targetId === 'string' ? targetId : targetId._id;
}

function getStatusStyle(status: ReportStatus) {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/10 text-amber-400';
    case 'reviewed':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'dismissed':
      return 'bg-red-500/10 text-red-400';
  }
}

export default function AdminReportsPage() {
  const { token } = useAuth();

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    null,
  );
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadReports() {
    if (!token) {
      setError('Authentication token not found.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getAdminReports(token);
      setReports(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load reports.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [token]);

  const statistics = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((report) => report.status === 'pending').length,
      reviewed: reports.filter((report) => report.status === 'reviewed').length,
      dismissed: reports.filter((report) => report.status === 'dismissed')
        .length,
    }),
    [reports],
  );

  const filteredReports = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return reports.filter((report) => {
      const reporterName = getReporterName(report.reporter).toLowerCase();
      const reporterEmail = getReporterEmail(report.reporter).toLowerCase();
      const reason = report.reason.toLowerCase();
      const targetId = getTargetId(report.targetId).toLowerCase();

      const matchesSearch =
        !searchValue ||
        reporterName.includes(searchValue) ||
        reporterEmail.includes(searchValue) ||
        reason.includes(searchValue) ||
        targetId.includes(searchValue) ||
        report.targetType.includes(searchValue);

      const matchesStatus =
        statusFilter === 'all' || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  async function handleModeration(
    reportId: string,
    status: 'reviewed' | 'dismissed',
  ) {
    if (!token) {
      setError('Authentication token not found.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await moderateAdminReport(
        reportId,
        status,
        adminNotes.trim(),
        token,
      );

      setSuccess(
        status === 'reviewed'
          ? 'Report marked as reviewed.'
          : 'Report dismissed successfully.',
      );

      setSelectedReportId(null);
      setAdminNotes('');

      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update report.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-emerald-400">
          Community Safety
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Reports Management
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Review reports submitted by community members and take appropriate
          action.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Reports',
            value: statistics.total,
            color: 'text-white',
          },
          {
            label: 'Pending',
            value: statistics.pending,
            color: 'text-amber-400',
          },
          {
            label: 'Reviewed',
            value: statistics.reviewed,
            color: 'text-emerald-400',
          },
          {
            label: 'Dismissed',
            value: statistics.dismissed,
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search reporter, reason, or target ID..."
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <button
          onClick={loadReports}
          disabled={loading}
          className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Submitted Reports</h2>
          <p className="mt-1 text-xs text-slate-400">
            {filteredReports.length} report(s) found
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">
            Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-300">No reports found</p>
            <p className="mt-1 text-sm text-slate-500">
              Reports matching your search will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredReports.map((report) => {
              const isSelected = selectedReportId === report._id;

              return (
                <div key={report._id} className="p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(report.status)}`}
                        >
                          {report.status}
                        </span>

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300">
                          {report.targetType} report
                        </span>
                      </div>

                      <h3 className="mt-3 font-semibold text-white">
                        Report against {report.targetType}
                      </h3>

                      <p className="mt-1 break-all text-xs text-slate-500">
                        Target ID: {getTargetId(report.targetId)}
                      </p>

                      <p className="mt-3 text-sm text-slate-300">
                        {report.reason}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                        <span>
                          Reporter: {getReporterName(report.reporter)}
                        </span>
                        <span>
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {getReporterEmail(report.reporter) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {getReporterEmail(report.reporter)}
                        </p>
                      )}

                      {report.adminNotes && (
                        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950 p-3">
                          <p className="text-xs font-semibold text-slate-400">
                            Administrator notes
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
                            {report.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedReportId(
                              isSelected ? null : report._id,
                            );
                            setAdminNotes(report.adminNotes || '');
                          }}
                          className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/10"
                        >
                          {isSelected ? 'Close' : 'Review'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isSelected && report.status === 'pending' && (
                    <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4">
                      <label
                        htmlFor={`notes-${report._id}`}
                        className="text-sm font-medium text-slate-300"
                      >
                        Administrator notes
                      </label>

                      <textarea
                        id={`notes-${report._id}`}
                        value={adminNotes}
                        onChange={(event) => setAdminNotes(event.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Explain your decision (optional)..."
                        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                      />

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            handleModeration(report._id, 'reviewed')
                          }
                          disabled={submitting}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {submitting ? 'Saving...' : 'Mark as Reviewed'}
                        </button>

                        <button
                          onClick={() =>
                            handleModeration(report._id, 'dismissed')
                          }
                          disabled={submitting}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                          Dismiss Report
                        </button>

                        <button
                          onClick={() => {
                            setSelectedReportId(null);
                            setAdminNotes('');
                          }}
                          disabled={submitting}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}