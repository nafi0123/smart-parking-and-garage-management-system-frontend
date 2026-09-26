'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { AuthService } from '@/services/auth';

interface IUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Sync cookie in case of fresh load
    document.cookie = `accessToken=${token}; path=/; max-age=2592000; SameSite=Lax`;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (_err) {
      // ignore
    }
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // 1. Call Backend logout API to clear server cookies
      await AuthService.logout();
    } catch (_err) {
      console.error('Logout error:', _err);
    } finally {
      // 2. Clear client cookies and storage
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // 3. Redirect to login page
      router.push('/login');
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
          <Link href="/dashboard" className="active">
            <span>▤</span> Overview
          </Link>
          <Link href="#">
            <span>🅿</span> Parking Zones
          </Link>
          <Link href="#">
            <span>🚗</span> Active Vehicles
          </Link>
          <Link href="#">
            <span>💳</span> Payments
          </Link>

          <div className="nav-grp">Settings</div>
          <Link href="#">
            <span>👤</span> Users
          </Link>
          <Link href="#">
            <span>⚙</span> Configuration
          </Link>
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
        <div className="topbar">
          <div>
            <h1>Overview</h1>
            <p>Central Plaza Parking — Live Status</p>
          </div>
          <div className="tb-right">
            <input
              type="search"
              placeholder="🔍 Search slot or vehicle plate..."
              className="search-input"
            />

            {/* Topbar User Profile & Logout Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--line)] rounded-xl py-1.5 px-3">
                <div className="avatar !w-7 !h-7 !text-xs" title={user?.email || 'User'}>
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold leading-tight">
                    {user?.name || 'Authorized User'}
                  </div>
                  <div className="text-[10px] text-[var(--sub)] capitalize">
                    {user?.role?.toLowerCase() || 'Driver'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Logout"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/50 transition-colors cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Logout"
                >
                  <title>Logout</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">{loggingOut ? 'Exiting...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
