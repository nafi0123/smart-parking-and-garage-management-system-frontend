'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import GarageReviewsSection from '@/components/GarageReviewsSection';
import { BookingService } from '@/services/booking';
import { GarageService } from '@/services/garage';
import Alert from '@/utils/alert';
import { getAuthToken, getAuthUser } from '@/utils/cookie';

const getInitialLocalDateTime = () => {
  const now = new Date();
  // Round up to nearest 5 minutes
  now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function GarageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const garageId = params?.id as string;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [startTimeInput, setStartTimeInput] = useState(getInitialLocalDateTime());
  const [selectedHours, setSelectedHours] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state on client
  useEffect(() => {
    const token = getAuthToken();
    setIsLoggedIn(!!token);
  }, []);

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
              {(error as any)?.message ||
                'The requested parking facility does not exist or has been removed.'}
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
  const isAvailable = Boolean(garage.availableSlots && garage.availableSlots > 0);
  const occupiedSlots = Math.max(0, garage.totalSlots - garage.availableSlots);
  const occupancyPercent =
    garage.totalSlots > 0 ? Math.round((occupiedSlots / garage.totalSlots) * 100) : 0;

  const estimatedTotal = Number(((garage.pricePerHour || 0) * selectedHours).toFixed(2));
  const garageImages = garage.images && garage.images.length > 0 ? garage.images : [];
  const reviewsList = garage.reviews || [];

  // Calculate schedule dates
  const startDate = new Date(startTimeInput);
  const isValidStartDate = !Number.isNaN(startDate.getTime());
  const endDate = isValidStartDate
    ? new Date(startDate.getTime() + selectedHours * 3600000)
    : new Date();

  // Reset to current time
  const handleSetToNow = () => {
    setStartTimeInput(getInitialLocalDateTime());
  };

  // SSLCommerz Payment Gateway Checkout Trigger
  const handleProceedToPayment = async () => {
    // Strict Guard: Prevent any booking if availableSlots <= 0
    if (!isAvailable || garage.availableSlots <= 0) {
      Alert.error(
        'Facility Fully Occupied',
        'There are 0 available parking slots in this garage. Reservation is disabled.',
      );
      return;
    }

    const token = getAuthToken();
    if (!token) {
      const shouldLogin = await Alert.confirm({
        title: 'Authentication Required',
        text: 'Please sign in to reserve a parking spot and proceed with SSLCommerz payment.',
        confirmButtonText: 'Sign In Now',
        cancelButtonText: 'Cancel',
        icon: 'info',
      });
      if (shouldLogin) {
        router.push(`/login?redirect=/garages/${garageId}`);
      }
      return;
    }

    if (!isValidStartDate) {
      Alert.error('Invalid Start Time', 'Please pick a valid start date and time.');
      return;
    }

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    setIsProcessingPayment(true);

    try {
      Alert.toast('Initiating SSLCommerz Payment Session...', 'info');

      const response = await BookingService.createBooking({
        garageId: garage.id,
        startTime: startIso,
        endTime: endIso,
        vehicleNumber: vehicleNumber.trim() || undefined,
      });

      const bookingData = response?.data;
      const paymentUrl = bookingData?.paymentUrl;

      if (paymentUrl) {
        Alert.toast('Redirecting to SSLCommerz Checkout...', 'success');
        // Redirect browser to SSLCommerz payment gateway
        window.location.href = paymentUrl;
      } else {
        // In case SSL session could not generate URL directly (e.g. sandbox credentials fallback)
        Alert.success(
          'Booking Created',
          'Your booking has been created. Redirecting to your dashboard...',
        );
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('SSLCommerz payment booking error:', err);
      Alert.error(
        'Payment Initialization Failed',
        err.message || 'Could not initiate SSLCommerz payment session. Please try again.',
      );
    } finally {
      setIsProcessingPayment(false);
    }
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
                <span
                  className={`h-2 w-2 rounded-full ${
                    isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
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
            <div className="text-xs font-semibold text-[var(--sub)] uppercase tracking-wider">
              Hourly Rate
            </div>
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
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
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
                    <div className="text-[11px] text-[var(--sub)] font-mono">
                      {garage.owner.email}
                    </div>
                    {garage.owner.phone && (
                      <div className="text-[11px] text-slate-500">Phone: {garage.owner.phone}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Customer Ratings & Reviews (Comprehensive Section with Breakdown & Filters) */}
            <GarageReviewsSection
              garageId={garage.id}
              garageName={garage.name}
              initialAverageRating={garage.averageRating}
              initialTotalReviews={garage.totalReviews}
            />
          </div>

          {/* Right Column: SSLCommerz Payment Gateway & Reservation Card (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--card)] p-5 sm:p-6 shadow-lg space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div>
                  <span className="text-xs font-semibold text-[var(--sub)] uppercase tracking-wider">
                    Parking Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-[var(--ink)] font-mono">
                      ৳{garage.pricePerHour}
                    </span>
                    <span className="text-xs text-[var(--sub)]">/ hour</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    {isAvailable ? `${garage.availableSlots} Slots Free` : 'Full'}
                  </span>
                </div>
              </div>

              {/* Dynamic Reservation Section (Only active when slots are available) */}
              {isAvailable ? (
                <>
                  {/* Start Date & Time Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="start-time-input"
                        className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5"
                      >
                        <span>🕒</span> Start Time & Date:
                      </label>
                      <button
                        type="button"
                        onClick={handleSetToNow}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Set to Now
                      </button>
                    </div>
                    <input
                      id="start-time-input"
                      type="datetime-local"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Duration Selector */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="duration-presets"
                      className="text-xs font-bold text-[var(--ink)] block"
                    >
                      Duration (Hours):
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 4, 8, 24].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setSelectedHours(hrs)}
                          className={`rounded py-2 text-xs font-bold transition-all cursor-pointer text-center ${
                            selectedHours === hrs
                              ? 'bg-[#0f2a6b] text-white shadow-sm ring-2 ring-blue-500/30'
                              : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>

                    {/* Custom Hours Counter / Input */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[var(--sub)]">Custom duration:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedHours((prev) => Math.max(1, prev - 1))}
                          className="w-7 h-7 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-mono font-bold text-xs text-[var(--ink)]">
                          {selectedHours}h
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedHours((prev) => Math.min(168, prev + 1))}
                          className="w-7 h-7 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Number (Optional) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="vehicle-number-input"
                      className="text-xs font-bold text-[var(--ink)] flex items-center justify-between"
                    >
                      <span>🚗 Vehicle Plate Number:</span>
                      <span className="text-[10px] text-[var(--sub)] font-normal">Optional</span>
                    </label>
                    <input
                      id="vehicle-number-input"
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. DHAKA METRO GA-11-2233"
                      className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--ink)] uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                    />
                  </div>

                  {/* Schedule Summary Preview */}
                  {isValidStartDate && (
                    <div className="rounded-md border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-[var(--sub)]">
                        <span>Reservation Schedule:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {selectedHours} hour{selectedHours > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-[var(--ink)]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">In:</span>{' '}
                        {startDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                      <div className="text-[11px] font-medium text-[var(--ink)]">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Out:</span>{' '}
                        {endDate.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] p-3 text-xs">
                    <div className="flex justify-between text-[var(--sub)]">
                      <span>
                        Parking Fee ({selectedHours} hrs × ৳{garage.pricePerHour})
                      </span>
                      <span className="font-mono font-medium text-[var(--ink)]">৳{estimatedTotal}</span>
                    </div>
                    <div className="flex justify-between text-[var(--sub)]">
                      <span>Payment Gateway Processing</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free</span>
                    </div>
                    <div className="border-t border-[var(--line)] pt-2 mt-1 flex justify-between font-extrabold text-sm sm:text-base text-[var(--ink)]">
                      <span>Total Payable:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        ৳{estimatedTotal} BDT
                      </span>
                    </div>
                  </div>

                  {/* Action Button: Pay with SSLCommerz */}
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleProceedToPayment}
                    className="w-full rounded-md py-3.5 px-4 bg-[#0f2a6b] hover:bg-[#1e40af] active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to SSLCommerz...</span>
                      </>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>Pay ৳{estimatedTotal} & Reserve Spot</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Fully Occupied Display - Completely Disables Booking */
                <div className="space-y-4">
                  <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-center space-y-2">
                    <div className="text-2xl">🚫</div>
                    <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">
                      Facility 100% Occupied
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                      All {garage.totalSlots} parking slots are currently in use. Reservations are temporarily closed until vehicles depart.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full rounded-md py-3.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-bold cursor-not-allowed text-center border border-slate-300 dark:border-slate-700"
                  >
                    🚫 No Slots Available (0 Free)
                  </button>

                  <Link
                    href="/garages?onlyAvailable=true"
                    className="w-full block rounded-md py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold text-center transition-colors"
                  >
                    Find Nearby Available Garages →
                  </Link>
                </div>
              )}

              {/* Supported Payment Gateways showcase (SSLCommerz) */}
              <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--sub)] font-medium">
                  <span>Supported Payment Channels:</span>
                  <span className="text-emerald-600 font-bold">SSLCommerz</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-900 px-2 py-0.5 text-[10px] font-bold text-pink-700 dark:text-pink-300">
                    bKash
                  </span>
                  <span className="rounded bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:text-orange-300">
                    Nagad
                  </span>
                  <span className="rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                    Rocket
                  </span>
                  <span className="rounded bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    Visa / Master
                  </span>
                  <span className="rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Internet Banking
                  </span>
                </div>
              </div>

              {/* Security & Refund Guarantee note */}
              <div className="space-y-1.5 pt-1 text-[11px] text-[var(--sub)]">
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Instant slot confirmation upon successful transaction</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>Full refund allowed up to 1 hour before start time</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold shrink-0">🛡️</span>
                  <span>256-bit SSL encrypted secure payment gateway</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
