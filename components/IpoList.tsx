import * as React from 'react';

export interface IpoItem {
  symbol?: string;
  name: string;
  date: string;
  price?: string;
}

export interface IpoListProps {
  ipoCalendarData: IpoItem[];
}

export const IpoList: React.FC<IpoListProps> = ({ ipoCalendarData }) => {
  if (!ipoCalendarData || ipoCalendarData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No upcoming IPOs found in the selected range.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {ipoCalendarData.slice(0, 15).map((ipo) => (
        <li key={ipo.symbol || ipo.name} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
          <div>
            <p className="font-semibold text-gray-800">{ipo.symbol || 'N/A'}</p>
            <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">{ipo.name}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-700">{ipo.date}</p>
            <p className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{ipo.price || 'N/A'}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
