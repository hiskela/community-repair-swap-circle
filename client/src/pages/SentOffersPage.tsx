
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSentOffers, type Offer } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export default function SentOffersPage() {
  const { token } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOffers() {
      if (!token) {
        setError('Please sign in to view your offers.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const result = await getSentOffers(token);

        if (!cancelled) {
          setOffers(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load your offers.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOffers();

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  function listingDetails(offer: Offer) {
    return typeof offer.listingId === 'object' && offer.listingId !== null
      ? offer.listingId
      : null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
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

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading your offers...
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
              onClick={() => window.location.reload()}
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
          <div className="space-y-4">
            {offers.map((offer) => {
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

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(offer.status)}`}
                    >
                      {offer.status.replace('_', ' ')}
                    </span>
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

                  {listing && (
                    <Link
                      to={`/listings/${listing._id}`}
                      className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View listing →
                    </Link>
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
