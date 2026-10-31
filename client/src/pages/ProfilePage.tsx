
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyProfile,
  updateMyProfile,
  type UserProfile,
} from '../services/api';
import { useAuth } from '../auth/AuthContext';

export default function ProfilePage() {
  const { token } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProfile = useCallback(async () => {
    if (!token) {
      setError('Please sign in to view your profile.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await getMyProfile(token);

      setProfile(result);
      setName(result.name);
      setLocation(result.location ?? '');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load your profile.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function cancelEditing() {
    if (!profile) return;

    setName(profile.name);
    setLocation(profile.location ?? '');
    setEditing(false);
    setError('');
    setSuccess('');
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !profile) return;

    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError('Name must contain between 2 and 100 characters.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updatedProfile = await updateMyProfile(
        {
          name: trimmedName,
          location: trimmedLocation,
        },
        token,
      );

      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setLocation(updatedProfile.location ?? '');
      setEditing(false);
      setSuccess('Your profile has been updated successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update your profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-white p-8">
          <h1 className="text-xl font-bold text-slate-900">
            Could not load profile
          </h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadProfile}
            className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="mt-2 text-slate-600">
            View and manage your personal information.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-8 sm:px-8">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white text-3xl font-bold text-emerald-800">
                {profile.name.charAt(0).toUpperCase()}
              </div>

              <div className="text-white">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="mt-1 text-sm text-emerald-50">
                  {profile.email}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold capitalize">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Personal information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your profile details and contact information.
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Edit profile
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-location"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Location
                  </label>
                  <input
                    id="profile-location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    maxLength={200}
                    placeholder="Enter your location"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Full name
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {profile.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email address
                  </p>
                  <p className="mt-2 break-all font-medium text-slate-900">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Location
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {profile.location || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email verification
                  </p>
                  <p className="mt-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        profile.isEmailVerified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {profile.isEmailVerified ? 'Verified' : 'Not verified'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">
            Account information
          </h2>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account role
              </p>
              <p className="mt-2 font-medium capitalize text-slate-900">
                {profile.role}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account status
              </p>
              <p className="mt-2 font-medium text-slate-900">
                {profile.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Member since
              </p>
              <p className="mt-2 font-medium text-slate-900">
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <Link
              to="/settings"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Manage account settings →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
