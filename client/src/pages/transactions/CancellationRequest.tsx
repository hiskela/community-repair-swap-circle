
import type { Transaction } from '../../services/api';

type Props = {
  transaction: Transaction;
  currentUserId: string;
  actioningId: string;
  cancellationReason: string;
  isFormOpen: boolean;
  onReasonChange: (value: string) => void;
  onRequest: (transaction: Transaction) => void;
  onRespond: (
    transaction: Transaction,
    status: 'accepted' | 'rejected',
  ) => void;
  onToggleForm: () => void;
  onClearForm: () => void;
};

function getId(value: string | { _id: string } | undefined) {
  return typeof value === 'string' ? value : value?._id ?? '';
}

export default function CancellationRequest({
  transaction,
  currentUserId,
  actioningId,
  cancellationReason,
  isFormOpen,
  onReasonChange,
  onRequest,
  onRespond,
  onToggleForm,
  onClearForm,
}: Props) {
  const request = transaction.cancellationRequest;
  const busy = actioningId !== '';

  if (request) {
    const requestedById = getId(request.requestedBy);
    const isRequester = requestedById === currentUserId;
    const canRespond =
      request.status === 'pending' &&
      !isRequester &&
      currentUserId !== '';

    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h4 className="font-semibold text-slate-900">
          Cancellation Request
        </h4>

        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium">Reason:</span> {request.reason}
        </p>

        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium">Status:</span>{' '}
          <span className="capitalize">{request.status}</span>
        </p>

        {request.status === 'pending' && (
          <p className="mt-2 text-sm text-amber-800">
            {isRequester
              ? 'Waiting for the other participant to respond.'
              : 'Please respond to this cancellation request.'}
          </p>
        )}

        {request.status === 'accepted' && (
          <p className="mt-2 text-sm text-emerald-800">
            The cancellation request was accepted.
          </p>
        )}

        {request.status === 'rejected' && (
          <p className="mt-2 text-sm text-red-800">
            The cancellation request was rejected.
          </p>
        )}

        {canRespond && (
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onRespond(transaction, 'accepted')}
              className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {actioningId === transaction._id
                ? 'Processing...'
                : 'Accept Request'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => onRespond(transaction, 'rejected')}
              className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Reject Request
            </button>
          </div>
        )}
      </div>
    );
  }

  if (transaction.status !== 'in_progress') {
    return null;
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {!isFormOpen ? (
        <button
          type="button"
          disabled={busy}
          onClick={onToggleForm}
          className="rounded-lg border border-amber-300 px-4 py-2.5 font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
        >
          Request Cancellation
        </button>
      ) : (
        <div className="space-y-3">
          <label
            htmlFor={`cancellation-reason-${transaction._id}`}
            className="block text-sm font-medium text-slate-700"
          >
            Reason for cancellation
          </label>

          <textarea
            id={`cancellation-reason-${transaction._id}`}
            value={cancellationReason}
            onChange={(event) => onReasonChange(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Explain why you want to cancel..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || !cancellationReason.trim()}
              onClick={() => onRequest(transaction)}
              className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {actioningId === transaction._id
                ? 'Submitting...'
                : 'Submit Request'}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onClearForm}
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
