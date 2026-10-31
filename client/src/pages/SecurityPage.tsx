
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { changePassword } from '../services/api';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  toggleVisibility: () => void;
  placeholder: string;
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  toggleVisibility,
  placeholder,
}: PasswordInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          autoComplete="off"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-sm text-gray-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordIsLongEnough = newPassword.length >= 8;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Your new password must contain at least 8 characters.');
      return;
    }

    if (newPassword.length > 72) {
      setError('Your new password cannot exceed 72 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Your new passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        'Your new password must be different from your current password.',
      );
      return;
    }

    try {
      setLoading(true);

      const result = await changePassword(
        {
          currentPassword,
          newPassword,
        },
        token,
      );

      setSuccess(result.message || 'Password changed successfully.');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to change your password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            to="/profile"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            ← Back to Profile
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Security
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage your password and keep your account secure.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                🔐
              </div>

              <h2 className="font-bold text-gray-900">
                Account protection
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Use a strong, unique password to protect your account from
                unauthorized access.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <h3 className="font-semibold text-emerald-900">
                Password tips
              </h3>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-800">
                <li>• Use at least 8 characters.</li>
                <li>• Avoid passwords you use elsewhere.</li>
                <li>• Don't share your password.</li>
                <li>• Avoid easily guessed information.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Change Password
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter your current password and choose a new one.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                  ✓ {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <PasswordInput
                  label="Current Password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  visible={showCurrentPassword}
                  toggleVisibility={() =>
                    setShowCurrentPassword((value) => !value)
                  }
                  placeholder="Enter your current password"
                />

                <PasswordInput
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNewPassword}
                  toggleVisibility={() =>
                    setShowNewPassword((value) => !value)
                  }
                  placeholder="Enter your new password"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Minimum 8 characters
                    </span>

                    <span
                      className={
                        passwordIsLongEnough
                          ? 'font-semibold text-emerald-700'
                          : 'text-gray-400'
                      }
                    >
                      {passwordIsLongEnough ? '✓ Requirement met' : 'Not met'}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordIsLongEnough
                          ? 'w-full bg-emerald-600'
                          : newPassword.length > 0
                            ? 'w-1/2 bg-amber-500'
                            : 'w-0'
                      }`}
                    />
                  </div>
                </div>

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  toggleVisibility={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  placeholder="Enter your new password again"
                />

                {confirmPassword.length > 0 && (
                  <p
                    className={`text-xs font-medium ${
                      passwordsMatch ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {passwordsMatch
                      ? '✓ Passwords match'
                      : 'Passwords do not match'}
                  </p>
                )}

                <div className="border-t border-gray-100 pt-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? 'Changing Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
