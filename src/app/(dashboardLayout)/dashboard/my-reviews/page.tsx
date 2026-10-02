'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReviewTable from '@/components/ReviewTable';
import { getAuthUser } from '@/utils/cookie';

export default function MyReviewsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.replace('/login?redirect=/dashboard/my-reviews');
      return;
    }
    setUser(u);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Loading your reviews...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ReviewTable
        title="My Reviews & Ratings"
        subtitle="Live feedback, ratings, and garage reviews submitted from your account"
        badgeLabel="Reviews"
      />
    </div>
  );
}
