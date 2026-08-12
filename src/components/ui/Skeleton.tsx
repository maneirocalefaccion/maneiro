'use client';

import React from 'react';

export const SkeletonText: React.FC = () => {
  return <div className="skeleton skeleton-text"></div>;
};

export const SkeletonCard: React.FC = () => {
  return <div className="skeleton skeleton-card"></div>;
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="table-container">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton skeleton-table-row"></div>
      ))}
    </div>
  );
};
