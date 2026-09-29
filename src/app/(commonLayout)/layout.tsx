import Link from 'next/link';
import type React from 'react';
import Navbar from '@/components/Navbar';

export default function CommonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Dynamic Navbar matching reference design */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] bg-[var(--card)] py-8 text-center text-sm text-[var(--sub)]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="brand-logo !p-0 !text-[var(--ink)] text-sm">
            <span className="dot" /> ParkWise System
          </div>
          <p>© {new Date().getFullYear()} ParkWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
