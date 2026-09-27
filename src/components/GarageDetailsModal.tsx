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
            <div className="w-full h-full flex items-center justify-center text-white/40">
              <span className="text-5xl">🅿</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xs backdrop-blur-xs transition-colors cursor-pointer"
          >
            ✕
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
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">📍</span>
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
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                ৳{garage.pricePerHour}
                <span className="text-xs text-[var(--sub)] font-normal"> / hour</span>
              </div>
              <div className="text-[11px] text-[var(--sub)]">Hourly Rate</div>
            </div>
          </div>

          {/* Slots & Occupancy Meter */}
          <div className="p-3 rounded-lg bg-[var(--bg)]/60 space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-[var(--ink)]">Slot Capacity & Live Availability</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  garage.availableSlots > 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {garage.availableSlots > 0 ? `${garage.availableSlots} Available` : 'Fully Occupied'}
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
              <span>{garage.totalSlots - garage.availableSlots} occupied ({occupancyRate}%)</span>
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
              <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-sm">
                ★
              </div>
              <div>
                <div className="font-bold text-[var(--ink)] text-sm">
                  {garage.averageRating?.toFixed(1) || '0.0'} / 5.0
                </div>
                <div className="text-[11px] text-[var(--sub)]">
                  Based on {garage.totalReviews || 0} reviews
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="p-3 rounded-lg bg-[var(--bg)]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                👤
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
              <h4 className="font-semibold text-[var(--ink)] mb-1.5">Gallery ({garage.images.length} Photos)</h4>
              <div className="grid grid-cols-3 gap-2">
                {garage.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${garage.name} photo ${idx + 1}`}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-[var(--navy-2)] dark:text-blue-400 font-semibold text-xs transition-colors"
            >
              <span>🗺</span> Open in Google Maps ↗
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
                className="px-3 py-1.5 rounded-md bg-[var(--navy-2)] hover:bg-[var(--navy)] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Edit Details
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
