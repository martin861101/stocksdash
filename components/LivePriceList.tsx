import * as React from 'react';

export interface LivePrices {
  [key: string]: string | number;
}

export interface LivePriceListProps {
  livePrices: LivePrices;
}

export const LivePriceList: React.FC<LivePriceListProps> = ({ livePrices }) => {
  const priceItems = [
    { id: 'OANDA:XAU_USD', label: '🥇 Gold (USD)', digits: 2 },
    { id: 'OANDA:XAG_USD', label: '🥈 Silver (USD)', digits: 4 },
    { id: 'OANDA:USD_ZAR', label: '🇿🇦 USD/ZAR', digits: 4 },
  ];

  return (
    <ul className="space-y-4">
      {priceItems.map(item => (
        <li key={item.id} className="flex justify-between items-center text-sm">
          <p className="font-semibold text-gray-800">{item.label}</p>
          <p className="font-mono text-base text-gray-900 bg-gray-100 px-3 py-1 rounded">
            {typeof livePrices[item.id] === 'number'
              ? (livePrices[item.id] as number).toLocaleString(undefined, { minimumFractionDigits: item.digits, maximumFractionDigits: item.digits })
              : livePrices[item.id] // Displays "Connecting..." or error
            }
          </p>
        </li>
      ))}
    </ul>
  );
};
