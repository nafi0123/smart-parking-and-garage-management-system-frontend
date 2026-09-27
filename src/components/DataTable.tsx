'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import TableSkeleton from '@/components/TableSkeleton';
import { type IUser, UserService } from '@/services/user';
import Alert from '@/utils/alert';

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'MANAGER', label: 'Garage Manager' },
  { value: 'ADMIN', label: 'System Admin' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
];

const LIMIT_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

interface IOption<T> {
  value: T;
  label: string;
}

function SelectDropdown<T extends string | number>({
  value,
  options,
  onChange,
  className = '',
  dropdownPosition = 'bottom',
}: {
  value: T;
  options: IOption<T>[];
  onChange: (val: T) => void;
  className?: string;
  dropdownPosition?: 'bottom' | 'top';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-[var(--card)] text-xs text-[var(--ink)] font-semibold border-0 outline-none focus:outline-none cursor-pointer transition-all shadow-2xs select-none hover:bg-[var(--bg)]"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--sub)] shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            dropdownPosition === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } left-0 min-w-full w-max max-w-[240px] bg-[var(--card)] rounded-md shadow-xl border-0 py-1 z-50 flex flex-col gap-0.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold cursor-pointer border-0 outline-none flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[var(--navy-2)] text-white font-bold'
                    : 'text-[var(--ink)] hover:bg-[var(--bg)]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface IDataTableProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
}

export default function DataTable({
  title = 'User Management',
  subtitle = 'Live records from Central Parking Network',
  badgeLabel = 'Total',
}: IDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // TanStack React Query: useQuery
  const {
    data: queryResult,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, page, limit, sortBy, sortOrder],
    queryFn: () =>
      UserService.getAllUsers({
        searchTerm: debouncedSearch,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      }),
  });

  const users: IUser[] = queryResult?.data || [];
  const meta = queryResult?.meta || {
    page: 1,
    limit: 25,
    total: 0,
    totalPage: 1,
  };

  // TanStack React Query: useMutation for block/unblock
  const blockMutation = useMutation({
    mutationFn: (userId: string) => UserService.blockUser(userId),
    onSuccess: (res) => {
      if (res.success) {
        Alert.toast(res.message || 'User status updated successfully.', 'success');
      } else {
        Alert.error('Action Failed', res.message || 'Could not update user status.');
      }
    },
    onError: (_err) => {
      Alert.error('Error', 'An error occurred while updating user status.');
    },
  });

  async function handleToggleBlock(user: IUser) {
    if (user.role === 'ADMIN') {
      Alert.error('Protected Account', 'Admin users cannot be blocked.');
      return;
    }

    const actionText = user.isActive ? 'block' : 'unblock';
    const confirmed = await Alert.confirm({
      title: `${user.isActive ? 'Block' : 'Unblock'} User?`,
      text: `Are you sure you want to ${actionText} ${user.name} (${user.email})?`,
      confirmButtonText: `Yes, ${user.isActive ? 'Block User' : 'Unblock User'}`,
      cancelButtonText: 'Cancel',
      icon: user.isActive ? 'warning' : 'question',
      isDestructive: user.isActive,
    });

    if (!confirmed) return;

    blockMutation.mutate(user.id);
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  const errorMessage =
    queryError instanceof Error
      ? queryError.message
      : queryResult && !queryResult.success
      ? queryResult.message
      : null;

  return (
    <div className="w-full bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col my-5">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-slate-200/90 dark:border-slate-800">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight">
                {title}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-[var(--navy-2)] dark:text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {meta.total} {badgeLabel}
              </span>
            </div>
            <p className="text-xs text-[var(--sub)] mt-0.5">{subtitle}</p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            {(searchTerm || roleFilter !== 'ALL' || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('ALL');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--sub)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                title="Reset All Filters"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh Data"
            >
              <svg
                className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[var(--navy-2)]' : 'text-[var(--sub)]'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Unified Search & Filter Toolbar (Borderless) */}
        <div className="bg-[var(--bg)]/70 rounded-md p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--sub)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search by name, email, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-md border-0 bg-[var(--card)] text-xs text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:outline-none focus:ring-0 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--sub)] hover:text-[var(--ink)] text-xs"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns Container */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Role Filter */}
            <SelectDropdown
              value={roleFilter}
              options={ROLE_OPTIONS}
              onChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
              className="min-w-[135px] flex-1 sm:flex-none"
            />

            {/* Sort Order */}
            <SelectDropdown
              value={`${sortBy}-${sortOrder}`}
              options={SORT_OPTIONS}
              onChange={(val) => {
                const [sb, so] = val.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
                setPage(1);
              }}
              className="min-w-[135px] flex-1 sm:flex-none"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Ensure you are logged in with an authorized account to access this endpoint.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Area */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--bg)] border-b border-slate-200/90 dark:border-slate-800 text-[var(--sub)] font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">User</th>
              <th className="py-2.5 px-4">Phone</th>
              <th className="py-2.5 px-4">Role</th>
              <th className="py-2.5 px-4">OTP Status</th>
              <th className="py-2.5 px-4">Account Status</th>
              <th className="py-2.5 px-4">Joined Date</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800">
            {loading ? (
              <TableSkeleton rows={limit > 25 ? 8 : 6} />
            ) : users.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-10 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                    <svg className="w-9 h-9 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-[var(--ink)]">No Records Found</p>
                    <p className="text-xs mt-0.5">
                      {searchTerm || roleFilter !== 'ALL'
                        ? 'Try clearing your search or filter parameters.'
                        : 'No records available in the database.'}
                    </p>
                    {(searchTerm || roleFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter('ALL');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-md bg-[var(--navy-2)] text-white text-xs font-medium hover:bg-[var(--navy)]"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Rows
              users.map((user) => {
                const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
                const isBlocked = !user.isActive;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-[var(--bg)]/50 transition-colors group"
                  >
                    {/* User Profile */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0f2a6b] to-[#3b82f6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--ink)] text-xs flex items-center gap-1.5">
                            {user.name}
                            {user.role === 'ADMIN' && (
                              <span className="text-[10px] text-amber-500" title="System Administrator">
                                ★
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--sub)] font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--ink)]">
                      {user.phone || <span className="text-[var(--sub)] italic">None</span>}
                    </td>

                    {/* Role Badge */}
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : user.role === 'MANAGER'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-2.5 px-4">
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending OTP
                        </span>
                      )}
                    </td>

                    {/* Account Status (Active/Blocked) */}
                    <td className="py-2.5 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Blocked
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-2.5 px-4 text-[11px] text-[var(--sub)] font-medium whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Action Block/Unblock Button */}
                    <td className="py-2.5 px-4 text-right">
                      {user.role === 'ADMIN' ? (
                        <span className="text-[10px] text-[var(--sub)] italic">Admin Protected</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleBlock(user)}
                          disabled={blockMutation.isPending}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                            isBlocked
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {blockMutation.isPending
                            ? 'Processing...'
                            : isBlocked
                            ? 'Unblock'
                            : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls (Borderless items) */}
      <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-[var(--bg)]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Items per page dropdown (25, 50, 100) */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--sub)] font-medium text-xs">Rows per page:</span>
          <SelectDropdown
            value={limit}
            options={LIMIT_OPTIONS}
            onChange={(val) => {
              setLimit(Number(val));
              setPage(1);
            }}
            dropdownPosition="top"
            className="min-w-[65px]"
          />

          <span className="text-[var(--sub)] text-[11px] ml-2">
            Showing {users.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
          </span>
        </div>

        {/* Right: Page Navigation Controls */}
        <div className="flex items-center gap-1.5">
          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-2.5 py-1 rounded-md border-0 bg-[var(--card)] text-[var(--ink)] font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>←</span> Prev
          </button>

          {/* Page indicator pill */}
          <div className="px-2.5 py-1 rounded-md border-0 bg-[var(--card)] text-xs font-bold text-[var(--ink)] shadow-2xs">
            Page {meta.page} of {Math.max(1, meta.totalPage)}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
            disabled={page >= meta.totalPage || loading}
            className="px-2.5 py-1 rounded-md border-0 bg-[var(--card)] text-[var(--ink)] font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            Next <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
