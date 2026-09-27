'use client';

import { useQuery } from '@tanstack/react-query';
import GarageTable from '@/components/GarageTable';
import { GarageService } from '@/services/garage';

export default function GaragesPage() {
  const { data: garagesData } = useQuery({
    queryKey: ['garages', 'stats'],
    queryFn: () => GarageService.getAllGarages({ limit: 100 }),
  });

  const garages = garagesData?.data || [];
  const totalGarages = garagesData?.meta?.total || garages.length;
  const totalSlots = garages.reduce((sum, g) => sum + (g.totalSlots || 0), 0);
  const availableSlots = garages.reduce((sum, g) => sum + (g.availableSlots || 0), 0);
  const avgPrice =
    garages.length > 0
      ? Math.round(garages.reduce((sum, g) => sum + (g.pricePerHour || 0), 0) / garages.length)
      : 0;

  return (
    <div className="space-y-5">
      {/* Quick Facility Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Garages */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-[var(--navy-2)] dark:text-blue-400 flex items-center justify-center font-bold text-lg">
            🅿
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Total Facilities
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">{totalGarages}</div>
          </div>
        </div>

        {/* Live Available Slots */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
            ⚡
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
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
            🚗
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Total Capacity
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">{totalSlots}</div>
          </div>
        </div>

        {/* Average Hourly Rate */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
            ৳
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              Avg Rate / Hour
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">
              ৳{avgPrice}
            </div>
          </div>
        </div>
      </div>

      {/* Main Garage Table Component */}
      <GarageTable />
    </div>
  );
}
