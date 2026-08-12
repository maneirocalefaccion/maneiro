'use client';

import React, { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  outline?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  outline = false,
}) => {
  const baseClass = 'badge';
  const variantClass = outline ? 'badge-outline' : `badge-${variant}`;
  
  return (
    <span className={`${baseClass} ${variantClass} ${outline ? `text-${variant}` : ''}`}>
      {children}
    </span>
  );
};
