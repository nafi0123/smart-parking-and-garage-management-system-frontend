'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import GarageDetailsModal from '@/components/GarageDetailsModal';
import GarageFormModal from '@/components/GarageFormModal';
import TableSkeleton from '@/components/TableSkeleton';
import { type IGarage, GarageService } from '@/services/garage';
import Alert from '@/utils/alert';

// Custom Borderless SelectDropdown
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
                    ? 'bg-[var(--navy-2)] text-white font-bold'
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
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'pricePerHour-asc', label: 'Price (Low to High)' },
  { value: 'pricePerHour-desc', label: 'Price (High to Low)' },
  { value: 'totalSlots-desc', label: 'Capacity (Largest)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
];

const LIMIT_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

export interface IGarageTableProps {
  title?: string;
  subtitle?: string;
}

export default function GarageTable({
  title = 'Garage & Parking Facilities',
  subtitle = 'Manage live parking zones, capacity, pricing and location radars',
}: IGarageTableProps) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [viewScope, setViewScope] = useState<'ALL' | 'MY'>('ALL');
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGarage, setEditingGarage] = useState<IGarage | null>(null);
  const [selectedGarage, setSelectedGarage] = useState<IGarage | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // TanStack Query: Garages
  const {
    data: queryResult,
    isLoading: loading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['garages', viewScope, debouncedSearch, availabilityFilter, page, limit, sortBy, sortOrder],
    queryFn: () => {
      if (viewScope === 'MY') {
        return GarageService.getMyGarages();
      }
      return GarageService.getAllGarages({
        searchTerm: debouncedSearch,
        onlyAvailable: availabilityFilter === 'AVAILABLE' ? true : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      });
    },
  });

  const garages: IGarage[] = queryResult?.data || [];
  const meta = queryResult?.meta || {
    page: 1,
    limit: 25,
    total: garages.length,
    totalPage: 1,
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (garageId: string) => GarageService.deleteGarage(garageId),
    onSuccess: (res) => {
      if (res.success) {
        Alert.toast(res.message || 'Garage removed successfully.', 'success');
        queryClient.invalidateQueries({ queryKey: ['garages'] });
      } else {
        Alert.error('Deletion Failed', res.message || 'Could not delete garage.');
      }
    },
    onError: (err: any) => {
      Alert.error('Error', err?.message || 'An error occurred while deleting the garage.');
    },
  });

  async function handleDelete(garage: IGarage) {
    const confirmed = await Alert.confirm({
      title: 'Delete Parking Garage?',
      text: `Are you sure you want to permanently delete "${garage.name}"? This action cannot be undone.`,
      confirmButtonText: 'Yes, Delete Garage',
      cancelButtonText: 'Cancel',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;
    deleteMutation.mutate(garage.id);
  }

  function handleOpenCreate() {
    setEditingGarage(null);
    setIsFormOpen(true);
  }

  function handleOpenEdit(garage: IGarage) {
    setEditingGarage(garage);
    setIsFormOpen(true);
  }

  const errorMessage =
    queryError instanceof Error
      ? queryError.message
      : queryResult && !queryResult.success
      ? queryResult.message
      : null;

  return (
    <>
      <div className="w-full bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col my-5">
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
                  {meta.total} Facilities
                </span>
              </div>
              <p className="text-xs text-[var(--sub)] mt-0.5">{subtitle}</p>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2">
              {/* Scope Switcher: All vs My */}
              <div className="flex bg-[var(--bg)] p-0.5 rounded-md text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setViewScope('ALL');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    viewScope === 'ALL'
                      ? 'bg-[var(--card)] text-[var(--ink)] shadow-2xs font-bold'
                      : 'text-[var(--sub)] hover:text-[var(--ink)]'
                  }`}
                >
                  All Garages
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewScope('MY');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    viewScope === 'MY'
                      ? 'bg-[var(--card)] text-[var(--ink)] shadow-2xs font-bold'
                      : 'text-[var(--sub)] hover:text-[var(--ink)]'
                  }`}
                >
                  My Garages
                </button>
              </div>

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

              {/* Add Garage Primary Button */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>+</span> Add Garage
              </button>
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
                placeholder="Search garage name, address, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-md border-0 bg-[var(--card)] text-xs text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:outline-none focus:ring-0 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--sub)] hover:text-[var(--ink)] text-xs"
                  title="Clear search"
                >
                  ✕
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
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              {loading ? (
                <TableSkeleton rows={limit > 25 ? 8 : 6} />
              ) : garages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                      <span className="text-4xl mb-2 opacity-50">🅿</span>
                      <p className="text-sm font-semibold text-[var(--ink)]">No Garages Found</p>
                      <p className="text-xs mt-0.5">
                        {searchTerm || availabilityFilter !== 'ALL'
                          ? 'Try clearing your search or filter parameters.'
                          : 'No garage facilities currently registered.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-3 px-3.5 py-1.5 rounded-md bg-[var(--navy-2)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                      >
                        + Add First Garage
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                garages.map((garage) => {
                  const isAvailable = garage.availableSlots > 0;
                  const thumb = garage.images && garage.images.length > 0 ? garage.images[0] : null;

                  return (
                    <tr
                      key={garage.id}
                      className="hover:bg-[var(--bg)]/50 transition-colors group"
                    >
                      {/* Facility info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold border border-slate-200/60 dark:border-slate-800">
                            {thumb ? (
                              <img src={thumb} alt={garage.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[var(--navy-2)]">🅿</span>
                            )}
                          </div>
                          <div className="truncate max-w-[260px]">
                            <button
                              type="button"
                              onClick={() => setSelectedGarage(garage)}
                              className="font-bold text-[var(--ink)] hover:text-[var(--navy-2)] dark:hover:text-blue-400 text-xs truncate text-left cursor-pointer"
                            >
                              {garage.name}
                            </button>
                            <div className="text-[11px] text-[var(--sub)] truncate flex items-center gap-1">
                              <span>📍</span> {garage.location || garage.address}
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
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-amber-500 font-bold">★</span>
                          <span className="font-bold text-[var(--ink)]">
                            {garage.averageRating?.toFixed(1) || '5.0'}
                          </span>
                          <span className="text-[10px] text-[var(--sub)]">
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
                          <button
                            type="button"
                            onClick={() => setSelectedGarage(garage)}
                            className="p-1.5 rounded hover:bg-[var(--bg)] text-[var(--sub)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="View Facility Details"
                          >
                            👁
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(garage)}
                            className="p-1.5 rounded hover:bg-[var(--bg)] text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            title="Edit Garage"
                          >
                            ✎
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(garage)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded hover:bg-red-500/15 text-red-500 transition-colors cursor-pointer disabled:opacity-40"
                            title="Delete Garage"
                          >
                            🗑
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

        {/* Pagination Footer */}
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
              Showing {garages.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}–
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} facilities
            </span>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1 rounded-md border-0 bg-[var(--card)] text-[var(--ink)] font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>←</span> Prev
            </button>

            <div className="px-2.5 py-1 rounded-md border-0 bg-[var(--card)] text-xs font-bold text-[var(--ink)] shadow-2xs">
              Page {meta.page} of {Math.max(1, meta.totalPage)}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
              disabled={page >= meta.totalPage || loading}
              className="px-2.5 py-1 rounded-md border-0 bg-[var(--card)] text-[var(--ink)] font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg)] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              Next <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <GarageFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGarage(null);
        }}
        initialData={editingGarage}
      />

      {/* Details Modal */}
      <GarageDetailsModal
        isOpen={!!selectedGarage}
        onClose={() => setSelectedGarage(null)}
        garage={selectedGarage}
        onEdit={(g) => handleOpenEdit(g)}
      />
    </>
  );
}
