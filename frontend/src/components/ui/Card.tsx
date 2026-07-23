import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverGlow?: boolean;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = true,
  hoverGlow = false,
  noPadding = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={[
        glass ? 'glass-card' : 'card',
        hoverGlow ? 'card-hover' : '',
        noPadding ? '' : 'p-6',
        'rounded-2xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};
