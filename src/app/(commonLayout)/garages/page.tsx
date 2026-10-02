'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  FaCompass,
  FaHeart,
  FaLocationCrosshairs,
  FaLocationDot,
  FaRegHeart,
  FaStar,
} from 'react-icons/fa6';
import Container from '@/components/Container';
import { FavoriteService } from '@/services/favorite';
import { GarageService, type IGetAllGaragesParams } from '@/services/garage';
import Alert from '@/utils/alert';
import { getAuthToken } from '@/utils/cookie';

const POPULAR_ZONES = [
  'All Zones',
  'Dhanmondi',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mirpur',
  'Motijheel',
  'Mohakhali',
];

const RADIUS_PRESETS = [
  { label: '≤ 2 km', value: 2 },
  { label: '≤ 5 km', value: 5 },
  { label: '≤ 10 km', value: 10 },
  { label: '≤ 20 km', value: 20 },
];

const PRICE_PRESETS = [
  { label: 'Any', value: '' },
  { label: '≤ ৳40', value: '40' },
  { label: '≤ ৳60', value: '60' },
  { label: '≤ ৳80', value: '80' },
  { label: '≤ ৳100', value: '100' },
];

const RATING_OPTIONS = [
  { label: 'All Ratings', value: '' },
  { label: '★ 4.5 & above', value: '4.5' },
  { label: '★ 4.0 & above', value: '4.0' },
  { label: '★ 3.5 & above', value: '3.5' },
];

function GaragesPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  // URL search query initial values
  const urlSearchTerm = searchParams?.get('searchTerm') || '';
  const urlMaxPrice = searchParams?.get('maxPrice') || '';
  const urlOnlyAvailable = searchParams?.get('onlyAvailable') === 'true';

  // Filter States
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [maxPrice, setMaxPrice] = useState<string>(urlMaxPrice);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(urlOnlyAvailable);
  const [minRating, setMinRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Live GPS Nearby Mode State
  const [isNearbyActive, setIsNearbyActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [nearbyRadius, setNearbyRadius] = useState<number>(10);
  const [isLocating, setIsLocating] = useState(false);

  // Mobile sidebar visibility
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Check auth state
  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  // Sync state when URL searchParams change
  useEffect(() => {
    if (urlSearchTerm) setSearchTerm(urlSearchTerm);
    if (urlMaxPrice) setMaxPrice(urlMaxPrice);
    if (urlOnlyAvailable) setOnlyAvailable(true);
  }, [urlSearchTerm, urlMaxPrice, urlOnlyAvailable]);

  // Request browser GPS location
  const handleLocateMe = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      Alert.error('Geolocation Unsupported', 'Your browser does not support GPS location.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setIsNearbyActive(true);
        setIsLocating(false);
        setCurrentPage(1);
        Alert.toastSuccess('GPS Location acquired! Showing nearest parking garages.');
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        Alert.info(
          'Location Permission Needed',
          'Please allow location permission in your browser to find parking spots near you.',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handleExitNearby = () => {
    setIsNearbyActive(false);
    setUserCoords(null);
    setCurrentPage(1);
  };

  // Query user favorites when logged in
  const { data: favoritesResponse } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => FavoriteService.getMyFavorites(),
    enabled: isLoggedIn,
  });

  const favoritedGarageIds = useMemo(() => {
    const set = new Set<string>();
    if (favoritesResponse?.data) {
      for (const fav of favoritesResponse.data) {
        set.add(fav.id);
      }
    }
    return set;
  }, [favoritesResponse]);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (garageId: string) => FavoriteService.toggleFavorite(garageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check'] });
      Alert.toastSuccess(data?.message || 'Favorites updated');
    },
    onError: (err: any) => {
      Alert.error('Error', err?.response?.data?.message || 'Failed to update favorite');
    },
  });

  // Construct query params (24 items per page) for standard search
  const queryParams: IGetAllGaragesParams = {
    page: currentPage,
    limit: 24,
    sortBy,
    sortOrder,
  };

  const effectiveSearch = searchTerm.trim() || (selectedZone !== 'All Zones' ? selectedZone : '');
  if (effectiveSearch) {
    queryParams.searchTerm = effectiveSearch;
  }

  if (maxPrice && !Number.isNaN(Number(maxPrice))) {
    queryParams.minPrice = Number(maxPrice);
  }

  if (onlyAvailable) {
    queryParams.onlyAvailable = true;
  }

  if (minRating && !Number.isNaN(Number(minRating))) {
    queryParams.minRating = Number(minRating);
  }

  // TanStack Query for caching, automatic background refetch, and seamless pagination
  const {
    data: garagesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey:
      isNearbyActive && userCoords
        ? [
            'garages-nearby',
            userCoords.latitude,
            userCoords.longitude,
            nearbyRadius,
            maxPrice,
            onlyAvailable,
            minRating,
          ]
        : ['garages', queryParams],
    queryFn: async () => {
      if (isNearbyActive && userCoords) {
        return GarageService.getNearbyGarages({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          radius: nearbyRadius,
          minPrice: maxPrice ? Number(maxPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          onlyAvailable: onlyAvailable ? true : undefined,
          minRating: minRating ? Number(minRating) : undefined,
          limit: 50,
        });
      }
      return GarageService.getAllGarages(queryParams);
    },
    placeholderData: (previousData) => previousData,
  });

  const garages = garagesResponse?.data || [];
  const totalCount = garagesResponse?.meta?.total ?? garages.length;
  const totalPages = isNearbyActive ? 1 : (garagesResponse?.meta?.totalPage ?? 1);

  // Active filters count for badge
  const activeFiltersCount = [
    isNearbyActive,
    searchTerm.trim(),
    selectedZone !== 'All Zones',
    maxPrice,
    onlyAvailable,
    minRating,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedZone('All Zones');
    setMaxPrice('');
    setOnlyAvailable(false);
    setMinRating('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setIsNearbyActive(false);
    setUserCoords(null);
    setCurrentPage(1);
  };

  const handleZoneClick = (zone: string) => {
    setSelectedZone(zone);
    if (zone === 'All Zones') {
      setSearchTerm('');
    } else {
      setSearchTerm(zone);
    }
    setCurrentPage(1);
  };

  return (
    <div className="py-6 sm:py-10 bg-[var(--bg)] min-h-[85vh]">
      <Container>
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-5 border-b border-[var(--line)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live Telemetry Smart Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              Explore Parking Garages
            </h1>
            <p className="text-xs sm:text-sm text-[var(--sub)] max-w-2xl">
              Filter by GPS proximity, city zone, price, live bay availability, and user rating.
              Click anywhere on a card to view live occupancy and book.
            </p>
          </div>

          {/* Quick Action & Counter Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick GPS Near Me Header Button */}
            {!isNearbyActive ? (
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0f2a6b] hover:bg-[#1e40af] text-white px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Locating GPS...</span>
                  </>
                ) : (
                  <>
                    <FaLocationCrosshairs className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Find Near Me</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExitNearby}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3.5 py-2 text-xs font-semibold shadow-2xs hover:bg-emerald-500/25 transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>GPS Radar Active (≤ {nearbyRadius}km) · ✕ Exit</span>
              </button>
            )}

            <div className="rounded-md border border-[var(--line)] bg-[var(--card)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] shadow-2xs">
              <span className="text-[var(--sub)]">Showing: </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{totalCount}</span>{' '}
              Garages
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle Button (< lg) */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-md border border-[var(--line)] bg-[var(--card)] text-xs font-semibold text-[var(--ink)] shadow-2xs hover:bg-[var(--bg)] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>⚡ Filters & Search</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#0f2a6b] text-white text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </span>
            <span>{isMobileFilterOpen ? '▲ Hide Filters' : '▼ Show Filters'}</span>
          </button>
        </div>

        {/* 2-Column Main Layout: Left Filter Sidebar (3 Cols) + Right Cards Grid (9 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT FILTER SIDEBAR ================= */}
          <aside
            className={`lg:col-span-3 lg:block ${
              isMobileFilterOpen ? 'block' : 'hidden'
            } space-y-5 rounded-md border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xs sticky top-20`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--ink)]">Filter Garages</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 text-[10px] font-bold">
                    {activeFiltersCount} Active
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* 1. Live GPS Radar Box (Nearby Me) */}
            <div
              className={`p-3.5 rounded-md border transition-all ${
                isNearbyActive
                  ? 'bg-blue-500/10 border-blue-500/40 shadow-xs'
                  : 'bg-[var(--bg)]/80 border-[var(--line)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <FaLocationCrosshairs
                    className={`w-3.5 h-3.5 ${
                      isNearbyActive
                        ? 'text-blue-600 dark:text-blue-400 animate-spin'
                        : 'text-slate-400'
                    }`}
                  />
                  Live GPS Radar
                </span>
                {isNearbyActive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Nearby Active
                  </span>
                )}
              </div>

              {!isNearbyActive ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[var(--sub)]">
                    Use your live GPS coordinates to locate the closest available smart garages
                    within your chosen radius.
                  </p>
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-[#0f2a6b] hover:bg-[#1e40af] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Acquiring GPS...</span>
                      </>
                    ) : (
                      <>
                        <FaCompass className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Find Parking Near Me</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--sub)] font-medium">Search Radius:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      ≤ {nearbyRadius} km
                    </span>
                  </div>

                  {/* Radius Preset Chips */}
                  <div className="grid grid-cols-4 gap-1">
                    {RADIUS_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setNearbyRadius(preset.value);
                          setCurrentPage(1);
                        }}
                        className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer text-center ${
                          nearbyRadius === preset.value
                            ? 'bg-[#0f2a6b] text-white shadow-xs'
                            : 'border border-[var(--line)] bg-[var(--card)] text-[var(--sub)] hover:text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Radius Slider */}
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={nearbyRadius}
                    onChange={(e) => {
                      setNearbyRadius(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-[#0f2a6b] cursor-pointer"
                  />

                  {/* GPS Coordinates readout */}
                  {userCoords && (
                    <div className="text-[10px] text-[var(--sub)] flex items-center justify-between font-mono bg-[var(--card)] px-2 py-1 rounded border border-[var(--line)]">
                      <span>Lat: {userCoords.latitude.toFixed(4)}</span>
                      <span>Lon: {userCoords.longitude.toFixed(4)}</span>
                    </div>
                  )}

                  {/* Exit GPS Radar Button */}
                  <button
                    type="button"
                    onClick={handleExitNearby}
                    className="w-full py-1.5 rounded text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    ✕ Exit GPS Radar Mode
                  </button>
                </div>
              )}
            </div>

            {/* 2. Keyword / Location Search Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-search"
                className="text-xs font-semibold text-[var(--ink)] block"
              >
                Search by Name or Area
              </label>
              <div className="relative">
                <input
                  id="filter-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="e.g. Dhanmondi, Gulshan, Arena..."
                  className="w-full rounded border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--sub)] focus:border-blue-500 focus:outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedZone('All Zones');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 3. Availability Toggle */}
            <div className="space-y-2 pt-2 border-t border-[var(--line)]">
              <span className="text-xs font-semibold text-[var(--ink)] block">
                Live Bay Availability
              </span>
              <label className="flex items-center gap-2.5 p-2 rounded border border-[var(--line)] bg-[var(--bg)]/60 cursor-pointer hover:bg-[var(--bg)] transition-colors">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => {
                    setOnlyAvailable(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-[var(--ink)] block">Show Available Only</span>
                  <span className="text-[10px] text-[var(--sub)]">Hide full garages</span>
                </div>
              </label>
            </div>

            {/* 4. Popular City Zones / Areas */}
            <div className="space-y-2 pt-2 border-t border-[var(--line)]">
              <span className="text-xs font-semibold text-[var(--ink)] block">
                Popular City Hubs
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ZONES.map((zone) => {
                  const isSelected =
                    (zone === 'All Zones' && !searchTerm && selectedZone === 'All Zones') ||
                    searchTerm.toLowerCase() === zone.toLowerCase() ||
                    selectedZone === zone;

                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => handleZoneClick(zone)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0f2a6b] text-white shadow-xs font-semibold'
                          : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--sub)] hover:text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {zone}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Maximum Hourly Tariff Filter */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--line)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink)]">Max Tariff / Hour</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {maxPrice ? `≤ ৳${maxPrice}/hr` : 'Any Price'}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={maxPrice || '150'}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full accent-[#0f2a6b] cursor-pointer"
              />

              {/* Quick Price Preset Chips */}
              <div className="flex flex-wrap gap-1">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMaxPrice(preset.value);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                      maxPrice === preset.value
                        ? 'bg-blue-600 text-white font-bold'
                        : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--sub)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Driver Rating Filter */}
            <div className="space-y-2 pt-2 border-t border-[var(--line)]">
              <span className="text-xs font-semibold text-[var(--ink)] block">
                Minimum Driver Rating
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setMinRating(opt.value);
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors cursor-pointer text-center ${
                      minRating === opt.value
                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                        : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--sub)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button on bottom */}
            <div className="pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full rounded border border-[var(--line)] bg-[var(--bg)] py-2 text-xs font-semibold text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </aside>

          {/* ================= RIGHT GARAGES CONTENT AREA ================= */}
          <main className="lg:col-span-9 space-y-6">
            {/* GPS Nearby Banner Alert if Active */}
            {isNearbyActive && (
              <div className="p-3.5 rounded-md bg-gradient-to-r from-blue-900/30 via-blue-800/20 to-cyan-900/30 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--ink)] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-500 dark:text-blue-400">
                    <FaLocationCrosshairs className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <span>Live GPS Proximity Radar Active</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </p>
                    <p className="text-[11px] text-[var(--sub)]">
                      Showing parking facilities within <strong>{nearbyRadius} km</strong> of your
                      coordinates, sorted from nearest to furthest.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={nearbyRadius}
                    onChange={(e) => {
                      setNearbyRadius(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-[var(--card)] border border-[var(--line)] text-[var(--ink)] text-xs font-semibold rounded px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value={2}>Radius: ≤ 2 km</option>
                    <option value={5}>Radius: ≤ 5 km</option>
                    <option value={10}>Radius: ≤ 10 km</option>
                    <option value={20}>Radius: ≤ 20 km</option>
                    <option value={30}>Radius: ≤ 30 km</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExitNearby}
                    className="rounded bg-[var(--card)] border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    ✕ Exit
                  </button>
                </div>
              </div>
            )}

            {/* Top Sort & Results Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border border-[var(--line)] bg-[var(--card)] shadow-2xs">
              <div className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <span>📍 Available Parking Hubs</span>
                <span className="text-[var(--sub)] font-normal">
                  ({totalCount} {totalCount === 1 ? 'facility' : 'facilities'}{' '}
                  {isNearbyActive ? 'within radius' : 'found'})
                </span>
              </div>

              {/* Sort Dropdown / Info */}
              {!isNearbyActive ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--sub)] shrink-0">Sort By:</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sb, so] = e.target.value.split('-');
                      setSortBy(sb);
                      setSortOrder(so as 'asc' | 'desc');
                      setCurrentPage(1);
                    }}
                    className="bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-medium rounded px-2.5 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="createdAt-desc">Newest Added</option>
                    <option value="pricePerHour-asc">Price: Low to High</option>
                    <option value="pricePerHour-desc">Price: High to Low</option>
                    <option value="availableSlots-desc">Most Available Slots</option>
                    <option value="averageRating-desc">Highest Rated</option>
                  </select>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded">
                  <span>🧭 Order:</span>
                  <span className="font-bold">Closest Distance First</span>
                </div>
              )}
            </div>

            {/* Loading Skeletons */}
            {isLoading && garages.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder
                    key={i}
                    className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 shadow-xs animate-pulse space-y-3"
                  >
                    <div className="h-44 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              /* Error State */
              <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {(error as any)?.message || 'Failed to load smart garages. Please try again.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-md bg-[#0f2a6b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e40af] transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : garages.length === 0 ? (
              /* Empty State */
              <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-12 text-center space-y-3 shadow-xs">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xl font-bold">
                  {isNearbyActive ? '📍' : '🅿'}
                </div>
                <h3 className="text-base font-bold text-[var(--ink)]">
                  {isNearbyActive
                    ? `No Garages Found within ${nearbyRadius} km`
                    : 'No Garages Found'}
                </h3>
                <p className="text-xs text-[var(--sub)] max-w-sm mx-auto">
                  {isNearbyActive
                    ? `We couldn't find any parking facilities within ${nearbyRadius} km of your GPS location. Try increasing the search radius to 20 km or 30 km.`
                    : "We couldn't find any smart garages matching your selected filters or search criteria."}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  {isNearbyActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setNearbyRadius(20)}
                        className="rounded-md bg-[#0f2a6b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e40af] transition-colors cursor-pointer"
                      >
                        Expand to 20 km
                      </button>
                      <button
                        type="button"
                        onClick={handleExitNearby}
                        className="rounded-md border border-[var(--line)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                      >
                        Browse All Garages
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="rounded-md bg-[#0f2a6b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e40af] transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* 100% Clickable Garage Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {garages.map((garage) => {
                  const isAvailable = garage.availableSlots > 0;
                  const isFavorited = favoritedGarageIds.has(garage.id);
                  const occupancyPercent =
                    garage.totalSlots > 0
                      ? Math.round(
                          ((garage.totalSlots - garage.availableSlots) / garage.totalSlots) * 100,
                        )
                      : 0;

                  return (
                    /* Entire Card is a Link navigating to /garages/[id] */
                    <Link
                      key={garage.id}
                      href={`/garages/${garage.id}`}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-md border border-[var(--line)] bg-[var(--card)] shadow-xs transition-all duration-200 hover:shadow-md hover:border-blue-500/50 cursor-pointer block"
                    >
                      {/* Top Thumbnail Image */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                        {garage.images && garage.images.length > 0 ? (
                          <Image
                            src={garage.images[0]}
                            alt={garage.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-500">
                            <span className="text-3xl font-black">🅿</span>
                          </div>
                        )}

                        {/* Dark gradient shadow on image bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                        {/* Live Availability Status Pill on Top Left */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                              isAvailable
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                              }`}
                            />
                            {isAvailable ? `${garage.availableSlots} Slots Free` : 'Full'}
                          </span>

                          {/* Distance Badge on Card Top Left if Available */}
                          {garage.distanceKm !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-950/90 text-cyan-300 border border-cyan-400/50 px-2 py-0.5 text-[10px] font-bold backdrop-blur-md shadow-xs">
                              <FaLocationCrosshairs className="w-2.5 h-2.5 text-cyan-300" />
                              {garage.distanceKm < 1
                                ? `${Math.round(garage.distanceKm * 1000)}m away`
                                : `${garage.distanceKm.toFixed(1)} km away`}
                            </span>
                          )}
                        </div>

                        {/* Heart Bookmark Button on Top Right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isLoggedIn) {
                              Alert.info(
                                'Sign In Required',
                                'Please sign in to save garages to your favorites dashboard.',
                              );
                              return;
                            }
                            toggleFavoriteMutation.mutate(garage.id);
                          }}
                          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 border cursor-pointer ${
                            isFavorited
                              ? 'bg-red-500 text-white border-red-400 shadow-md scale-105'
                              : 'bg-black/50 text-white hover:bg-red-500/80 hover:text-white border-white/20'
                          }`}
                          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {isFavorited ? (
                            <FaHeart className="w-4 h-4 text-white animate-in zoom-in-75" />
                          ) : (
                            <FaRegHeart className="w-4 h-4" />
                          )}
                        </button>

                        {/* Rating & Location on Bottom Left */}
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                          <div className="rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-amber-300 flex items-center gap-1 border border-white/10">
                            <span>★</span>
                            <span>{garage.averageRating?.toFixed(1) || '5.0'}</span>
                          </div>

                          {garage.location && (
                            <span className="rounded bg-black/50 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-slate-200">
                              📍 {garage.location}
                            </span>
                          )}
                        </div>

                        {/* Price Tag Overlay on Bottom Right */}
                        <div className="absolute bottom-2.5 right-2.5 text-right">
                          <div className="rounded bg-[#0f2a6b]/90 backdrop-blur-md px-2.5 py-1 text-white border border-blue-400/30">
                            <span className="text-sm font-extrabold font-mono text-cyan-300">
                              ৳{garage.pricePerHour}
                            </span>
                            <span className="text-[10px] text-blue-200">/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-[var(--ink)] line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {garage.name}
                          </h3>
                          <p className="text-[11px] text-[var(--sub)] line-clamp-1 flex items-center gap-1">
                            <span>📌</span>
                            <span className="truncate">{garage.address}</span>
                          </p>
                        </div>

                        {/* Capacity Occupancy Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[var(--sub)] font-medium">
                            <span>Occupancy</span>
                            <span className="font-semibold text-[var(--ink)]">
                              {garage.totalSlots - garage.availableSlots} / {garage.totalSlots}{' '}
                              slots
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                occupancyPercent > 80
                                  ? 'bg-rose-500'
                                  : occupancyPercent > 50
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Button Element inside the Clickable Card */}
                        <div className="pt-2 border-t border-[var(--line)]">
                          <div
                            className={`w-full flex items-center justify-center gap-1.5 rounded px-3.5 py-2.5 text-xs font-semibold text-white transition-all text-center shadow-xs ${
                              isAvailable
                                ? 'bg-[#0f2a6b] group-hover:bg-[#1e40af] group-active:scale-[0.98]'
                                : 'bg-rose-800/80 text-rose-200 border border-rose-700/50'
                            }`}
                          >
                            <span>
                              {isAvailable ? 'View Details & Book' : 'Fully Occupied (0 Free)'}
                            </span>
                            <span className="text-xs transition-transform group-hover:translate-x-1">
                              →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Enhanced Pagination Controls (24 items/page) - Hidden in Nearby Mode */}
            {!isNearbyActive && totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--line)]">
                <div className="text-xs text-[var(--sub)]">
                  Showing{' '}
                  <span className="font-bold text-[var(--ink)]">
                    {(currentPage - 1) * 24 + 1}–{Math.min(currentPage * 24, totalCount)}
                  </span>{' '}
                  of <span className="font-bold text-[var(--ink)]">{totalCount}</span> garages
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer"
                  >
                    ← Prev
                  </button>

                  {/* Page number buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`min-w-[32px] h-8 rounded text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#0f2a6b] text-white shadow-xs'
                          : 'border border-[var(--line)] bg-[var(--card)] text-[var(--sub)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}

export default function GaragesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 bg-[var(--bg)] min-h-[80vh]">
          <Container>
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 h-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
                    key={i}
                    className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 space-y-3 animate-pulse"
                  >
                    <div className="h-44 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </div>
      }
    >
      <GaragesPageContent />
    </Suspense>
  );
}
