
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  deleteListing,
  getMyListings,
  type Listing,
} from '../services/api';

const typeLabels: Record<Listing['type'], string> = {
  need_repair: 'Need Repair',
  available: 'Available',
  looking_for_parts: 'Looking for Parts',
};

export default function MyListingsPage() {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    if (!token) {
      setError('Please log in to view your listings.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await getMyListings(token);
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load your listings.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  async function handleDelete(listing: Listing) {
    if (!token) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${listing.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(listing._id);
    setError('');

    try {
      await deleteListing(listing._id, token);
      setListings((current) =>
        current.filter((item) => item._id !== listing._id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete this listing.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto mt-8 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950">
            My Listings
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage items and repair requests you have posted.
          </p>
        </div>

        <Link
          to="/listings/new"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          + Create Listing
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadListings()}
            className="ml-3 font-bold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-600 shadow-sm">
          Loading your listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-14 text-center">
          <div className="text-4xl">♻️</div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            You haven't created any listings yet
          </h2>
          <p className="mt-2 text-gray-600">
            Create a listing to offer an item, request a repair, or find parts.
          </p>
          <Link
            to="/listings/new"
            className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Create your first listing
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {typeLabels[listing.type] ?? listing.type}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      listing.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : listing.status === 'reserved'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  {listing.title}
                </h2>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                  {listing.description}
                </p>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-semibold text-gray-700">Category:</dt>
                    <dd className="text-gray-600">{listing.category}</dd>
                  </div>

                  {listing.location && (
                    <div className="flex gap-2">
                      <dt className="font-semibold text-gray-700">Location:</dt>
                      <dd className="text-gray-600">{listing.location}</dd>
                    </div>
                  )}

                  {listing.createdAt && (
                    <div className="flex gap-2">
                      <dt className="font-semibold text-gray-700">Created:</dt>
                      <dd className="text-gray-600">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-auto flex gap-3 pt-6">
                  {listing.status === 'open' ? (
                    <>
                      <Link
                        to={`/listings/${listing._id}/edit`}
                        className="flex-1 rounded-xl border border-emerald-200 px-3 py-2.5 text-center text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => void handleDelete(listing)}
                        disabled={deletingId === listing._id}
                        className="flex-1 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === listing._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  ) : (
                    <p className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-center text-sm text-gray-500">
                      Only open listings can be edited or deleted.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
