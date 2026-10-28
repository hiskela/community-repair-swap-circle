
import type { Transaction } from '../../services/api';

type Props = {
  transaction: Transaction;
  actioningId: string;
  onStart: (transaction: Transaction) => void;
  onCancelAgreed: (transaction: Transaction) => void;
  onConfirmCompletion: (transaction: Transaction) => void;
};

export default function TransactionActions({
  transaction,
  actioningId,
  onStart,
  onCancelAgreed,
  onConfirmCompletion,
}: Props) {
  const busy = actioningId !== '';

  if (transaction.status === 'agreed') {
    return (
      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => onStart(transaction)}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {actioningId === transaction._id ? 'Processing...' : 'Start Transaction'}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onCancelAgreed(transaction)}
          className="rounded-lg border border-red-200 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Cancel Transaction
        </button>
      </div>
    );
  }

  if (transaction.status === 'in_progress') {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onConfirmCompletion(transaction)}
        className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {actioningId === transaction._id
          ? 'Processing...'
          : 'Confirm Completion'}
      </button>
    );
  }

  return null;
}
