
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createOffer } from '../services/api';

export default function CreateOfferPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmedMessage = message.trim();

    if (!id) {
      setError('Listing ID is missing.');
      return;
    }

    if (trimmedMessage.length < 10 || trimmedMessage.length > 1000) {
      setError('Your offer message must be between 10 and 1000 characters.');
      return;
    }

    if (!token) {
      setError('Please log in to make an offer.');
      return;
    }

    try {
      setLoading(true);

    const result = await createOffer(
  {
    listingId: id,
    message: trimmedMessage,
  },
  token,
);

console.log('Offer created:', result);

alert('Offer submitted successfully!');
navigate(`/listings/${id}`, { replace: true });
      navigate(`/listings/${id}`, {
        state: { successMessage: 'Your offer was submitted successfully!' },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit your offer.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-10 max-w-2xl px-4 pb-12">
      <button
        type="button"
        onClick={() => navigate(id ? `/listings/${id}` : '/listings')}
        className="mb-6 text-sm font-medium text-slate-600 hover:text-emerald-700"
      >
        ← Back to listing
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Community Repair & Swap Circle
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Make an Offer
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Explain what you are offering and how you would like to arrange the
          repair, swap, or exchange. You can discuss item exchanges or additional
          money with the listing owner through messages.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-slate-700"
            >
              Your offer message
            </label>

            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={10}
              maxLength={1000}
              required
              rows={7}
              placeholder="Describe what you can offer, how you can help, or what you would like to exchange..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

            <p className="mt-2 text-right text-xs text-slate-500">
              {message.length}/1000 characters
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Submitting...' : 'Submit Offer'}
            </button>

            <button
              type="button"
              onClick={() => navigate(id ? `/listings/${id}` : '/listings')}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
