
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const PAGE_SIZE = 12;

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

type Filters = {
  keyword: string;
  type: string;
  category: string;
  location: string;
};

const emptyFilters: Filters = {
  keyword: '',
  type: '',
  category: '',
  location: '',
};

function extractListings(response: unknown): Listing[] {
  if (Array.isArray(response)) return response as Listing[];

  if (response && typeof response === 'object') {
    const object = response as Record<string, unknown>;

    for (const key of ['items', 'data', 'results', 'listings']) {
      const value = object[key];

      if (Array.isArray(value)) return value as Listing[];

      if (value && typeof value === 'object') {
        const nested = value as Record<string, unknown>;

        for (const nestedKey of ['items', 'results', 'listings']) {
          if (Array.isArray(nested[nestedKey])) {
            return nested[nestedKey] as Listing[];
          }
        }
      }
    }
  }

  return [];
}

function typeLabel(type: Listing['type']) {
  const labels: Record<Listing['type'], string> = {
    need_repair: 'Repair needed',
    available: 'Item available',
    looking_for_parts: 'Parts wanted',
  };

  return labels[type] ?? type;
}

function statusStyle(status: Listing['status']) {
  if (status === 'open') return 'bg-emerald-50 text-emerald-800';
  if (status === 'reserved') return 'bg-amber-50 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function formatDate(date?: string) {
  if (!date) return '';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleDateString();
}

export default function ListingsPage() {
  const location = useLocation();

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const successMessage =
    (location.state as { message?: string } | null)?.message ?? '';

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (appliedFilters.keyword.trim()) {
      params.set('keyword', appliedFilters.keyword.trim());
    }
    if (appliedFilters.type) {
      params.set('type', appliedFilters.type);
    }
    if (appliedFilters.category.trim()) {
      params.set('category', appliedFilters.category.trim());
    }
    if (appliedFilters.location.trim()) {
      params.set('location', appliedFilters.location.trim());
    }

    try {
      const response = await fetch(
        `${API_URL}/listings?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Could not load listings (${response.status}).`);
      }

      const result: unknown = await response.json();
      const items = extractListings(result);

      setListings((current) =>
        page === 1 ? items : [...current, ...items],
      );

      let more = items.length === PAGE_SIZE;

      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const object = result as Record<string, unknown>;
        const pagination = object.pagination as Record<string, unknown> | undefined;
        const totalPages = pagination?.totalPages ?? object.totalPages ?? object.pages;

        if (typeof totalPages === 'number') {
          more = page < totalPages;
        }

        if (typeof object.hasMore === 'boolean') {
          more = object.hasMore;
        }
      }

      setHasMore(more);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong loading listings.',
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFilters = {
      keyword: filters.keyword.trim(),
      type: filters.type,
      category: filters.category.trim(),
      location: filters.location.trim(),
    };

    setListings([]);
    setHasMore(false);
    setPage(1);
    setAppliedFilters(nextFilters);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setListings([]);
    setHasMore(false);
    setPage(1);
  }

  const hasActiveFilters = Object.values(appliedFilters).some(
    (value) => value !== '',
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Community marketplace
          </p>

          <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Find something useful.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100 sm:text-base">
                Discover items to share, repair requests, and useful parts
                from your community.
              </p>
            </div>

            <Link
              to="/listings/new"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
            >
              + Create listing
            </Link>
          </div>
        </section>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Find a listing
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by keyword or narrow your results using filters.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="keyword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search
              </label>
              <input
                id="keyword"
                type="search"
                value={filters.keyword}
                onChange={(event) =>
                  updateFilter('keyword', event.target.value)
                }
                placeholder="Try bicycle, phone, or repair..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Listing type
                </label>
                <select
                  id="type"
                  value={filters.type}
                  onChange={(event) =>
                    updateFilter('type', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="">All types</option>
                  <option value="need_repair">Repair needed</option>
                  <option value="available">Item available</option>
                  <option value="looking_for_parts">Parts wanted</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category
                </label>
                <input
                  id="category"
                  value={filters.category}
                  onChange={(event) =>
                    updateFilter('category', event.target.value)
                  }
                  placeholder="e.g. Electronics"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  General location
                </label>
                <input
                  id="location"
                  value={filters.location}
                  onChange={(event) =>
                    updateFilter('location', event.target.value)
                  }
                  placeholder="e.g. Jimma"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={loading && !hasActiveFilters}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-500">
                Active filters:
              </span>
              {appliedFilters.keyword && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Search: {appliedFilters.keyword}
                </span>
              )}
              {appliedFilters.type && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {typeLabel(appliedFilters.type as Listing['type'])}
                </span>
              )}
              {appliedFilters.category && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Category: {appliedFilters.category}
                </span>
              )}
              {appliedFilters.location && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Location: {appliedFilters.location}
                </span>
              )}
            </div>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadListings()}
              className="shrink-0 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Community listings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? 'Loading listings...'
                  : `${listings.length} listing${listings.length === 1 ? '' : 's'} loaded`}
              </p>
            </div>
          </div>

          {loading && listings.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-5 w-1/3 rounded bg-slate-100" />
                  <div className="mt-5 h-5 w-3/4 rounded bg-slate-100" />
                  <div className="mt-3 h-4 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="text-4xl">♻️</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No listings found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try another keyword or change your filters to find more
                results.
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : (
                <Link
                  to="/listings/new"
                  className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Create a listing
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <article
                  key={listing._id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {typeLabel(listing.type)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(listing.status)}`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  <h3 className="mt-4 line-clamp-2 text-lg font-bold text-slate-900">
                    {listing.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                    {listing.description}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <p>
                      Category:{' '}
                      <span className="font-semibold text-slate-700">
                        {listing.category}
                      </span>
                    </p>

                    {listing.location && (
                      <p>
                        Location:{' '}
                        <span className="font-medium text-slate-700">
                          {listing.location}
                        </span>
                      </p>
                    )}

                    {listing.createdAt && formatDate(listing.createdAt) && (
                      <p>Posted {formatDate(listing.createdAt)}</p>
                    )}
                  </div>

                  {listing.wantedItem && (
                    <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Preferred in return
                      </p>
                      <p className="mt-1 text-sm leading-5 text-emerald-950">
                        {listing.wantedItem}
                      </p>
                    </div>
                  )}

                  <Link
                    to={`/listings/${listing._id}`}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    View details <span className="ml-2">→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-7 text-center">
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more listings'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
