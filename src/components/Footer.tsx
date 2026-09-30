'use client';

import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import Container from '@/components/Container';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="border-t border-slate-800/80 bg-[#081534] text-slate-300">
      {/* Newsletter / Feature Banner on Top of Footer */}
      <div className="border-b border-slate-800/60 bg-[#0a1a3e]/60 py-8 sm:py-10">
        <Container>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live City Alerts
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Get Real-Time Parking & Tariff Updates
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Subscribe to receive vacancy notifications, peak-hour forecasts, and exclusive parking discounts.
              </p>
            </div>

            {/* Newsletter Form */}
            <form onSubmit={handleSubscribe} className="w-full md:w-auto flex-1 max-w-md">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  {subscribed ? 'Subscribed ✓' : 'Subscribe'}
                </button>
              </div>
              {subscribed && (
                <p className="text-[11px] text-emerald-400 mt-1.5 font-medium animate-in fade-in">
                  Thank you for subscribing to ParkWise alerts!
                </p>
              )}
            </form>
          </div>
        </Container>
      </div>

      {/* Main Footer Links Grid */}
      <div className="py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Column 1: Brand & Bio (Spans 2 cols on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 text-white font-extrabold text-xl tracking-tight"
              >
                <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white shadow-xs font-black text-sm">
                  🅿
                </div>
                <div className="flex flex-col">
                  <span className="leading-none text-lg font-bold flex items-center gap-1.5">
                    ParkWise
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                  <span className="text-[10px] text-blue-200 font-normal tracking-wide mt-0.5">
                    Smart Garage System
                  </span>
                </div>
              </Link>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                Next-generation IoT-powered smart parking and multi-level garage management system. Enabling instant space reservation, robotic automation, and real-time telemetry across city hubs.
              </p>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                All 42 City Garage Zones Online
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                {[
                  {
                    name: 'Twitter',
                    href: '#',
                    path: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
                  },
                  {
                    name: 'Facebook',
                    href: '#',
                    path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
                  },
                  {
                    name: 'LinkedIn',
                    href: '#',
                    path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z',
                  },
                  {
                    name: 'GitHub',
                    href: '#',
                    path: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Drivers & Parking
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href="/garages" className="hover:text-cyan-400 transition-colors">
                    Find Vacant Spots
                  </Link>
                </li>
                <li>
                  <Link href="/garages" className="hover:text-cyan-400 transition-colors">
                    Explore Garages
                  </Link>
                </li>
                <li>
                  <Link href="/garages?onlyAvailable=true" className="hover:text-cyan-400 transition-colors">
                    Available Parking Bays
                  </Link>
                </li>
                <li>
                  <Link href="/garages" className="hover:text-cyan-400 transition-colors">
                    Interactive Live Map
                  </Link>
                </li>
                <li>
                  <Link href="/garages?sortBy=pricePerHour&sortOrder=asc" className="hover:text-cyan-400 transition-colors">
                    Hourly & Daily Rates
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Garage Owners & Partners */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Facility Owners
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href="/dashboard/garages" className="hover:text-cyan-400 transition-colors">
                    List Your Facility
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
                    Garage Manager Portal
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-cyan-400 transition-colors">
                    IoT Hardware Setup
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-cyan-400 transition-colors">
                    Automated RFID Gates
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-cyan-400 transition-colors">
                    Partner Commercial API
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Help & Support */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Support & Legal
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href="/#faq" className="hover:text-cyan-400 transition-colors">
                    24/7 Helpline & FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/#terms" className="hover:text-cyan-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/#privacy" className="hover:text-cyan-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/#refund" className="hover:text-cyan-400 transition-colors">
                    Refund & Booking Policy
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="hover:text-cyan-400 transition-colors">
                    Emergency Assistance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar: Copyright & Security Standards */}
      <div className="border-t border-slate-800/80 bg-[#061028] py-5">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span>© {new Date().getFullYear()} ParkWise Technologies Inc.</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline">All Rights Reserved.</span>
            </div>

            {/* Security & Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-300">
                <svg className="h-3 w-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
                SSL 256-Bit Encrypted
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                IoT Sensor Telemetry
              </span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
