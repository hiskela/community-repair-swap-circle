
import type { Transaction } from '../../services/api';
import TransactionActions from './TransactionActions';
import CancellationRequest from './CancellationRequest';

type Props = {
  transaction: Transaction;
  currentUserId: string;
  actioningId: string;
  cancellationReason: string;
  isCancellationFormOpen: boolean;
  onStart: (transaction: Transaction) => void;
  onCancelAgreed: (transaction: Transaction) => void;
  onConfirmCompletion: (transaction: Transaction) => void;
  onRequestCancellation: (transaction: Transaction) => void;
  onRespondToCancellation: (
    transaction: Transaction,
    status: 'accepted' | 'rejected',
  ) => void;
  onCancellationReasonChange: (value: string) => void;
  onToggleCancellationForm: () => void;
  onClearCancellationForm: () => void;
};

const statusStyles: Record<string, string> = {
  agreed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-purple-100 text-purple-800',
};

const statusLabels: Record<string, string> = {
  agreed: 'Agreed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export default function TransactionCard({
  transaction,
  currentUserId,
  actioningId,
  cancellationReason,
  isCancellationFormOpen,
  onStart,
  onCancelAgreed,
  onConfirmCompletion,
  onRequestCancellation,
  onRespondToCancellation,
  onCancellationReasonChange,
  onToggleCancellationForm,
  onClearCancellationForm,
}: Props) {
  const cancellationStatus = transaction.cancellationRequest?.status
    ?.toLowerCase()
    .trim();

  const pendingCancellation = cancellationStatus === 'pending';

  const isRequester =
    typeof transaction.requester === 'object' &&
    transaction.requester !== null &&
    transaction.requester._id === currentUserId;

  const myConfirmation = isRequester
    ? transaction.requesterConfirmedCompletion
    : transaction.providerConfirmedCompletion;

  const otherConfirmation = isRequester
    ? transaction.providerConfirmedCompletion
    : transaction.requesterConfirmedCompletion;

  const canConfirmCompletion =
    transaction.status === 'in_progress' && !pendingCancellation;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {transaction.listing?.title ?? 'Transaction'}
          </h3>

          {transaction.listing?.category && (
            <p className="mt-1 text-sm text-slate-500">
              Category: {transaction.listing.category}
            </p>
          )}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyles[transaction.status] ??
            'bg-slate-100 text-slate-700'
          }`}
        >
          {statusLabels[transaction.status] ?? transaction.status}
        </span>
      </div>

      {transaction.listing?.location && (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium">Location:</span>{' '}
          {transaction.listing.location}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">
            Your confirmation
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {myConfirmation ? 'Confirmed' : 'Not confirmed'}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">
            Other participant
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {otherConfirmation ? 'Confirmed' : 'Not confirmed'}
          </p>
        </div>
      </div>

      {transaction.status === 'disputed' && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
          <h4 className="font-semibold text-purple-900">
            Transaction Disputed
          </h4>

          {transaction.disputeReason && (
            <p className="mt-2 text-sm text-purple-800">
              <span className="font-medium">Reason:</span>{' '}
              {transaction.disputeReason}
            </p>
          )}

          {transaction.resolutionNotes && (
            <p className="mt-2 text-sm text-purple-800">
              <span className="font-medium">Resolution:</span>{' '}
              {transaction.resolutionNotes}
            </p>
          )}

          <p className="mt-2 text-sm text-purple-800">
            Completion is blocked until the dispute is resolved.
          </p>
        </div>
      )}

      {transaction.status === 'agreed' && (
        <TransactionActions
          transaction={transaction}
          actioningId={actioningId}
          onStart={onStart}
          onCancelAgreed={onCancelAgreed}
          onConfirmCompletion={onConfirmCompletion}
        />
      )}

      {transaction.status === 'in_progress' && (
        <>
          {canConfirmCompletion && (
            <TransactionActions
              transaction={transaction}
              actioningId={actioningId}
              onStart={onStart}
              onCancelAgreed={onCancelAgreed}
              onConfirmCompletion={onConfirmCompletion}
            />
          )}

          {pendingCancellation && (
            <div
              role="status"
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              Completion is unavailable while the cancellation request is
              awaiting a response.
            </div>
          )}

          <CancellationRequest
            transaction={transaction}
            currentUserId={currentUserId}
            actioningId={actioningId}
            cancellationReason={cancellationReason}
            isFormOpen={isCancellationFormOpen}
            onReasonChange={onCancellationReasonChange}
            onRequest={onRequestCancellation}
            onRespond={onRespondToCancellation}
            onToggleForm={onToggleCancellationForm}
            onClearForm={onClearCancellationForm}
          />
        </>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Transaction ID: {transaction._id}
      </p>
    </article>
  );
}
