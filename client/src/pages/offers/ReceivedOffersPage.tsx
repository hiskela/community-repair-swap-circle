
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  acceptOffer,
  getReceivedOffers,
  rejectOffer,
  hideReceivedOffer,
  type Offer,
} from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

type OfferFilter =
  | 'all'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export default function ReceivedOffersPage() {
  const { token } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OfferFilter>('all');

  const loadOffers = useCallback(async () => {
    if (!token) {
      setOffers([]);
      setError('Please sign in to view received offers.');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const result = await getReceivedOffers(token);
      setOffers(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load received offers.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  async function handleAction(
    offer: Offer,
    action: 'accept' | 'reject',
  ) {
    if (!token) {
      setActionError('Please sign in again.');
      return;
    }

    const confirmed = window.confirm(
      action === 'accept'
        ? 'Accept this offer? This may reserve the listing and affect other pending offers.'
        : 'Are you sure you want to reject this offer?',
    );

    if (!confirmed) return;

    setProcessingId(offer._id);
    setActionError('');
    setSuccess('');

    try {
      if (action === 'accept') {
        await acceptOffer(offer._id, token);
      } else {
        await rejectOffer(offer._id, token);
      }

      await loadOffers();
      setSuccess(
        action === 'accept'
          ? 'Offer accepted successfully.'
          : 'Offer rejected successfully.',
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} this offer.`,
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRemoveOffer(offer: Offer) {
    if (!token) {
      setActionError('Please sign in again.');
      return;
    }

    const confirmed = window.confirm(
      'Remove this offer from your received offers? The sender will still see it, and its status will not change.',
    );

    if (!confirmed) return;

    try {
      setRemovingId(offer._id);
      setActionError('');
      setSuccess('');

      await hideReceivedOffer(offer._id, token);

      setOffers((current) =>
        current.filter((item) => item._id !== offer._id),
      );

      setSuccess('Offer removed from your received offers.');
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to remove this offer.',
      );
    } finally {
      setRemovingId(null);
    }
  }

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

  const offerCounts = {
    all: offers.length,
    pending: offers.filter((offer) => offer.status === 'pending').length,
    accepted: offers.filter((offer) => offer.status === 'accepted').length,
    rejected: offers.filter((offer) => offer.status === 'rejected').length,
    withdrawn: offers.filter((offer) => offer.status === 'withdrawn').length,
  };

  const filteredOffers = offers.filter(
    (offer) => filter === 'all' || offer.status === filter,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            YOUR LISTINGS
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Received Offers
          </h1>
          <p className="mt-2 text-slate-600">
            Review offers from community members interested in your listings.
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

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                'all',
                'pending',
                'accepted',
                'rejected',
                'withdrawn',
              ] as OfferFilter[]
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                  filter === item
                    ? 'bg-emerald-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item} ({offerCounts[item]})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading received offers...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-700">
              Could not load offers
            </h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadOffers();
              }}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No received offers yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Offers from other members will appear here.
            </p>
            <Link
              to="/listings"
              className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse listings
            </Link>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-slate-900">
              No {filter === 'all' ? '' : filter} offers found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              There are no offers in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => {
              const listingData = offer.listing ?? offer.listingId;

              const listing =
                typeof listingData === 'object' && listingData !== null
                  ? listingData
                  : null;

              return (
                <article
                  key={offer._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {listing?.title || 'Offer on your listing'}
                      </h2>

                      {listing?.category && (
                        <p className="mt-1 text-sm text-slate-500">
                          Category: {listing.category}
                        </p>
                      )}

                      {listing?._id && (
                        <Link
                          to={`/listings/${listing._id}`}
                          className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          View listing →
                        </Link>
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
                          disabled={
                            processingId !== null || removingId !== null
                          }
                          onClick={() => void handleRemoveOffer(offer)}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingId === offer._id
                            ? 'Removing...'
                            : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Offer message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {offer.message}
                    </p>
                  </div>

                  {offer.createdAt && (
                    <p className="mt-4 text-xs text-slate-500">
                      Received on{' '}
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  )}

                  {offer.status === 'pending' && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={
                          processingId !== null || removingId !== null
                        }
                        onClick={() => void handleAction(offer, 'accept')}
                        className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingId === offer._id
                          ? 'Processing...'
                          : 'Accept Offer'}
                      </button>

                      <button
                        type="button"
                        disabled={
                          processingId !== null || removingId !== null
                        }
                        onClick={() => void handleAction(offer, 'reject')}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject Offer
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
