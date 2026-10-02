'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FaHeart } from 'react-icons/fa6';
import {
  LuArrowUpRight,
  LuCalendarCheck,
  LuCar,
  LuCircleDollarSign,
  LuClock,
  LuCompass,
  LuMapPin,
  LuPlus,
  LuQrCode,
  LuShieldCheck,
  LuTicket,
  LuUser,
} from 'react-icons/lu';
import { RiParkingBoxLine } from 'react-icons/ri';
import { BookingService, type IBooking } from '@/services/booking';
import { FavoriteService } from '@/services/favorite';
import { ReviewService } from '@/services/review';
import { VehicleService, type IVehicle } from '@/services/vehicle';

interface DriverDashboardViewProps {
  user: any;
}

export default function DriverDashboardView({ user }: DriverDashboardViewProps) {
  const [selectedTicketBooking, setSelectedTicketBooking] = useState<IBooking | null>(null);

  // 1. Fetch User's Bookings
  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['my-bookings-overview'],
    queryFn: () => BookingService.getMyBookings(),
  });

  // 2. Fetch User's Vehicles
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['my-vehicles-overview'],
    queryFn: () => VehicleService.getMyVehicles(),
  });

  // 3. Fetch User's Favorites
  const { data: favoritesData, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['my-favorites-overview'],
    queryFn: () => FavoriteService.getMyFavorites(),
  });

  // 4. Fetch User's Reviews
  const { data: _reviewsData } = useQuery({
    queryKey: ['my-reviews-overview'],
    queryFn: () => ReviewService.getMyReviews(),
  });

  const bookings: IBooking[] = bookingsData?.data || [];
  const vehicles: IVehicle[] = vehiclesData?.data || [];
  const favorites = favoritesData?.data || [];

  // Metrics computation
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const totalSpent = bookings
    .filter((b) => b.payment?.status === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Get current active / next upcoming confirmed reservation
  const activeReservation = activeBookings[0] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0f2a6b] via-[#163a8c] to-[#0a1b45] p-6 sm:p-7 text-white shadow-lg border border-blue-400/20">
        {/* Background glow & accents */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Driver Account · Smart Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Welcome Back, {user?.name || 'Driver'}!</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Find, reserve, and manage your smart city parking spots with instant QR gate access and real-time bay telemetry.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/garages"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <LuCompass className="w-3.5 h-3.5" />
              <span>Explore Garages</span>
            </Link>

            <Link
              href="/dashboard/vehicles"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <LuPlus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Reservations */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-blue-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Active Parking</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoadingBookings ? '...' : activeBookings.length}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeBookings.length > 0 ? 'Ready for Entry' : 'No Active Session'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuTicket className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Registered Vehicles */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-cyan-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Saved Vehicles</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoadingVehicles ? '...' : vehicles.length}
            </p>
            <p className="text-[11px] text-[var(--sub)] font-mono truncate max-w-[130px]">
              {vehicles.find((v) => v.isDefault)?.vehicleNumber || (vehicles[0]?.vehicleNumber ?? 'No vehicles saved')}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuCar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Favorite Garages */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-rose-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Favorite Spots</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoadingFavorites ? '...' : favorites.length}
            </p>
            <p className="text-[11px] text-[var(--sub)]">Bookmarked hubs</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <FaHeart className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Spent */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-amber-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Total Spent</p>
            <p className="text-2xl font-black text-[var(--ink)] font-mono">
              {isLoadingBookings ? '...' : `৳${totalSpent.toLocaleString()}`}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {completedBookings.length} completed trips
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuCircleDollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Highlight: Live Active / Upcoming Reservation Banner (If exists) */}
      {activeReservation && (
        <div className="rounded-lg border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-[var(--card)] to-[var(--card)] p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                Live Confirmed Parking Spot
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--sub)]">
              Booking Ref: #{activeReservation.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Garage details */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--ink)]">
                {activeReservation.garage?.name || 'Smart Parking Facility'}
              </h3>
              <p className="text-xs text-[var(--sub)] flex items-center gap-1">
                <LuMapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{activeReservation.garage?.address || 'City Center'}</span>
              </p>
            </div>

            {/* Timings & Vehicle */}
            <div className="space-y-1 text-xs text-[var(--ink)]">
              <div className="flex items-center gap-2">
                <LuClock className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  {new Date(activeReservation.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {new Date(activeReservation.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[var(--sub)]">
                <LuCar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Vehicle: {activeReservation.vehicleNumber || 'Unassigned'}</span>
              </div>
            </div>

            {/* Quick QR Ticket & Navigation Actions */}
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => setSelectedTicketBooking(activeReservation)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <LuQrCode className="w-3.5 h-3.5" />
                <span>Show QR Pass</span>
              </button>

              {activeReservation.garage?.latitude && activeReservation.garage?.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeReservation.garage.latitude},${activeReservation.garage.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-[var(--ink)] border border-[var(--line)] transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <LuCompass className="w-3.5 h-3.5 text-blue-500" />
                  <span>Navigate</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. 2-Column Content Grid: Recent Bookings (7 cols) + My Vehicles & Favorites (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Bookings (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuCalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Recent Parking Activity
            </h2>
            <Link
              href="/dashboard/my-bookings"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <LuArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] shadow-sm overflow-hidden">
            {isLoadingBookings ? (
              <div className="p-8 text-center space-y-2 text-xs text-[var(--sub)]">
                <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading your parking history...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <RiParkingBoxLine className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">No Bookings Yet</h3>
                <p className="text-xs text-[var(--sub)] max-w-xs mx-auto">
                  You haven&apos;t reserved any parking spots yet. Explore smart garages nearby and book in seconds.
                </p>
                <Link
                  href="/garages"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Find Parking
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {bookings.slice(0, 5).map((booking) => {
                  const statusColors: Record<string, string> = {
                    CONFIRMED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  };

                  return (
                    <div
                      key={booking.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg)]/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--ink)]">
                            {booking.garage?.name || 'Smart Garage'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              statusColors[booking.status] || 'bg-slate-500/10 text-slate-400'
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--sub)] flex items-center gap-2">
                          <span>
                            {new Date(booking.startTime).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(booking.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {booking.vehicleNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[var(--ink)] font-semibold">
                                {booking.vehicleNumber}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="font-mono font-bold text-xs text-[var(--ink)]">
                          ৳{booking.totalPrice}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTicketBooking(booking)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-semibold text-[var(--ink)] border border-[var(--line)] transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <LuTicket className="w-3.5 h-3.5 text-blue-500" />
                          <span>Pass Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Registered Vehicles & Favorite Spots (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Saved Vehicles Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <LuCar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Registered Vehicles
              </h2>
              <Link
                href="/dashboard/vehicles"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Manage</span>
                <LuArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-4 shadow-sm space-y-3">
              {isLoadingVehicles ? (
                <p className="text-xs text-[var(--sub)]">Loading vehicles...</p>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-[var(--sub)]">No saved vehicles yet.</p>
                  <Link
                    href="/dashboard/vehicles"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <LuPlus className="w-3.5 h-3.5" />
                    <span>Add License Plate</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="p-2.5 rounded-md border border-[var(--line)] bg-[var(--bg)]/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          <LuCar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black font-mono text-[var(--ink)] tracking-wide">
                            {v.vehicleNumber}
                          </p>
                          <p className="text-[10px] text-[var(--sub)]">
                            {v.model || v.vehicleType || 'Personal Vehicle'}
                          </p>
                        </div>
                      </div>
                      {v.isDefault && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          DEFAULT
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Favorite Garages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <FaHeart className="w-4 h-4 text-rose-500" />
                Favorite Spots
              </h2>
              <Link
                href="/dashboard/favorites"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <LuArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-4 shadow-sm space-y-3">
              {isLoadingFavorites ? (
                <p className="text-xs text-[var(--sub)]">Loading favorites...</p>
              ) : favorites.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-[var(--sub)]">No favorite parking spots saved.</p>
                  <Link
                    href="/garages"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Browse Garages</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {favorites.slice(0, 3).map((g: any) => (
                    <Link
                      key={g.id}
                      href={`/garages/${g.id}`}
                      className="p-2.5 rounded-md border border-[var(--line)] bg-[var(--bg)]/50 hover:border-blue-500/40 flex items-center justify-between transition-colors block"
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <p className="text-xs font-bold text-[var(--ink)] truncate">{g.name}</p>
                        <p className="text-[10px] text-[var(--sub)] truncate flex items-center gap-1">
                          <LuMapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{g.address}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          ৳{g.pricePerHour}/hr
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. QR Code Pass Modal */}
      {selectedTicketBooking && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedTicketBooking(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedTicketBooking(null)}
        >
          <div
            role="document"
            className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <LuShieldCheck className="w-4 h-4" />
                Smart Digital Pass
              </span>
              <button
                type="button"
                onClick={() => setSelectedTicketBooking(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR Visual */}
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner border border-slate-200">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  JSON.stringify({
                    bookingId: selectedTicketBooking.id,
                    garage: selectedTicketBooking.garage?.name,
                    vehicle: selectedTicketBooking.vehicleNumber,
                    status: selectedTicketBooking.status,
                  }),
                )}`}
                alt="Parking Pass QR Code"
                width={160}
                height={160}
                unoptimized
                className="mx-auto"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--ink)]">
                {selectedTicketBooking.garage?.name}
              </h3>
              <p className="text-xs text-[var(--sub)]">
                Vehicle Plate: <strong className="text-[var(--ink)]">{selectedTicketBooking.vehicleNumber || 'Standard'}</strong>
              </p>
              <p className="text-[11px] font-mono text-[var(--sub)]">
                Pass ID: #{selectedTicketBooking.id.slice(0, 10).toUpperCase()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTicketBooking(null)}
              className="w-full py-2.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
