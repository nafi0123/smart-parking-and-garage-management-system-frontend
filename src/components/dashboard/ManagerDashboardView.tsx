'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { FaStar } from 'react-icons/fa6';
import {
  LuArrowUpRight,
  LuBuilding2,
  LuCalendarCheck,
  LuCircleDollarSign,
  LuInbox,
  LuPlus,
  LuTrendingUp,
} from 'react-icons/lu';
import { RiParkingBoxLine } from 'react-icons/ri';
import { AnalyticsService } from '@/services/analytics';

interface ManagerDashboardViewProps {
  user: any;
}

export default function ManagerDashboardView({ user }: ManagerDashboardViewProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    revenue: number;
    bookingsCount: number;
  } | null>(null);

  // Fetch Manager Analytics from backend
  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['manager-analytics-overview'],
    queryFn: () => AnalyticsService.getManagerAnalytics(),
  });

  const analytics = analyticsResponse?.data;
  const summary = analytics?.summary;
  const breakdown = analytics?.bookingStatusBreakdown;
  const revenueChart = analytics?.revenueChart || [];
  const topGarages = analytics?.topGarages || [];

  // Max revenue in 30 days for scaling bar heights
  const maxDailyRevenue = Math.max(
    ...revenueChart.map((d) => d.revenue),
    100, // minimum scale
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Manager Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0a235c] via-[#0f2a6b] to-[#081538] p-6 sm:p-7 text-white shadow-lg border border-blue-500/20">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-400/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Garage Facility Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Operations Overview: {user?.name || 'Manager'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Real-time telemetry across your smart parking infrastructure, revenue streams, and incoming vehicle occupancy.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/garages"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <LuPlus className="w-3.5 h-3.5" />
              <span>Add New Facility</span>
            </Link>

            <Link
              href="/dashboard/manager-bookings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <LuInbox className="w-3.5 h-3.5" />
              <span>Incoming Bookings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Operational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Managed Garages & Slots */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-blue-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Managed Facilities</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoading ? '...' : summary?.totalGarages ?? 0}
            </p>
            <p className="text-[11px] text-[var(--sub)]">
              {summary?.totalSlots ?? 0} Total Parking Bays
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuBuilding2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Live Bay Occupancy Rate */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-emerald-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Live Bay Occupancy</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoading ? '...' : `${summary?.occupancyRate ?? 0}%`}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {summary?.occupiedSlots ?? 0} of {summary?.totalSlots ?? 0} bays occupied
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <RiParkingBoxLine className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Total Platform Revenue */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-cyan-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Total Earnings</p>
            <p className="text-2xl font-black text-[var(--ink)] font-mono">
              {isLoading ? '...' : `৳${(summary?.totalRevenue ?? 0).toLocaleString()}`}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              Month: ৳{(summary?.monthlyRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuCircleDollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Bookings Processed */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-purple-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoading ? '...' : summary?.totalBookings ?? 0}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {breakdown?.CONFIRMED ?? 0} Confirmed Active
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuCalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. 30-Day Daily Revenue Activity Chart */}
      <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuTrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              30-Day Revenue & Booking Volume Telemetry
            </h2>
            <p className="text-xs text-[var(--sub)]">
              Hover over daily bars to inspect daily earnings and vehicle entry volumes.
            </p>
          </div>

          {hoveredDay ? (
            <div className="inline-flex items-center gap-3 bg-[var(--bg)] px-3 py-1.5 rounded-md border border-[var(--line)] text-xs shadow-2xs">
              <span className="font-semibold text-[var(--ink)]">{hoveredDay.date}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ৳{hoveredDay.revenue.toLocaleString()}
              </span>
              <span className="text-[var(--sub)]">({hoveredDay.bookingsCount} bookings)</span>
            </div>
          ) : (
            <div className="text-xs text-[var(--sub)] font-medium">
              30-Day Total: <strong>৳{(summary?.totalRevenue ?? 0).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4">
          <div className="h-44 w-full flex items-end gap-1 sm:gap-2 px-1">
            {revenueChart.map((day, idx) => {
              const heightPercent = Math.max(
                4,
                Math.round((day.revenue / maxDailyRevenue) * 100),
              );

              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: Chart index
                  key={idx}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 flex flex-col items-center gap-1 group cursor-pointer h-full justify-end"
                >
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        day.revenue > 0
                          ? 'bg-blue-600 group-hover:bg-cyan-400 shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] text-[var(--sub)] font-mono pt-2 border-t border-[var(--line)]">
            <span>30 Days Ago</span>
            <span>15 Days Ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* 4. 2-Column: Booking Status Breakdown (4 cols) + Top Facilities (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Breakdown */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
            <LuInbox className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Booking Status Distribution
          </h2>

          <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-5 shadow-sm space-y-4">
            {/* Status Item 1: Confirmed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Confirmed (Active)
                </span>
                <span className="text-[var(--ink)] font-bold">{breakdown?.CONFIRMED ?? 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary?.totalBookings
                        ? ((breakdown?.CONFIRMED ?? 0) / summary.totalBookings) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Status Item 2: Completed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Completed (Done)
                </span>
                <span className="text-[var(--ink)] font-bold">{breakdown?.COMPLETED ?? 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary?.totalBookings
                        ? ((breakdown?.COMPLETED ?? 0) / summary.totalBookings) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Status Item 3: Pending Payment */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Pending Payment
                </span>
                <span className="text-[var(--ink)] font-bold">{breakdown?.PENDING ?? 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary?.totalBookings
                        ? ((breakdown?.PENDING ?? 0) / summary.totalBookings) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Status Item 4: Cancelled */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Cancelled
                </span>
                <span className="text-[var(--ink)] font-bold">{breakdown?.CANCELLED ?? 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary?.totalBookings
                        ? ((breakdown?.CANCELLED ?? 0) / summary.totalBookings) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Facilities Table */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuBuilding2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Managed Parking Facilities
            </h2>
            <Link
              href="/dashboard/garages"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Manage All</span>
              <LuArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center space-y-2 text-xs text-[var(--sub)]">
                <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading garage facilities...</p>
              </div>
            ) : topGarages.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <LuBuilding2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">No Garages Listed Yet</h3>
                <p className="text-xs text-[var(--sub)] max-w-xs mx-auto">
                  Add your first smart parking garage to begin receiving driver bookings and tracking revenue.
                </p>
                <Link
                  href="/dashboard/garages"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <LuPlus className="w-3.5 h-3.5" />
                  <span>Add New Facility</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {topGarages.map((garage) => {
                  const freeSlots = garage.availableSlots ?? 0;
                  const totalSlots = garage.totalSlots ?? 1;

                  return (
                    <div
                      key={garage.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg)]/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/garages/${garage.id}`}
                            className="font-bold text-xs text-[var(--ink)] hover:text-blue-600 transition-colors"
                          >
                            {garage.name}
                          </Link>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            ৳{garage.pricePerHour}/hr
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--sub)] flex items-center gap-1.5">
                          <span>
                            Slots: <strong className="text-[var(--ink)]">{freeSlots} free</strong> / {totalSlots} total
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <FaStar className="w-3 h-3 text-amber-400" />
                            <strong>{garage.averageRating?.toFixed(1) || '5.0'}</strong> ({garage.totalReviews || 0} reviews)
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-right">
                          <p className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                            ৳{(garage.totalRevenue || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-[var(--sub)]">{garage.totalBookings || 0} bookings</p>
                        </div>

                        <Link
                          href="/dashboard/garages"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold text-[var(--ink)] border border-[var(--line)] transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <span>Manage</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
