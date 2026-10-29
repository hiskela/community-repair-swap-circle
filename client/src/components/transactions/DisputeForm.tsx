import { useState } from 'react';
import { createTransactionDispute } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

type DisputeFormProps = {
  transactionId: string;
  status: string;
  onSubmitted: () => void;
};

export default function DisputeForm({
  transactionId,
  status,
  onSubmitted,
}: DisputeFormProps) {
  const { token } = useAuth();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const canDispute = status === 'agreed' || status === 'in_progress';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedReason = reason.trim();

    if (trimmedReason.length < 10 || trimmedReason.length > 1000) {
      setError('Your explanation must be between 10 and 1000 characters.');
      return;
    }

    if (!token) {
      setError('Please log in again to raise a dispute.');
      return;
    }

    setLoading(true);

    try {
      await createTransactionDispute(
        transactionId,
        trimmedReason,
        token,
      );

      setReason('');
      setSuccess('Your dispute has been submitted.');
      onSubmitted();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your dispute.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!canDispute) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        Raise a Dispute
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Explain what went wrong with this transaction. An administrator
        may review your explanation before resolving the dispute.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="dispute-reason"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            What went wrong?
          </label>

          <textarea
            id="dispute-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={10}
            maxLength={1000}
            rows={4}
            required
            placeholder="Describe the problem with this transaction..."
            className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />

          <p className="mt-1 text-right text-xs text-gray-500">
            {reason.length}/1000 characters
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Dispute'}
        </button>
      </form>
    </section>
  );
}