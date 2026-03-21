import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Skeleton({ className = '', rounded = 'lg' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-${rounded} ${className}`} />
  );
}

export function HotelCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
      <Skeleton className="h-52 w-full" rounded="sm" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-16" rounded="full" />
          <Skeleton className="h-8 w-20" rounded="full" />
        </div>
        <Skeleton className="h-10 w-full" rounded="xl" />
      </div>
    </div>
  );
}

export function HotelGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => <HotelCardSkeleton key={i} />)}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16" rounded="full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" rounded="xl" />)}
    </div>
  );
}

export function CouponSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex gap-3 items-center">
        <Skeleton className="w-16 h-16" rounded="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" rounded="full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" rounded="xl" />
        <Skeleton className="h-10 flex-1" rounded="xl" />
      </div>
    </div>
  );
}
