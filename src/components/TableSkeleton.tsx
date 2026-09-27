import type React from 'react';

export interface ITableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 6, columns = 7 }: ITableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} className="animate-pulse">
          {/* First column with avatar and two lines */}
          <td className="py-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-32 h-2.5 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
              </div>
            </div>
          </td>

          {/* Phone */}
          <td className="py-3 px-4">
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </td>

          {/* Role badge */}
          <td className="py-3 px-4">
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </td>

          {/* OTP / Status badge */}
          <td className="py-3 px-4">
            <div className="w-14 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </td>

          {/* Account Status badge */}
          <td className="py-3 px-4">
            <div className="w-14 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </td>

          {/* Date */}
          <td className="py-3 px-4">
            <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
          </td>

          {/* Action button */}
          <td className="py-3 px-4 text-right">
            <div className="w-14 h-5 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}
