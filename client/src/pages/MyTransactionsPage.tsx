
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyTransactions,
  updateTransactionStatus,
  confirmTransactionCompletion,
  requestTransactionCancellation,
  respondToCancellationRequest,
  type Transaction,
} from '../services/api';
import { useAuth } from '../auth/AuthContext';

const statusStyles: Record<string, string> = {
  agreed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  disputed: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  agreed: 'Agreed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

function getUserId(value: string | { _id: string } | undefined) {
  return typeof value === 'string' ? value : value?._id;
}

export default function MyTransactionsPage() {
  const { token } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actioningId, setActioningId] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [cancellationReasons, setCancellationReasons] = useState<
    Record<string, string>
  >({});
  const [openCancellationForm, setOpenCancellationForm] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      setLoading(true);
      setError('');

      if (!token) {
        setError('Please log in to view your transactions.');
        setLoading(false);
        return;
      }

      try {
        const data = await getMyTransactions(token);

        if (active) {
          setTransactions(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load transactions.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTransactions();

    return () => {
      active = false;
    };
  }, [token, refreshCount]);

  async function handleStatusUpdate(
    transaction: Transaction,
    status: 'in_progress' | 'cancelled',
  ) {
    if (!token) {
      setActionError('Please sign in again.');
      return;
    }

    const confirmed = window.confirm(
      status === 'in_progress'
        ? 'Are you ready to start this transaction?'
        : 'Are you sure you want to cancel this agreed transaction?',
    );

    if (!confirmed) return;

    setActioningId(transaction._id);
    setActionError('');

    try {
      await updateTransactionStatus(transaction._id, status, token);
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to update transaction.',
      );
    } finally {
      setActioningId('');
    }
  }

  async function handleConfirmCompletion(transaction: Transaction) {
    if (!token) {
      setActionError('Please sign in again.');
      return;
    }

    if (!window.confirm('Confirm that this transaction has been completed?')) {
      return;
    }

    setActioningId(transaction._id);
    setActionError('');

    try {
      await confirmTransactionCompletion(transaction._id, token);
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to confirm transaction completion.',
      );
    } finally {
      setActioningId('');
    }
  }

  async function handleRequestCancellation(transaction: Transaction) {
    if (!token) {
      setActionError('Please sign in again.');
      return;
    }

    const reason = (cancellationReasons[transaction._id] ?? '').trim();

    if (reason.length < 5 || reason.length > 1000) {
      setActionError('Please enter a reason between 5 and 1000 characters.');
      return;
    }

    setActioningId(transaction._id);
    setActionError('');

    try {
      await requestTransactionCancellation(transaction._id, reason, token);

      setCancellationReasons((current) => ({
        ...current,
        [transaction._id]: '',
      }));
      setOpenCancellationForm('');
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to request cancellation.',
      );
    } finally {
      setActioningId('');
    }
  }

  async function handleCancellationResponse(
    transaction: Transaction,
    status: 'accepted' | 'rejected',
  ) {
    if (!token) {
      setActionError('Please sign in again.');
      return;
    }

    const confirmed = window.confirm(
      status === 'accepted'
        ? 'Accept this request? The transaction will be cancelled.'
        : 'Reject this request? The transaction will remain active.',
    );

    if (!confirmed) return;

    setActioningId(transaction._id);
    setActionError('');

    try {
      await respondToCancellationRequest(
        transaction._id,
        status,
        token,
      );

      setRefreshCount((count) => count + 1);
      setOpenCancellationForm('');
      setCancellationReasons((current) => ({
        ...current,
        [transaction._id]: '',
      }));
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to respond to the cancellation request.',
      );
    } finally {
      setActioningId('');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 text-center text-slate-500">
        Loading your transactions...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-white p-5 text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefreshCount((count) => count + 1)}
            className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Your activity
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Transactions
          </h1>
          <p className="mt-2 text-slate-600">
            Track accepted offers, ongoing exchanges, and completed transactions.
          </p>
        </header>

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="text-4xl">🤝</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              No transactions yet
            </h2>
            <p className="mt-2 text-slate-600">
              When an offer is accepted, its transaction will appear here.
            </p>
            <Link
              to="/listings"
              className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const cancellation = transaction.cancellationRequest;
              const requestedBy = getUserId(cancellation?.requestedBy);
              const requesterId = transaction.requester?._id;
              const providerId = transaction.provider?._id;

              const requesterMadeRequest =
                Boolean(requestedBy) && requestedBy === requesterId;

              const providerMadeRequest =
                Boolean(requestedBy) && requestedBy === providerId;

              const cancellationPending = cancellation?.status === 'pending';
              const isProcessing = actioningId === transaction._id;

              return (
                <article
                  key={transaction._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {transaction.listing?.title ?? 'Untitled listing'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.listing?.category ?? 'General category'}
                        {transaction.listing?.location
                          ? ` · ${transaction.listing.location}`
                          : ''}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                        statusStyles[transaction.status] ??
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusLabels[transaction.status] ?? transaction.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Participants
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">
                        Requester: {transaction.requester?.name ?? 'Unknown'}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Provider: {transaction.provider?.name ?? 'Unknown'}
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Completion confirmations
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">
                        Requester:{' '}
                        {transaction.requesterConfirmedCompletion
                          ? 'Confirmed'
                          : 'Waiting'}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Provider:{' '}
                        {transaction.providerConfirmedCompletion
                          ? 'Confirmed'
                          : 'Waiting'}
                      </p>
                    </section>
                  </div>

                  {transaction.status === 'disputed' && (
                    <section className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                      <h3 className="font-semibold text-red-800">
                        ⚠️ Transaction under dispute
                      </h3>
                      {transaction.disputeReason && (
                        <p className="mt-2 text-sm text-red-700">
                          {transaction.disputeReason}
                        </p>
                      )}
                      {transaction.resolutionNotes && (
                        <p className="mt-2 text-sm text-red-700">
                          Resolution: {transaction.resolutionNotes}
                        </p>
                      )}
                    </section>
                  )}

                  {cancellation && (
                    <section className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <h3 className="font-semibold text-orange-900">
                        Cancellation request:{' '}
                        {cancellation.status.replace('_', ' ')}
                      </h3>
                      <p className="mt-2 text-sm text-orange-800">
                        <span className="font-medium">Reason:</span>{' '}
                        {cancellation.reason}
                      </p>

                      {cancellationPending && (
                        <>
                          <p className="mt-3 text-sm text-orange-800">
                            {requesterMadeRequest
                              ? 'The requester submitted this request.'
                              : providerMadeRequest
                                ? 'The provider submitted this request.'
                                : 'A participant submitted this request.'}
                          </p>
                          <p className="mt-1 text-sm text-orange-800">
                            The other participant can accept or reject it.
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={actioningId !== ''}
                              onClick={() =>
                                void handleCancellationResponse(
                                  transaction,
                                  'accepted',
                                )
                              }
                              className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isProcessing ? 'Processing...' : 'Accept Request'}
                            </button>
                            <button
                              type="button"
                              disabled={actioningId !== ''}
                              onClick={() =>
                                void handleCancellationResponse(
                                  transaction,
                                  'rejected',
                                )
                              }
                              className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Reject Request
                            </button>
                          </div>
                        </>
                      )}

                      {cancellation.status === 'accepted' && (
                        <p className="mt-2 text-sm text-orange-800">
                          The request was accepted. The transaction is cancelled.
                        </p>
                      )}

                      {cancellation.status === 'rejected' && (
                        <p className="mt-2 text-sm text-orange-800">
                          The request was rejected. The transaction remains active.
                        </p>
                      )}
                    </section>
                  )}

                  {transaction.status === 'agreed' && (
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        disabled={actioningId !== ''}
                        onClick={() =>
                          void handleStatusUpdate(transaction, 'in_progress')
                        }
                        className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isProcessing ? 'Processing...' : 'Start Transaction'}
                      </button>

                      <button
                        type="button"
                        disabled={actioningId !== ''}
                        onClick={() =>
                          void handleStatusUpdate(transaction, 'cancelled')
                        }
                        className="rounded-lg border border-red-200 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel Transaction
                      </button>
                    </div>
                  )}

                  {transaction.status === 'in_progress' && (
                    <section className="mt-5 border-t border-slate-100 pt-4">
                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="font-semibold text-emerald-800">
                          Almost there! 🎉
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                          Confirm when the repair, swap, or exchange is finished.
                          The transaction completes after both participants confirm.
                        </p>
                      </div>

                      {!cancellationPending && (
                        <>
                          <button
                            type="button"
                            disabled={actioningId !== ''}
                            onClick={() =>
                              void handleConfirmCompletion(transaction)
                            }
                            className="mt-3 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isProcessing
                              ? 'Processing...'
                              : 'Confirm Completion'}
                          </button>

                          <div className="mt-4">
                            {openCancellationForm === transaction._id ? (
                              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                                <label
                                  htmlFor={`cancellation-reason-${transaction._id}`}
                                  className="block text-sm font-semibold text-slate-800"
                                >
                                  Why do you need to cancel?
                                </label>
                                <textarea
                                  id={`cancellation-reason-${transaction._id}`}
                                  rows={3}
                                  maxLength={1000}
                                  value={
                                    cancellationReasons[transaction._id] ?? ''
                                  }
                                  onChange={(event) =>
                                    setCancellationReasons((current) => ({
                                      ...current,
                                      [transaction._id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Explain the reason (at least 5 characters)..."
                                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    (cancellationReasons[transaction._id] ?? '')
                                      .length
                                  }
                                  /1000 characters
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={actioningId !== ''}
                                    onClick={() =>
                                      void handleRequestCancellation(transaction)
                                    }
                                    className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                                  >
                                    {isProcessing ? 'Sending...' : 'Send Request'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => {
                                      setOpenCancellationForm('');
                                      setActionError('');
                                    }}
                                    className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-white"
                                  >
                                    Keep Transaction
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={actioningId !== ''}
                                onClick={() => {
                                  setActionError('');
                                  setOpenCancellationForm(transaction._id);
                                }}
                                className="rounded-lg border border-orange-300 px-4 py-2.5 font-semibold text-orange-800 hover:bg-orange-50 disabled:opacity-60"
                              >
                                Request Cancellation
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {cancellationPending && (
                        <p className="mt-3 text-sm text-orange-800">
                          A cancellation request is pending. Please wait for the
                          other participant's response.
                        </p>
                      )}
                    </section>
                  )}

                  <p className="mt-4 break-all text-xs text-slate-400">
                    Transaction ID: {transaction._id}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
