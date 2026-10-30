
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminListings,
  getAdminListingById,
  updateAdminListingVisibility,
  type AdminListing,
  type AdminListingsFilters,
} from '../../services/api';

export default function AdminListingsPage() {
  const { token } = useAuth();

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [allListings, setAllListings] = useState<AdminListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const filters = useMemo<AdminListingsFilters>(() => ({
    search: search.trim() || undefined,
    status: status
      ? status as AdminListing['status']
      : undefined,
    type: type
      ? type as AdminListing['type']
      : undefined,
    category: category.trim() || undefined,
  }), [search, status, type, category]);

  const fetchListings = useCallback(async () => {
    if (!token) {
      setError('You are not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getAdminListings(token, filters);
      setListings(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load listings',
      );
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  const fetchAllListings = useCallback(async () => {
    if (!token) return;

    try {
      const data = await getAdminListings(token);
      setAllListings(data);
    } catch (err) {
      console.error('Failed to load listing statistics:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    fetchAllListings();
  }, [fetchAllListings]);

  const handleViewDetails = async (id: string) => {
    if (!token) return;

    try {
      setDetailsLoading(true);
      setActionError('');

      const listing = await getAdminListingById(id, token);
      setSelectedListing(listing);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to load listing details',
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleVisibilityChange = async (listing: AdminListing) => {
    if (!token) return;

    const hidden = listing.status === 'open';

    const confirmed = window.confirm(
      hidden
        ? `Are you sure you want to hide "${listing.title}"?`
        : `Are you sure you want to republish "${listing.title}"?`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setActionError('');

      await updateAdminListingVisibility(listing._id, hidden, token);

      if (selectedListing?._id === listing._id) {
        setSelectedListing(null);
      }

      await Promise.all([fetchListings(), fetchAllListings()]);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to update listing',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: allListings.length,
    open: allListings.filter(item => item.status === 'open').length,
    hidden: allListings.filter(item => item.status === 'hidden').length,
    reserved: allListings.filter(item => item.status === 'reserved').length,
    closed: allListings.filter(item => item.status === 'closed').length,
  }), [allListings]);

  const getStatusStyle = (listingStatus: AdminListing['status']) => {
    const styles = {
      open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      hidden: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      reserved: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    return styles[listingStatus];
  };

  const getTypeLabel = (listingType: AdminListing['type']) => {
    const labels = {
      need_repair: 'Need Repair',
      available: 'Available',
      looking_for_parts: 'Looking for Parts',
    };

    return labels[listingType];
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setType('');
    setCategory('');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Listing Management
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Review, manage, and moderate community listings.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Listings', value: stats.total },
          { label: 'Open', value: stats.open },
          { label: 'Hidden', value: stats.hidden },
          { label: 'Reserved', value: stats.reserved },
          { label: 'Closed', value: stats.closed },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="hidden">Hidden</option>
            <option value="reserved">Reserved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="">All types</option>
            <option value="need_repair">Need Repair</option>
            <option value="available">Available</option>
            <option value="looking_for_parts">Looking for Parts</option>
          </select>

          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Filter by category..."
            className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            Clear filters
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {actionError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
          Loading listings...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && listings.length === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center">
          <h3 className="text-lg font-semibold text-white">
            No listings found
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Try changing your search or filters.
          </p>
        </div>
      )}

      {/* Mobile listing cards */}
      {!loading && listings.length > 0 && (
        <div className="space-y-3 md:hidden">
          {listings.map((listing) => (
            <div
              key={listing._id}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-white">
                    {listing.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {listing.category}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-xs ${getStatusStyle(listing.status)}`}
                >
                  {listing.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <p>Owner: {listing.owner?.name || 'Unknown'}</p>
                <p>Type: {getTypeLabel(listing.type)}</p>
                <p>Created: {formatDate(listing.createdAt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-700 pt-3">
                <button
                  onClick={() => handleViewDetails(listing._id)}
                  disabled={detailsLoading}
                  className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  Details
                </button>

                {(listing.status === 'open' || listing.status === 'hidden') && (
                  <button
                    onClick={() => handleVisibilityChange(listing)}
                    disabled={actionLoading}
                    className={`rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50 ${
                      listing.status === 'open'
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {listing.status === 'open' ? 'Hide listing' : 'Republish'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop listings table */}
      {!loading && listings.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border border-slate-700 md:block">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="px-5 py-4">Listing</th>
                <th className="px-5 py-4">Owner</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700 bg-slate-900">
              {listings.map((listing) => (
                <tr key={listing._id} className="hover:bg-slate-800/70">
                  <td className="max-w-xs px-5 py-4">
                    <p className="break-words font-medium text-white">
                      {listing.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {listing.category}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-white">
                      {listing.owner?.name || 'Unknown'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {listing.owner?.email || ''}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {getTypeLabel(listing.type)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(listing.status)}`}
                    >
                      {listing.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                    {formatDate(listing.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewDetails(listing._id)}
                        disabled={detailsLoading}
                        className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-white hover:bg-slate-600 disabled:opacity-50"
                      >
                        Details
                      </button>

                      {(listing.status === 'open' || listing.status === 'hidden') && (
                        <button
                          onClick={() => handleVisibilityChange(listing)}
                          disabled={actionLoading}
                          className={`rounded-lg px-3 py-2 text-xs disabled:opacity-50 ${
                            listing.status === 'open'
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {listing.status === 'open' ? 'Hide' : 'Republish'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listing details modal */}
      {selectedListing && (
        <div
          className="fixed inset-x-0 bottom-0 top-20 z-[9999] flex justify-center overflow-y-auto bg-slate-950 p-4"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="my-auto max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 p-5">
              <h2 className="text-xl font-bold text-white">
                Listing Details
              </h2>

              <button
                onClick={() => setSelectedListing(null)}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-xs text-slate-400">Title</p>
                <h3 className="mt-1 break-words text-lg font-semibold text-white">
                  {selectedListing.title}
                </h3>
              </div>

              <div>
                <p className="text-xs text-slate-400">Description</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                  {selectedListing.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="mt-1 text-sm text-white">
                    {selectedListing.category}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="mt-1 text-sm text-white">
                    {getTypeLabel(selectedListing.type)}
                  </p>
                </div>

                {selectedListing.wantedItem && (
                  <div>
                    <p className="text-xs text-slate-400">Wanted Item</p>
                    <p className="mt-1 break-words text-sm text-white">
                      {selectedListing.wantedItem}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="mt-1 text-sm text-white">
                    {selectedListing.location || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <span
                    className={`mt-1 inline-block rounded-full border px-3 py-1 text-xs ${getStatusStyle(selectedListing.status)}`}
                  >
                    {selectedListing.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Created</p>
                  <p className="mt-1 text-sm text-white">
                    {formatDate(selectedListing.createdAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <h3 className="font-semibold text-white">Listing Owner</h3>
                <p className="mt-3 text-sm text-slate-300">
                  {selectedListing.owner?.name || 'Unknown'}
                </p>
                <p className="mt-1 break-all text-sm text-slate-400">
                  {selectedListing.owner?.email || 'No email available'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700 p-5">
              {(selectedListing.status === 'open' ||
                selectedListing.status === 'hidden') && (
                <button
                  onClick={() => handleVisibilityChange(selectedListing)}
                  disabled={actionLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                    selectedListing.status === 'open'
                      ? 'bg-rose-600 text-white hover:bg-rose-500'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {actionLoading
                    ? 'Updating...'
                    : selectedListing.status === 'open'
                      ? 'Hide Listing'
                      : 'Republish Listing'}
                </button>
              )}

              <button
                onClick={() => setSelectedListing(null)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
