
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getSentOffers,
  withdrawOffer,
updateOffer,
hideOffer,
  type Offer,
} from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

type OfferFilter = 'all' | Offer['status'];

export default function SentOffersPage() {
  const { token } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OfferFilter>('all');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
const [editedMessage, setEditedMessage] = useState('');
const [savingEdit, setSavingEdit] = useState(false);
const [removingId, setRemovingId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (!token) {
      setError('Please sign in to view your offers.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await getSentOffers(token);
      setOffers(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load your offers.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  function statusStyle(status: Offer['status']) {
    switch (status) {
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      case 'withdrawn':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-amber-50 text-amber-700';
    }
  }
async function handleUpdateOffer() {
  if (!token || !editingOffer) return;

  const message = editedMessage.trim();

  if (message.length < 10 || message.length > 1000) {
    setActionError('Message must contain between 10 and 1000 characters.');
    return;
  }

  try {
    setSavingEdit(true);
    setActionError('');
    setSuccess('');

    const updatedOffer = await updateOffer(
      editingOffer._id,
      message,
      token,
    );

    setOffers((current) =>
  current.map((offer) =>
    offer._id === updatedOffer._id
      ? {
          ...offer,
          message: updatedOffer.message,
          status: updatedOffer.status,
          createdAt: updatedOffer.createdAt ?? offer.createdAt,
        }
      : offer,
  ),
);

    setEditingOffer(null);
    setEditedMessage('');
    setSuccess('Your offer has been updated successfully.');
  } catch (err) {
    setActionError(
      err instanceof Error ? err.message : 'Failed to update offer.',
    );
  } finally {
    setSavingEdit(false);
  }
}
async function handleRemoveOffer(offerId: string) {
  if (!token) return;

  const confirmed = window.confirm(
    'Remove this offer from your sent offers? It will remain visible to the listing owner.'
  );

  if (!confirmed) return;

  try {
    setRemovingId(offerId);
    setActionError('');
    setSuccess('');

    await hideOffer(offerId, token);

    setOffers((current) =>
      current.filter((offer) => offer._id !== offerId)
    );

    setSuccess('Offer removed from your sent offers.');
  } catch (err) {
    setActionError(
      err instanceof Error ? err.message : 'Failed to remove offer.'
    );
  } finally {
    setRemovingId(null);
  }
}
  function listingDetails(offer: Offer) {
    const listing = offer.listing ?? offer.listingId;

    return typeof listing === 'object' && listing !== null
      ? listing
      : null;
  }

  async function handleWithdraw(offer: Offer) {
    if (!token || offer.status !== 'pending') return;

    const confirmed = window.confirm(
      'Are you sure you want to withdraw this offer? This action cannot be undone.',
    );

    if (!confirmed) return;

    try {
      setWithdrawingId(offer._id);
      setActionError('');
      setSuccess('');

      const updatedOffer = await withdrawOffer(offer._id, token);

      setOffers((current) =>
        current.map((item) =>
          item._id === offer._id
            ? { ...item, status: updatedOffer.status }
            : item,
        ),
      );

      setSuccess('Your offer has been withdrawn successfully.');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to withdraw offer.',
      );
    } finally {
      setWithdrawingId(null);
    }
  }

  const filteredOffers =
    filter === 'all'
      ? offers
      : offers.filter((offer) => offer.status === filter);

  const counts = {
    all: offers.length,
    pending: offers.filter((offer) => offer.status === 'pending').length,
    accepted: offers.filter((offer) => offer.status === 'accepted').length,
    rejected: offers.filter((offer) => offer.status === 'rejected').length,
    withdrawn: offers.filter((offer) => offer.status === 'withdrawn').length,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              YOUR ACTIVITY
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Sent Offers
            </h1>
            <p className="mt-2 text-slate-600">
              Track the offers you've sent to other community members.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOffers}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">Loading your offers...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-700">
              Could not load offers
            </h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={loadOffers}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No offers yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              When you make an offer on a listing, it will appear here.
            </p>
            <Link
              to="/listings"
              className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'accepted', 'rejected', 'withdrawn'] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                      filter === status
                        ? 'bg-emerald-700 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {status} ({counts[status]})
                  </button>
                ),
              )}
            </div>

            {filteredOffers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-semibold text-slate-800">
                  No {filter} offers
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  There are no offers with this status.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOffers.map((offer) => {
                  const listing = listingDetails(offer);

                  return (
                    <article
                      key={offer._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">
                            {listing?.title || 'Listing offer'}
                          </h2>
                          {listing?.category && (
                            <p className="mt-1 text-sm text-slate-500">
                              Category: {listing.category}
                            </p>
                          )}
                        </div>

                    <div className="flex flex-wrap items-center gap-2">
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(offer.status)}`}
  >
    {offer.status.replace('_', ' ')}
  </span>

  {offer.status !== 'accepted' && (
    <button
      type="button"
      onClick={() => handleRemoveOffer(offer._id)}
      disabled={removingId === offer._id}
      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {removingId === offer._id ? 'Removing...' : 'Remove'}
    </button>
  )}
</div>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Your message
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {offer.message}
                        </p>
                      </div>

                      {offer.createdAt && (
                        <p className="mt-4 text-xs text-slate-500">
                          Sent on{' '}
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        {listing && (
                          <Link
                            to={`/listings/${listing._id}`}
                            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            View listing →
                          </Link>
                        )}
{offer.status === 'pending' && (
  <button
    type="button"
    onClick={() => {
      setEditingOffer(offer);
      setEditedMessage(offer.message);
      setActionError('');
      setSuccess('');
    }}
    className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
  >
    Edit offer
  </button>
)}
                        {offer.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleWithdraw(offer)}
                            disabled={withdrawingId === offer._id}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {withdrawingId === offer._id
                              ? 'Withdrawing...'
                              : 'Withdraw offer'}
                          </button>
                        )}

                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
{editingOffer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-xl font-bold text-slate-900">
        Edit offer
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        Update the message you sent to the listing owner.
      </p>

      <textarea
        value={editedMessage}
        onChange={(e) => setEditedMessage(e.target.value)}
        rows={5}
        maxLength={1000}
        className="mt-5 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        placeholder="Write your offer message..."
      />

      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Minimum 10 characters</span>
        <span>{editedMessage.length}/1000</span>
      </div>

      {actionError && (
        <p className="mt-3 text-sm text-red-600">
          {actionError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={savingEdit}
          onClick={() => {
            setEditingOffer(null);
            setEditedMessage('');
            setActionError('');
          }}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={savingEdit || editedMessage.trim().length < 10}
          onClick={handleUpdateOffer}
          className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingEdit ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}
