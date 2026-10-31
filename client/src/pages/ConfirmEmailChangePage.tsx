import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmailChange } from '../services/api';

export default function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleConfirmation() {
    if (!token) {
      setError('The verification link is missing its token.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await confirmEmailChange(token);
      setMessage(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Email confirmation failed. The link may have expired.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Confirm New Email
        </h1>

        <p className="mb-6 text-gray-600">
          Confirm that you own the new email address to complete your account
          email change.
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

        {!message && (
          <button
            type="button"
            onClick={handleConfirmation}
            disabled={loading || !token}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Confirming...' : 'Confirm email address'}
          </button>
        )}

        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}