import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge: uses CSS variable colors for proper contrast on both themes.
 * All colored variants have opaque enough backgrounds + dark text to pass WCAG AA.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'md',
  className = '',
}) => {
  /*
   * Each variant: solid-ish bg + contrasting text.
   * Light mode: darker text on light tinted bg — readable.
   * Dark mode: lighter text on dark tinted bg — readable.
   */
  const variants: Record<string, string> = {
    purple: 'bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]',
    accent:  'bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]',
    indigo:  'bg-[var(--accent-2-light)] text-[var(--accent-2)] border border-[rgba(79,70,229,0.30)]',
    blue:    'bg-[var(--info-light)] text-[var(--info-text)] border border-[rgba(59,130,246,0.30)]',
    emerald: 'bg-[var(--success-light)] text-[var(--success-text)] border border-[rgba(16,185,129,0.30)]',
    amber:   'bg-[var(--warning-light)] text-[var(--warning-text)] border border-[rgba(245,158,11,0.30)]',
    rose:    'bg-[var(--error-light)] text-[var(--error-text)] border border-[rgba(239,68,68,0.30)]',
    slate:   'bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-medium ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
