
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createListing } from '../services/api';
import { useAuth } from '../auth/AuthContext';

type ListingType = 'need_repair' | 'available' | 'looking_for_parts';

export default function CreateListingPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ListingType>('available');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 const [wantedItem, setWantedItem]=useState()
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    if (title.trim().length < 3) {
      setError('Title must contain at least 3 characters.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must contain at least 10 characters.');
      return;
    }

    if (category.trim().length < 2) {
      setError('Category must contain at least 2 characters.');
      return;
    }

    setLoading(true);

    try {
      await createListing(
        {
          title: title.trim(),
          description: description.trim(),
          type,
          category: category.trim(),
          ...(location.trim() ? { location: location.trim() } : {}),
...(wantedItem.trim() ? { wantedItem: wantedItem.trim() } : {}),
        },
        token,
      );

      navigate('/listings', {
        replace: true,
        state: { message: 'Your listing was created successfully.' },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your listing. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10';

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
            <Link to="/listings" className="font-medium text-slate-600 hover:text-emerald-700">
              Listings
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <Link to="/listings" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            ← Back to listings
          </Link>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Community marketplace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Create a listing
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Share something you need repaired, an item you can offer, or parts you are looking for.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Listing title
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              maxLength={100}
              placeholder="e.g. Bicycle needs a brake repair"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">{title.length}/100 characters</p>
          </div>

          <div>
            <label htmlFor="type" className="text-sm font-semibold text-slate-700">
              What do you need?
            </label>
            <select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value as ListingType)}
              className={inputClass}
            >
              <option value="available">I have an item to share</option>
              <option value="need_repair">I need something repaired</option>
              <option value="looking_for_parts">I am looking for parts</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="text-sm font-semibold text-slate-700">
              Category
            </label>
            <input
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Electronics, Furniture, Bicycles"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              minLength={10}
              maxLength={1000}
              rows={5}
              placeholder="Describe the item, its condition, or the repair or parts you need..."
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              {description.length}/1000 characters · Minimum 10
            </p>
          </div>

          <div>
            <label htmlFor="location" className="text-sm font-semibold text-slate-700">
              Location <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={200}
              placeholder="e.g. Jimma"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">
              A general area is enough. Do not enter your private home address.
            </p>
          </div>
<div>
  <label
    htmlFor="wantedItem"
    className="text-sm font-semibold text-slate-700"
  >
    What do you want in return? <span className="font-normal text-slate-400">(Optional)</span>
  </label>
  <input
    id="wantedItem"
    type="text"
    value={wantedItem}
    onChange={(event) => setWantedItem(event.target.value)}
    maxLength={200}
    placeholder="e.g. A mobile phone, bicycle parts, or anything useful"
    className={inputClass}
  />
  <p className="mt-1 text-xs text-slate-500">
    You can discuss the exact exchange terms, including any extra money, through chat.
  </p>
</div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link
              to="/listings"
              className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating listing…' : 'Publish listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
