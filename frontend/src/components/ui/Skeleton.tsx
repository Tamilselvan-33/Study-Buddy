import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`rounded-xl animate-pulse bg-[var(--surface-3)] ${className}`}
    style={{ minHeight: '1rem' }}
  />
);
