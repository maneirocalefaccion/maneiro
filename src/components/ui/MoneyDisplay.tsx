'use client';

import React from 'react';
// Asumiendo que utils existe y contiene formatMoney. Si no, ajustar.
import { formatMoney } from '@/lib/utils';

interface MoneyDisplayProps {
  cents: number;
  currency?: 'ARS' | 'USD';
  exchangeRate?: number;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  cents,
  currency = 'ARS',
  exchangeRate,
}) => {
  const formattedAmount = formatMoney(cents, currency);
  const currencyClass = currency === 'USD' ? 'money-usd' : 'money-ars';

  return (
    <div className="flex flex-col">
      <span className={`font-semibold ${currencyClass}`}>
        {formattedAmount}
      </span>
      {exchangeRate && currency === 'USD' && (
        <span className="exchange-rate">
          Tipo de cambio: {formatMoney(exchangeRate, 'ARS')}
        </span>
      )}
    </div>
  );
};
