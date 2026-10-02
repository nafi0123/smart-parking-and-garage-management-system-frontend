'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import ReviewModal from '@/components/ReviewModal';
import { BookingService, type IBooking } from '@/services/booking';
import { type IReview, ReviewService } from '@/services/review';
import { getAuthToken } from '@/utils/cookie';

interface IGarageReviewsSectionProps {
  garageId: string;
  garageName: string;
  initialAverageRating?: number;
  initialTotalReviews?: number;
}

export default function GarageReviewsSection({
  garageId,
  garageName,
  initialAverageRating = 0,
  initialTotalReviews = 0,
}: IGarageReviewsSectionProps) {
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const isLoggedIn = !!token;

  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<IBooking | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Determine sortBy and sortOrder
  const { sortBy, sortOrder } = useMemo(() => {
    if (sortOption === 'highest') {
      return { sortBy: 'rating', sortOrder: 'desc' as const };
    }
    if (sortOption === 'lowest') {
      return { sortBy: 'rating', sortOrder: 'asc' as const };
    }
    return { sortBy: 'createdAt', sortOrder: 'desc' as const };
  }, [sortOption]);

  // Fetch reviews for this garage from backend API
  const {
    data: reviewsResponse,
    isLoading: isReviewsLoading,
    isFetching: isReviewsFetching,
  } = useQuery({
    queryKey: ['garage-reviews', garageId, page, sortBy, sortOrder],
    queryFn: () =>
      ReviewService.getGarageReviews(garageId, {
        page,
        limit: 8,
        sortBy,
        sortOrder,
      }),
    enabled: !!garageId,
  });

  // Check if current user has any completed booking eligible for review
  const { data: myBookingsResponse } = useQuery({
    queryKey: ['my-bookings-for-garage', garageId],
    queryFn: () => BookingService.getMyBookings(),
    enabled: isLoggedIn && !!garageId,
  });

  const reviews: IReview[] = reviewsResponse?.data || [];
  const meta = reviewsResponse?.meta;
  const totalReviews = meta?.totalReviews ?? initialTotalReviews;
  const averageRating = meta?.averageRating ?? initialAverageRating;

  // Find completed booking for this garage
  const eligibleBooking = useMemo(() => {
    if (!myBookingsResponse?.data) return null;
    return myBookingsResponse.data.find(
      (b) => b.garageId === garageId && b.status === 'COMPLETED' && !b.review,
    );
  }, [myBookingsResponse, garageId]);

  // Calculate rating distribution for progress bars
  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const handleOpenReviewModal = (booking: IBooking) => {
    setSelectedBookingForReview(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['garage-reviews', garageId] });
    queryClient.invalidateQueries({ queryKey: ['garage', garageId] });
    queryClient.invalidateQueries({ queryKey: ['my-bookings-for-garage', garageId] });
  };

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 sm:p-7 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)] tracking-tight">
              Customer Ratings & Reviews
            </h2>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
              {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
          <p className="text-xs text-[var(--sub)] mt-1">
            Genuine experiences and feedback submitted by verified drivers after parking.
          </p>
        </div>

        {/* Action Button: Write Review (if eligible) */}
        {eligibleBooking && (
          <button
            type="button"
            onClick={() => handleOpenReviewModal(eligibleBooking)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>★</span>
            <span>Write a Review</span>
          </button>
        )}
      </div>

      {/* Aggregate Score & Rating Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-lg bg-[var(--bg)] border border-[var(--line)] p-5">
        {/* Left: Big Average Score */}
        <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center space-y-2 md:border-r md:border-[var(--line)] md:pr-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--sub)]">
            Overall Rating
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[var(--ink)] font-mono">
              {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm font-semibold text-[var(--sub)]">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400 text-lg">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star}>
                {averageRating >= star ? '★' : averageRating >= star - 0.5 ? '★' : '☆'}
              </span>
            ))}
          </div>

          <div className="text-xs text-[var(--sub)]">
            Based on <span className="font-bold text-[var(--ink)]">{totalReviews}</span> verified{' '}
            {totalReviews === 1 ? 'driver rating' : 'driver ratings'}
          </div>
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star as keyof typeof ratingCounts] || 0;
            const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-semibold text-[var(--ink)] flex items-center justify-end gap-1">
                  <span>{star}</span>
                  <span className="text-amber-400">★</span>
                </span>

                <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <span className="w-8 text-right font-mono text-[11px] text-[var(--sub)]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sorting & Filter Bar */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-bold text-[var(--ink)]">
            Showing {reviews.length} of {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--sub)] hidden sm:inline">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as any);
                setPage(1);
              }}
              className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List or Empty State */}
      {isReviewsLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-lg border border-[var(--line)] bg-[var(--bg)] space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1">
                  <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3.5">
          {reviews.map((rev) => {
            const userInitial = rev.user?.name?.charAt(0).toUpperCase() || 'U';
            const userPicture = rev.user?.picture;
            const reviewDate = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recently';

            return (
              <div
                key={rev.id}
                className="group p-4 sm:p-5 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:border-blue-500/40 transition-all space-y-3 shadow-2xs"
              >
                {/* Reviewer Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {userPicture ? (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/20 shrink-0">
                        <Image
                          src={userPicture}
                          alt={rev.user?.name || 'Reviewer'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0f2a6b] to-[#1e40af] text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                        {userInitial}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[var(--ink)]">
                          {rev.user?.name || 'Verified Driver'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-semibold">
                          <span>✓</span> Verified Driver
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--sub)] font-mono">{reviewDate}</div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2 py-1 rounded text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span className="text-amber-400">★</span>
                    <span>{rev.rating}.0</span>
                  </div>
                </div>

                {/* Stars Visual */}
                <div className="flex items-center gap-0.5 text-amber-400 text-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>{rev.rating >= star ? '★' : '☆'}</span>
                  ))}
                </div>

                {/* Review Content */}
                {rev.comment ? (
                  <p className="text-xs sm:text-sm text-[var(--ink)] leading-relaxed bg-[var(--card)]/60 rounded-md p-3 border border-[var(--line)]">
                    {rev.comment}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--sub)] italic">
                    Driver gave a {rev.rating}-star rating without additional comments.
                  </p>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {meta && meta.totalPage > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--line)] text-xs">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 font-semibold text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                ← Previous
              </button>

              <span className="text-[var(--sub)] font-medium">
                Page <span className="font-bold text-[var(--ink)]">{page}</span> of{' '}
                <span className="font-bold text-[var(--ink)]">{meta.totalPage}</span>
              </span>

              <button
                type="button"
                disabled={page >= meta.totalPage}
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                className="rounded-md border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 font-semibold text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-lg border-2 border-dashed border-[var(--line)] bg-[var(--bg)] p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center text-2xl font-bold shadow-2xs">
            ★
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--ink)]">No Reviews Yet for this Garage</h3>
            <p className="text-xs text-[var(--sub)] max-w-sm mx-auto leading-relaxed">
              Be among the first drivers to park here and share your verified experience regarding
              security, accessibility, and service!
            </p>
          </div>

          {eligibleBooking ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenReviewModal(eligibleBooking)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] text-white px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>★</span>
                <span>Review Your Completed Parking Session</span>
              </button>
            </div>
          ) : isLoggedIn ? (
            <div className="pt-2 text-[11px] text-[var(--sub)]">
              💡 Complete a parking session to unlock verified driver reviews.
            </div>
          ) : (
            <div className="pt-2">
              <Link
                href={`/login?redirect=/garages/${garageId}`}
                className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign in to manage bookings and leave reviews →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedBookingForReview(null);
          }}
          booking={selectedBookingForReview}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
