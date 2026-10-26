
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
  const [wantedItem, setWantedItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputClass =
    'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:bg-slate-50';

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-7">
        <section>
          <p className="text-sm font-semibold text-emerald-700">
            COMMUNITY MARKETPLACE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create a listing
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Need a repair, have something useful to share, or looking for
            parts? Create a listing to connect with your community.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <section className="space-y-5">
            <div>
              <label
                htmlFor="type"
                className="text-sm font-semibold text-slate-700"
              >
                What would you like to do?
              </label>

              <select
                id="type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as ListingType)
                }
                className={inputClass}
                disabled={loading}
              >
                <option value="available">Share or offer an item</option>
                <option value="need_repair">Request a repair</option>
                <option value="looking_for_parts">Look for parts</option>
              </select>

              <p className="mt-1 text-xs text-slate-500">
                Choose the option that best describes your listing.
              </p>
            </div>

            <div>
              <label
                htmlFor="title"
                className="text-sm font-semibold text-slate-700"
              >
                Listing title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={3}
                maxLength={100}
                placeholder="e.g. Bicycle needs brake repair"
                className={inputClass}
                disabled={loading}
              />

              <p className="mt-1 text-right text-xs text-slate-500">
                {title.length}/100
              </p>
            </div>

            <div>
              <label
                htmlFor="category"
                className="text-sm font-semibold text-slate-700"
              >
                Category
              </label>

              <input
                id="category"
                type="text"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                minLength={2}
                maxLength={100}
                placeholder="e.g. Electronics, Furniture, Bicycles"
                className={inputClass}
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-semibold text-slate-700"
              >
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
                disabled={loading}
              />

              <p className="mt-1 text-right text-xs text-slate-500">
                {description.length}/1000 characters · Minimum 10
              </p>
            </div>
          </section>

          <section className="space-y-5 border-t border-slate-100 pt-6">
            <div>
              <label
                htmlFor="location"
                className="text-sm font-semibold text-slate-700"
              >
                General location{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>

              <input
                id="location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={200}
                placeholder="e.g. Jimma"
                className={inputClass}
                disabled={loading}
              />

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Share a general area only. Do not enter your private home
                address.
              </p>
            </div>

            <div>
              <label
                htmlFor="wantedItem"
                className="text-sm font-semibold text-slate-700"
              >
                What would you like in return?{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>

              <input
                id="wantedItem"
                type="text"
                value={wantedItem}
                onChange={(event) => setWantedItem(event.target.value)}
                maxLength={200}
                placeholder="e.g. Bicycle parts or another useful item"
                className={inputClass}
                disabled={loading}
              />

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Describe what you would prefer to receive. You can discuss
                the final terms with the other participant.
              </p>
            </div>
          </section>

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
              {loading ? 'Publishing…' : 'Publish listing'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
