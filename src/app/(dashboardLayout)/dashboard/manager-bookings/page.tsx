'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ManagerBookingTable from '@/components/ManagerBookingTable';
import { getAuthUser } from '@/utils/cookie';

export default function ManagerBookingsPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace('/login?redirect=/dashboard/manager-bookings');
      return;
    }

    if (u.role !== 'MANAGER' && u.role !== 'ADMIN') {
      router.replace('/dashboard');
      return;
    }

    setRole(u.role);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Checking manager permissions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ManagerBookingTable
        title="Incoming Driver Bookings"
        subtitle="Manage and track incoming parking reservations across all your garage facilities"
        badgeLabel="Bookings"
      />
    </div>
  );
}
