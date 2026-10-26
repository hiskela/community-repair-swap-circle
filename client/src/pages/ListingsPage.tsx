
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type Listing = {
  _id: string;
  title: string;
  description: string;
  type: 'need_repair' | 'available' | 'looking_for_parts';
  category: string;
  location?: string;
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
    available: 'Available',
    looking_for_parts: 'Parts wanted',
  };

  return labels[type] ?? type;
}

function statusStyle(status: Listing['status']) {
  if (status === 'open') return 'bg-emerald-50 text-emerald-800';
  if (status === 'reserved') return 'bg-amber-50 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

export default function ListingsPage() {
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    type: '',
    category: '',
    location: '',
  });

  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);
useEffect(() => {
  const timer = setTimeout(() => {
    setAppliedFilters((current) => ({
      ...current,
      keyword: filters.keyword.trim(),
    }));
  }, 300);

  return () => clearTimeout(timer);
}, [filters.keyword]);
useEffect(() => {
  const timer = setTimeout(() => {
    setAppliedFilters((current) => ({
      ...current,
      category: filters.category.trim(),
      location: filters.location.trim(),
      type: filters.type,
    }));
  }, 300);

  return () => clearTimeout(timer);
}, [filters.category, filters.location, filters.type]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
    });

    if (appliedFilters.keyword.trim()) {
      params.set('keyword', appliedFilters.keyword.trim());
    }
    if (appliedFilters.type) params.set('type', appliedFilters.type);
    if (appliedFilters.category.trim()) {
      params.set('category', appliedFilters.category.trim());
    }
    if (appliedFilters.location.trim()) {
      params.set('location', appliedFilters.location.trim());
    }

    try {
      const response = await fetch(`${API_URL}/listings?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Could not load listings (${response.status}).`);
      }

      const result: unknown = await response.json();
      const items = extractListings(result);

      setListings((current) => (page === 1 ? items : [...current, ...items]));

      let more = items.length === 12;

      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const object = result as Record<string, unknown>;
        const totalPages = object.totalPages ?? object.pages;

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
        err instanceof Error ? err.message : 'Something went wrong loading listings.',
      );
      if (page === 1) setListings([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setListings([]);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    const emptyFilters = {
      keyword: '',
      type: '',
      category: '',
      location: '',
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setListings([]);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-xl font-bold tracking-tight text-emerald-950">
            Repair<span className="text-emerald-600">Circle</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="font-medium text-slate-600 hover:text-emerald-700">
              Dashboard
            </Link>
            <Link to="/listings" className="font-semibold text-emerald-700">
              Listings
            </Link>
            <Link
              to="/listings/new"
              className="rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white transition hover:bg-emerald-800"
            >
              + Create listing
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-3xl bg-emerald-950 px-6 py-8 text-white sm:px-9 sm:py-10">
          <p className="text-sm font-semibold text-emerald-300">COMMUNITY MARKETPLACE</p>
          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Find something useful.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/80 sm:text-base">
                Discover repair requests, available items, and parts shared by your community.
              </p>
            </div>
            <p className="text-sm text-emerald-100/80">
              {loading ? 'Loading listings…' : `${listings.length} shown`}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="keyword" className="mb-2 block text-sm font-medium text-slate-700">
                Search listings
              </label>
             <input
  id="keyword"
  value={filters.keyword}
  onChange={(event) => {
    const keyword = event.target.value;

    setFilters((current) => ({ ...current, keyword }));
    setPage(1);
    setListings([]);
    setAppliedFilters((current) => ({
      ...current,
      keyword,
    }));
  }}
  placeholder="Try a bicycle, phone, or repair..."
  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
/>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="type" className="mb-2 block text-sm font-medium text-slate-700">
                  Listing type
                </label>
                <select
                  id="type"
                  value={filters.type}
onChange={(event) => {
  setFilters((current) => ({ ...current, type: event.target.value }));
  setPage(1);
  setListings([]);
}}                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                >
                  <option value="">All types</option>
                  <option value="need_repair">Repair needed</option>
                  <option value="available">Available</option>
                  <option value="looking_for_parts">Parts wanted</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <input
                  id="category"
                  value={filters.category}
onChange={(event) => {
  setFilters((current) => ({ ...current, category: event.target.value }));
  setPage(1);
  setListings([]);
}}                  placeholder="e.g. Electronics"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              <div>
                <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  id="location"
                  value={filters.location}
onChange={(event) => {
  setFilters((current) => ({ ...current, location: event.target.value }));
  setPage(1);
  setListings([]);
}}                  placeholder="e.g. Jimma"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
            <button onClick={() => void loadListings()} className="mt-2 font-semibold underline">
              Try again
            </button>
          </div>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Community listings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Browse what people are repairing, sharing, and looking for.
              </p>
            </div>
          </div>

          {loading && listings.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="mt-5 h-5 w-3/4 rounded bg-slate-100" />
                  <div className="mt-3 h-4 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="text-3xl">♻</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No listings found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try different search terms or clear your filters. You can also create the first listing.
              </p>
              <Link
                to="/listings/new"
                className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Create a listing
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <article
                  key={listing._id}
                  className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-slate-200/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      {typeLabel(listing.type)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyle(listing.status)}`}>
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
                    <p>Category: <span className="font-medium text-slate-700">{listing.category}</span></p>
                    {listing.location && (
                      <p>Location: <span className="font-medium text-slate-700">{listing.location}</span></p>
                    )}
                    {listing.createdAt && (
                      <p>Posted {new Date(listing.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>

                  <Link
                    to={`/listings/${listing._id}`}
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    View details →
                  </Link>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-7 text-center">
              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Load more listings'}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
