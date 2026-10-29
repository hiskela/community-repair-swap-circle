
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminDisputes,
  resolveAdminDispute,
  type AdminDispute,
  type AdminDisputeDecision,
} from '../../services/api';

export default function AdminDisputesPage() {
  const { token } = useAuth();

  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState('');
  const [decision, setDecision] =
    useState<AdminDisputeDecision>('in_progress');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchDisputes = useCallback(async () => {
    if (!token) {
      setError('Authentication required. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const result = await getAdminDisputes(token);
      setDisputes(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load disputes.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const selectedDispute = disputes.find(
    (dispute) => dispute._id === selectedId,
  );

  const filteredDisputes = disputes.filter((dispute) => {
    const searchText = search.toLowerCase();

    return (
      dispute.listing?.title?.toLowerCase().includes(searchText) ||
      dispute.requester?.name?.toLowerCase().includes(searchText) ||
      dispute.provider?.name?.toLowerCase().includes(searchText) ||
      dispute.disputeReason?.toLowerCase().includes(searchText)
    );
  });

  async function handleResolve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token || !selectedId) return;

    if (notes.trim().length < 10) {
      setError('Resolution notes must contain at least 10 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await resolveAdminDispute(
        selectedId,
        decision,
        notes.trim(),
        token,
      );

      setSuccess('Dispute resolved successfully.');
      setSelectedId('');
      setNotes('');
      setDecision('in_progress');

      await fetchDisputes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resolve dispute.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-400">
        Loading disputes...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Transaction Disputes
          </h1>
          <p className="mt-2 text-slate-400">
            Review and resolve disagreements between community members.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Refresh
        </button>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Open disputes</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {disputes.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Awaiting administrator review</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">
            {disputes.length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Disputed transactions
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Select a transaction to review and resolve it.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search disputes..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 sm:w-64"
          />
        </div>

        {filteredDisputes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center">
            <p className="text-slate-300">
              {disputes.length === 0
                ? 'There are no open disputes.'
                : 'No disputes match your search.'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              New disputes will appear here when participants report a problem.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute._id}
                className={`rounded-lg border p-4 transition ${
                  selectedId === dispute._id
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {dispute.listing?.title || 'Unknown listing'}
                      </h3>
                      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                        Disputed
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {dispute.listing?.category || 'Uncategorized'} ·{' '}
                      {dispute.listing?.type || 'Unknown type'}
                    </p>

                    <p className="mt-3 text-sm text-slate-300">
                      <span className="text-slate-500">Requester:</span>{' '}
                      {dispute.requester?.name || 'Unknown'}
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      <span className="text-slate-500">Provider:</span>{' '}
                      {dispute.provider?.name || 'Unknown'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Last updated:{' '}
                      {new Date(dispute.updatedAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedId(
                        selectedId === dispute._id ? '' : dispute._id,
                      );
                      setError('');
                      setSuccess('');
                    }}
                    className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    {selectedId === dispute._id ? 'Close details' : 'Review dispute'}
                  </button>
                </div>

                {selectedId === dispute._id && (
                  <div className="mt-5 border-t border-slate-800 pt-5">
                    <h4 className="font-semibold text-white">
                      Dispute details
                    </h4>

                    <div className="mt-3 rounded-lg bg-slate-900 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Reason for dispute
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {dispute.disputeReason || 'No reason provided.'}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-900 p-4">
                        <p className="text-xs text-slate-500">Requester email</p>
                        <p className="mt-1 break-all text-sm text-slate-300">
                          {dispute.requester?.email || 'Not available'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-900 p-4">
                        <p className="text-xs text-slate-500">Provider email</p>
                        <p className="mt-1 break-all text-sm text-slate-300">
                          {dispute.provider?.email || 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDispute && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-sm font-medium text-emerald-400">
              Administrator action
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              Resolve dispute
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Choose an outcome for "{selectedDispute.listing?.title || 'this transaction'}".
            </p>
          </div>

          <form onSubmit={handleResolve} className="space-y-5">
            <div>
              <label
                htmlFor="decision"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Resolution decision
              </label>

              <select
                id="decision"
                value={decision}
                onChange={(e) =>
                  setDecision(e.target.value as AdminDisputeDecision)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500"
              >
                <option value="in_progress">
                  Return transaction to active
                </option>
                <option value="cancelled">Cancel transaction</option>
                <option value="completed">Mark transaction completed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="resolutionNotes"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Resolution explanation
              </label>

              <textarea
                id="resolutionNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                minLength={10}
                maxLength={1000}
                required
                placeholder="Explain why you selected this resolution..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
              />

              <p className="mt-1 text-right text-xs text-slate-500">
                {notes.length}/1000 characters (minimum 10)
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={submitting || notes.trim().length < 10}
                className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Resolving...' : 'Confirm resolution'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedId('');
                  setNotes('');
                  setDecision('in_progress');
                  setError('');
                }}
                disabled={submitting}
                className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
