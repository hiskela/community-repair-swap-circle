
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPublicListings, type Listing } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const typeLabels: Record<string, string> = {
  need_repair: 'Repair needed',
  available: 'Item available',
  looking_for_parts: 'Parts wanted',
};

const typeColors: Record<string, string> = {
  need_repair: 'bg-orange-50 text-orange-700',
  available: 'bg-emerald-50 text-emerald-700',
  looking_for_parts: 'bg-blue-50 text-blue-700',
};

const categories = [
  { label: 'Electronics', icon: '💻' },
  { label: 'Bicycles', icon: '🚲' },
  { label: 'Clothing', icon: '👕' },
  { label: 'Furniture', icon: '🪑' },
  { label: 'Tools', icon: '🔧' },
  { label: 'Kitchen', icon: '🍳' },
];

const howItWorks = [
  {
    step: '01',
    title: 'Browse listings',
    description:
      'Explore repair requests, available items, and spare parts from people in your community.',
    icon: '🔍',
  },
  {
    step: '02',
    title: 'Submit an offer',
    description:
      'Found something useful? Send an offer to the listing owner and describe what you can bring to the exchange.',
    icon: '✉️',
  },
  {
    step: '03',
    title: 'Make it happen',
    description:
      'Agree on the details, complete the transaction, and leave a review to build community trust.',
    icon: '🤝',
  },
];

const benefits = [
  {
    icon: '♻️',
    title: 'Reduce waste',
    description: 'Keep useful items in circulation instead of sending them to landfill.',
  },
  {
    icon: '🔒',
    title: 'Safe & trustworthy',
    description: 'Verified reviews, transparent transaction history, and dispute resolution.',
  },
  {
    icon: '🌍',
    title: 'Community-first',
    description: 'Connect with people nearby. Share skills, tools, and knowledge.',
  },
  {
    icon: '💸',
    title: 'Save money',
    description: 'Repair instead of replace. Swap instead of buy. Keep more in your pocket.',
  },
];

export default function HomePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPublicListings({
        keyword: keyword.trim() || undefined,
        type: selectedType || undefined,
        category: selectedCategory || undefined,
        limit: 9,
        page: 1,
      });
      setListings(res.data);
    } catch {
      setError('Could not load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedType, selectedCategory]);


useEffect(() => {
  const timeoutId = setTimeout(() => {
    loadListings();
  }, 300);

  return () => clearTimeout(timeoutId);
}, [loadListings]);


  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void loadListings();
  }

  function handleCategoryClick(cat: string) {
    setSelectedCategory((prev) => (prev === cat ? '' : cat));
    setKeyword('');
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-20 text-white sm:px-10 sm:py-28">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-300/10 blur-2xl" />

        <div className="relative mx-auto max-w-5xl">
          <span className="inline-block rounded-full bg-emerald-400/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Community Repair &amp; Swap Circle
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Fix it. Share it.
            <br />
            <span className="text-emerald-300">Waste less together.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-100/90">
            A community platform where neighbours connect to repair useful
            items, swap things they no longer need, and find spare parts —
            keeping goods in use and out of landfill.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            {token ? (
              <Link
                to="/dashboard"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 shadow-lg transition hover:bg-emerald-50 hover:shadow-emerald-900/30"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 shadow-lg transition hover:bg-emerald-50 hover:shadow-emerald-900/30"
                >
                  Join for free →
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-8 text-sm text-emerald-200/80">
            <span>✓ Free to join</span>
            <span>✓ No ads or fees</span>
            <span>✓ Real community listings</span>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ─────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search listings — bicycle, phone repair, drill..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Search
            </button>
          </form>

          {/* Type filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { value: '', label: 'All listings' },
              { value: 'need_repair', label: 'Repair needed' },
              { value: 'available', label: 'Items available' },
              { value: 'looking_for_parts', label: 'Parts wanted' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedType(opt.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  selectedType === opt.value
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY CATEGORY ─────────────────────────────── */}
      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-slate-900">Browse by category</h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleCategoryClick(cat.label)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-xs font-semibold transition ${
                  selectedCategory === cat.label
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT LISTINGS ────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-12 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {selectedType || selectedCategory || keyword
                  ? 'Matching listings'
                  : 'Recent listings'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? 'Loading...'
                  : `${listings.length} listing${listings.length === 1 ? '' : 's'} found`}
              </p>
            </div>
            <Link
              to="/listings"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all →
            </Link>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={() => void loadListings()}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-slate-100" />
                  <div className="mt-3 h-4 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 && !error ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <span className="text-4xl">♻️</span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">No listings yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Be the first to post a repair request, available item, or spare part.
              </p>
              {token ? (
                <Link
                  to="/listings/new"
                  className="mt-5 inline-block rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Create a listing
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="mt-5 inline-block rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Join and post first
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const ownerName =
                  typeof listing.owner === 'string'
                    ? listing.owner
                    : listing.owner?.name;

                return (
                  <article
                    key={listing._id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/60"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          typeColors[listing.type] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {typeLabels[listing.type] ?? listing.type}
                      </span>
                      {listing.location && (
                        <span className="text-xs text-slate-400">
                          📍 {listing.location}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900">
                      {listing.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                      {listing.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{listing.category}</span>
                      {ownerName && <span>by {ownerName}</span>}
                    </div>

                    <Link
                      to={`/listings/${listing._id}`}
                      className="mt-4 inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-700 hover:text-white"
                    >
                      View details →
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/listings"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Browse all listings →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-slate-500">
              Three simple steps to connect with your community.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.step} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  {step.icon}
                </div>
                <span className="absolute top-0 right-0 text-xs font-bold text-slate-200">
                  {step.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ───────────────────────────────────────── */}
      <section className="bg-slate-50 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Why join the circle?
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="text-3xl">{b.icon}</span>
                <h3 className="mt-3 font-bold text-slate-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTRATION CTA ───────────────────────────────── */}
      {!token && (
        <section className="px-6 py-20 sm:px-10">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-800 px-8 py-14 text-center text-white shadow-xl">
            <span className="text-4xl">♻️</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to join the community?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-emerald-100/90">
              Creating an account is free. Start by browsing listings or post
              your first repair request, available item, or spare part.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="rounded-xl bg-white px-8 py-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
              >
                Create a free account →
              </Link>
              <Link
                to="/listings"
                className="rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Browse listings first
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm font-bold text-emerald-900">
            Repair<span className="text-emerald-600">Circle</span>
          </p>
          <p className="text-xs text-slate-400">
            Repair more. Share more. Waste less.
          </p>
          <nav className="flex gap-5 text-xs text-slate-400">
            <Link to="/listings" className="hover:text-emerald-600">Browse</Link>
            <Link to="/register" className="hover:text-emerald-600">Register</Link>
            <Link to="/login" className="hover:text-emerald-600">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
