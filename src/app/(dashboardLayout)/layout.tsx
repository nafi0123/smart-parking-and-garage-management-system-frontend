import Link from 'next/link';
import type React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

        <div className="side-foot">
          <div className="font-semibold text-emerald-400">● Sensor Sync Active</div>
          <div className="text-zinc-400 mt-1">Last updated: Just now</div>
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
            <div className="avatar" title="User Profile">
              P
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
