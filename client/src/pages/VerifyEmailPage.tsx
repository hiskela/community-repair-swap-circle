
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setMessage('Verification token is missing.');
        setLoading(false);
        return;
      }

      try {
        const result = await verifyEmail(token);

        if (active) {
          setMessage(result.message);
          setSuccess(true);
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Email verification failed.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">
          Email Verification
        </h1>

        {loading ? (
          <p>Verifying your email address...</p>
        ) : (
          <>
            <p className={success ? 'text-green-600' : 'text-red-600'}>
              {message}
            </p>

            {success && (
              <p className="mt-3 text-gray-600">
                Your email address has been verified successfully.
              </p>
            )}

            <Link
              to="/login"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
