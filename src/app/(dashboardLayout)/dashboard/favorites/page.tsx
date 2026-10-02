'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FavoriteTable from '@/components/FavoriteTable';
import { getAuthUser } from '@/utils/cookie';

export default function MyFavoritesDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace('/login?redirect=/dashboard/favorites');
      return;
    }
    setUser(u);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Loading your favorite garages...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FavoriteTable
        title="My Favorite Garages"
        subtitle="Bookmarked parking facilities with live bay availability and quick booking"
      />
    </div>
  );
}
