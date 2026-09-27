'use client';

import DataTable from '@/components/DataTable';

export default function UsersPage() {
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
