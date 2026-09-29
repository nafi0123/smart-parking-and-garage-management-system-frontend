'use client';

import type React from 'react';
import type { IGarage } from '@/services/garage';

interface IGarageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  garage: IGarage | null;
  onEdit?: (garage: IGarage) => void;
}

export default function GarageDetailsModal({
  isOpen,
  onClose,
  garage,
  onEdit,
}: IGarageDetailsModalProps) {
  if (!isOpen || !garage) return null;

  const occupancyRate =
    garage.totalSlots > 0
      ? Math.round(((garage.totalSlots - garage.availableSlots) / garage.totalSlots) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[var(--card)] text-[var(--ink)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/80 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Image Banner */}
        <div className="relative h-44 bg-gradient-to-tr from-[#0f2a6b] to-[#1e40af] overflow-hidden">
          {garage.images && garage.images.length > 0 ? (
            <img
              src={garage.images[0]}
              alt={garage.name}
              className="w-full h-full object-cover opacity-85"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors cursor-pointer"
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
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="inline-block px-2 py-0.5 rounded bg-blue-500/80 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider mb-1">
              {garage.location || 'Central Facility'}
            </span>
            <h3 className="text-lg font-bold text-white truncate drop-shadow-sm">{garage.name}</h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Address & Price Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[var(--bg)]/60">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              </div>
              <div>
                <div className="font-semibold text-[var(--ink)]">{garage.address}</div>
                {garage.latitude && garage.longitude && (
                  <div className="text-[11px] text-[var(--sub)] font-mono mt-0.5">
                    Lat: {garage.latitude}, Lon: {garage.longitude}
                  </div>
                )}
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ৳{garage.pricePerHour}
                <span className="text-xs text-[var(--sub)] font-sans font-normal"> / hour</span>
              </div>
              <div className="text-[11px] text-[var(--sub)]">Hourly Rate</div>
            </div>
          </div>

          {/* Slots & Occupancy Meter */}
          <div className="p-3.5 rounded-lg bg-[var(--bg)]/60 space-y-2.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-[var(--ink)]">Slot Capacity & Live Availability</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  garage.availableSlots > 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {garage.availableSlots > 0
                  ? `${garage.availableSlots} Available`
                  : 'Fully Occupied'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    garage.totalSlots > 0 ? (garage.availableSlots / garage.totalSlots) * 100 : 0,
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--sub)] font-mono">
              <span>{garage.availableSlots} available</span>
              <span>
                {garage.totalSlots - garage.availableSlots} occupied ({occupancyRate}%)
              </span>
              <span>{garage.totalSlots} total capacity</span>
            </div>
          </div>

          {/* Description */}
          {garage.description && (
            <div>
              <h4 className="font-semibold text-[var(--ink)] mb-1">Description & Amenities</h4>
              <p className="text-[var(--sub)] leading-relaxed bg-[var(--bg)]/40 p-3 rounded-lg">
                {garage.description}
              </p>
            </div>
          )}

          {/* Ratings & Owner Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Rating */}
            <div className="p-3 rounded-lg bg-[var(--bg)]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-sm shrink-0">
                <svg className="w-4 h-4 fill-amber-500 text-amber-500" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-[var(--ink)] text-sm">
                  {garage.averageRating?.toFixed(1) || '5.0'} / 5.0
                </div>
                <div className="text-[11px] text-[var(--sub)]">
                  Based on {garage.totalReviews || 0} reviews
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="p-3 rounded-lg bg-[var(--bg)]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="truncate">
                <div className="font-semibold text-[var(--ink)] truncate">
                  {garage.owner?.name || 'Assigned Manager'}
                </div>
                <div className="text-[11px] text-[var(--sub)] font-mono truncate">
                  {garage.owner?.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Images Gallery */}
          {garage.images && garage.images.length > 1 && (
            <div>
              <h4 className="font-semibold text-[var(--ink)] mb-1.5">
                Gallery ({garage.images.length} Photos)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {garage.images.map((img) => (
                  <img
                    key={img}
                    src={img}
                    alt={garage.name}
                    className="w-full h-20 object-cover rounded-md bg-[var(--bg)] hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-[var(--bg)]/30">
          {garage.latitude && garage.longitude ? (
            <a
              href={`https://www.google.com/maps?q=${garage.latitude},${garage.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-[var(--navy-2)] dark:text-blue-400 font-semibold text-xs transition-colors shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span>Open in Google Maps</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(garage);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--navy-2)] hover:bg-[var(--navy)] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Details</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
