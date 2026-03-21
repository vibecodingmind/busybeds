'use client';

import { useState } from 'react';
import { useCurrency } from '@/context/CurrencyContext';

export default function CurrencyToggle() {
  const { currency, setCurrency, rate } = useCurrency();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-1">
        <button
          onClick={() => setCurrency('USD')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            currency === 'USD'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          USD
        </button>
        <button
          onClick={() => setCurrency('TZS')}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all relative ${
            currency === 'TZS'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          TZS
          {showTooltip && currency === 'TZS' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
              1 USD = {rate.toLocaleString()} TZS
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gray-900"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
