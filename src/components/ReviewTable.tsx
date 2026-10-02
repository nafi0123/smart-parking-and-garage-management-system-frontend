'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReviewEditModal from '@/components/ReviewEditModal';
import TableSkeleton from '@/components/TableSkeleton';
import { type IReview, ReviewService } from '@/services/review';
import Alert from '@/utils/alert';
import { getAuthUser } from '@/utils/cookie';

const RATING_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Ratings' },
  { value: '5', label: '5 Stars (Excellent)' },
  { value: '4', label: '4 Stars (Very Good)' },
  { value: '3', label: '3 Stars (Average)' },
  { value: '2', label: '2 Stars (Needs Improvement)' },
  { value: '1', label: '1 Star (Poor)' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'rating-desc', label: 'Highest Rating' },
  { value: 'rating-asc', label: 'Lowest Rating' },
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

export interface IReviewTableProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
}

export default function ReviewTable({
  title = 'My Reviews & Ratings',
  subtitle = 'Manage your submitted feedback and ratings across all parking facilities',
  badgeLabel = 'Reviews',
}: IReviewTableProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState<IReview | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Load current user from Cookie
  useEffect(() => {
    const u = getAuthUser();
    if (u) {
      setCurrentUser(u);
    }
  }, []);

  // TanStack Query: Fetch my reviews strictly scoped to current user
  const {
    data: reviewsResponse,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['my-reviews-dashboard', currentUser?.id, currentUser?.email],
    queryFn: () => ReviewService.getMyReviews(),
    enabled: !!currentUser,
  });

  const rawReviews: IReview[] = (reviewsResponse as any)?.data || [];

  // Delete review handler
  const handleDeleteReview = async (review: IReview) => {
    const confirmed = await Alert.confirm({
      title: 'Delete Review?',
      text: `Are you sure you want to delete your ${review.rating}-star review for ${review.garage?.name || 'this garage'}? This cannot be undone.`,
      confirmButtonText: 'Yes, Delete Review',
      cancelButtonText: 'Cancel',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setDeletingReviewId(review.id);
    try {
      Alert.toast('Deleting review...', 'info');
      await ReviewService.deleteReview(review.id);
      Alert.success('Review Deleted', 'Your review was deleted successfully.');
      refetch();
    } catch (err: any) {
      console.error('Delete review error:', err);
      Alert.error('Delete Failed', err.message || 'Could not delete review.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Filter & Search & Sort
  const filteredReviews = useMemo(() => {
    let result = [...rawReviews];

    // Filter by rating
    if (ratingFilter !== 'ALL') {
      const targetRating = Number(ratingFilter);
      result = result.filter((r) => r.rating === targetRating);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((r) => {
        const garageName = r.garage?.name?.toLowerCase() || '';
        const garageAddress = r.garage?.address?.toLowerCase() || '';
        const comment = r.comment?.toLowerCase() || '';
        const id = r.id.toLowerCase();
        return (
          garageName.includes(q) ||
          garageAddress.includes(q) ||
          comment.includes(q) ||
          id.includes(q)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [rawReviews, ratingFilter, searchTerm, sortBy, sortOrder]);

  // Pagination calculation
  const total = filteredReviews.length;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredReviews.slice(start, start + limit);
  }, [filteredReviews, page, limit]);

  // Quick stats
  const stats = useMemo(() => {
    const totalCount = rawReviews.length;
    const avgRating =
      totalCount > 0
        ? (rawReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
        : '0.0';
    const fiveStarCount = rawReviews.filter((r) => r.rating === 5).length;
    const withCommentsCount = rawReviews.filter((r) => (r.comment || '').trim().length > 0).length;

    return { totalCount, avgRating, fiveStarCount, withCommentsCount };
  }, [rawReviews]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700 fill-slate-200 dark:fill-slate-700'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const errorMessage = queryError instanceof Error ? queryError.message : null;

  return (
    <div className="space-y-5 my-2">
      {/* Metrics Header Cards (Hubuhu Garage & Booking style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--ink)] font-mono">
              {stats.totalCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Total Reviews</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-amber-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 fill-amber-500" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.avgRating}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Avg Rating Given</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-emerald-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.fiveStarCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">5-Star Feedback</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-purple-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--ink)] font-mono">
              {stats.withCommentsCount}
            </div>
            <div className="text-[11px] text-[var(--sub)] font-medium mt-0.5">Written Reviews</div>
          </div>
        </div>
      </div>

      {/* Main Table Card (Matching GarageTable.tsx 1:1) */}
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
                ratingFilter !== 'ALL' ||
                sortBy !== 'createdAt' ||
                sortOrder !== 'desc') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setRatingFilter('ALL');
                    setSortBy('createdAt');
                    setSortOrder('desc');
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer border border-red-500/20 flex items-center gap-1"
                  title="Clear all filters"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset Filters</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Refresh Reviews"
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

              {/* Find Garages Primary Action Button */}
              <Link
                href="/garages"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Find Garages</span>
              </Link>
            </div>
          </div>

          {/* Unified Borderless Filter Toolbar (Matching GarageTable.tsx) */}
          <div className="bg-[var(--bg)]/70 rounded-md p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--sub)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                placeholder="Search reviews by garage name, address, or comment text..."
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

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <SelectDropdown
                value={ratingFilter}
                options={RATING_FILTER_OPTIONS}
                onChange={(val) => {
                  setRatingFilter(val);
                  setPage(1);
                }}
                className="min-w-[170px] flex-1 sm:flex-none"
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

          {/* Optional Error Display */}
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
                <th className="py-2.5 px-4">Rating Given</th>
                <th className="py-2.5 px-4">Your Feedback & Comment</th>
                <th className="py-2.5 px-4">Submitted On</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800">
              {loading ? (
                <TableSkeleton rows={limit > 10 ? 8 : 6} columns={5} />
              ) : paginatedReviews.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 text-2xl flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 fill-amber-500" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        No Reviews Submitted Yet
                      </p>
                      <p className="text-xs mt-0.5 max-w-sm">
                        {searchTerm || ratingFilter !== 'ALL'
                          ? 'No reviews match your current search or filter criteria.'
                          : "You haven't reviewed any completed parking sessions yet. Rate your next stay!"}
                      </p>
                      <Link
                        href="/dashboard/my-bookings"
                        className="mt-3 inline-block rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] text-white px-4 py-1.5 text-xs font-bold transition-all shadow-xs"
                      >
                        View My Bookings →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((review) => {
                  const createdAt = new Date(review.createdAt);
                  const isDeleting = deletingReviewId === review.id;

                  return (
                    <tr
                      key={review.id}
                      className="hover:bg-[var(--bg)]/50 transition-colors group"
                    >
                      {/* Garage Facility */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/garages/${review.garageId}`}
                            className="font-bold text-[var(--ink)] group-hover:text-blue-600 dark:group-hover:text-blue-400 hover:underline block"
                          >
                            {review.garage?.name || 'Parking Facility'}
                          </Link>
                          <div className="text-[11px] text-[var(--sub)] flex items-center gap-1 truncate max-w-[200px]">
                            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{review.garage?.address || review.garage?.location || 'Dhaka'}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            ID: #{review.id.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </td>

                      {/* Rating Given */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {review.rating}.0
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--sub)] font-medium">
                            {review.rating === 5
                              ? 'Excellent'
                              : review.rating === 4
                              ? 'Very Good'
                              : review.rating === 3
                              ? 'Average'
                              : review.rating === 2
                              ? 'Needs Improvement'
                              : 'Poor'}
                          </div>
                        </div>
                      </td>

                      {/* Your Feedback & Comment */}
                      <td className="py-3 px-4 max-w-[320px]">
                        {review.comment ? (
                          <div className="text-xs text-[var(--ink)] line-clamp-2 leading-relaxed font-medium bg-[var(--bg)]/40 p-2 rounded border border-slate-200/60 dark:border-slate-800/60">
                            “{review.comment}”
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--sub)] italic">
                            No written comment provided.
                          </span>
                        )}
                      </td>

                      {/* Submitted On */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[var(--ink)] text-[11px]">
                            {createdAt.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-[var(--sub)] font-mono">
                            {createdAt.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons (Exact Hubuhu Style from GarageTable.tsx) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Facility Button (Sky blue box icon) */}
                          <Link
                            href={`/garages/${review.garageId}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer group"
                            title="View Facility Details"
                            aria-label={`View details for ${review.garage?.name || 'facility'}`}
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

                          {/* Edit Review Button (Indigo box icon) */}
                          <button
                            type="button"
                            onClick={() => setSelectedReviewForEdit(review)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer group"
                            title="Edit Review & Rating"
                            aria-label="Edit review"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          {/* Delete Review Button (Rose red box icon) */}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDeleteReview(review)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                            title="Delete Review"
                            aria-label="Delete review"
                          >
                            {isDeleting ? (
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
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
              of <span className="font-bold text-[var(--ink)]">{total}</span> reviews
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

      {/* Review Edit Modal */}
      <ReviewEditModal
        isOpen={!!selectedReviewForEdit}
        onClose={() => setSelectedReviewForEdit(null)}
        review={selectedReviewForEdit}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
