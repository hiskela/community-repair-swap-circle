import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  getMyProfile,
  requestEmailChange,
  requestEmailVerification,
  type UserProfile,
} from '../services/api';

export default function AccountSettingsPage() {
  const { token } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;

      try {
        const result = await getMyProfile(token);
        setProfile(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load profile.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  async function handleResendVerification() {
    if (!token) return;

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const result = await requestEmailVerification(token);
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not send verification email.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) return;

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const result = await requestEmailChange(newEmail, password, token);
      setMessage(result.message);
      setNewEmail('');
      setPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not request email change.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading account settings...</div>;
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-red-600">{error || 'Profile could not be loaded.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Account Settings
      </h1>
      <p className="mb-8 text-gray-600">
        Manage your account information and email verification.
      </p>

      {message && (
        <div className="mb-5 rounded-lg bg-green-50 p-4 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Account Information</h2>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium text-gray-900">{profile.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email address</p>
            <p className="font-medium text-gray-900">{profile.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email verification</p>
            {profile.isEmailVerified ? (
              <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Verified
              </span>
            ) : (
              <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                Not verified
              </span>
            )}
          </div>
        </div>

        {!profile.isEmailVerified && (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={submitting}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Resend verification email'}
          </button>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Change Email Address</h2>

        <p className="mb-5 text-sm text-gray-600">
          Your current email remains active until you verify the new email
          address.
        </p>

        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label
              htmlFor="newEmail"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              New email address
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              required
              maxLength={254}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              placeholder="Enter your new email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Current password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !newEmail || !password}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Request email change'}
          </button>
        </form>
      </section>
    </div>
  );
}