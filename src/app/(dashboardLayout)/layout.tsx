'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { AuthService } from '@/services/auth';
import Alert from '@/utils/alert';
import { clearAuthSession, getAuthToken, getAuthUser } from '@/utils/cookie';

interface IUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<IUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const authUser = getAuthUser();
    if (authUser) {
      setUser(authUser);
    }
  }, [router]);

  // Real-time Clock with seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogout() {
    const confirmed = await Alert.confirm({
      title: 'Sign Out Confirmation',
      text: 'Are you sure you want to log out from your ParkWise account?',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Stay Logged In',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setLoggingOut(true);
    try {
      // 1. Call Backend logout API to clear server cookies
      await AuthService.logout();
    } catch (_err) {
      console.error('Logout error:', _err);
    } finally {
      // 2. Clear client cookies
      clearAuthSession();
      // 3. Redirect to login page
      router.replace('/login');
    }
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-side">
        <Link href="/" className="brand-logo">
          <span className="dot" /> ParkWise
        </Link>

        <nav className="side-nav">
          <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
            <span>▤</span> Overview
          </Link>

          {/* Reservations & Bookings (All Roles) */}
          <Link
            href="/dashboard/my-bookings"
            className={
              pathname.startsWith('/dashboard/my-bookings') ||
              pathname.startsWith('/dashboard/bookings')
                ? 'active'
                : ''
            }
          >
            <span>📋</span> My Bookings
          </Link>

          {/* Admin & Manager: Incoming Garage Bookings */}
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <Link
              href="/dashboard/manager-bookings"
              className={pathname.startsWith('/dashboard/manager-bookings') ? 'active' : ''}
            >
              <span>📥</span> Manager Bookings
            </Link>
          )}

          {/* Admin & Manager: Garage Facility Management */}
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <Link
              href="/dashboard/garages"
              className={pathname.startsWith('/dashboard/garages') ? 'active' : ''}
            >
              <span>🅿</span> {user?.role === 'MANAGER' ? 'My Garages' : 'Parking Zones'}
            </Link>
          )}

          {/* Admin Only: System & User Management */}
          {user?.role === 'ADMIN' && (
            <Link
              href="/dashboard/users"
              className={pathname === '/dashboard/users' ? 'active' : ''}
            >
              <span>👤</span> Users
            </Link>
          )}
        </nav>

        {/* Sidebar Footer with Logout & Status */}
        <div className="side-foot flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-emerald-400 text-xs">● Sensor Sync Active</div>
              <div className="text-zinc-400 text-[11px] mt-0.5">Live status online</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 font-medium text-xs transition-colors border border-red-500/20 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Logout icon"
            >
              <title>Logout</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {loggingOut ? 'Logging out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="main-content">
        {/* Modern Top Navbar */}
        <div className="bg-[var(--card)] border border-[var(--line)] shadow-sm rounded-lg p-3.5 sm:px-5 mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--ink)] tracking-tight">
              {pathname === '/dashboard/users'
                ? 'User Management'
                : pathname.startsWith('/dashboard/manager-bookings')
                ? 'Incoming Garage Bookings'
                : pathname.startsWith('/dashboard/my-bookings') ||
                  pathname.startsWith('/dashboard/bookings')
                ? 'My Reservations & Bookings'
                : pathname.startsWith('/dashboard/garages')
                  ? 'Garage & Facility Management'
                  : 'Overview'}
            </h1>
            <p className="text-xs text-[var(--sub)] mt-0.5">
              {pathname === '/dashboard/users'
                ? 'Central Parking Network — Registered Users & Access Control'
                : pathname.startsWith('/dashboard/manager-bookings')
                ? 'Central Parking Network — Driver Parking Sessions & Slot Control'
                : pathname.startsWith('/dashboard/my-bookings') ||
                  pathname.startsWith('/dashboard/bookings')
                ? 'Central Parking Network — Spot Reservations, SSLCommerz Payments & Invoices'
                : pathname.startsWith('/dashboard/garages')
                  ? 'Central Parking Network — Registered Facilities, Slots & Rates'
                  : 'Central Plaza Parking — Live Status'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Clock with Seconds */}
            {currentTime && (
              <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-md py-1.5 px-3 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-mono font-bold text-xs text-[var(--ink)] leading-tight tracking-wider">
                    {currentTime}
                  </span>
                  <span className="text-[10px] text-[var(--sub)] font-medium leading-none mt-0.5">
                    {currentDate}
                  </span>
                </div>
              </div>
            )}

            {/* Topbar User Profile */}
            <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-md py-1.5 px-2.5 shadow-xs">
              <div
                className="avatar !w-6 !h-6 !text-[11px] font-bold"
                title={user?.email || 'User'}
              >
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold leading-tight text-[var(--ink)]">
                  {user?.name || 'Authorized User'}
                </div>
                <div className="text-[10px] text-[var(--sub)] capitalize font-medium">
                  {user?.role?.toLowerCase() || 'Driver'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
