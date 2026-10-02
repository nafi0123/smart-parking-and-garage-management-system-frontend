'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { type IReview, ReviewService } from '@/services/review';
import Alert from '@/utils/alert';

interface IReviewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: IReview | null;
  onSuccess?: () => void;
}

export default function ReviewEditModal({
  isOpen,
  onClose,
  review,
  onSuccess,
}: IReviewEditModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (review) {
      setRating(review.rating || 5);
      setComment(review.comment || '');
    }
  }, [review]);

  if (!isOpen || !review) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      Alert.error('Invalid Rating', 'Please select a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    try {
      Alert.toast('Updating your review...', 'info');
      await ReviewService.updateReview(review.id, {
        rating,
        comment: comment.trim() || undefined,
      });

      Alert.success('Review Updated', 'Your review and rating have been updated successfully.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Review update error:', err);
      Alert.error('Update Failed', err.message || 'Could not update review.');
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
        {/* Modal Header (Matching GarageFormModal.tsx) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-[var(--bg)]/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--ink)]">
                Edit Your Review & Rating
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Update Feedback
              </span>
            </div>
            <p className="text-xs text-[var(--sub)] mt-0.5">
              Modify your rating or feedback for {review.garage?.name || 'this facility'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[var(--sub)] hover:text-[var(--ink)] p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Garage Info Card */}
          <div className="p-3.5 rounded-lg bg-[var(--bg)]/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-[var(--ink)] text-xs truncate flex items-center gap-1.5">
                <span>{review.garage?.name || 'Parking Facility'}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                Verified Garage
              </span>
            </div>

            <div className="text-[11px] text-[var(--sub)] flex items-center gap-1.5 truncate">
              <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{review.garage?.address || review.garage?.location || 'Dhaka, Bangladesh'}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-[var(--sub)] font-mono">
              <span>Review ID: #{review.id.slice(0, 8).toUpperCase()}</span>
              <span>Submitted: {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Interactive Star Rating Selector Card */}
          <div className="p-4 rounded-lg bg-[var(--bg)]/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-center">
            <label className="block font-bold text-[var(--ink)] text-xs">
              Update your rating <span className="text-red-500">*</span>
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
                    <svg
                      className={`w-6 h-6 transition-colors ${
                        isActive ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-300 dark:text-slate-700 fill-slate-300 dark:fill-slate-700'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--card)] border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-amber-500 shadow-2xs">
              <span>{getRatingFeedbackText(activeRating)}</span>
            </div>
          </div>

          {/* Comment / Review Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="review-edit-comment" className="block font-semibold text-[var(--ink)]">
                Feedback & Experience
              </label>
              <span className="text-[10px] text-[var(--sub)]">Optional</span>
            </div>
            <textarea
              id="review-edit-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Update your review details regarding safety, slot cleanliness, staff assistance, or lighting..."
              className="w-full px-3.5 py-2.5 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium resize-none shadow-2xs"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-[var(--sub)] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Changes reflect immediately</span>
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Changes</span>
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
