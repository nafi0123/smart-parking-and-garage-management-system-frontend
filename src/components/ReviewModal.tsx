'use client';

import type React from 'react';
import { useState } from 'react';
import { FaRegStar, FaStar } from 'react-icons/fa6';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { LuBuilding, LuCheck, LuSparkles } from 'react-icons/lu';
import { MdVerified } from 'react-icons/md';
import type { IBooking } from '@/services/booking';
import { ReviewService } from '@/services/review';
import Alert from '@/utils/alert';

interface IReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: IBooking | null;
  onSuccess?: () => void;
}

export default function ReviewModal({ isOpen, onClose, booking, onSuccess }: IReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  // Strict check: Only completed bookings can be reviewed
  if (booking.status !== 'COMPLETED') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-md bg-[var(--card)] text-[var(--ink)] rounded-xl shadow-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">
            <LuSparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink)]">Booking Not Completed</h3>
          <p className="text-xs text-[var(--sub)] leading-relaxed">
            Reviews can only be submitted after your parking session is officially marked as{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">COMPLETED</span>.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      Alert.error('Invalid Rating', 'Please select a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    try {
      Alert.toast('Submitting your review...', 'info');
      await ReviewService.createReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim() || undefined,
      });

      Alert.success('Review Submitted', 'Thank you for your valuable feedback!');
      setComment('');
      setRating(5);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Review submission error:', err);
      Alert.error(
        'Submission Failed',
        err.message || 'Could not submit review. You may have already reviewed this booking.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingFeedbackText = (val: number) => {
    switch (val) {
      case 5:
        return '5.0 — Excellent Experience';
      case 4:
        return '4.0 — Very Good';
      case 3:
        return '3.0 — Average / Decent';
      case 2:
        return '2.0 — Needs Improvement';
      case 1:
        return '1.0 — Poor Experience';
      default:
        return 'Select a star rating';
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[var(--card)] text-[var(--ink)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/80 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header (Matching Garage Modals) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-[var(--bg)]/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--ink)]">
                Rate Your Parking Experience
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <MdVerified className="w-3 h-3 text-amber-500" />
                Verified Feedback
              </span>
            </div>
            <p className="text-xs text-[var(--sub)] mt-0.5">
              Share your genuine feedback for {booking.garage?.name || 'this parking facility'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[var(--sub)] hover:text-[var(--ink)] p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Booking Summary Box */}
          <div className="p-3.5 rounded-lg bg-[var(--bg)]/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-[var(--ink)] text-xs truncate flex items-center gap-1.5">
                <LuBuilding className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{booking.garage?.name || 'Parking Facility'}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                <LuCheck className="w-3 h-3" /> Completed
              </span>
            </div>

            <div className="text-[11px] text-[var(--sub)] flex items-center gap-1.5 truncate">
              <HiOutlineLocationMarker className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>
                {booking.garage?.address || booking.garage?.location || 'Dhaka, Bangladesh'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-[var(--sub)] font-mono">
              <span>Booking ID: #{booking.id.slice(0, 8).toUpperCase()}</span>
              {booking.vehicleNumber && <span>Plate: {booking.vehicleNumber}</span>}
            </div>
          </div>

          {/* Interactive Star Rating Selector Card */}
          <div className="p-4 rounded-lg bg-[var(--bg)]/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-center">
            <label className="block font-bold text-[var(--ink)] text-xs">
              How would you rate this garage facility? <span className="text-red-500">*</span>
            </label>

            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = activeRating >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    title={`${star} Star${star > 1 ? 's' : ''}`}
                  >
                    {isActive ? (
                      <FaStar className="w-6 h-6 text-amber-400 drop-shadow-sm" />
                    ) : (
                      <FaRegStar className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-amber-500 shadow-2xs">
              <FaStar className="w-3 h-3 text-amber-400" />
              <span>{getRatingFeedbackText(activeRating)}</span>
            </div>
          </div>

          {/* Comment / Review Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="review-comment" className="block font-semibold text-[var(--ink)]">
                Review & Feedback
              </label>
              <span className="text-[10px] text-[var(--sub)]">Optional</span>
            </div>
            <textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about security, entry/exit barrier convenience, lighting, EV charging or staff support..."
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium resize-none shadow-2xs"
            />
          </div>

          {/* Modal Footer (Matching Garage Modals) */}
          <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-[var(--sub)] flex items-center gap-1">
              <LuCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
              <span>Publicly verified rating</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FaStar className="w-3.5 h-3.5 text-amber-300" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
