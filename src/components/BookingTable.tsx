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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--ink)] font-mono">
              ৳{stats.totalSpent}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Total Paid (BDT)</div>
          </div>
        </div>
      </div>

      {/* Main Table Card (Exact match of DataTable.tsx and GarageTable.tsx styling) */}
      <div className="w-full bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col my-5">
        {/* Table Header & Toolbar */}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--sub)] hover:text-[var(--ink)] transition-colors cursor-pointer"
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
                    isFetching ? 'animate-spin text-[var(--navy-2)]' : 'text-[var(--sub)]'
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Book Spot</span>
              </Link>
            </div>
          </div>

          {/* Unified Borderless Filter Toolbar */}
          <div className="bg-[var(--bg)]/70 rounded-md p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--sub)]">
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
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--sub)] hover:text-[var(--ink)] text-xs transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
              <svg
                className="w-4 h-4 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
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
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
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
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--navy-2)] text-white text-xs font-bold hover:bg-[var(--navy)] transition-colors shadow-xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Explore Garages</span>
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
                  const thumb =
                    booking.garage?.images && booking.garage.images.length > 0
                      ? booking.garage.images[0]
                      : null;

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-[var(--bg)]/50 transition-colors group"
                    >
                      {/* Garage Facility */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold border border-slate-200/60 dark:border-slate-800">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={booking.garage?.name || 'Garage'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                className="w-5 h-5 text-blue-500/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.75}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="truncate max-w-[220px]">
                            <Link
                              href={`/garages/${booking.garageId}`}
                              className="font-bold text-[var(--ink)] hover:text-[var(--navy-2)] dark:hover:text-blue-400 text-xs truncate block cursor-pointer transition-colors"
                            >
                              {booking.garage?.name || 'Parking Facility'}
                            </Link>
                            <div className="text-[11px] text-[var(--sub)] truncate flex items-center gap-1 mt-0.5">
                              <svg
                                className="w-3 h-3 text-slate-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="truncate">{booking.garage?.address || booking.garage?.location || 'Dhaka'}</span>
                            </div>
                            <div className="text-[10px] font-mono text-[var(--sub)] mt-0.5">
                              ID: #{booking.id.slice(0, 8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">IN</span>
                            <span>{startTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">OUT</span>
                            <span>{endTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                          </div>
                          <div className="text-[10px] text-[var(--sub)] flex items-center gap-1">
                            <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{durationHours} hour{durationHours > 1 ? 's' : ''} duration</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-[var(--sub)] shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8m-8 3h8m-9 8h10a2 2 0 002-2v-5a2 2 0 00-2-2H7a2 2 0 00-2 2v5a2 2 0 002 2zm1-5a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-mono font-bold text-[var(--ink)] text-xs">
                              {booking.vehicleNumber || '—'}
                            </div>
                            <div className="text-[10px] text-[var(--sub)]">Slot Reserved</div>
                          </div>
                        </div>
                      </td>

                      {/* Fare */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-extrabold text-[var(--ink)] text-xs">
                          ৳{booking.totalPrice}
                        </div>
                        {booking.garage?.pricePerHour && (
                          <div className="text-[10px] text-[var(--sub)] font-mono">
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
                            <div className="text-[10px] font-mono text-[var(--sub)] truncate max-w-[130px] flex items-center gap-1">
                              <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <span className="truncate">{booking.payment.transactionId}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Garage Facility Details */}
                          <Link
                            href={`/garages/${booking.garageId}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer group"
                            title="View Garage Facility"
                            aria-label={`View garage facility ${booking.garage?.name || ''}`}
                          >
                            <svg
                              className="w-4 h-4 transition-transform group-hover:scale-110"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>

                          {/* Invoice PDF Download for Confirmed or Completed Bookings */}
                          {(isConfirmed || booking.status === 'COMPLETED') && (
                            <button
                              type="button"
                              disabled={downloadingInvoiceId === booking.id}
                              onClick={() => handleViewInvoice(booking.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 group"
                              title="Download Official PDF Invoice"
                              aria-label="Download Official PDF Invoice"
                            >
                              {downloadingInvoiceId === booking.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg
                                  className="w-4 h-4 transition-transform group-hover:scale-110"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Pay Now Button for Pending Bookings */}
                          {isPending && (
                            <button
                              type="button"
                              disabled={payingBookingId === booking.id || cancellingBookingId === booking.id}
                              onClick={() => handlePayNow(booking.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 group"
                              title={`Pay ৳${booking.totalPrice} via SSLCommerz`}
                              aria-label={`Pay ৳${booking.totalPrice}`}
                            >
                              {payingBookingId === booking.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <svg
                                    className="w-3.5 h-3.5 transition-transform group-hover:scale-110"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                  <span>Pay ৳{booking.totalPrice}</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Cancel Pending Booking */}
                          {isPending && (
                            <button
                              type="button"
                              disabled={cancellingBookingId === booking.id || payingBookingId === booking.id}
                              onClick={() => handleCancelPendingBooking(booking)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 group"
                              title="Cancel Unpaid Reservation"
                              aria-label="Cancel Unpaid Reservation"
                            >
                              {cancellingBookingId === booking.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg
                                  className="w-4 h-4 transition-transform group-hover:scale-110"
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
                              )}
                            </button>
                          )}

                          {/* Rate Garage Review Button - ONLY for COMPLETED bookings */}
                          {booking.status === 'COMPLETED' && (
                            booking.review ? (
                              <Link
                                href="/dashboard/my-reviews"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs group"
                                title="View review in My Reviews"
                              >
                                <svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>{booking.review.rating}.0 Rated</span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedBookingForReview(booking)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer group"
                                title="Rate & Review this Garage"
                                aria-label="Rate & Review this Garage"
                              >
                                <svg
                                  className="w-3.5 h-3.5 text-amber-500 fill-amber-500 transition-transform group-hover:scale-110"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
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
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-50 group"
                                title={`Cancel Reservation & Refund ৳${booking.totalPrice}`}
                                aria-label={`Cancel Reservation & Refund ৳${booking.totalPrice}`}
                              >
                                {refundingBookingId === booking.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg
                                    className="w-4 h-4 transition-transform group-hover:scale-110"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                    />
                                  </svg>
                                )}
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200/80 dark:border-slate-700 cursor-help"
                                title="Non-refundable: Cancellation allowed up to 1 hour before scheduled time"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                  />
                                </svg>
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
