'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import Container from '@/components/Container';
import { AuthService } from '@/services/auth';
import { GarageService, type IGarage } from '@/services/garage';
import Alert from '@/utils/alert';
import { clearAuthSession, getAuthToken, getAuthUser } from '@/utils/cookie';

interface IUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // Authentication State
  const [user, setUser] = useState<IUser | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Search State - Empty by default on page load/refresh
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // Live Search Dropdown State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<IGarage[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerMobileRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean search input and reset query on refresh/mount
  useEffect(() => {
    setSearchTerm('');
    setMaxPrice('');
    setOnlyAvailable(false);
    if (typeof window !== 'undefined' && window.location.search) {
      router.replace(window.location.pathname);
    }
  }, [router]);

  // Check login state
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const authUser = getAuthUser();
      setUser(authUser);
    } else {
      setUser(null);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedInsideDesktop = searchContainerRef.current?.contains(event.target as Node);
      const clickedInsideMobile = searchContainerMobileRef.current?.contains(event.target as Node);

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsSearchOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results from backend API: /api/v1/garages
  const performSearch = async (term: string, priceLimit?: string, availableFilter?: boolean) => {
    setIsLoadingSearch(true);
    try {
      const params: Record<string, any> = {
        limit: 8,
      };

      if (term.trim()) {
        params.searchTerm = term.trim();
      }
      if (priceLimit) {
        params.maxPrice = Number(priceLimit);
      }
      if (availableFilter) {
        params.onlyAvailable = true;
      }

      const res = await GarageService.getAllGarages(params);
      if (res?.data) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to search garages:', err);
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Debounced input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearchOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(value, maxPrice, onlyAvailable);
    }, 280);
  };

  // Submit search
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchOpen(false);

    const queryParams = new URLSearchParams();
    if (searchTerm.trim()) queryParams.set('searchTerm', searchTerm.trim());
    if (maxPrice) queryParams.set('maxPrice', maxPrice);
    if (onlyAvailable) queryParams.set('onlyAvailable', 'true');

    const targetUrl = `/?${queryParams.toString()}`;
    router.push(targetUrl);
  };

  // Handle Logout
  const handleLogout = async () => {
    const confirmed = await Alert.confirm({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out from ParkWise?',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setLoggingOut(true);
    try {
      await AuthService.logout();
    } catch (_err) {
      console.error('Logout error:', _err);
    } finally {
      clearAuthSession();
      setUser(null);
      setIsProfileOpen(false);
      setLoggingOut(false);
      router.push('/login');
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const renderSearchBar = (isMobile: boolean = false) => (
    <div
      ref={isMobile ? searchContainerMobileRef : searchContainerRef}
      className={`relative ${
        isMobile
          ? 'w-full block md:hidden'
          : 'hidden md:block flex-1 max-w-2xl lg:max-w-3xl mx-4 lg:mx-8'
      }`}
    >
      <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchInputChange}
          onFocus={() => {
            setIsSearchOpen(true);
            if (searchResults.length === 0) {
              performSearch(searchTerm, maxPrice, onlyAvailable);
            }
          }}
          placeholder="Search for parking garages, areas (e.g. Dhanmondi, Gulshan)..."
          className="w-full h-11 sm:h-12 pl-4 sm:pl-5 pr-14 sm:pr-16 text-xs sm:text-sm text-zinc-900 bg-white rounded-md border-0 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-zinc-400 font-medium transition-all"
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              if (typeof window !== 'undefined' && window.location.search) {
                router.replace(pathname || '/');
              }
              performSearch('', maxPrice, onlyAvailable);
            }}
            className="absolute right-12 sm:right-14 text-zinc-400 hover:text-zinc-600 p-1 text-sm cursor-pointer"
            title="Clear search"
          >
            ✕
          </button>
        )}

        {/* Embedded Search Icon Button */}
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1 bottom-1 w-10 sm:w-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </form>

      {/* Live Search Results Dropdown Overlay */}
      {isSearchOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white text-zinc-900 rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Active filters bar inside dropdown */}
          <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-zinc-600">
            <span className="font-semibold text-zinc-700">
              {isLoadingSearch
                ? 'Searching Garages...'
                : `${searchResults.length} Garage${searchResults.length === 1 ? '' : 's'} Found`}
            </span>
            <div className="flex items-center gap-2">
              {onlyAvailable && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  ● Only Available
                </span>
              )}
              {maxPrice && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Max ৳{maxPrice}/hr
                </span>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoadingSearch ? (
              <div className="p-6 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Fetching smart parking facilities...
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((garage) => (
                <button
                  type="button"
                  key={garage.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchTerm(garage.name);
                    const queryParams = new URLSearchParams();
                    queryParams.set('searchTerm', garage.name);
                    router.push(`/?${queryParams.toString()}`);
                  }}
                  className="w-full text-left p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-md bg-slate-200 overflow-hidden shrink-0 relative">
                      {garage.images && garage.images.length > 0 ? (
                        <Image
                          src={garage.images[0]}
                          alt={garage.name}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100">
                          🅿
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-700 truncate">
                        {garage.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{garage.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            garage.availableSlots > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {garage.availableSlots > 0
                            ? `${garage.availableSlots} slots free`
                            : 'Full'}
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                          ★ {garage.averageRating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-700 font-mono">
                      ৳{garage.pricePerHour}
                      <span className="text-[10px] font-normal text-zinc-400">/hr</span>
                    </div>
                    <span className="text-[10px] text-blue-600 group-hover:underline font-semibold mt-1 inline-block">
                      View Details →
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-zinc-500 text-xs">
                <p className="font-semibold text-zinc-700">No matching garages found</p>
                <p className="text-[11px] mt-1 text-zinc-400">
                  Try searching for Dhanmondi, Gulshan, Banani, or Uttara
                </p>
              </div>
            )}
          </div>

          {/* Quick Filters Footer in Dropdown */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = !onlyAvailable;
                  setOnlyAvailable(next);
                  performSearch(searchTerm, maxPrice, next);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  onlyAvailable
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-zinc-700 hover:bg-slate-100'
                }`}
              >
                {onlyAvailable ? '✓ Only Available' : '+ Available Only'}
              </button>

              <select
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  performSearch(searchTerm, e.target.value, onlyAvailable);
                }}
                className="bg-white border border-slate-200 text-zinc-700 text-[11px] px-2 py-1 rounded focus:outline-none cursor-pointer"
              >
                <option value="">Any Price</option>
                <option value="50">≤ ৳50/hr</option>
                <option value="100">≤ ৳100/hr</option>
                <option value="150">≤ ৳150/hr</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                const queryParams = new URLSearchParams();
                if (searchTerm) queryParams.set('searchTerm', searchTerm);
                if (maxPrice) queryParams.set('maxPrice', maxPrice);
                if (onlyAvailable) queryParams.set('onlyAvailable', 'true');
                router.push(`/?${queryParams.toString()}`);
              }}
              className="text-blue-600 font-bold hover:underline text-[11px] cursor-pointer ml-auto"
            >
              See All Results →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      {/* Main Navbar Row (Sidebar Color: var(--navy) #0f2a6b) */}
      <div className="bg-[#0f2a6b] text-white py-3 sm:py-4 transition-all">
        <Container className="flex flex-col gap-2.5 md:gap-0">
          {/* Top row: Brand Logo on Left, Desktop Search in Center, Profile on Right */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 w-full">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 text-white font-extrabold text-lg sm:text-2xl tracking-tight shrink-0 hover:opacity-95 transition-opacity"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-xs font-black text-sm sm:text-base">
                🅿
              </div>
              <div className="flex flex-col">
                <span className="leading-none text-base sm:text-xl font-bold flex items-center gap-1 sm:gap-1.5">
                  ParkWise
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-200 font-normal tracking-wide mt-0.5">
                  Smart Garage System
                </span>
              </div>
            </Link>

            {/* Centered Large Search Bar (Visible on Desktop / Tablets md+) */}
            {renderSearchBar(false)}

            {/* Right Side: Auth / Profile Button */}
            <div
              ref={profileDropdownRef}
              className="relative flex items-center gap-2 sm:gap-3 shrink-0"
            >
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-inner"
                title={user ? user.name : 'Account Profile'}
              >
                {user?.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || 'User Profile'}
                    width={44}
                    height={44}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : user ? (
                  <span className="font-bold text-sm sm:text-base text-white">{userInitial}</span>
                ) : (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white text-zinc-900 rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in duration-150">
                  {user ? (
                    <>
                      <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                        <div className="font-bold text-xs text-zinc-900 truncate">
                          {user.name || 'ParkWise User'}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                          {user.email}
                        </div>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                          {user.role || 'Driver'}
                        </span>
                      </div>

                      <div className="p-1.5 space-y-0.5 text-xs font-medium">
                        <Link
                          href="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 text-zinc-700 transition-colors"
                        >
                          <span>▤</span> Dashboard Overview
                        </Link>

                        {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                          <Link
                            href="/dashboard/garages"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 text-zinc-700 transition-colors"
                          >
                            <span>🅿</span> Manage Facilities
                          </Link>
                        )}

                        {user.role === 'ADMIN' && (
                          <Link
                            href="/dashboard/users"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 text-zinc-700 transition-colors"
                          >
                            <span>👤</span> User Management
                          </Link>
                        )}
                      </div>

                      <div className="p-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          {loggingOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 space-y-1 text-xs font-medium">
                      <div className="px-3 py-2 text-zinc-500 text-[11px] border-b border-slate-100">
                        Welcome to ParkWise
                      </div>
                      <Link
                        href="/login"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] text-white font-bold transition-colors"
                      >
                        Sign In / Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-zinc-700 font-semibold transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile 2nd Row: Full Width Search Bar (Visible only on < md) */}
          {renderSearchBar(true)}
        </Container>
      </div>
    </header>
  );
}
