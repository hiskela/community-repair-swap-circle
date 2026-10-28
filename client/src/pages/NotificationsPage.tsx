import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getNotifications,
  getOfferById,
getTransactionById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type AppNotification,
  type Offer,
} from '../services/api';

function formatDate(date?: string) {
  if (!date) return 'Date unavailable';

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : parsed.toLocaleString();
}

function notificationLabel(type: AppNotification['type']) {
  const labels: Record<AppNotification['type'], string> = {
    offer_received: 'Offer received',
    offer_accepted: 'Offer accepted',
    offer_rejected: 'Offer rejected',
    transaction_updated: 'Transaction update',
    dispute_opened: 'Dispute opened',
    dispute_resolved: 'Dispute resolved',
  };

  return labels[type] ?? 'Notification';
}
type TransactionDetails = {
  _id: string;
  status: string;
  listing?: { title?: string } | string;
  requester?: { name?: string } | string;
  provider?: { name?: string } | string;
  disputeReason?: string;
  resolutionNotes?: string;
  requesterConfirmedCompletion?: boolean;
  providerConfirmedCompletion?: boolean;
  cancellationRequest?: {
    reason?: string;
    status?: string;
  } | null;
  history?: {
    status: string;
    note: string;
    changedAt?: string;
    changedBy?: { name?: string } | string;
  }[];
};




export default function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
const [selectedTransaction, setSelectedTransaction] =
  useState<TransactionDetails | null>(null);
const [transactionLoading, setTransactionLoading] = useState(false);
const [transactionError, setTransactionError] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getNotifications(token);
      setNotifications(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load notifications.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!selectedNotification || !token) {
      setSelectedOffer(null);
      setOfferError('');
      setOfferLoading(false);
      return;
    }

    if (
      selectedNotification.relatedType !== 'offer' ||
      !selectedNotification.relatedId
    ) {
      setSelectedOffer(null);
      setOfferError('');
      setOfferLoading(false);
      return;
    }

    let active = true;

    async function loadOfferDetails() {
      setSelectedOffer(null);
      setOfferError('');
      setOfferLoading(true);

      try {
        const offer = await getOfferById(
          selectedNotification.relatedId!,
          token!,
        );

        if (active) {
          setSelectedOffer(offer);
        }
      } catch (err) {
        if (active) {
          setOfferError(
            err instanceof Error
              ? err.message
              : 'Could not load the original offer message.',
          );
        }
      } finally {
        if (active) {
          setOfferLoading(false);
        }
      }
    }

    void loadOfferDetails();

    return () => {
      active = false;
    };
  }, [selectedNotification, token]);
useEffect(() => {
  if (!selectedNotification || !token) {
    setSelectedTransaction(null);
    setTransactionError('');
    setTransactionLoading(false);
    return;
  }

  const isTransactionNotification = [
    'transaction_updated',
    'dispute_opened',
    'dispute_resolved',
  ].includes(selectedNotification.type);

  if (
    !isTransactionNotification ||
    selectedNotification.relatedType !== 'transaction' ||
    !selectedNotification.relatedId
  ) {
    setSelectedTransaction(null);
    setTransactionError('');
    setTransactionLoading(false);
    return;
  }

  let active = true;

  async function loadTransaction() {
    setSelectedTransaction(null);
    setTransactionError('');
    setTransactionLoading(true);

    try {
      const result = await getTransactionById(
        selectedNotification.relatedId!,
        token,
      );

      if (active) {
        setSelectedTransaction(result);
      }
    } catch (err) {
      if (active) {
        setTransactionError(
          err instanceof Error
            ? err.message
            : 'Could not load transaction details.',
        );
      }
    } finally {
      if (active) setTransactionLoading(false);
    }
  }

  void loadTransaction();

  return () => {
    active = false;
  };
}, [selectedNotification, token]);
  useEffect(() => {
    if (!selectedNotification) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deleting) {
        setSelectedNotification(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotification, deleting]);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  async function handleMarkAllAsRead() {
    if (!token || unreadCount === 0) return;

    setMarkingAll(true);
    setError('');

    try {
      await markAllNotificationsAsRead(token);

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );

      setSelectedNotification((current) =>
        current ? { ...current, isRead: true } : null,
      );

      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not mark all notifications as read.',
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.isRead || !token) return;

    try {
      await markNotificationAsRead(notification._id, token);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setSelectedNotification((current) =>
        current?._id === notification._id
          ? { ...current, isRead: true }
          : current,
      );

      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to mark notification as read.',
      );
    }
  };

  async function handleDelete() {
    if (!token || !selectedNotification || deleting) return;

    setDeleting(true);
    setError('');

    try {
      await deleteNotification(selectedNotification._id, token);

      setNotifications((current) =>
        current.filter(
          (item) => item._id !== selectedNotification._id,
        ),
      );

      setSelectedNotification(null);
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete this notification.',
      );
    } finally {
      setDeleting(false);
    }
  }

  const listingData = selectedOffer?.listing ?? selectedOffer?.listingId;
  const listing =
    typeof listingData === 'object' && listingData !== null
      ? listingData
      : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Click a notification to view its details.
            </p>
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {unreadCount} unread
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleMarkAllAsRead()}
            disabled={unreadCount === 0 || markingAll || loading}
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? 'Updating...' : 'Mark all as read'}
          </button>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="ml-3 font-semibold underline"
            >
              Retry loading
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <div className="text-4xl" aria-hidden="true">
              🔔
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No notifications
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Updates about your offers and transactions will appear here.
            </p>
            <Link
              to="/dashboard"
              className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <section className="space-y-3" aria-label="Your notifications">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`rounded-2xl border p-5 transition hover:shadow-md ${
                  notification.isRead
                    ? 'border-slate-200 bg-white'
                    : 'border-emerald-200 bg-emerald-50/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotification(notification);
                    void handleMarkAsRead(notification);
                  }}
                  className="block w-full rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-3 w-3 shrink-0 rounded-full ${
                        notification.isRead
                          ? 'bg-slate-300'
                          : 'bg-emerald-600'
                      }`}
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-900">
                          {notificationLabel(notification.type)}
                        </h2>

                        {!notification.isRead && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                            Unread
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">
                        {notification.message}
                      </p>

                      <p className="mt-3 text-xs text-slate-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-medium text-emerald-700">
                      View Message →
                    </span>
                  </div>
                </button>

                {!notification.isRead && (
                  <div className="mt-4 flex justify-end border-t border-emerald-100 pt-3">
                    <button
                      type="button"
                      onClick={() => void handleMarkAsRead(notification)}
                      className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>

      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setSelectedNotification(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="notification-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {notificationLabel(selectedNotification.type)}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDate(selectedNotification.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                disabled={deleting}
                aria-label="Close notification details"
                className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notification
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {selectedNotification.message}
              </p>
            </div>

            {selectedNotification.relatedType === 'offer' && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
                <h3 className="font-semibold text-slate-900">
                  Original offer details
                </h3>

                {offerLoading ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Loading offer details...
                  </p>
                ) : offerError ? (
                  <p role="alert" className="mt-3 text-sm text-red-600">
                    {offerError}
                  </p>
                ) : selectedOffer ? (
                  <div className="mt-3 space-y-3">
                    {listing?.title && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Listing
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {listing.title}
                        </p>
                      </div>
                    )}

                    {selectedOffer.sender?.name && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Sent by
                        </p>
                        <p className="mt-1 text-sm text-slate-800">
                          {selectedOffer.sender.name}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Offer message
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-emerald-50 p-3 text-sm leading-7 text-slate-700">
                        {selectedOffer.message || 'No message was provided.'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Offer status
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {selectedOffer.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Offer details are unavailable.
                  </p>
                )}
              </div>
            )}
{transactionLoading && (
  <p className="mt-4 text-sm text-slate-500">
    Loading transaction details...
  </p>
)}

{transactionError && (
  <p role="alert" className="mt-4 text-sm text-red-600">
    {transactionError}
  </p>
)}

{selectedTransaction && (
  <div className="mt-4 space-y-4 rounded-xl border border-emerald-100 p-4">
    <h3 className="font-semibold text-slate-900">
      Transaction details
    </h3>

    <p className="text-sm text-slate-700">
      Listing:{' '}
      {typeof selectedTransaction.listing === 'object'
        ? selectedTransaction.listing?.title ?? 'Unavailable'
        : selectedTransaction.listing ?? 'Unavailable'}
    </p>

    <p className="text-sm text-slate-700">
      Current status:{' '}
      <span className="font-semibold">
        {selectedTransaction.status.replaceAll('_', ' ')}
      </span>
    </p>

    {selectedNotification.type === 'dispute_opened' &&
      selectedTransaction.disputeReason && (
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Dispute reason
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
            {selectedTransaction.disputeReason}
          </p>
        </div>
      )}

    {selectedNotification.type === 'dispute_resolved' && (
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Resolution notes
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
          {selectedTransaction.resolutionNotes ||
            'No resolution notes were recorded.'}
        </p>
      </div>
    )}

    {selectedTransaction.cancellationRequest && (
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Cancellation request
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Status: {selectedTransaction.cancellationRequest.status}
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
          Reason: {selectedTransaction.cancellationRequest.reason}
        </p>
      </div>
    )}

    <div>
      <h4 className="text-sm font-semibold text-slate-800">
        Transaction history
      </h4>

      <div className="mt-2 space-y-3">
        {selectedTransaction.history?.length ? (
          selectedTransaction.history.map((entry, index) => (
            <div
              key={`${entry.status}-${index}`}
              className="rounded-lg bg-slate-50 p-3"
            >
              <p className="text-sm font-semibold capitalize text-slate-800">
                {entry.status.replaceAll('_', ' ')}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                {entry.note}
              </p>
              {entry.changedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(entry.changedAt)}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No transaction history is available.
          </p>
        )}
      </div>
    </div>
  </div>
)}
            <p className="mt-3 text-xs text-slate-500">
              Status: {selectedNotification.isRead ? 'Read' : 'Unread'}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete notification'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
