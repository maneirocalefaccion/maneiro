'use client';

import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  isActions?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string) => void;
  currentSort?: { key: string; direction: 'asc' | 'desc' };
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  onSort,
  currentSort,
  emptyMessage = 'No hay datos disponibles.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="text-center p-6 text-muted my-4">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-${col.align || 'left'} ${
                  col.isActions ? 'table-actions' : ''
                } ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={() => col.sortable && onSort && onSort(col.key)}
              >
                <div className={`flex items-center gap-2 justify-${col.align === 'right' ? 'end' : col.align === 'center' ? 'center' : 'start'}`}>
                  {col.header}
                  {col.sortable && currentSort?.key === col.key && (
                    <span>{currentSort.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`text-${col.align || 'left'} ${
                    col.isActions ? 'table-actions' : ''
                  }`}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
