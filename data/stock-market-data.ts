// ../data/stock-market-data.ts

// ----------------------------------------------------------------------------------
// DATA FOR CHARTS
// ----------------------------------------------------------------------------------

// Example: Data for a stock index price history (e.g., S&P 500)
// Structure: { date: string (e.g., "Jan 24" or "2024-01-01"), value: number }[]
export const stockIndexHistoryData = [
  { date: "Jan 24", value: 4800 },
  { date: "Feb 24", value: 4850 },
  { date: "Mar 24", value: 4900 },
  { date: "Apr 24", value: 5050 },
  { date: "May 24", value: 5100 },
  { date: "Jun 24", value: 5150 }, // Assuming current month
  // Add more historical data points
];

// Example: Data for a watchlist of specific stocks
// Structure: { ticker: string, currentPrice: number, dayChangePercent: number }[]
export const stockWatchlistData = [
  { ticker: "AAPL", currentPrice: 195.50, dayChangePercent: 1.2 },
  { ticker: "MSFT", currentPrice: 420.30, dayChangePercent: -0.5 },
  { ticker: "GOOGL", currentPrice: 175.80, dayChangePercent: 0.8 },
  { ticker: "AMZN", currentPrice: 185.20, dayChangePercent: -1.1 },
  { ticker: "NVDA", currentPrice: 1205.60, dayChangePercent: 2.5 },
];

// Example: Data for portfolio allocation
// Structure: { name: string (asset class/sector), value: number (percentage) }[]
export const portfolioAllocationData = [
  { name: "US Large Cap", value: 40 },
  { name: "International Equities", value: 25 },
  { name: "Fixed Income", value: 20 },
  { name: "Real Estate", value: 10 },
  { name: "Cash", value: 5 },
];

// Example: Data for sector performance (e.g., daily or weekly % change)
// Structure: { sector: string, performance: number (% change) }[]
export const sectorPerformanceData = [
  { sector: "Technology", performance: 1.8 },
  { sector: "Healthcare", performance: -0.5 },
  { sector: "Financials", performance: 0.9 },
  { sector: "Consumer Discretionary", performance: 1.2 },
  { sector: "Energy", performance: -1.3 },
  { sector: "Industrials", performance: 0.4 },
];

// Example: Data for top market movers (gainers)
// Structure: { ticker: string, change: number (% positive change) }[]
export const marketMoversData = [
  { ticker: "TSLA", change: 5.75 },
  { ticker: "AMD", change: 4.50 },
  { ticker: "PYPL", change: 3.90 },
  { ticker: "SQ", change: 3.25 },
  { ticker: "UBER", change: 2.80 },
];

// ----------------------------------------------------------------------------------
// CALCULATION FUNCTIONS FOR KEY METRICS
// ----------------------------------------------------------------------------------

// For a real application, these functions would likely calculate values based on
// fetched data, portfolio holdings, etc. For this example, they return static values.

export const calculateCurrentPortfolioValue = (): number => {
  // Example: Sum of current values of all holdings
  return 135750.75;
};

export const calculateDayGainLoss = (): { amount: number; percentage: number } => {
  // Example: Today's change in portfolio value
  const amount = 1250.25; // Positive for gain, negative for loss
  const previousDayValue = calculateCurrentPortfolioValue() - amount;
  const percentage = previousDayValue === 0 ? 0 : (amount / previousDayValue) * 100;
  return { amount, percentage };
};

export const calculateOverallPortfolioReturn = (): { amount: number; percentage: number } => {
  // Example: Total return since inception or a specific period
  const initialInvestment = 100000;
  const current_value = calculateCurrentPortfolioValue();
  const amount = current_value - initialInvestment;
  const percentage = initialInvestment === 0 ? 0 : (amount / initialInvestment) * 100;
  return { amount, percentage };
};

export const getSP500CurrentValue = (): { value: number; change: number; changePercent: number } => {
  // Example: Get the latest S&P 500 data (or any other index you are tracking)
  const latestIndexData = stockIndexHistoryData[stockIndexHistoryData.length - 1];
  const previousIndexData = stockIndexHistoryData.length > 1 ? stockIndexHistoryData[stockIndexHistoryData.length - 2] : { value: latestIndexData.value }; // Handle no previous data
  
  const value = latestIndexData.value;
  const change = value - previousIndexData.value;
  const changePercent = previousIndexData.value === 0 ? 0 : (change / previousIndexData.value) * 100;
  
  return { value, change, changePercent };
};

export const getTotalMarketVolume = (): number => {
  // Example: Aggregate trading volume for a market (e.g., NYSE or a specific index)
  // This would typically come from an API.
  return 3580000000; // Example: 3.58 Billion shares
};

export const getPortfolioYield = (): number => {
  // Example: Dividend yield of the portfolio
  return 1.85; // As a percentage, e.g., 1.85%
};

// Remove or comment out the old sales data and related functions:
/*
export const salesData = [
  { date: "Jan 22", Sales: 2890, Profit: 2400, Expenses: 490, Customers: 145 },
  { date: "Feb 22", Sales: 1890, Profit: 1398, Expenses: 492, Customers: 112 },
  { date: "Mar 22", Sales: 3890, Profit: 2980, Expenses: 910, Customers: 194 },
  // ... other sales data
];

export const productData = [ ... ];
export const categoryData = [ ... ];
// ... etc. for all old sales-related exports

export const calculateTotalRevenue = () => { ... };
export const calculateTotalProfit = () => { ... };
// ... etc. for all old calculation functions
*/

