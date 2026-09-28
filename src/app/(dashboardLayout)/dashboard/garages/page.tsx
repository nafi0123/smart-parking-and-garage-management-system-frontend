'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import GarageTable from '@/components/GarageTable';
import { AuthService } from '@/services/auth';
import { GarageService } from '@/services/garage';
import { clearAuthSession, getAuthUser } from '@/utils/cookie';

export default function GaragesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      clearAuthSession();
      router.replace('/login');
      return;
    }

    if (u.role === 'DRIVER') {
      // Driver is unauthorized on facility management route
      clearAuthSession();
      AuthService.logout().finally(() => {
        router.replace('/login');
      });
      return;
    }

    setUserRole(u.role);
    setLoadingUser(false);
  }, [router]);

  const isManager = userRole === 'MANAGER';

  // Fetch stats: Managers see their own stats; Admins see system-wide stats
  const { data: garagesData } = useQuery({
    queryKey: ['garages', 'stats', isManager ? 'my' : 'all'],
    queryFn: () => (isManager ? GarageService.getMyGarages() : GarageService.getAllGarages({ limit: 100 })),
    enabled: !loadingUser && userRole !== 'DRIVER',
  });

  const garages = garagesData?.data || [];
  const totalGarages = garagesData?.meta?.total || garages.length;
  const totalSlots = garages.reduce((sum, g) => sum + (g.totalSlots || 0), 0);
  const availableSlots = garages.reduce((sum, g) => sum + (g.availableSlots || 0), 0);
  const avgPrice =
    garages.length > 0
      ? Math.round(garages.reduce((sum, g) => sum + (g.pricePerHour || 0), 0) / garages.length)
      : 0;

  if (loadingUser || userRole === 'DRIVER') {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Checking access permissions...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quick Facility Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Garages */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-blue-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-[11px] text-[var(--sub)] font-semibold uppercase tracking-wider">
              {isManager ? 'My Facilities' : 'Total Facilities'}
            </div>
            <div className="text-xl font-bold text-[var(--ink)] tracking-tight">{totalGarages}</div>
          </div>
        </div>

        {/* Live Available Slots */}
        <div className="p-4 rounded-xl bg-[var(--card)] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5 hover:border-emerald-500/30 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M12 4v16" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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


