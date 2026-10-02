'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa6';
import { LuArrowRight, LuSparkles } from 'react-icons/lu';
import { FavoriteService } from '@/services/favorite';
import { GarageService } from '@/services/garage';
import Alert from '@/utils/alert';
import { getAuthToken } from '@/utils/cookie';

export default function RecentGaragesSection() {
  const queryClient = useQueryClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAuthToken());
  }, []);

  // 1. Fetch 8 Most Recent Garages
  const {
    data: garagesResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['recent-garages-home'],
    queryFn: () =>
      GarageService.getAllGarages({
        limit: 8,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  // 2. Fetch User Favorites (if logged in)
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

  // 3. Toggle Favorite Mutation
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

  const garages = garagesResponse?.data || [];

  return (
    <section className="py-10 sm:py-14">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <LuSparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            <span>Latest Smart Network Additions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Recently Added Smart Garages
          </h2>
          <p className="text-xs sm:text-sm text-[var(--sub)]">
            Discover the latest automated multi-level towers and secure parking facilities with guaranteed vacant bay telemetry.
          </p>
        </div>

        {/* Explore All Button */}
        <Link
          href="/garages"
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white px-4 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>Explore All Garages</span>
          <LuArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Loading Skeletons: 8 cards in 4 columns */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
            <div
              key={i}
              className="rounded-md border border-[var(--line)] bg-[var(--card)] p-4 shadow-xs animate-pulse space-y-3"
            >
              <div className="h-44 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-9 w-full rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : isError || garages.length === 0 ? (
        <div className="rounded-md border border-[var(--line)] bg-[var(--card)] p-12 text-center space-y-3 shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xl font-bold">
            🅿
          </div>
          <h3 className="text-base font-bold text-[var(--ink)]">No Recent Garages Available</h3>
          <p className="text-xs text-[var(--sub)] max-w-sm mx-auto">
            Check back shortly as new smart parking facilities are being onboarded.
          </p>
        </div>
      ) : (
        /* 4-Column Grid (8 Garages total: 4 cards per row) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {garages.slice(0, 8).map((garage) => {
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
                      {isAvailable ? `${garage.availableSlots} Free` : 'Full'}
                    </span>
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
                      <span className="rounded bg-black/50 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-slate-200 truncate max-w-[110px]">
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
                        {garage.totalSlots - garage.availableSlots} / {garage.totalSlots} slots
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
                      <span>{isAvailable ? 'View Details & Book' : 'Fully Occupied (0 Free)'}</span>
                      <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
