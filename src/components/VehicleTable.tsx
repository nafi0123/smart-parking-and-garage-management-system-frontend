'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaCar, FaMotorcycle, FaStar } from 'react-icons/fa6';
import {
  LuArrowUpDown,
  LuCar,
  LuPlus,
  LuRefreshCw,
  LuSearch,
  LuSparkles,
  LuTrash2,
} from 'react-icons/lu';
import { MdDirectionsCar, MdOutlineTwoWheeler } from 'react-icons/md';
import { RiCarLine, RiTruckLine } from 'react-icons/ri';
import TableSkeleton from '@/components/TableSkeleton';
import VehicleFormModal from '@/components/VehicleFormModal';
import { type IVehicle, VehicleService, type VehicleType } from '@/services/vehicle';
import Alert from '@/utils/alert';
import { getAuthUser } from '@/utils/cookie';

const TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Vehicle Types' },
  { value: 'CAR', label: 'Cars / Sedans 🚗' },
  { value: 'BIKE', label: 'Bikes / Scooters 🏍️' },
  { value: 'SUV', label: 'SUVs / Crossovers 🚙' },
  { value: 'VAN', label: 'Vans / Microbuses 🚐' },
  { value: 'TRUCK', label: 'Pickups / Trucks 🚚' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'vehicleNumber-asc', label: 'Plate (A–Z)' },
  { value: 'vehicleNumber-desc', label: 'Plate (Z–A)' },
  { value: 'model-asc', label: 'Model (A–Z)' },
];

const LIMIT_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

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

export interface IVehicleTableProps {
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
}

export default function VehicleTable({
  title = 'My Registered Vehicles',
  subtitle = 'Manage your motor vehicles, license plates and fast 1-click booking defaults',
  badgeLabel = 'Vehicles',
}: IVehicleTableProps) {
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<IVehicle | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load user
  useEffect(() => {
    const u = getAuthUser();
    if (u) setCurrentUser(u);
  }, []);

  // TanStack Query: Fetch my vehicles
  const {
    data: vehiclesResponse,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['my-vehicles', currentUser?.id],
    queryFn: () => VehicleService.getMyVehicles(),
    enabled: !!currentUser,
  });

  const rawVehicles = (vehiclesResponse?.data || []) as IVehicle[];

  // Mutation: Make default
  const makeDefaultMutation = useMutation({
    mutationFn: (vehicleId: string) => VehicleService.updateVehicle(vehicleId, { isDefault: true }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      Alert.toastSuccess(`"${data.data.vehicleNumber}" is now your default booking vehicle.`);
    },
    onError: (err: any) => {
      Alert.error(
        'Action Failed',
        err?.response?.data?.message || 'Could not update default vehicle.',
      );
    },
  });

  // Mutation: Delete vehicle
  const deleteMutation = useMutation({
    mutationFn: (vehicleId: string) => VehicleService.deleteVehicle(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
      Alert.toastSuccess('Vehicle removed from your account.');
    },
    onError: (err: any) => {
      Alert.error('Delete Failed', err?.response?.data?.message || 'Could not delete vehicle.');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDeleteVehicle = async (vehicle: IVehicle) => {
    const confirmed = await Alert.confirm({
      title: 'Delete Vehicle?',
      text: `Are you sure you want to remove license plate "${vehicle.vehicleNumber}" from your registered vehicles?`,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      icon: 'warning',
      isDestructive: true,
    });

    if (!confirmed) return;

    setDeletingId(vehicle.id);
    deleteMutation.mutate(vehicle.id);
  };

  const handleOpenCreate = () => {
    setSelectedVehicleForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (vehicle: IVehicle) => {
    setSelectedVehicleForEdit(vehicle);
    setIsFormModalOpen(true);
  };

  // Filter & Sort
  const processedVehicles = useMemo(() => {
    let list = [...rawVehicles];

    // Search Box
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (v) =>
          v.vehicleNumber?.toLowerCase().includes(q) ||
          v.model?.toLowerCase().includes(q) ||
          v.color?.toLowerCase().includes(q) ||
          v.vehicleType?.toLowerCase().includes(q),
      );
    }

    // Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter((v) => v.vehicleType === typeFilter);
    }

    // Sorting
    list.sort((a, b) => {
      // Default vehicle always prioritizes top if same sort
      if (sortBy === 'createdAt') {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }
      if (sortBy === 'vehicleNumber') {
        return sortOrder === 'desc'
          ? b.vehicleNumber.localeCompare(a.vehicleNumber)
          : a.vehicleNumber.localeCompare(b.vehicleNumber);
      }
      if (sortBy === 'model') {
        const mA = a.model || '';
        const mB = b.model || '';
        return sortOrder === 'desc' ? mB.localeCompare(mA) : mA.localeCompare(mB);
      }
      return 0;
    });

    return list;
  }, [rawVehicles, searchTerm, typeFilter, sortBy, sortOrder]);

  // Client-side pagination (25, 50, 100)
  const total = processedVehicles.length;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPage);

  const paginatedVehicles = useMemo(() => {
    const startIndex = (safePage - 1) * limit;
    return processedVehicles.slice(startIndex, startIndex + limit);
  }, [processedVehicles, safePage, limit]);

  // Metric Stats
  const stats = useMemo(() => {
    const totalCount = rawVehicles.length;
    const defaultVehicle = rawVehicles.find((v) => v.isDefault);
    const carCount = rawVehicles.filter(
      (v) => v.vehicleType === 'CAR' || v.vehicleType === 'SUV',
    ).length;
    const bikeCount = rawVehicles.filter((v) => v.vehicleType === 'BIKE').length;

    return {
      totalCount,
      defaultPlate: defaultVehicle ? defaultVehicle.vehicleNumber : 'None Set',
      carCount,
      bikeCount,
    };
  }, [rawVehicles]);

  const getVehicleTypeBadge = (type: VehicleType) => {
    switch (type) {
      case 'CAR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span>🚗</span> Car / Sedan
          </span>
        );
      case 'BIKE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span>🏍️</span> Motorbike
          </span>
        );
      case 'SUV':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span>🚙</span> SUV / Crossover
          </span>
        );
      case 'VAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span>🚐</span> Van / Microbus
          </span>
        );
      case 'TRUCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span>🚚</span> Pickup / Truck
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">
            <span>🚗</span> Vehicle
          </span>
        );
    }
  };

  const errorMessage = queryError instanceof Error ? queryError.message : null;

  return (
    <>
      <div className="space-y-5">
        {/* 4 Stat Metric Cards (Matching /dashboard/garages and /dashboard/my-reviews) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Registered */}
          <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
              <FaCar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
                Total Vehicles
              </div>
              <div className="text-xl font-bold text-[var(--ink)] tracking-tight">
                {stats.totalCount}
              </div>
            </div>
          </div>

          {/* Card 2: Default Vehicle */}
          <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-emerald-500/30 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
              <FaStar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
                Primary Default
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-[140px]">
                {stats.defaultPlate}
              </div>
            </div>
          </div>

          {/* Card 3: Cars & SUVs */}
          <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-purple-500/30 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg shrink-0">
              <MdDirectionsCar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
                Cars & SUVs
              </div>
              <div className="text-xl font-bold text-[var(--ink)] tracking-tight">
                {stats.carCount}
              </div>
            </div>
          </div>

          {/* Card 4: Motorbikes */}
          <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-amber-500/30 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
              <FaMotorcycle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
                Motorbikes & Scooters
              </div>
              <div className="text-xl font-bold text-[var(--ink)] tracking-tight">
                {stats.bikeCount}
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Card (Matching GarageTable.tsx and ReviewTable.tsx) */}
        <div className="w-full bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
          {/* Table Header & Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col gap-4 border-b border-slate-200/90 dark:border-slate-800">
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] tracking-tight">
                    {title}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-[#0f2a6b] dark:text-blue-400 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {total} {badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-[var(--sub)] mt-0.5">{subtitle}</p>
              </div>

              {/* Top Actions */}
              <div className="flex items-center gap-2">
                {(searchTerm ||
                  typeFilter !== 'ALL' ||
                  sortBy !== 'createdAt' ||
                  sortOrder !== 'desc') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('ALL');
                      setSortBy('createdAt');
                      setSortOrder('desc');
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer border border-red-500/20 flex items-center gap-1"
                    title="Clear all filters"
                  >
                    <LuSparkles className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Refresh Vehicles"
                >
                  <LuRefreshCw
                    className={`w-3.5 h-3.5 ${
                      isFetching ? 'animate-spin text-[#0f2a6b]' : 'text-[var(--sub)]'
                    }`}
                  />
                  <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                {/* Add Vehicle Primary Action Button */}
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <LuPlus className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>
            </div>

            {/* Unified Borderless Filter Toolbar */}
            <div className="bg-[var(--bg)]/70 rounded-md p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--sub)]">
                  <LuSearch className="w-3.5 h-3.5" />
                </div>
                <input
                  type="search"
                  placeholder="Search license plate, model, color or class..."
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
                {/* Type Filter */}
                <SelectDropdown
                  value={typeFilter}
                  options={TYPE_FILTER_OPTIONS}
                  onChange={(val) => {
                    setTypeFilter(val);
                    setPage(1);
                  }}
                  className="min-w-[155px] flex-1 sm:flex-none"
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

          {/* Main Table Body */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] border-b border-slate-200/90 dark:border-slate-800 text-[var(--sub)] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">License Plate Number</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Model & Make</th>
                  <th className="py-2.5 px-4">Color</th>
                  <th className="py-2.5 px-4">Booking Priority</th>
                  <th className="py-2.5 px-4">Registered Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/90 dark:divide-slate-800">
                {isLoading ? (
                  <TableSkeleton rows={limit > 25 ? 8 : 6} />
                ) : paginatedVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center text-[var(--sub)]">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 text-2xl">
                          🚗
                        </div>
                        <p className="text-sm font-semibold text-[var(--ink)]">No Vehicles Found</p>
                        <p className="text-xs mt-0.5">
                          {searchTerm || typeFilter !== 'ALL'
                            ? 'Try clearing your search or filter parameters.'
                            : 'No vehicles registered to your account yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenCreate}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0f2a6b] text-white text-xs font-bold hover:bg-[#1e40af] transition-colors shadow-xs cursor-pointer"
                        >
                          <LuPlus className="w-3.5 h-3.5" />
                          <span>Register First Vehicle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedVehicles.map((vehicle) => {
                    const formattedDate = new Date(vehicle.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <tr
                        key={vehicle.id}
                        className="hover:bg-[var(--bg)]/50 transition-colors group"
                      >
                        {/* License Plate Number */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-[var(--bg)] border border-slate-200/60 dark:border-slate-800 flex items-center justify-center text-base shrink-0">
                              {vehicle.vehicleType === 'BIKE'
                                ? '🏍️'
                                : vehicle.vehicleType === 'SUV'
                                  ? '🚙'
                                  : vehicle.vehicleType === 'VAN'
                                    ? '🚐'
                                    : vehicle.vehicleType === 'TRUCK'
                                      ? '🚚'
                                      : '🚗'}
                            </div>
                            <div>
                              <div className="font-mono font-bold text-xs text-[var(--ink)] tracking-wider">
                                {vehicle.vehicleNumber}
                              </div>
                              <div className="text-[11px] text-[var(--sub)]">
                                {vehicle.model || 'Standard Model'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Classification */}
                        <td className="py-3 px-4">{getVehicleTypeBadge(vehicle.vehicleType)}</td>

                        {/* Model & Make */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-xs text-[var(--ink)]">
                            {vehicle.model || '—'}
                          </span>
                        </td>

                        {/* Color */}
                        <td className="py-3 px-4">
                          {vehicle.color ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink)]">
                              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                              <span>{vehicle.color}</span>
                            </span>
                          ) : (
                            <span className="text-[var(--sub)]">—</span>
                          )}
                        </td>

                        {/* Default Priority */}
                        <td className="py-3 px-4">
                          {vehicle.isDefault ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                              <span>⭐ Primary Default</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makeDefaultMutation.mutate(vehicle.id)}
                              disabled={makeDefaultMutation.isPending}
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              Set as Default
                            </button>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-[11px] text-[var(--sub)] font-mono">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(vehicle)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer"
                              title="Edit Vehicle"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteVehicle(vehicle)}
                              disabled={deletingId === vehicle.id || deleteMutation.isPending}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all duration-150 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Delete Vehicle"
                            >
                              {deletingId === vehicle.id ? (
                                <LuRefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                              ) : (
                                <LuTrash2 className="w-4 h-4" />
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

          {/* Pagination Footer (25, 50, 100) */}
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
                Showing {paginatedVehicles.length > 0 ? (safePage - 1) * limit + 1 : 0}–
                {Math.min(safePage * limit, total)} of {total} vehicles
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

      {/* Form Modal (Create / Edit) */}
      <VehicleFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedVehicleForEdit(null);
        }}
        vehicle={selectedVehicleForEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['my-vehicles'] });
        }}
      />
    </>
  );
}
