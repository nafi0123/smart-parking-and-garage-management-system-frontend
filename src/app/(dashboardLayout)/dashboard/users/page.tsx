'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import { AuthService } from '@/services/auth';
import { clearAuthSession, getAuthUser } from '@/utils/cookie';

export default function UsersPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      clearAuthSession();
      router.replace('/login');
      return;
    }

    if (u.role !== 'ADMIN') {
      // Non-admin is unauthorized on user management route
      clearAuthSession();
      AuthService.logout().finally(() => {
        router.replace('/login');
      });
      return;
    }

    setRole(u.role);
    setLoading(false);
  }, [router]);

  if (loading || role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-xs text-[var(--sub)] animate-pulse">
        Checking access permissions...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        title="User Management"
        subtitle="Manage system drivers, garage managers, and administrators"
        badgeLabel="Users"
      />
    </div>
  );
}

