
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  getAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
  type AdminUsersFilters,
} from '../../services/api';

export default function AdminUsersPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
if (!token) {
    setLoading(false);
    setError('You are not authenticated. Please log in again.');
    return;
  }

    setLoading(true);
    setError('');

    try {
      const filters: AdminUsersFilters = {
        search: search.trim() || undefined,
        role: role ? (role as 'user' | 'admin') : undefined,
        status: status ? (status as 'active' | 'inactive') : undefined,
      };

      const data = await getAdminUsers(token, filters);
console.log('Users API response:', data);
console.log('Is response an array:', Array.isArray(data));
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, search, role, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const statistics = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
    admins: users.filter((user) => user.role === 'admin').length,
  }), [users]);

  async function handleStatusChange(user: AdminUser) {
    if (!token) return;

    const nextStatus = !user.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} ${user.name}?`,
    );

    if (!confirmed) return;

    setUpdatingId(user._id);
    setError('');

    try {
      await updateAdminUserStatus(user._id, nextStatus, token);

      if (selectedUser?._id === user._id) {
        setSelectedUser({
          ...selectedUser,
          isActive: nextStatus,
        });
      }

      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  }

  const statCards = [
    { label: 'Total Users', value: statistics.total },
    { label: 'Active Users', value: statistics.active },
    { label: 'Inactive Users', value: statistics.inactive },
    { label: 'Administrators', value: statistics.admins },
  ];

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          User Management
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage registered users and their account status.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-xl border border-slate-700 bg-slate-800 p-3 sm:p-5"
          >
            <p className="text-xs text-slate-400 sm:text-sm">
              {stat.label}
            </p>
            <p className="mt-2 text-xl font-bold text-white sm:text-2xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 sm:p-5">
        <h2 className="mb-4 font-semibold text-white">
          Search and Filter
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className="min-w-0 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
          />

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Registered Users */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 p-4 sm:p-5">
          <h2 className="font-semibold text-white">
            Registered Users
          </h2>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-400">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-slate-400">
            No users found.
          </p>
        ) : (
          <>
            {/* Mobile User Cards */}
            <div className="space-y-3 p-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-white">
                        {user.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-400">
                        {user.email}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
                      user.isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-700 pt-3">
                    <div>
                      <p className="text-xs text-slate-500">Role</p>
                      <p className="mt-1 text-sm capitalize text-slate-300">
                        {user.role}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Email Verification</p>
                      <p className={`mt-1 text-sm ${
                        user.isEmailVerified
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}>
                        {user.isEmailVerified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-600 active:scale-95"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => handleStatusChange(user)}
                      disabled={updatingId === user._id}
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.isActive
                          ? 'bg-red-600 hover:bg-red-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      {updatingId === user._id
                        ? 'Updating...'
                        : user.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet and Desktop Table */}
            <div className=" overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-900/70 text-slate-400">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Email Verification</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-700/30">
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">
                          {user.name}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-400">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 capitalize text-slate-300">
                        {user.role}
                      </td>

                      <td className="px-5 py-4">
                        <span className={
                          user.isEmailVerified
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }>
                          {user.isEmailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-200 transition-all duration-200 hover:bg-slate-600 active:scale-95"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleStatusChange(user)}
                            disabled={updatingId === user._id}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isActive
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                          >
                            {updatingId === user._id
                              ? 'Updating...'
                              : user.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    
{/* User Details Modal */}
{selectedUser && (
  <div
  className="fixed inset-x-0 bottom-0 top-20 z-[9999] flex justify-center overflow-y-auto bg-slate-950 p-4"
  onClick={() => setSelectedUser(null)}
>
<div
  className="my-auto max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl"
  onClick={(event) => event.stopPropagation()}
>
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-slate-700 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">
            User Details
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            View account information
          </p>
        </div>

        <button
          onClick={() => setSelectedUser(null)}
          className="rounded-lg bg-slate-700 p-2 text-slate-300 transition hover:bg-slate-600 hover:text-white"
          aria-label="Close user details"
        >
          ✕
        </button>
      </div>

      {/* User Information */}
      <div className="space-y-5 p-5 sm:p-6">

        {/* User Profile */}
        <div className="flex items-center gap-4 rounded-xl bg-slate-900 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xl font-bold text-emerald-400">
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-semibold text-white">
              {selectedUser.name}
            </h3>
            <p className="break-all text-sm text-slate-400">
              {selectedUser.email}
            </p>
          </div>
        </div>

        {/* Account Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Account Status</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
              selectedUser.isActive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {selectedUser.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Email Verification</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
              selectedUser.isEmailVerified
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}>
              {selectedUser.isEmailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Detail label="Full Name" value={selectedUser.name} />
          <Detail label="Email Address" value={selectedUser.email} />
          <Detail label="Role" value={selectedUser.role} />
          <Detail
            label="Location"
            value={selectedUser.location || 'Not provided'}
          />
          <Detail
            label="Registration Date"
            value={new Date(selectedUser.createdAt).toLocaleDateString()}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end border-t border-slate-700 p-4 sm:p-5">
        <button
          onClick={() => setSelectedUser(null)}
          className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-medium text-white transition hover:cursor-pointer hover:bg-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-900 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm text-white">{value}</p>
    </div>
  );
}
