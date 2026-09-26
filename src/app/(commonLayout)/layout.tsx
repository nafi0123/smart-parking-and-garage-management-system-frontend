import Link from 'next/link';
import type React from 'react';

export default function CommonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Navbar */}
      <header className="border-b border-[var(--line)] bg-[var(--card)]/90 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="brand-logo !p-0 !text-[var(--ink)]">
            <span className="dot" /> ParkWise
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="hover:text-[var(--blue)] transition-colors">
              Home
            </Link>
            <Link href="/dashboard" className="hover:text-[var(--blue)] transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-[var(--blue)] transition-colors">
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-[var(--navy-2)] text-white font-semibold hover:bg-[var(--navy)] transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

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
