'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BookingTable from '@/components/BookingTable';
import { getAuthUser } from '@/utils/cookie';

export default function MyBookingsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace('/login?redirect=/dashboard/my-bookings');
      return;
    }
    setUser(u);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Loading reservations...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BookingTable
        title="My Reservations & Bookings"
        subtitle="Live parking spot reservations, SSLCommerz transactions & invoices"
        badgeLabel="Bookings"
      />
    </div>
  );
}
