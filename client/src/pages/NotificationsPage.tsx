
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  getNotifications,
markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type AppNotification,
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

export default function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);
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
  } catch (error) {
    setError(
      error instanceof Error ? error.message : 'Failed to mark notification as read.',
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
            <div className="text-4xl" aria-hidden="true">🔔</div>
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
              notification.isRead ? 'bg-slate-300' : 'bg-emerald-600'
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
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
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
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {selectedNotification.message}
              </p>
            </div>

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
                Cancel
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
