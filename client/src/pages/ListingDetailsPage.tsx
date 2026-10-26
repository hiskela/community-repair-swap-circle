
import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getListingById } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type Listing = {
  _id: string;
  title: string;
  description: string;
  type: 'need_repair' | 'available' | 'looking_for_parts';
  category: string;
  location?: string;
  wantedItem?: string;
  status: 'open' | 'reserved' | 'closed';
  createdAt?: string;
  owner?: { name?: string } | string;
};

const typeLabels: Record<Listing['type'], string> = {
  need_repair: 'Need a repair',
  available: 'Available to share or swap',
  looking_for_parts: 'Looking for parts',
};

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
const navigate=useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      if (!id || !token) {
        setError('Unable to load this listing. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const result = await getListingById(id, token);

        if (!cancelled) {
          setListing(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load this listing.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const ownerName =
    typeof listing?.owner === 'string'
      ? listing.owner
      : listing?.owner?.name;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="text-xl font-bold tracking-tight text-emerald-950"
          >
            Repair<span className="text-emerald-600">Circle</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/dashboard"
              className="font-medium text-slate-600 hover:text-emerald-700"
            >
              Dashboard
            </Link>
            <Link
              to="/listings"
              className="font-medium text-slate-600 hover:text-emerald-700"
            >
              Listings
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/listings"
          className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          ← Back to listings
        </Link>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">Loading listing...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <h1 className="text-lg font-semibold text-red-700">
              Could not load listing
            </h1>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Link
              to="/listings"
              className="mt-4 inline-block rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Browse listings
            </Link>
          </div>
        ) : listing ? (
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {typeLabels[listing.type]}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {listing.status}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {listing.title}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Category: {listing.category}
              </p>
            </div>

            <div className="space-y-7 p-6 sm:p-8">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </h2>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                  {listing.description}
                </p>
              </section>

              {listing.wantedItem && (
                <section className="rounded-xl bg-emerald-50 p-4">
                  <h2 className="text-sm font-semibold text-emerald-800">
                    Wanted in return
                  </h2>
                  <p className="mt-2 text-slate-800">
                    {listing.wantedItem}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-emerald-800">
                    You can discuss exchange details and any extra payment
                    through chat.
                  </p>
                </section>
              )}

              {listing.location && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Location
                  </h2>
                  <p className="mt-2 text-slate-700">{listing.location}</p>
                </section>
              )}

              <section className="border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Posted by
                </h2>
                <p className="mt-2 font-medium text-slate-800">
                  {ownerName || 'Community member'}
                </p>
                {listing.createdAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    Posted on{' '}
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                )}
              </section>

            {listing.status === 'open' && (
  <div className="border-t border-slate-100 pt-5">
    <p className="text-sm leading-6 text-slate-600">
      Interested in this listing? Send an offer to the owner and
      discuss repair, swapping, or any additional payment.
    </p>

    <button
      type="button"
      onClick={() => navigate(`/listings/${listing._id}/offer`)}
      className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
    >
      Make an Offer
    </button>
  </div>
)}
            </div>
          </article>
        ) : null}
      </main>
    </div>
  );
}
