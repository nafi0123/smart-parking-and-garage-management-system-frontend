'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReviewModal from '@/components/ReviewModal';
import TableSkeleton from '@/components/TableSkeleton';
import { API_BASE_URL } from '@/services/apiClient';
import { type IBooking, BookingService } from '@/services/booking';
import { PaymentService } from '@/services/payment';
import Alert from '@/utils/alert';
import { getAuthToken, getAuthUser } from '@/utils/cookie';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Booking Status' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PENDING', label: 'Pending Payment' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'totalPrice-desc', label: 'Fare: High to Low' },
  { value: 'totalPrice-asc', label: 'Fare: Low to High' },
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

export interface IBookingTableProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
}

export default function BookingTable({
  title = 'My Reservations',
  subtitle = 'Track parking reservations, SSLCommerz transactions & official receipts',
  badgeLabel = 'Bookings',
}: IBookingTableProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [refundingBookingId, setRefundingBookingId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<IBooking | null>(null);

  const handleViewInvoice = async (bookingId: string) => {
    setDownloadingInvoiceId(bookingId);
    try {
      Alert.toast('Generating official PDF Invoice...', 'info');
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/invoice`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Could not download invoice PDF');
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const newTab = window.open(fileUrl, '_blank');
      if (!newTab) {
        // If popup was blocked, fallback to direct download anchor
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `Invoice-${bookingId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error('Invoice download error:', err);
      Alert.error('Invoice Failed', err.message || 'Could not load PDF invoice.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Load current user from Cookie
  useEffect(() => {
    const u = getAuthUser();
    if (u) {
      setCurrentUser(u);
    }
  }, []);

  // TanStack Query: Fetch My Bookings strictly for current user
  const {
    data: bookingsResponse,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['my-bookings-dashboard', currentUser?.id, currentUser?.email],
    queryFn: () => BookingService.getMyBookings(),
    enabled: !!currentUser,
  });

  const rawBookings: IBooking[] = bookingsResponse?.data || [];

  // Filter & Search & Sort logic
  const filteredBookings = useMemo(() => {
    let result = [...rawBookings];

    // Filter by Status
    if (statusFilter !== 'ALL') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Search query (Garage name, address, vehicle plate number, or TRX ID)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((b) => {
        const garageName = b.garage?.name?.toLowerCase() || '';
        const garageAddress = b.garage?.address?.toLowerCase() || '';
        const vehicle = b.vehicleNumber?.toLowerCase() || '';
        const trx = b.payment?.transactionId?.toLowerCase() || '';
        const id = b.id.toLowerCase();
        return (
          garageName.includes(q) ||
          garageAddress.includes(q) ||
          vehicle.includes(q) ||
          trx.includes(q) ||
          id.includes(q)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'totalPrice') {
        return sortOrder === 'asc' ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
      }
      // default: createdAt
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
    const pendingCount = rawBookings.filter((b) => b.status === 'PENDING').length;
    const completedCount = rawBookings.filter((b) => b.status === 'COMPLETED').length;
    const totalSpent = rawBookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return { totalCount, confirmedCount, pendingCount, completedCount, totalSpent };
  }, [rawBookings]);

  // Initiate Payment via SSLCommerz
  const handlePayNow = async (bookingId: string) => {
    setPayingBookingId(bookingId);
    try {
      Alert.toast('Initiating SSLCommerz Session...', 'info');
      const res = await PaymentService.initiatePayment(bookingId);
      if (res?.data?.paymentUrl) {
        Alert.toast('Redirecting to SSLCommerz Checkout...', 'success');
        window.location.href = res.data.paymentUrl;
      } else {
        Alert.error('Payment Error', 'Could not obtain SSLCommerz payment session.');
      }
    } catch (err: any) {
      Alert.error('Payment Initiation Failed', err.message || 'Unable to connect to gateway.');
    } finally {
      setPayingBookingId(null);
    }
  };

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  // Cancel an unpaid pending booking
  const handleCancelPendingBooking = async (booking: IBooking) => {
    const confirmed = await Alert.confirm({
      title: 'Cancel Pending Booking?',
      text: `Are you sure you want to cancel your unpaid reservation at ${booking.garage?.name || 'this garage'}?`,
      confirmButtonText: 'Yes, Cancel Booking',
      cancelButtonText: 'Keep Booking',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setCancellingBookingId(booking.id);
    try {
      Alert.toast('Cancelling pending booking...', 'info');
      await BookingService.cancelBooking(booking.id);
      Alert.success('Booking Cancelled', 'Your pending booking has been cancelled successfully.');
      refetch();
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      Alert.error('Cancellation Failed', err.message || 'Could not cancel booking.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  // Cancel & Refund Confirmed Booking
  const handleRefund = async (booking: IBooking) => {
    if (booking.status === 'COMPLETED') {
      Alert.error('Action Not Allowed', 'This parking session is already COMPLETED and cannot be cancelled or refunded.');
      return;
    }

    const confirmed = await Alert.confirm({
      title: 'Cancel & Process Refund?',
      text: `Are you sure you want to cancel your reservation at ${booking.garage?.name}? An automatic refund of ৳${booking.totalPrice} will be processed.`,
      confirmButtonText: 'Yes, Cancel & Refund',
      cancelButtonText: 'Keep Reservation',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setRefundingBookingId(booking.id);
    try {
      Alert.toast('Processing SSLCommerz refund...', 'info');
      await PaymentService.refundPayment(booking.id, 'User requested cancellation');
      Alert.success('Refund Processed', 'Your booking was cancelled and payment has been refunded.');
      refetch();
    } catch (err: any) {
      Alert.error(
        'Refund Failed',
        err.message || 'Cancellation must be requested at least 1 hour before start time.',
      );
    } finally {
      setRefundingBookingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CONFIRMED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            PENDING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            ✓ COMPLETED
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
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            ✕ FAILED
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
            🎫
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
            ✓
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.confirmedCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Confirmed & Paid</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-amber-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
            ⏳
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.pendingCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Pending Payment</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-purple-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
            ৳
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--ink)] font-mono">
              ৳{stats.totalSpent}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Total Paid (BDT)</div>
          </div>
        </div>
      </div>

      {/* Main Table Card (Exact match of DataTable.tsx styling) */}
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
              <p className="text-xs text-[var(--sub)] mt-0.5">{subtitle}</p>
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

              <Link
                href="/garages"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
              >
                <span>+</span> Book Spot
              </Link>
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
                placeholder="Search by garage name, address, vehicle plate, or TRX ID..."
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
                <th className="py-2.5 px-4">Garage Facility</th>
                <th className="py-2.5 px-4">Reservation Schedule</th>
                <th className="py-2.5 px-4">Vehicle</th>
                <th className="py-2.5 px-4">Fare (BDT)</th>
                <th className="py-2.5 px-4">Booking Status</th>
                <th className="py-2.5 px-4">SSLCommerz Payment</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800">
              {loading ? (
                <TableSkeleton rows={limit > 10 ? 8 : 6} columns={7} />
              ) : paginatedBookings.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-2xl flex items-center justify-center mb-2">
                        🅿
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        No Reservations Found
                      </p>
                      <p className="text-xs mt-0.5 max-w-sm">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No bookings match your current search or filter criteria.'
                          : "You haven't reserved any parking slots yet. Book a spot to see it here!"}
                      </p>
                      <Link
                        href="/garages"
                        className="mt-3 inline-block rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] text-white px-4 py-1.5 text-xs font-bold transition-all shadow-xs"
                      >
                        Explore Garages →
                      </Link>
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
                  const canRefund =
                    isConfirmed && startTime.getTime() - Date.now() > 3600000;

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[var(--bg)]/50 transition-colors group"
                    >
                      {/* Garage Facility */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/garages/${booking.garageId}`}
                            className="font-bold text-[var(--ink)] group-hover:text-blue-600 dark:group-hover:text-blue-400 hover:underline block"
                          >
                            {booking.garage?.name || 'Parking Facility'}
                          </Link>
                          <div className="text-[11px] text-[var(--sub)] flex items-center gap-1 truncate max-w-[200px]">
                            <span>📍</span>
                            <span>{booking.garage?.address || booking.garage?.location || 'Dhaka'}</span>
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

                      {/* Fare */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-extrabold text-[var(--ink)] text-xs">
                          ৳{booking.totalPrice}
                        </div>
                        {booking.garage?.pricePerHour && (
                          <div className="text-[10px] text-[var(--sub)]">
                            ৳{booking.garage.pricePerHour}/hr
                          </div>
                        )}
                      </td>

                      {/* Booking Status */}
                      <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {getPaymentBadge(booking.payment?.status)}
                          {booking.payment?.transactionId && (
                            <div className="text-[10px] font-mono text-[var(--sub)] truncate max-w-[130px]">
                              {booking.payment.transactionId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Pay Now Button for Pending Bookings */}
                          {isPending && (
                            <button
                              type="button"
                              disabled={payingBookingId === booking.id || cancellingBookingId === booking.id}
                              onClick={() => handlePayNow(booking.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-75"
                              title="Complete payment via SSLCommerz"
                            >
                              {payingBookingId === booking.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span>🔒 Pay ৳{booking.totalPrice}</span>
                              )}
                            </button>
                          )}

                          {/* Cancel Pending Booking */}
                          {isPending && (
                            <button
                              type="button"
                              disabled={cancellingBookingId === booking.id || payingBookingId === booking.id}
                              onClick={() => handleCancelPendingBooking(booking)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                              title="Cancel this unpaid reservation"
                            >
                              {cancellingBookingId === booking.id ? (
                                <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span>✕ Cancel</span>
                              )}
                            </button>
                          )}

                          {/* Invoice Download for Confirmed or Completed Bookings */}
                          {(isConfirmed || booking.status === 'COMPLETED') && (
                            <button
                              type="button"
                              disabled={downloadingInvoiceId === booking.id}
                              onClick={() => handleViewInvoice(booking.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-[var(--card)] hover:bg-[var(--bg)] text-[var(--ink)] font-bold text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Download official PDF Invoice"
                            >
                              {downloadingInvoiceId === booking.id ? (
                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span>📄</span>
                              )}
                              <span>PDF</span>
                            </button>
                          )}

                          {/* Rate Garage Review Button - ONLY for COMPLETED bookings */}
                          {booking.status === 'COMPLETED' && (
                            booking.review ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                <span>★</span>
                                <span>{booking.review.rating}.0 Rated</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedBookingForReview(booking)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                                title="Leave feedback for this completed parking session"
                              >
                                <span>★</span>
                                <span>Rate Garage</span>
                              </button>
                            )
                          )}

                          {/* Cancel & Refund Button for Confirmed Bookings */}
                          {isConfirmed && (
                            canRefund ? (
                              <button
                                type="button"
                                disabled={refundingBookingId === booking.id}
                                onClick={() => handleRefund(booking)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-75"
                                title="Cancel reservation & refund payment"
                              >
                                {refundingBookingId === booking.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                    <span>Refunding...</span>
                                  </>
                                ) : (
                                  <span>↺ Cancel & Refund</span>
                                )}
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-help"
                                title="Cancellations and refunds are only permitted at least 1 hour before scheduled start time."
                              >
                                <span>🔒 Non-refundable</span>
                              </span>
                            )
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

        {/* Pagination Footer (Exact match of DataTable.tsx footer) */}
        <div className="p-4 sm:px-5 border-t border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[var(--card)]">
          {/* Entries Indicator & Page Limit Selector */}
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

          {/* Pagination Navigation Controls */}
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

      {/* Driver Review Modal - Active Only on Completed Bookings */}
      <ReviewModal
        isOpen={!!selectedBookingForReview}
        onClose={() => setSelectedBookingForReview(null)}
        booking={selectedBookingForReview}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
