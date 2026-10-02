'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import TableSkeleton from '@/components/TableSkeleton';
import { FavoriteService, type IFavoriteGarageItem } from '@/services/favorite';
import Alert from '@/utils/alert';

// Custom Borderless SelectDropdown (Matching GarageTable.tsx 1:1)
interface IOption<T> {
  value: T;
  label: string;
}

function SelectDropdown<T extends string | number>({
  value,
  options,
  onChange,
  className = '',
  dropdownPosition = 'bottom',
}: {
  value: T;
  options: IOption<T>[];
  onChange: (val: T) => void;
  className?: string;
  dropdownPosition?: 'bottom' | 'top';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-[var(--card)] text-xs text-[var(--ink)] font-semibold border-0 outline-none focus:outline-none cursor-pointer transition-all shadow-2xs select-none hover:bg-[var(--bg)]"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--sub)] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            dropdownPosition === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } left-0 min-w-full w-max max-w-[240px] bg-[var(--card)] rounded-md shadow-xl border-0 py-1 z-50 flex flex-col gap-0.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold cursor-pointer border-0 outline-none flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#0f2a6b] text-white font-bold'
                    : 'text-[var(--ink)] hover:bg-[var(--bg)]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 ml-2 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const AVAILABILITY_OPTIONS = [
  { value: 'ALL', label: 'All Garages' },
  { value: 'AVAILABLE', label: 'Available Slots Only' },
];

const SORT_OPTIONS = [
  { value: 'favoritedAt-desc', label: 'Newest First' },
  { value: 'pricePerHour-asc', label: 'Price (Low to High)' },
  { value: 'pricePerHour-desc', label: 'Price (High to Low)' },
  { value: 'totalSlots-desc', label: 'Capacity (Largest)' },
  { value: 'averageRating-desc', label: 'Rating (Highest)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
];

const LIMIT_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

export interface IFavoriteTableProps {
  title?: string;
  subtitle?: string;
}

export default function FavoriteTable({
  title = 'My Favorite Garages',
  subtitle = 'Manage and quickly access your bookmarked parking facilities with live slot telemetry',
}: IFavoriteTableProps) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('favoritedAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [removingId, setRemovingId] = useState<string | null>(null);

  // TanStack Query for favorite garages
  const {
    data: favoritesResponse,
    isLoading,
    isFetching,
    refetch,
    error: queryError,
  } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => FavoriteService.getMyFavorites(),
  });

  const rawFavorites = (favoritesResponse?.data || []) as IFavoriteGarageItem[];

  // Mutation for toggling/removing favorite
  const removeFavoriteMutation = useMutation({
    mutationFn: (garageId: string) => FavoriteService.toggleFavorite(garageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check'] });
      queryClient.invalidateQueries({ queryKey: ['garages'] });
      Alert.toastSuccess(data?.message || 'Garage removed from favorites');
    },
    onError: (err: any) => {
      Alert.error('Action Failed', err?.response?.data?.message || 'Failed to update favorites');
    },
    onSettled: () => {
      setRemovingId(null);
    },
  });

  async function handleRemoveFavorite(garage: IFavoriteGarageItem) {
    const confirmed = await Alert.confirm({
      title: 'Remove from Favorites?',
      text: `Are you sure you want to remove "${garage.name}" from your favorite garages?`,
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setRemovingId(garage.id);
    removeFavoriteMutation.mutate(garage.id);
  }

  // Filter & Sort
  const processedGarages = useMemo(() => {
    let list = [...rawFavorites];

    // Search Box Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.address?.toLowerCase().includes(q) ||
          g.location?.toLowerCase().includes(q) ||
          g.owner?.name?.toLowerCase().includes(q) ||
          g.owner?.email?.toLowerCase().includes(q),
      );
    }

    // Availability Filter
    if (availabilityFilter === 'AVAILABLE') {
      list = list.filter((g) => g.availableSlots > 0);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'favoritedAt') {
        const tA = new Date(a.favoritedAt).getTime();
        const tB = new Date(b.favoritedAt).getTime();
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }
      if (sortBy === 'pricePerHour') {
        return sortOrder === 'desc'
          ? b.pricePerHour - a.pricePerHour
          : a.pricePerHour - b.pricePerHour;
      }
      if (sortBy === 'totalSlots') {
        return sortOrder === 'desc' ? b.totalSlots - a.totalSlots : a.totalSlots - b.totalSlots;
      }
      if (sortBy === 'averageRating') {
        return sortOrder === 'desc'
          ? (b.averageRating || 0) - (a.averageRating || 0)
          : (a.averageRating || 0) - (b.averageRating || 0);
      }
      if (sortBy === 'name') {
        return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [rawFavorites, searchTerm, availabilityFilter, sortBy, sortOrder]);

  // Client-side Pagination calculations with 25, 50, 100
  const total = processedGarages.length;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPage);

  const paginatedGarages = useMemo(() => {
    const startIndex = (safePage - 1) * limit;
    return processedGarages.slice(startIndex, startIndex + limit);
  }, [processedGarages, safePage, limit]);

  // 4 Top Metric Calculations
  const totalSlots = rawFavorites.reduce((sum, g) => sum + (g.totalSlots || 0), 0);
  const availableSlots = rawFavorites.reduce((sum, g) => sum + (g.availableSlots || 0), 0);
  const avgPrice =
    rawFavorites.length > 0
      ? Math.round(
          rawFavorites.reduce((sum, g) => sum + (g.pricePerHour || 0), 0) / rawFavorites.length,
        )
      : 0;

  const errorMessage = queryError instanceof Error ? queryError.message : null;

  return (
    <div className="space-y-5">
      {/* 4 Quick Facility Stat Cards (Matching /dashboard/garages 1:1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Garages */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Favorite Facilities
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">
              {rawFavorites.length}
            </div>
          </div>
        </div>

        {/* Live Available Slots */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-emerald-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Available Slots
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {availableSlots}
            </div>
          </div>
        </div>

        {/* Total Capacity */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-purple-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 12h16M12 4v16"
              />
            </svg>
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Total Capacity
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">{totalSlots}</div>
          </div>
        </div>

        {/* Average Hourly Rate */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-amber-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Avg Rate / Hour
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">৳{avgPrice}</div>
          </div>
        </div>
      </div>

      {/* Main Garage Table Component Card (Matching GarageTable.tsx 1:1) */}
      <div className="w-full bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Table Header & Actions */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-slate-200/90 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight">
                  {title}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-[var(--navy-2)] dark:text-blue-400 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {total} Facilities
                </span>
              </div>
              <p className="text-xs text-[var(--sub)] mt-0.5">{subtitle}</p>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Refresh Garages"
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    isFetching ? 'animate-spin text-[var(--navy-2)]' : 'text-[var(--sub)]'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {/* Explore Garages Primary Button */}
              <Link
                href="/garages"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Find Garages</span>
              </Link>
            </div>
          </div>

          {/* Unified Borderless Filter Toolbar */}
          <div className="bg-[var(--bg)]/70 rounded-md p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--sub)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search favorite garage name, address, or area..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 rounded-md border-0 bg-[var(--card)] text-xs text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:outline-none focus:ring-0 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--sub)] hover:text-[var(--ink)] text-xs transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Availability Filter */}
              <SelectDropdown
                value={availabilityFilter}
                options={AVAILABILITY_OPTIONS}
                onChange={(val) => {
                  setAvailabilityFilter(val);
                  setPage(1);
                }}
                className="min-w-[145px] flex-1 sm:flex-none"
              />

              {/* Sort Order */}
              <SelectDropdown
                value={`${sortBy}-${sortOrder}`}
                options={SORT_OPTIONS}
                onChange={(val) => {
                  const [sb, so] = val.split('-');
                  setSortBy(sb);
                  setSortOrder(so as 'asc' | 'desc');
                  setPage(1);
                }}
                className="min-w-[155px] flex-1 sm:flex-none"
              />
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-2.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <svg
                className="w-4 h-4 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Table Area */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--bg)] border-b border-slate-200/90 dark:border-slate-800 text-[var(--sub)] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Facility & Location</th>
                <th className="py-2.5 px-4">Slot Availability</th>
                <th className="py-2.5 px-4">Rate / Hour</th>
                <th className="py-2.5 px-4">Rating</th>
                <th className="py-2.5 px-4">Manager / Owner</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800">
              {isLoading ? (
                <TableSkeleton rows={limit > 25 ? 8 : 6} />
              ) : paginatedGarages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        No Favorite Garages Found
                      </p>
                      <p className="text-xs mt-0.5">
                        {searchTerm || availabilityFilter !== 'ALL'
                          ? 'Try clearing your search or filter parameters.'
                          : 'No garage facilities currently bookmarked. Click ❤️ on any garage card to add it here.'}
                      </p>
                      <Link
                        href="/garages"
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--navy-2)] text-white text-xs font-bold hover:bg-[var(--navy)] transition-colors shadow-xs cursor-pointer"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <span>Explore Garages</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGarages.map((garage) => {
                  const isAvailable = garage.availableSlots > 0;
                  const thumb = garage.images && garage.images.length > 0 ? garage.images[0] : null;

                  return (
                    <tr key={garage.id} className="hover:bg-[var(--bg)]/50 transition-colors group">
                      {/* Facility info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/garages/${garage.id}`}
                            className="w-10 h-10 rounded-lg bg-[var(--bg)] overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold border border-slate-200/60 dark:border-slate-800 hover:opacity-85 transition-opacity"
                            title={`View ${garage.name}`}
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={garage.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                className="w-5 h-5 text-blue-500/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.75}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            )}
                          </Link>
                          <div className="truncate max-w-[260px]">
                            <Link
                              href={`/garages/${garage.id}`}
                              className="font-bold text-[var(--ink)] hover:text-[var(--navy-2)] dark:hover:text-blue-400 text-xs truncate text-left cursor-pointer transition-colors block"
                            >
                              {garage.name}
                            </Link>
                            <div className="text-[11px] text-[var(--sub)] truncate flex items-center gap-1 mt-0.5">
                              <svg
                                className="w-3 h-3 text-slate-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="truncate">{garage.location || garage.address}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Slot Availability */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                isAvailable
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {isAvailable ? `${garage.availableSlots} Open` : 'Full'}
                            </span>
                            <span className="text-[11px] text-[var(--sub)] font-mono">
                              / {garage.totalSlots} slots
                            </span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-28 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  garage.totalSlots > 0
                                    ? (garage.availableSlots / garage.totalSlots) * 100
                                    : 0,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Rate per hour */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[var(--ink)] text-xs font-mono">
                          ৳{garage.pricePerHour}
                        </span>
                        <span className="text-[10px] text-[var(--sub)]"> / hr</span>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <svg
                            className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-bold text-[var(--ink)]">
                            {garage.averageRating?.toFixed(1) || '5.0'}
                          </span>
                          <span className="text-[10px] text-[var(--sub)] font-mono">
                            ({garage.totalReviews || 0})
                          </span>
                        </div>
                      </td>

                      {/* Owner / Manager */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-[var(--ink)]">
                          {garage.owner?.name || 'Manager'}
                        </div>
                        <div className="text-[10px] text-[var(--sub)] font-mono">
                          {garage.owner?.email || 'N/A'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <Link
                            href={`/garages/${garage.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer group"
                            title="View Facility Page"
                            aria-label={`View details for ${garage.name}`}
                          >
                            <svg
                              className="w-4 h-4 transition-transform group-hover:scale-110"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>

                          {/* Book Spot Direct Link */}
                          <Link
                            href={`/garages/${garage.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer group"
                            title="Book Spot Now"
                            aria-label={`Book spot at ${garage.name}`}
                          >
                            <svg
                              className="w-4 h-4 transition-transform group-hover:scale-110"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </Link>

                          {/* Remove Favorite Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(garage)}
                            disabled={removingId === garage.id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                            title="Remove from Favorites"
                            aria-label={`Remove ${garage.name} from favorites`}
                          >
                            {removingId === garage.id ? (
                              <svg
                                className="w-4 h-4 animate-spin text-rose-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 transition-transform group-hover:scale-110 fill-rose-500 text-rose-500"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer (Matching GarageTable.tsx 1:1 with 25, 50, 100) */}
        <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-[var(--bg)]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Limit */}
          <div className="flex items-center gap-2">
            <span className="text-[var(--sub)] font-medium text-xs">Rows per page:</span>
            <SelectDropdown
              value={limit}
              options={LIMIT_OPTIONS}
              onChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
              dropdownPosition="top"
              className="min-w-[65px]"
            />
            <span className="text-[var(--sub)] text-[11px] ml-2">
              Showing {paginatedGarages.length > 0 ? (safePage - 1) * limit + 1 : 0}–
              {Math.min(safePage * limit, total)} of {total} facilities
            </span>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1 || isLoading}
              className="px-2.5 py-1.5 rounded-md border-0 bg-[var(--card)] text-[var(--ink)] font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <svg
                className="w-3.5 h-3.5 text-[var(--sub)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Prev</span>
            </button>

            <div className="px-3 py-1.5 rounded-md border-0 bg-[var(--card)] text-xs font-bold text-[var(--ink)] shadow-2xs">
              Page {safePage} of {totalPage}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
              disabled={safePage >= totalPage || isLoading}
              className="px-2.5 py-1.5 rounded-md border-0 bg-[var(--card)] text-[var(--ink)] font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Next</span>
              <svg
                className="w-3.5 h-3.5 text-[var(--sub)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
