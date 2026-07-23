import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]';

  const focusRing =
    'focus-visible:ring-[var(--accent)] focus-visible:ring-offset-[var(--surface)]';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  /**
   * Variant styles use CSS variables so they automatically adapt to both themes.
   * Primary: always accent-colored with white text — fully theme-safe.
   * Secondary: surface-2 bg with strong border, primary text.
   * Outline: transparent bg, accent border, accent text.
   * Ghost: transparent, muted text.
   * Danger: rose gradient, white text.
   */
  const variants: Record<string, string> = {
    primary: [
      'bg-[var(--accent)] hover:bg-[var(--accent-hover)]',
      'text-white',
      'border border-[var(--accent-border)]',
      'shadow-[var(--shadow-accent)]',
    ].join(' '),

    secondary: [
      'bg-[var(--surface-2)] hover:bg-[var(--surface-3)]',
      'text-[var(--text-primary)]',
      'border border-[var(--border-strong)]',
      'shadow-[var(--shadow-sm)]',
    ].join(' '),

    outline: [
      'bg-transparent hover:bg-[var(--accent-light)]',
      'text-[var(--accent-text)]',
      'border border-[var(--accent-border)]',
    ].join(' '),

    ghost: [
      'bg-transparent hover:bg-[var(--accent-light)]',
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      'border border-transparent',
    ].join(' '),

    danger: [
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500',
      'text-white',
      'border border-rose-500/30',
      'shadow-lg shadow-rose-600/20',
    ].join(' '),
  };

  return (
    <button
      className={`${base} ${focusRing} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
