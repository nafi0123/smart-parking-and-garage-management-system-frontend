'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Container from '@/components/Container';
import { GarageService } from '@/services/garage';

export default function GarageDetailsPage() {
  const params = useParams();
  const garageId = params?.id as string;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedHours, setSelectedHours] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // TanStack Query for dynamic single garage details from Backend API
  const {
    data: garageResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['garage', garageId],
    queryFn: () => GarageService.getSingleGarage(garageId),
    enabled: !!garageId,
  });

  const garage = garageResponse?.data || null;

  if (isLoading) {
    return (
      <div className="py-10 sm:py-16 bg-[var(--bg)] min-h-[80vh]">
        <Container>
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-72 sm:h-96 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="h-32 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-44 w-full rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="lg:col-span-4 h-80 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (isError || !garage) {
    return (
      <div className="py-16 bg-[var(--bg)] min-h-[80vh] flex items-center">
        <Container>
          <div className="max-w-md mx-auto rounded-md border border-[var(--line)] bg-[var(--card)] p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-[var(--ink)]">Garage Not Found</h2>
            <p className="text-xs text-[var(--sub)]">
              {(error as any)?.message || 'The requested parking facility does not exist or has been removed.'}
            </p>
            <Link
              href="/garages"
              className="inline-block rounded-md bg-[#0f2a6b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1e40af] transition-colors"
            >
              ← Back to All Garages
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  // Schema-derived calculations
  const isAvailable = garage.availableSlots > 0;
  const occupiedSlots = Math.max(0, garage.totalSlots - garage.availableSlots);
  const occupancyPercent =
    garage.totalSlots > 0 ? Math.round((occupiedSlots / garage.totalSlots) * 100) : 0;

  const estimatedTotal = (garage.pricePerHour || 0) * selectedHours;
  const garageImages = garage.images && garage.images.length > 0 ? garage.images : [];
  const reviewsList = garage.reviews || [];

  const handleBookSpot = () => {
    setBookingSuccess(true);
  };

  return (
    <div className="py-6 sm:py-10 bg-[var(--bg)] min-h-[85vh]">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link
            href="/garages"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sub)] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span>←</span> Back to All Garages
          </Link>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--sub)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Database Connected
          </div>
        </div>

        {/* Dynamic Header from Schema */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 mb-6 border-b border-[var(--line)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isAvailable
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isAvailable ? `${garage.availableSlots} Available Slots` : 'Fully Occupied'}
              </span>

              {garage.location && (
                <span className="rounded bg-[var(--card)] border border-[var(--line)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink)]">
                  📍 {garage.location}
                </span>
              )}

              <div className="rounded bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>★</span>
                <span>{garage.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-[var(--sub)] font-normal">
                  ({garage.totalReviews || reviewsList.length} reviews)
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--ink)]">
              {garage.name}
            </h1>

            <p className="text-xs sm:text-sm text-[var(--sub)] flex items-center gap-1.5">
              <span>📌</span>
              <span>{garage.address}</span>
            </p>
          </div>

          {/* Top Price Callout */}
          <div className="text-left md:text-right shrink-0">
            <div className="text-xs font-semibold text-[var(--sub)] uppercase tracking-wider">Hourly Rate</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] font-mono">
              ৳{garage.pricePerHour}
              <span className="text-xs font-normal text-[var(--sub)]">/hr</span>
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Dynamic Images Showcase from garage.images */}
            <div className="space-y-3">
              <div className="relative h-64 sm:h-96 md:h-[420px] w-full overflow-hidden rounded-lg border border-[var(--line)] bg-slate-100 dark:bg-slate-900 shadow-sm">
                {garageImages.length > 0 ? (
                  <Image
                    src={garageImages[activeImageIndex] || garageImages[0]}
                    alt={garage.name}
                    fill
                    unoptimized
                    priority
                    className="object-cover object-center transition-all duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400">
                    <span className="text-6xl font-black">🅿</span>
                  </div>
                )}
              </div>

              {/* Dynamic Thumbnail Row if Multiple Images Exist */}
              {garageImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {garageImages.map((img, idx) => (
                    <button
                      // biome-ignore lint/suspicious/noArrayIndexKey: Thumbnail gallery index
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm scale-105'
                          : 'border-[var(--line)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={img} alt={`Thumbnail ${idx + 1}`} fill unoptimized className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Capacity & Live Metrics Cards (from Schema) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 text-center shadow-2xs">
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] font-mono">
                  {garage.totalSlots}
                </div>
                <div className="text-xs text-[var(--sub)] mt-1 font-medium">Total Capacity</div>
              </div>

              <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 text-center shadow-2xs">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {garage.availableSlots}
                </div>
                <div className="text-xs text-[var(--sub)] mt-1 font-medium">Available Slots</div>
              </div>

              <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 text-center shadow-2xs">
                <div className="text-xl sm:text-2xl font-extrabold text-slate-700 dark:text-slate-300 font-mono">
                  {occupiedSlots}
                </div>
                <div className="text-xs text-[var(--sub)] mt-1 font-medium">Occupied Slots</div>
              </div>

              <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 text-center shadow-2xs">
                <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  ৳{garage.pricePerHour}
                </div>
                <div className="text-xs text-[var(--sub)] mt-1 font-medium">Rate / Hour</div>
              </div>
            </div>

            {/* Description & Overview (Dynamic from garage.description) */}
            <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 shadow-2xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                About this Garage
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--sub)] whitespace-pre-line">
                {garage.description || 'No specific description provided for this parking facility.'}
              </p>
            </div>

            {/* Dynamic Verified Specifications & Location (from Schema) */}
            <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 shadow-2xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                Location & Facility Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--ink)]">
                <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1">
                  <div className="text-[var(--sub)] font-medium text-[11px]">Full Address</div>
                  <div className="font-bold">{garage.address}</div>
                </div>

                <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1">
                  <div className="text-[var(--sub)] font-medium text-[11px]">Area / Zone</div>
                  <div className="font-bold">{garage.location || 'N/A'}</div>
                </div>

                <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1">
                  <div className="text-[var(--sub)] font-medium text-[11px]">Occupancy Status</div>
                  <div className="font-bold">
                    {occupancyPercent}% Occupied ({occupiedSlots} / {garage.totalSlots})
                  </div>
                </div>

                <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1">
                  <div className="text-[var(--sub)] font-medium text-[11px]">GPS Coordinates</div>
                  <div className="font-bold font-mono">
                    {garage.latitude && garage.longitude
                      ? `${garage.latitude.toFixed(4)}, ${garage.longitude.toFixed(4)}`
                      : 'Coordinates not set'}
                  </div>
                  {garage.latitude && garage.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${garage.latitude},${garage.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[11px] text-blue-600 hover:underline mt-1 font-semibold"
                    >
                      Open in Google Maps ↗
                    </a>
                  )}
                </div>

                <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1">
                  <div className="text-[var(--sub)] font-medium text-[11px]">Date Listed</div>
                  <div className="font-bold">
                    {new Date(garage.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1">
                  <div className="text-[var(--sub)] font-medium text-[11px]">Last Updated</div>
                  <div className="font-bold">
                    {new Date(garage.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Owner & Management Profile (from garage.owner relation) */}
            {garage.owner && (
              <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 shadow-2xs space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                  Garage Owner & Operator
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0f2a6b] text-white font-bold flex items-center justify-center text-base shadow-xs">
                    {garage.owner.name?.charAt(0).toUpperCase() || 'O'}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                      <span>{garage.owner.name}</span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-1.5 py-0.2 rounded">
                        {garage.owner.role || 'MANAGER'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--sub)] font-mono">{garage.owner.email}</div>
                    {garage.owner.phone && (
                      <div className="text-[11px] text-slate-500">Phone: {garage.owner.phone}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Customer Reviews (from garage.reviews relation) */}
            <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                  Customer Reviews ({reviewsList.length})
                </h2>
                <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <span>★</span>
                  <span>{garage.averageRating?.toFixed(1) || '0.0'} / 5.0</span>
                </div>
              </div>

              {reviewsList.length > 0 ? (
                <div className="space-y-3 divide-y divide-[var(--line)]">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-[var(--ink)]">
                            {rev.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-xs font-bold text-[var(--ink)]">
                            {rev.user?.name || 'Verified Driver'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--sub)] font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                      </div>
                      <p className="text-xs text-[var(--sub)] leading-relaxed">
                        {rev.comment || 'No comment provided.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-[var(--sub)] text-xs space-y-1">
                  <p className="font-semibold text-[var(--ink)]">No reviews yet for this facility</p>
                  <p className="text-[11px]">Book a spot and be among the first to leave verified feedback!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Reservation Card (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 shadow-md space-y-5">
              <div className="border-b border-[var(--line)] pb-4">
                <span className="text-xs font-semibold text-[var(--sub)] uppercase tracking-wider">
                  Parking Rate
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-[var(--ink)] font-mono">
                    ৳{garage.pricePerHour}
                  </span>
                  <span className="text-xs text-[var(--sub)]">/ hour</span>
                </div>
              </div>

              {/* Status summary */}
              <div className="rounded border border-[var(--line)] bg-[var(--bg)] p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--sub)]">Current Status:</span>
                  <span className={`font-bold ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isAvailable ? `${garage.availableSlots} Slots Free` : 'Full'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--sub)]">Total Capacity:</span>
                  <span className="font-mono font-medium text-[var(--ink)]">{garage.totalSlots} Slots</span>
                </div>
              </div>

              {/* Booking Duration Selector */}
              <div className="space-y-2">
                <label htmlFor="duration-select" className="text-xs font-semibold text-[var(--ink)] block">
                  Select Estimated Duration:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 4, 8].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setSelectedHours(hrs)}
                      className={`rounded py-1.5 text-xs font-bold transition-colors cursor-pointer text-center ${
                        selectedHours === hrs
                          ? 'bg-[#0f2a6b] text-white'
                          : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Fare Calculation Summary */}
              <div className="space-y-1.5 rounded border border-[var(--line)] bg-[var(--bg)] p-3 text-xs">
                <div className="flex justify-between text-[var(--sub)]">
                  <span>Base Rate ({selectedHours} hrs × ৳{garage.pricePerHour})</span>
                  <span className="font-mono font-medium text-[var(--ink)]">৳{estimatedTotal}</span>
                </div>
                <div className="flex justify-between text-[var(--sub)]">
                  <span>Reservation Fee</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free</span>
                </div>
                <div className="border-t border-[var(--line)] pt-1.5 flex justify-between font-bold text-sm text-[var(--ink)]">
                  <span>Estimated Total</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">৳{estimatedTotal}</span>
                </div>
              </div>

              {/* Booking Button (Direct Spot Hold without Payment Flow) */}
              {bookingSuccess ? (
                <div className="rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 p-3 text-center space-y-1 animate-in fade-in">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    ✓ Parking Spot Reserved!
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    A parking spot at {garage.name} has been reserved for {selectedHours} hours.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={handleBookSpot}
                  className={`w-full rounded-md py-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-md ${
                    isAvailable
                      ? 'bg-[#0f2a6b] hover:bg-[#1e40af] active:scale-[0.98]'
                      : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? 'Reserve Spot Now' : 'Currently Full'}
                </button>
              )}

              {/* Info Badges */}
              <div className="space-y-1.5 pt-1 text-[11px] text-[var(--sub)] border-t border-[var(--line)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Instant reservation confirmation
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Free cancellation up to 15m prior
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Pay directly at garage entrance
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
