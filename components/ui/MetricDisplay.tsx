import * as React from 'react';
import { cn } from "@/lib/utils"; // Assuming a utility for classnames

export interface MetricDisplayProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number; // For color coding (e.g., positive/negative)
  changePercent?: number; // Added to display alongside change if needed
  valueClassName?: string;
  subtitle?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({ title, value, unit, change, changePercent, valueClassName, subtitle }) => {
  const displayValue = typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;

  // This logic for changeText was simplified in the last step of previous subtask,
  // as subtitle now handles complex cases. Let's keep it simple.
  let changeText = "";
  if (change !== undefined && changePercent !== undefined) {
     changeText = ` (${change.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})}, ${changePercent.toFixed(2)}%)`;
  } else if (change !== undefined) {
     changeText = ` (${change.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})})`;
  }

  const baseValueClass = "text-xl font-semibold";
  let finalValueClassName = valueClassName || "text-gray-900"; // Default color

  if (change !== undefined) {
    finalValueClassName = change >= 0 ? 'text-green-600' : 'text-red-600';
  }

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <p className={cn(baseValueClass, finalValueClassName)}>
        {unit && typeof displayValue === 'string' && !displayValue.startsWith(unit) && unit !== "$" ? unit : ''}
        {unit === "$" && "$"}
        {displayValue}
        {/* Display change text only if subtitle is not also trying to show it and it's not already in displayValue */}
        {changeText && !subtitle?.includes(change?.toLocaleString() || "###") && typeof displayValue === 'string' && !displayValue.includes(changeText.substring(1)) && <span className="text-sm ml-1">{changeText}</span>}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
};
