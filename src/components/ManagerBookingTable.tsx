'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import TableSkeleton from '@/components/TableSkeleton';
import { type IBooking, BookingService } from '@/services/booking';
import Alert from '@/utils/alert';
import { getAuthUser } from '@/utils/cookie';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Booking Status' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending Payment' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'totalPrice-desc', label: 'Revenue: High to Low' },
  { value: 'totalPrice-asc', label: 'Revenue: Low to High' },
];

const LIMIT_OPTIONS = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
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
          className={`w-3.5 h-3.5 text-[var(--sub)] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
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
          } left-0 min-w-full w-max max-w-[240px] bg-[var(--card)] rounded-md shadow-xl border border-slate-200/80 dark:border-slate-800 py-1 z-50 flex flex-col gap-0.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
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
                    ? 'bg-[#0f2a6b] text-white font-bold'
                    : 'text-[var(--ink)] hover:bg-[var(--bg)]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 ml-2 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
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

export interface IManagerBookingTableProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
}

export default function ManagerBookingTable({
  title = 'Incoming Garage Bookings',
  subtitle = 'Manage driver parking sessions across all your owned facilities',
  badgeLabel = 'Bookings',
}: IManagerBookingTableProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Load current user from Cookie
  useEffect(() => {
    const u = getAuthUser();
    if (u) {
      setCurrentUser(u);
    }
  }, []);

  // TanStack Query: Fetch manager bookings strictly scoped to current manager
  const {
    data: bookingsResponse,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['manager-bookings-dashboard', currentUser?.id, currentUser?.email],
    queryFn: () => BookingService.getManagerBookings(),
    enabled: !!currentUser,
  });

  const rawBookings: IBooking[] = bookingsResponse?.data || [];

  // TanStack Mutation: Update booking status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
    }) => BookingService.updateBookingStatus(bookingId, status),
    onSuccess: (res) => {
      if (res?.success) {
        Alert.toast('Booking status updated successfully', 'success');
        refetch();
      } else {
        Alert.error('Update Failed', res?.message || 'Could not update booking status.');
      }
    },
    onError: (err: any) => {
      Alert.error('Status Error', err.message || 'Failed to update booking status.');
    },
  });

  const handleUpdateStatus = async (
    booking: IBooking,
    newStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
  ) => {
    const actionLabel =
      newStatus === 'COMPLETED'
        ? 'mark as COMPLETED (vehicle exited garage)'
        : newStatus === 'CONFIRMED'
        ? 'CONFIRM this parking reservation'
        : 'CANCEL this booking';

    const confirmed = await Alert.confirm({
      title: `Update Booking Status?`,
      text: `Do you want to ${actionLabel} for vehicle ${booking.vehicleNumber || 'booking #' + booking.id.slice(0, 8)}?`,
      confirmButtonText: `Yes, ${newStatus}`,
      cancelButtonText: 'Cancel',
      icon: newStatus === 'CANCELLED' ? 'warning' : 'question',
      isDestructive: newStatus === 'CANCELLED',
    });

    if (!confirmed) return;

    updateStatusMutation.mutate({ bookingId: booking.id, status: newStatus });
  };

  // Filter & Search & Sort
  const filteredBookings = useMemo(() => {
    let result = [...rawBookings];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((b) => {
        const driverName = b.user?.name?.toLowerCase() || '';
        const driverEmail = b.user?.email?.toLowerCase() || '';
        const driverPhone = b.user?.phone?.toLowerCase() || '';
        const garageName = b.garage?.name?.toLowerCase() || '';
        const vehicle = b.vehicleNumber?.toLowerCase() || '';
        const id = b.id.toLowerCase();
        return (
          driverName.includes(q) ||
          driverEmail.includes(q) ||
          driverPhone.includes(q) ||
          garageName.includes(q) ||
          vehicle.includes(q) ||
          id.includes(q)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'totalPrice') {
        return sortOrder === 'asc' ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [rawBookings, statusFilter, searchTerm, sortBy, sortOrder]);

  // Pagination calculation
  const total = filteredBookings.length;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredBookings.slice(start, start + limit);
  }, [filteredBookings, page, limit]);

  // Quick stats
  const stats = useMemo(() => {
    const totalCount = rawBookings.length;
    const confirmedCount = rawBookings.filter((b) => b.status === 'CONFIRMED').length;
    const completedCount = rawBookings.filter((b) => b.status === 'COMPLETED').length;
    const totalRevenue = rawBookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return { totalCount, confirmedCount, completedCount, totalRevenue };
  }, [rawBookings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CONFIRMED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            ✓ COMPLETED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            PENDING
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            ✕ CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (status?: string | null) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ● PAID
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            ○ UNPAID
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            ↺ REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            N/A
          </span>
        );
    }
  };

  const errorMessage = queryError instanceof Error ? queryError.message : null;

  return (
    <div className="space-y-5 my-2">
      {/* Metrics Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            🅿
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--ink)] font-mono">
              {stats.totalCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Total Bookings</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-emerald-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
            ⚡
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.confirmedCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Active / Confirmed</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            ✓
          </div>
          <div>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {stats.completedCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Completed Sessions</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-purple-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
            ৳
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--ink)] font-mono">
              ৳{stats.totalRevenue}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Total Revenue (BDT)</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="w-full bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Table Header & Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-slate-200/90 dark:border-slate-800">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight">
                  {title}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-[#0f2a6b] dark:text-blue-400 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {total} {badgeLabel}
                </span>
              </div>
              <p className="text-xs text-[var(--sub)] mt-0.5">
                {currentUser?.email ? (
                  <span>
                    Showing incoming driver reservations for garages owned by{' '}
                    <span className="font-bold text-[var(--ink)]">
                      {currentUser.name || 'You'} ({currentUser.email})
                    </span>
                  </span>
                ) : (
                  subtitle
                )}
              </p>
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-2">
              {(searchTerm ||
                statusFilter !== 'ALL' ||
                sortBy !== 'createdAt' ||
                sortOrder !== 'desc') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setSortBy('createdAt');
                    setSortOrder('desc');
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--sub)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                  title="Reset All Filters"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Reset</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Refresh Records"
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    isFetching ? 'animate-spin text-[#0f2a6b]' : 'text-[var(--sub)]'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Unified Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[var(--bg)] p-2 rounded-lg border-0">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--sub)]">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search by driver name, email, phone, vehicle plate, or garage..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-md border-0 bg-[var(--card)] text-xs text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:outline-none focus:ring-0 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--sub)] hover:text-[var(--ink)] text-xs cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns Container */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <SelectDropdown
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
                className="min-w-[155px] flex-1 sm:flex-none"
              />

              <SelectDropdown
                value={`${sortBy}-${sortOrder}`}
                options={SORT_OPTIONS}
                onChange={(val) => {
                  const [sb, so] = val.split('-');
                  setSortBy(sb);
                  setSortOrder(so as 'asc' | 'desc');
                  setPage(1);
                }}
                className="min-w-[150px] flex-1 sm:flex-none"
              />
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 animate-in fade-in">
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Table Area */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-slate-200/90 dark:border-slate-800 text-[var(--sub)] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Customer / Driver (Who Booked)</th>
                <th className="py-2.5 px-4">Your Garage Facility</th>
                <th className="py-2.5 px-4">Schedule</th>
                <th className="py-2.5 px-4">Vehicle Plate</th>
                <th className="py-2.5 px-4">Fare & Payment</th>
                <th className="py-2.5 px-4">Booking Status</th>
                <th className="py-2.5 px-4 text-right">Manager Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800">
              {loading ? (
                <TableSkeleton rows={limit > 10 ? 8 : 6} columns={7} />
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-2xl flex items-center justify-center mb-2">
                        🅿
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        No Incoming Bookings Found
                      </p>
                      <p className="text-xs mt-0.5 max-w-sm">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No driver reservations match your search or filter.'
                          : 'Drivers have not made any bookings in your garages yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => {
                  const startTime = new Date(booking.startTime);
                  const endTime = new Date(booking.endTime);
                  const durationHours = Math.max(
                    1,
                    Number(
                      ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1),
                    ),
                  );
                  const isPending = booking.status === 'PENDING';
                  const isConfirmed = booking.status === 'CONFIRMED';
                  const isCompleted = booking.status === 'COMPLETED';

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[var(--bg)]/50 transition-colors group"
                    >
                      {/* Driver Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {booking.user?.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[var(--ink)] truncate max-w-[140px]">
                                {booking.user?.name || 'Driver User'}
                              </span>
                              <span className="rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1 py-0.2 text-[9px] font-bold">
                                Customer
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[var(--sub)] truncate max-w-[150px]">
                              {booking.user?.email}
                            </div>
                            {booking.user?.phone && (
                              <div className="text-[10px] text-slate-500">
                                📞 {booking.user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Garage Facility */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/garages/${booking.garageId}`}
                              className="font-bold text-[var(--ink)] group-hover:text-blue-600 dark:group-hover:text-blue-400 hover:underline block truncate max-w-[160px]"
                            >
                              {booking.garage?.name || 'Parking Facility'}
                            </Link>
                            <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 px-1 py-0.2 text-[9px] font-bold shrink-0">
                              Your Garage
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--sub)] flex items-center gap-1 truncate max-w-[180px]">
                            <span>📍</span>
                            <span>{booking.garage?.address || 'Dhaka'}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            ID: #{booking.id.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[var(--ink)] text-[11px]">
                            In: {startTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                          <div className="font-semibold text-[var(--ink)] text-[11px]">
                            Out: {endTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                          </div>
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                            Duration: {durationHours} hour{durationHours > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[var(--ink)] text-xs">
                          {booking.vehicleNumber || '—'}
                        </div>
                      </td>

                      {/* Fare & Payment */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-extrabold text-[var(--ink)] text-xs">
                          ৳{booking.totalPrice}
                        </div>
                        <div className="mt-1">{getPaymentBadge(booking.payment?.status)}</div>
                      </td>

                      {/* Booking Status */}
                      <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>

                      {/* Manager Action Controls */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* If Pending: Confirm */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(booking, 'CONFIRMED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              title="Confirm booking and occupy slot"
                            >
                              ✓ Confirm
                            </button>
                          )}

                          {/* If Confirmed: Mark as Completed when vehicle leaves */}
                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(booking, 'COMPLETED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                              title="Vehicle left garage: Mark completed and release slot"
                            >
                              ✓ Mark Complete
                            </button>
                          )}

                          {/* Cancel option */}
                          {!isCompleted && booking.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(booking, 'CANCELLED')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Cancel this booking"
                            >
                              Cancel
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Completed Session
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 sm:px-5 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[var(--card)]">
          <div className="flex items-center gap-2 text-[var(--sub)] font-medium">
            <span>Showing</span>
            <SelectDropdown
              value={limit}
              options={LIMIT_OPTIONS}
              onChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
              dropdownPosition="top"
              className="w-16"
            />
            <span>
              of <span className="font-bold text-[var(--ink)]">{total}</span> bookings
            </span>
          </div>

          {totalPage > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-md bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--bg)]/80 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-colors cursor-pointer"
              >
                Previous
              </button>

              <span className="px-3 py-1 font-semibold text-xs text-[var(--ink)]">
                Page {page} of {totalPage}
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPage, prev + 1))}
                disabled={page >= totalPage}
                className="px-2.5 py-1 rounded-md bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--bg)]/80 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
