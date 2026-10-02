'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import {
  LuArrowUpRight,
  LuBuilding2,
  LuCalendarCheck,
  LuCar,
  LuCircleDollarSign,
  LuInbox,
  LuShieldCheck,
  LuTrendingUp,
  LuUsers,
} from 'react-icons/lu';
import { AnalyticsService } from '@/services/analytics';

interface AdminDashboardViewProps {
  user: any;
}

export default function AdminDashboardView({ user }: AdminDashboardViewProps) {
  const [hoveredMonth, setHoveredMonth] = useState<{
    month: string;
    revenue: number;
    bookings: number;
    newUsers: number;
  } | null>(null);

  // Fetch Super Admin Platform Analytics
  const { data: adminResponse, isLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => AnalyticsService.getAdminAnalytics(),
  });

  const analytics = adminResponse?.data;
  const summary = analytics?.summary;
  const userStats = analytics?.userStats;
  const bookingStats = analytics?.bookingStats;
  const yearlyChart = analytics?.yearlyChart || [];
  const recentTransactions = analytics?.recentTransactions || [];

  const maxMonthRevenue = Math.max(
    ...yearlyChart.map((m) => m.revenue),
    500,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Super Admin Hero Command Center */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#091836] via-[#0f2a6b] to-[#120e3a] p-6 sm:p-7 text-white shadow-lg border border-purple-500/20">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-400/30 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Platform Super Admin Command Center · Global Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Platform Master Console</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Global overview across all registered drivers, garage owners, parking facilities, payment gateways, and telemetry health.
            </p>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <LuUsers className="w-3.5 h-3.5" />
              <span>User Directory</span>
            </Link>

            <Link
              href="/dashboard/garages"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-white/20"
            >
              <LuBuilding2 className="w-3.5 h-3.5" />
              <span>All Facilities</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Global Platform Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-purple-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Registered Users</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoading ? '...' : summary?.totalUsers ?? 0}
            </p>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              {userStats?.drivers ?? 0} Drivers · {userStats?.managers ?? 0} Managers
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuUsers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Network Garages */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-blue-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Platform Garages</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoading ? '...' : summary?.totalGarages ?? 0}
            </p>
            <p className="text-[11px] text-[var(--sub)]">Active parking facilities</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuBuilding2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Platform Net Revenue */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-emerald-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Platform Net Volume</p>
            <p className="text-2xl font-black text-[var(--ink)] font-mono">
              {isLoading ? '...' : `৳${(summary?.netRevenue ?? 0).toLocaleString()}`}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Gross: ৳{(summary?.totalPlatformRevenue ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuCircleDollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Platform Bookings */}
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-cyan-500/30 transition-colors">
          <div className="space-y-1">
            <p className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">Global Bookings</p>
            <p className="text-2xl font-black text-[var(--ink)]">
              {isLoading ? '...' : summary?.totalBookings ?? 0}
            </p>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
              {bookingStats?.COMPLETED ?? 0} Trips Completed
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xl shrink-0 font-bold">
            <LuCalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. 12-Month Annual Financial & User Growth Chart */}
      <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuTrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Annual Platform Financial Growth (12 Months)
            </h2>
            <p className="text-xs text-[var(--sub)]">
              Monthly breakdown of gross revenue, driver bookings, and user registrations.
            </p>
          </div>

          {hoveredMonth ? (
            <div className="inline-flex items-center gap-3 bg-[var(--bg)] px-3 py-1.5 rounded-md border border-[var(--line)] text-xs shadow-2xs">
              <span className="font-bold text-[var(--ink)]">{hoveredMonth.month}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ৳{hoveredMonth.revenue.toLocaleString()}
              </span>
              <span className="text-[var(--sub)]">
                ({hoveredMonth.bookings} bookings · +{hoveredMonth.newUsers} users)
              </span>
            </div>
          ) : (
            <div className="text-xs text-[var(--sub)] font-medium">
              This Month: <strong>৳{(summary?.monthlyRevenue ?? 0).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Visual 12-Month Bar Chart */}
        <div className="pt-4">
          <div className="h-44 w-full flex items-end gap-2 sm:gap-4 px-2">
            {yearlyChart.map((m, idx) => {
              const heightPercent = Math.max(
                4,
                Math.round((m.revenue / maxMonthRevenue) * 100),
              );

              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: Chart index
                  key={idx}
                  onMouseEnter={() => setHoveredMonth(m)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="flex-1 flex flex-col items-center gap-1 group cursor-pointer h-full justify-end"
                >
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        m.revenue > 0
                          ? 'bg-purple-600 group-hover:bg-cyan-400 shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--sub)] group-hover:text-[var(--ink)] group-hover:font-bold">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 2-Column: User Demographics & Breakdown (4 cols) + Recent Financial Transactions (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: User Demographics & Bookings */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Roles */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuUsers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              User Demographics
            </h2>

            <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-5 shadow-sm space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <LuCar className="w-3.5 h-3.5" />
                  <span>Drivers</span>
                </span>
                <span className="font-mono font-bold text-[var(--ink)]">{userStats?.drivers ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <LuBuilding2 className="w-3.5 h-3.5" />
                  <span>Managers</span>
                </span>
                <span className="font-mono font-bold text-[var(--ink)]">{userStats?.managers ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <LuShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrators</span>
                </span>
                <span className="font-mono font-bold text-[var(--ink)]">{userStats?.admins ?? 0}</span>
              </div>
              <div className="pt-2 border-t border-[var(--line)] flex justify-between items-center text-xs text-[var(--sub)]">
                <span>New This Month:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{userStats?.newUsersThisMonth ?? 0} accounts
                </span>
              </div>
            </div>
          </div>

          {/* Booking Breakdown */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuInbox className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Platform Bookings Status
            </h2>

            <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] p-5 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Confirmed
                </span>
                <span className="font-bold text-[var(--ink)]">{bookingStats?.CONFIRMED ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Completed
                </span>
                <span className="font-bold text-[var(--ink)]">{bookingStats?.COMPLETED ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Pending
                </span>
                <span className="font-bold text-[var(--ink)]">{bookingStats?.PENDING ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Cancelled
                </span>
                <span className="font-bold text-[var(--ink)]">{bookingStats?.CANCELLED ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transactions Table */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <LuShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Recent Payment Transactions (SSLCommerz)
            </h2>
            <Link
              href="/dashboard/manager-bookings"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View Audit</span>
              <LuArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-[var(--card)] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center space-y-2 text-xs text-[var(--sub)]">
                <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading transactions audit...</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--sub)]">
                No recent transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg)]/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--ink)]">
                          {tx.user?.name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-[var(--sub)]">({tx.user?.email})</span>
                      </div>
                      <p className="text-[11px] text-[var(--sub)] flex items-center gap-2">
                        <span>Facility: <strong>{tx.booking?.garage?.name || 'Smart Garage'}</strong></span>
                        {tx.booking?.vehicleNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Plate: {tx.booking.vehicleNumber}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          ৳{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[var(--sub)]">
                          {new Date(tx.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : tx.status === 'REFUNDED'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
