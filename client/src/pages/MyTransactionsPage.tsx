import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyTransactions,
  updateTransactionStatus,
  confirmTransactionCompletion,
  requestTransactionCancellation,
  respondToCancellationRequest,
  type Transaction,
} from "../services/api";
import { useAuth } from "../auth/AuthContext";

const statusStyles: Record<string, string> = {
  agreed: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  disputed: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  agreed: "Agreed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

function getUserId(value: string | { _id: string } | undefined) {
  return typeof value === "string" ? value : value?._id;
}

export default function MyTransactionsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actioningId, setActioningId] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const [cancellationReasons, setCancellationReasons] = useState<
    Record<string, string>
  >({});
  const [openCancellationForm, setOpenCancellationForm] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please log in to view your transactions.");
        setLoading(false);
        return;
      }

      try {
        const data = await getMyTransactions(token);
        if (active) setTransactions(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load transactions.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTransactions();

    return () => {
      active = false;
    };
  }, [token, refreshCount]);

  async function handleStatusUpdate(
    transaction: Transaction,
    status: "in_progress" | "cancelled",
  ) {
    const confirmed = window.confirm(
      status === "in_progress"
        ? "Are you ready to start this transaction?"
        : "Are you sure you want to cancel this agreed transaction?",
    );

    if (!confirmed || !token) return;

    setActioningId(transaction._id);
    setActionError("");

    try {
      await updateTransactionStatus(transaction._id, status, token);
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update transaction.",
      );
    } finally {
      setActioningId("");
    }
  }

  async function handleConfirmCompletion(transaction: Transaction) {
    if (!token) return;

    if (!window.confirm("Confirm that this transaction has been completed?")) {
      return;
    }

    setActioningId(transaction._id);
    setActionError("");

    try {
      await confirmTransactionCompletion(transaction._id, token);
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to confirm transaction completion.",
      );
    } finally {
      setActioningId("");
    }
  }

  async function handleRequestCancellation(transaction: Transaction) {
    if (!token) return;

    const reason = (cancellationReasons[transaction._id] ?? "").trim();

    if (reason.length < 5 || reason.length > 1000) {
      setActionError("Please enter a reason between 5 and 1000 characters.");
      return;
    }

    setActioningId(transaction._id);
    setActionError("");

    try {
      await requestTransactionCancellation(transaction._id, reason, token);

      setCancellationReasons((current) => ({
        ...current,
        [transaction._id]: "",
      }));
      setOpenCancellationForm("");
      setRefreshCount((count) => count + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to request cancellation.",
      );
    } finally {
      setActioningId("");
    }
  }

  async function handleCancellationResponse(
    transaction: Transaction,
    status: "accepted" | "rejected",
  ) {
    if (!token) return;

    const confirmed = window.confirm(
      status === "accepted"
        ? "Accept this request? The transaction will be cancelled."
        : "Reject this request? The transaction will remain active.",
    );

    if (!confirmed) return;

    setActioningId(transaction._id);
    setActionError("");

    try {
      const updatedTransaction = await respondToCancellationRequest(
        transaction._id,
        status,
        token,
      );

      setTransactions((current) =>
        current.map((item) =>
          item._id === updatedTransaction._id ? updatedTransaction : item,
        ),
      );

      setCancellationReasons((current) => ({
        ...current,
        [transaction._id]: "",
      }));

      setOpenCancellationForm("");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to respond to the cancellation request.",
      );
    } finally {
      setActioningId("");
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        Loading your transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-5xl space-y-6 px-4 pb-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Your activity
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          My Transactions
        </h1>
        <p className="mt-2 text-gray-600">
          Track accepted offers, ongoing exchanges, and completed transactions.
        </p>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <div className="text-4xl">🤝</div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No transactions yet
          </h2>
          <p className="mt-2 text-gray-600">
            When an offer is accepted, its transaction will appear here.
          </p>
          <Link
            to="/listings"
            className="mt-5 inline-flex rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const cancellation = transaction.cancellationRequest;
            const requestedBy = getUserId(cancellation?.requestedBy);
            const requesterId = transaction.requester?._id;
            const providerId = transaction.provider?._id;
            // Infer which participant made the request from the populated
            // participant records. The backend still enforces authorization.
            const requesterMadeRequest =
              Boolean(requestedBy) && requestedBy === requesterId;
            const providerMadeRequest =
              Boolean(requestedBy) && requestedBy === providerId;

            return (
              <article
                key={transaction._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {transaction.listing?.title ?? "Untitled listing"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {transaction.listing?.category ?? "General category"}
                      {transaction.listing?.location
                        ? ` · ${transaction.listing.location}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                      statusStyles[transaction.status] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statusLabels[transaction.status] ?? transaction.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Participants
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      Requester: {transaction.requester?.name ?? "Unknown"}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      Provider: {transaction.provider?.name ?? "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Completion confirmations
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      Requester:{" "}
                      {transaction.requesterConfirmedCompletion
                        ? "Confirmed"
                        : "Waiting"}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      Provider:{" "}
                      {transaction.providerConfirmedCompletion
                        ? "Confirmed"
                        : "Waiting"}
                    </p>
                  </div>
                </div>

                {transaction.status === "disputed" && (
                  <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="font-semibold text-red-800">
                      ⚠️ This transaction is under dispute.
                    </p>
                    {transaction.disputeReason && (
                      <p className="mt-1 text-sm text-red-700">
                        {transaction.disputeReason}
                      </p>
                    )}
                    {transaction.resolutionNotes && (
                      <p className="mt-2 text-sm text-red-700">
                        Resolution: {transaction.resolutionNotes}
                      </p>
                    )}
                  </div>
                )}

                {cancellation && (
                  <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="font-semibold text-orange-900">
                      Cancellation request: {cancellation.status}
                    </p>
                    <p className="mt-2 text-sm text-orange-800">
                      <span className="font-medium">Reason:</span>{" "}
                      {cancellation.reason}
                    </p>

                    {cancellation.status === "pending" && (
                      <div className="mt-3">
                        <p className="text-sm text-orange-800">
                          {requesterMadeRequest
                            ? "The requester submitted this request."
                            : "The provider submitted this request."}
                        </p>
                        <p className="mt-1 text-sm text-orange-800">
                          The other participant can accept or reject it.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={actioningId === transaction._id}
                            onClick={() =>
                              handleCancellationResponse(
                                transaction,
                                "accepted",
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Accept Request
                          </button>
                          <button
                            type="button"
                            disabled={actioningId === transaction._id}
                            onClick={() =>
                              handleCancellationResponse(
                                transaction,
                                "rejected",
                              )
                            }
                            className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            Reject Request
                          </button>
                        </div>
                      </div>
                    )}

                    {cancellation.status === "accepted" && (
                      <p className="mt-2 text-sm text-orange-800">
                        The request was accepted. The transaction is cancelled.
                      </p>
                    )}

                    {cancellation.status === "rejected" && (
                      <p className="mt-2 text-sm text-orange-800">
                        The request was rejected. The transaction remains
                        active.
                      </p>
                    )}
                  </div>
                )}

                {transaction.status === "agreed" && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      disabled={actioningId === transaction._id}
                      onClick={() =>
                        handleStatusUpdate(transaction, "in_progress")
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actioningId === transaction._id
                        ? "Processing..."
                        : "Start Transaction"}
                    </button>

                    <button
                      type="button"
                      disabled={actioningId === transaction._id}
                      onClick={() =>
                        handleStatusUpdate(transaction, "cancelled")
                      }
                      className="rounded-lg border border-red-200 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel Transaction
                    </button>
                  </div>
                )}

                {transaction.status === "in_progress" && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="font-medium text-emerald-800">
                        Almost there! 🎉
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        Confirm when the repair, swap, or exchange is finished.
                        The transaction completes after both participants
                        confirm.
                      </p>
                    </div>

                   {(!cancellation || cancellation.status !== 'pending') && (
  <button
    type="button"
    disabled={actioningId === transaction._id}
    onClick={() => handleConfirmCompletion(transaction)}
    className="mt-3 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {actioningId === transaction._id
      ? 'Processing...'
      : 'Confirm Completion'}
  </button>
)}

                    {!cancellation || cancellation.status !== "pending" ? (
                      <div className="mt-4">
                        {openCancellationForm === transaction._id ? (
                          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                            <label
                              htmlFor={`cancellation-reason-${transaction._id}`}
                              className="block text-sm font-semibold text-gray-800"
                            >
                              Why do you need to cancel?
                            </label>
                            <textarea
                              id={`cancellation-reason-${transaction._id}`}
                              rows={3}
                              maxLength={1000}
                              value={cancellationReasons[transaction._id] ?? ""}
                              onChange={(event) =>
                                setCancellationReasons((current) => ({
                                  ...current,
                                  [transaction._id]: event.target.value,
                                }))
                              }
                              placeholder="Explain the reason (at least 5 characters)..."
                              className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              {
                                (cancellationReasons[transaction._id] ?? "")
                                  .length
                              }
                              /1000 characters
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={actioningId === transaction._id}
                                onClick={() =>
                                  handleRequestCancellation(transaction)
                                }
                                className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                              >
                                {actioningId === transaction._id
                                  ? "Sending..."
                                  : "Send Request"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenCancellationForm("")}
                                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-white"
                              >
                                Keep Transaction
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={actioningId === transaction._id}
                            onClick={() => {
                              setActionError("");
                              setOpenCancellationForm(transaction._id);
                            }}
                            className="mt-3 rounded-lg border border-orange-300 px-4 py-2.5 font-semibold text-orange-800 hover:bg-orange-50 disabled:opacity-60"
                          >
                            Request Cancellation
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-orange-800">
                        A cancellation request is pending. Please wait for the
                        other participant's response.
                      </p>
                    )}
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-400">
                  Transaction ID: {transaction._id}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
