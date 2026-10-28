
import { useCallback, useEffect, useState } from 'react';
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
import TransactionCard from './transactions/TransactionCard';

function getCurrentUserId(token: string): string {
  try {
    const payload = token.split('.')[1];

    if (!payload) return '';

    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = atob(
      base64.padEnd(Math.ceil(base64.length / 4) * 4, '='),
    );

    const user = JSON.parse(decoded) as {
      sub?: string;
      id?: string;
      userId?: string;
      _id?: string;
    };

    return user.sub ?? user.userId ?? user.id ?? user._id ?? '';
  } catch {
    return '';
  }
}

export default function MyTransactionsPage() {
  const { token } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actioningId, setActioningId] = useState('');
  const [openCancellationForm, setOpenCancellationForm] = useState('');
  const [cancellationReasons, setCancellationReasons] = useState<
    Record<string, string>
  >({});

  const currentUserId = getCurrentUserId(token ?? '');

  const loadTransactions = useCallback(async () => {
    if (!token) {
      setTransactions([]);
      setLoading(false);
      setPageError('Please log in to view your transactions.');
      return;
    }

    setLoading(true);
    setPageError('');

    try {
      const result = await getMyTransactions(token);
      setTransactions(result);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : 'Failed to load transactions.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  async function handleStatusUpdate(
    transaction: Transaction,
    status: 'in_progress' | 'cancelled',
  ) {
    if (!token) return;

    if (
      status === 'cancelled' &&
      !window.confirm('Are you sure you want to cancel this transaction?')
    ) {
      return;
    }

    setActioningId(transaction._id);
    setActionError('');

    try {
      await updateTransactionStatus(transaction._id, status, token);
      await loadTransactions();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Failed to update transaction.',
      );
    } finally {
      setActioningId('');
    }
  }

  async function handleConfirmCompletion(transaction: Transaction) {
    if (!token) return;

    setActioningId(transaction._id);
    setActionError('');

    try {
      await confirmTransactionCompletion(transaction._id, token);
      await loadTransactions();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to confirm completion.',
      );
    } finally {
      setActioningId('');
    }
  }

  async function handleRequestCancellation(transaction: Transaction) {
    if (!token) return;

    const reason = cancellationReasons[transaction._id]?.trim();

    if (!reason) {
      setActionError('Please enter a reason for cancellation.');
      return;
    }

    setActioningId(transaction._id);
    setActionError('');

    try {
      await requestTransactionCancellation(
        transaction._id,
        reason,
        token,
      );

      setCancellationReasons((current) => ({
        ...current,
        [transaction._id]: '',
      }));

      setOpenCancellationForm('');
      await loadTransactions();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to request cancellation.',
      );
    } finally {
      setActioningId('');
    }
  }

  async function handleCancellationResponse(
    transaction: Transaction,
    status: 'accepted' | 'rejected',
  ) {
    if (!token) return;

    setActioningId(transaction._id);
    setActionError('');

    try {
      await respondToCancellationRequest(
        transaction._id,
        status,
        token,
      );

      await loadTransactions();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Failed to respond to cancellation request.',
      );
    } finally {
      setActioningId('');
    }
  }

  if (loading) {
    return (
      <main className="mx-auto mt-8 max-w-5xl px-4 py-6">
        <p className="text-slate-600">Loading your transactions...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-8 max-w-5xl space-y-6 px-4 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Transactions
        </h1>
        <p className="mt-2 text-slate-600">
          Track your agreed repairs, swaps, and cancellation requests.
        </p>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {pageError}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {actionError}
        </div>
      )}

      {!pageError && transactions.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            No transactions yet
          </h2>
          <p className="mt-2 text-slate-600">
            Transactions will appear here when an offer is accepted.
          </p>
          <Link
            to="/listings"
            className="mt-5 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800"
          >
            Browse Listings
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction._id}
            transaction={transaction}
            currentUserId={currentUserId}
            actioningId={actioningId}
            cancellationReason={
              cancellationReasons[transaction._id] ?? ''
            }
            isCancellationFormOpen={
              openCancellationForm === transaction._id
            }
            onStart={(item) =>
              void handleStatusUpdate(item, 'in_progress')
            }
            onCancelAgreed={(item) =>
              void handleStatusUpdate(item, 'cancelled')
            }
            onConfirmCompletion={(item) =>
              void handleConfirmCompletion(item)
            }
            onRequestCancellation={(item) =>
              void handleRequestCancellation(item)
            }
            onRespondToCancellation={(item, status) =>
              void handleCancellationResponse(item, status)
            }
            onCancellationReasonChange={(value) =>
              setCancellationReasons((current) => ({
                ...current,
                [transaction._id]: value,
              }))
            }
            onToggleCancellationForm={() => {
              setActionError('');
              setOpenCancellationForm(transaction._id);
            }}
            onClearCancellationForm={() => {
              setOpenCancellationForm('');
              setActionError('');
            }}
          />
        ))}
      </div>
    </main>
  );
}
