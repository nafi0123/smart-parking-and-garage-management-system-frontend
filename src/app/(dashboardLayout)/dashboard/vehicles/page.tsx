'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import VehicleTable from '@/components/VehicleTable';
import { getAuthUser } from '@/utils/cookie';

export default function MyVehiclesDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace('/login?redirect=/dashboard/vehicles');
      return;
    }
    setUser(u);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Loading your registered vehicles...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <VehicleTable
        title="My Registered Vehicles"
        subtitle="Manage your registered motor vehicles, license plates and fast 1-click booking defaults"
        badgeLabel="Vehicles"
      />
    </div>
  );
}
