'use client';

import { useEffect, useState } from 'react';
import { LuBuilding2, LuCar, LuShieldCheck } from 'react-icons/lu';
import AdminDashboardView from '@/components/dashboard/AdminDashboardView';
import DriverDashboardView from '@/components/dashboard/DriverDashboardView';
import ManagerDashboardView from '@/components/dashboard/ManagerDashboardView';
import { getAuthUser } from '@/utils/cookie';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeViewRole, setActiveViewRole] = useState<'DRIVER' | 'MANAGER' | 'ADMIN'>('DRIVER');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const authUser = getAuthUser();
    if (authUser) {
      setUser(authUser);
      const role = authUser.role?.toUpperCase() || 'DRIVER';
      if (role === 'ADMIN') {
        setActiveViewRole('ADMIN');
      } else if (role === 'MANAGER') {
        setActiveViewRole('MANAGER');
      } else {
        setActiveViewRole('DRIVER');
      }
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
            <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Admin Role Switcher for previewing all views seamlessly */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[var(--card)] border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
            <span>Administrator Perspective Switcher:</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-md bg-[var(--bg)] border border-[var(--line)]">
            <button
              type="button"
              onClick={() => setActiveViewRole('ADMIN')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                activeViewRole === 'ADMIN'
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md'
                  : 'text-[var(--sub)] hover:text-[var(--ink)]'
              }`}
            >
              <LuShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Master</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewRole('MANAGER')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                activeViewRole === 'MANAGER'
                  ? 'bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] text-white shadow-md'
                  : 'text-[var(--sub)] hover:text-[var(--ink)]'
              }`}
            >
              <LuBuilding2 className="w-3.5 h-3.5" />
              <span>Manager Ops</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewRole('DRIVER')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                activeViewRole === 'DRIVER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-[var(--sub)] hover:text-[var(--ink)]'
              }`}
            >
              <LuCar className="w-3.5 h-3.5" />
              <span>Driver View</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Dynamic Role-Based Dashboard View */}
      {activeViewRole === 'ADMIN' && <AdminDashboardView user={user} />}
      {activeViewRole === 'MANAGER' && <ManagerDashboardView user={user} />}
      {activeViewRole === 'DRIVER' && <DriverDashboardView user={user} />}
    </div>
  );
}
