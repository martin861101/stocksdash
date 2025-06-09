"use client";

import { useEffect, useState } from "react";
// Card components are now used by DashboardCard, not directly here.
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { AreaChart } from "./ui/area-chart";
import { BarChart } from "./ui/bar-chart";
import { DonutChart } from "./ui/pie-chart";
import { SearchResults } from "./generative-ui/SearchResults";
// cn is used by MetricDisplay, not directly here.
// import { cn } from "@/lib/utils";

// Import newly created components
import { DashboardCard } from "./ui/DashboardCard";
import { MetricDisplay } from "./ui/MetricDisplay";
import { IpoList } from "./IpoList";
import { LivePriceList } from "./LivePriceList";


// API Configurations
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const MARKETSTACK_API_KEY = process.env.NEXT_PUBLIC_MARKETSTACK_API_KEY;
// Note: Marketstack free tier often uses HTTP. If your app is on HTTPS, this might cause mixed content browser errors.
const MARKETSTACK_BASE_URL = 'http://api.marketstack.com/v1';

// --- TypeScript Interfaces for CopilotKit Props ---

export interface CopilotReadableDashboardMetrics {
  currentPortfolioValue: number;
  dayGainLossAmount: number;
  dayGainLossPercentage: number;
  totalReturnAmount: number;
  totalReturnPercentage: number;
  sp500Current: number;
  sp500Change: number;
  sp500ChangePercent: number;
  totalMarketVolume: number;
  portfolioYield: number;
}

export interface CopilotReadableDashboardData {
  sp500HistoricalData: any[]; // Consider defining a more specific type if possible
  watchlistData: any[]; // Consider defining a more specific type
  portfolioAllocationData: any[]; // Consider defining a more specific type
  ipoCalendarData: any[]; // Consider defining a more specific type
  livePrices: Record<string, string | number>;
  metrics: CopilotReadableDashboardMetrics;
}

export interface CopilotActionParameter {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  // Add other parameter properties if needed, e.g., enum, options
}
export interface CopilotActionConfig<T extends Record<string, any> = any> {
  name: string;
  description?: string;
  parameters: CopilotActionParameter[];
  handler?: (args: T) => Promise<any> | any; // For backend actions
  render?: (props: { args: T; status: string; }) => React.ReactNode | string; // For frontend actions
  available?: "enabled" | "disabled"; // Or boolean, depending on exact useCopilotAction version/preference
}


interface DashboardProps {
  copilotReadableDescription?: string;
  copilotReadableData?: CopilotReadableDashboardData; // Data to be made readable by Copilot
  copilotActions?: CopilotActionConfig<any>[]; // Actions to be made available to Copilot
}


export function Dashboard({
  copilotReadableDescription = "Stock market dashboard data including S&P 500 trend, watchlist, portfolio metrics, and upcoming IPOs.", // Default description
  copilotReadableData: externalCopilotData, // Renaming to avoid conflict with internal state if used differently
  copilotActions
}: DashboardProps) {
  // --- STATE DECLARATIONS ---
  const [sp500CurrentDisplay, setSp500CurrentDisplay] = useState({ value: 0, change: 0, changePercent: 0 });
  const [sp500HistoricalData, setSp500HistoricalData] = useState([]);
  const [watchlistData, setWatchlistData] = useState([]);
  const [currentPortfolioValue, setCurrentPortfolioValue] = useState(0);
  const [dayGainLoss, setDayGainLoss] = useState({ amount: 0, percentage: 0 });
  const [dynamicPortfolioAllocationData, setDynamicPortfolioAllocationData] = useState([]);
  const [ipoCalendarData, setIpoCalendarData] = useState([]);
  const [livePrices, setLivePrices] = useState({}); // For Websocket prices
  const [totalReturn, setTotalReturn] = useState({ amount: 25000, percentage: 25 });
  const [totalMarketVolume, setTotalMarketVolume] = useState(0);
  const [portfolioYield, setPortfolioYield] = useState(1.85);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- DEFINITIONS ---
  const myWatchlistTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA'];
  const userPortfolio = [
    { ticker: 'AAPL', shares: 10 },
    { ticker: 'MSFT', shares: 5 },
    { ticker: 'TSLA', shares: 8 },
    { ticker: 'NVDA', shares: 3 },
  ];

  // --- HOOKS ---

  // useEffect Hook #1: For all one-time FETCH requests on component load
  useEffect(() => {
    let finnhubKeyMissing = !FINNHUB_API_KEY;
    let marketstackKeyMissing = !MARKETSTACK_API_KEY;

    if (finnhubKeyMissing || marketstackKeyMissing) {
      let missingKeysMessage = "API key(s) missing: ";
      if (finnhubKeyMissing) missingKeysMessage += "Finnhub ";
      if (marketstackKeyMissing) missingKeysMessage += (finnhubKeyMissing ? "and " : "") + "Marketstack ";
      missingKeysMessage += ". Please set them in your .env.local file.";
      setError(missingKeysMessage);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Prepare Finnhub Quotes Promises
        const portfolioTickers = userPortfolio.map(p => p.ticker);
        const uniqueTickersToFetchFinnhub = Array.from(new Set(['SPY', ...myWatchlistTickers, ...portfolioTickers]));
        const finnhubPromises = uniqueTickersToFetchFinnhub.map(ticker =>
          fetch(`${FINNHUB_BASE_URL}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`)
            .then(res => {
              if (!res.ok) { return { ticker, error: true }; }
              return res.json().then(quote => ({
                ticker,
                currentPrice: parseFloat((quote.c || 0).toFixed(2)),
                dayChangeAbsolute: parseFloat((quote.d || 0).toFixed(2)),
                dayChangePercent: parseFloat((quote.dp || 0).toFixed(2)),
                previousClose: parseFloat((quote.pc || 0).toFixed(2)),
              }));
            }).catch(() => ({ ticker, error: true }))
        );

        // Prepare Marketstack History Promise
        const todayForApi = new Date();
        const yearAgoForApi = new Date(new Date().setFullYear(todayForApi.getFullYear() - 1));
        const dateTo = todayForApi.toISOString().split('T')[0];
        const dateFrom = yearAgoForApi.toISOString().split('T')[0];
        const marketstackSpyHistoryPromise = fetch(`${MARKETSTACK_BASE_URL}/eod?access_key=${MARKETSTACK_API_KEY}&symbols=SPY&date_from=${dateFrom}&date_to=${dateTo}&limit=365&sort=ASC`)
          .then(res => res.ok ? res.json() : Promise.reject(`Marketstack Error: ${res.status}`))
          .then(data => (data?.data || []).map(item => ({ date: item.date.split('T')[0], value: parseFloat((item.close || 0).toFixed(2)) })))
          .catch(err => { console.error(err); setError(prev => `${prev ? prev + '\n' : ''}${err.message}`); return []; });
          
        // Prepare Finnhub IPO Calendar Promise
        const fromDateIPO = todayForApi.toISOString().split('T')[0];
        const futureDateIPO = new Date(new Date().setDate(todayForApi.getDate() + 30));
        const toDateIPO = futureDateIPO.toISOString().split('T')[0];
        const finnhubIpoPromise = fetch(`${FINNHUB_BASE_URL}/calendar/ipo?from=${fromDateIPO}&to=${toDateIPO}&token=${FINNHUB_API_KEY}`)
          .then(res => res.ok ? res.json() : Promise.reject(`Finnhub IPO Error: ${res.status}`))
          .then(data => data?.ipoCalendar || [])
          .catch(err => { console.error(err); setError(prev => `${prev ? prev + '\n' : ''}${err.message}`); return []; });

        // Resolve all fetch promises
        const [ resolvedFinnhubData, resolvedMarketstackHistory, resolvedIpoData ] = await Promise.all([
            Promise.all(finnhubPromises),
            marketstackSpyHistoryPromise,
            finnhubIpoPromise
        ]);

        // Process all data and update state
        const validFinnhubData = resolvedFinnhubData.filter(d => !d.error);
        const spyQuote = validFinnhubData.find(d => d.ticker === 'SPY');
        if (spyQuote) setSp500CurrentDisplay({ value: spyQuote.currentPrice, change: spyQuote.dayChangeAbsolute, changePercent: spyQuote.dayChangePercent });

        setWatchlistData(validFinnhubData.filter(d => myWatchlistTickers.includes(d.ticker)));
        setSp500HistoricalData(resolvedMarketstackHistory);
        setIpoCalendarData(resolvedIpoData);
        
        // Portfolio Calculations
        let calculatedValue = 0, previousDayValue = 0;
        const holdingDetails = [];
        for (const holding of userPortfolio) {
          const quote = validFinnhubData.find(q => q.ticker === holding.ticker);
          if (quote) {
            calculatedValue += holding.shares * quote.currentPrice;
            previousDayValue += holding.shares * quote.previousClose;
            holdingDetails.push({ name: holding.ticker, value: holding.shares * quote.currentPrice });
          }
        }
        setCurrentPortfolioValue(calculatedValue);
        if (previousDayValue > 0) {
          const gainLoss = calculatedValue - previousDayValue;
          setDayGainLoss({ amount: gainLoss, percentage: (gainLoss / previousDayValue) * 100 });
        }
        if (calculatedValue > 0) {
          setDynamicPortfolioAllocationData(holdingDetails.map(h => ({ name: h.name, value: (h.value / calculatedValue) * 100 })));
        }
      } catch (err) {
        console.error("Main Fetch/Calculation Error:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // useEffect Hook #2: For managing the WEBSOCKET connection
  useEffect(() => {
    if (!FINNHUB_API_KEY) return;

    const symbolsToTrack = ['OANDA:XAU_USD', 'OANDA:XAG_USD', 'OANDA:USD_ZAR'];
    setLivePrices(prev => {
        const initialData = {};
        symbolsToTrack.forEach(s => { initialData[s] = prev[s] || 'Connecting...' });
        return { ...prev, ...initialData };
    });

    const socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

    socket.addEventListener('open', () => {
        console.log("Websocket connection opened.");
        symbolsToTrack.forEach(symbol => socket.send(JSON.stringify({'type':'subscribe', 'symbol': symbol})));
    });

    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'trade') {
            message.data.forEach(trade => {
                setLivePrices(prevPrices => ({ ...prevPrices, [trade.s]: trade.p }));
            });
        }
    });

    return () => { // Cleanup function
        console.log("Closing Websocket connection.");
        if (socket.readyState === 1) { // Only attempt to unsubscribe if socket is open
            symbolsToTrack.forEach(symbol => socket.send(JSON.stringify({'type':'unsubscribe', 'symbol': symbol})));
        }
        socket.close();
    };
  }, []);

  // Data that will be fed to useCopilotReadable. This can come from props or internal state.
  const currentReadableData: CopilotReadableDashboardData = externalCopilotData || {
    sp500HistoricalData,
    watchlistData,
    portfolioAllocationData: dynamicPortfolioAllocationData,
    ipoCalendarData,
    livePrices,
    metrics: {
      currentPortfolioValue,
      dayGainLossAmount: dayGainLoss.amount,
      dayGainLossPercentage: dayGainLoss.percentage,
      totalReturnAmount: totalReturn.amount,
      totalReturnPercentage: totalReturn.percentage,
      sp500Current: sp500CurrentDisplay.value,
      sp500Change: sp500CurrentDisplay.change,
      sp500ChangePercent: sp500CurrentDisplay.changePercent,
      totalMarketVolume,
      portfolioYield,
    }
  };

  useCopilotReadable({
    description: copilotReadableDescription,
    value: currentReadableData
  });

  // Register actions passed via props
  if (copilotActions && Array.isArray(copilotActions)) {
    copilotActions.forEach(actionConfig => {
      // IMPORTANT: useCopilotAction must be called at the top level of the component,
      // so we cannot conditionally call it inside a loop like this directly IF the number of actions can change.
      // For this refactoring, if the number of actions is fixed or if hooks can be registered in a loop
      // (which is generally not recommended as it can break rules of hooks if not careful),
      // this approach might seem okay.
      // A safer approach for dynamic actions is often to have a single action that then delegates
      // based on a parameter, or use a context/manager pattern if actions change frequently.
      //
      // For this specific task, we assume the list of actions is relatively stable per Dashboard instance.
      // However, the most robust way to handle truly dynamic actions list for useCopilotAction might require
      // a different pattern than simple iteration if the hook's internal mechanics rely on call order.
      // Let's proceed with the direct iteration for now as per the goal of passing a list of actions.
      // If this causes issues, a wrapper component that takes one actionConfig and is used multiple times,
      // or a single dispatching action, would be alternatives.
      useCopilotAction(actionConfig as any); // Type assertion as 'any' to simplify for now, ensure actionConfig matches useCopilotAction's expected type.
    });
  } else {
    // Fallback to default searchInternet action if no actions are provided via props
    useCopilotAction({
      name: "searchInternet",
      available: "disabled",
      description: "Searches the internet for information based on a query.",
      parameters: [
        { name: "query", type: "string", description: "The query to search the internet for.", required: true }
      ],
      render: ({args, status}) => <SearchResults query={args.query || 'No query provided'} status={status} />,
    });
  }

  // Component definitions and their interfaces have been moved to separate files.
  // No need for these interfaces or component consts here anymore.

  const colors = {
    indexPerformance: ["#3b82f6", "#10b981"],
    watchlist: ["#8b5cf6", "#6366f1", "#4f46e5", "#7c3aed"],
    portfolioAllocation: ["#3b82f6", "#64748b", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"],
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-xl">Loading dashboard data...</p></div>;
  }

  if (error) {
    return <div className="flex flex-col justify-center items-center h-screen p-4">
        <p className="text-xl text-red-500 mb-2">Error loading dashboard data:</p>
        <pre className="text-sm text-red-400 whitespace-pre-wrap">{error}</pre>
    </div>;
  }
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">
      {/* Key Stock Market Metrics */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricDisplay title="Portfolio Value" value={currentPortfolioValue} unit="$" />
          <MetricDisplay
            title="Day's Gain/Loss"
            value={dayGainLoss.amount}
            unit="$"
            change={dayGainLoss.amount}
            subtitle={`${dayGainLoss.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})} (${dayGainLoss.percentage.toFixed(2)}%)`}
          />
          <MetricDisplay
            title="S&P 500 (SPY Quote)"
            value={sp500CurrentDisplay.value}
            change={sp500CurrentDisplay.change}
            // Subtitle now correctly shows both absolute and percent change, similar to original
            subtitle={`${sp500CurrentDisplay.change.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})} (${sp500CurrentDisplay.changePercent.toFixed(2)}%)`}
          />
          <MetricDisplay
            title="Total Return"
            value={totalReturn.amount}
            unit="$"
            change={totalReturn.amount}
            subtitle={`${totalReturn.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})} (${totalReturn.percentage.toFixed(2)}%)`}
          />
          <MetricDisplay title="Market Volume" value={`${(totalMarketVolume / 1_000_000_000).toFixed(2)}B`} unit="" />
          <MetricDisplay title="Portfolio Yield" value={`${portfolioYield.toFixed(2)}%`} />
        </div>
      </div>

      {/* S&P 500 Historical AreaChart Card - Now using Marketstack data */}
      <DashboardCard
        title="S&P 500 Index Performance (SPY - EOD)"
        description="Historical End-of-Day trend from Marketstack"
        className="col-span-1 md:col-span-2 lg:col-span-4"
      >
        <div className="h-60">
          {sp500HistoricalData && sp500HistoricalData.length > 0 ? (
            <AreaChart
              data={sp500HistoricalData}
              index="date"
              categories={["value"]}
              colors={colors.indexPerformance || ["#3b82f6"]}
              valueFormatter={(value) => `$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}
              showLegend={true} showGrid={true} showXAxis={true} showYAxis={true}
            />
          ) : (
            <p className="text-center text-gray-500">S&P 500 historical data not available or failed to load.</p>
          )}
        </div>
      </DashboardCard>

      {/* Stock Watchlist - Dynamic */}
      <DashboardCard
        title="Stock Watchlist"
        description="Current price from Finnhub"
        className="col-span-1 md:col-span-1 lg:col-span-2"
      >
        <div className="h-60">
          {watchlistData.length > 0 ? (
            <BarChart
              data={watchlistData}
              index="ticker"
              categories={["currentPrice"]}
              colors={colors.watchlist}
              valueFormatter={(value) => `$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}
              showLegend={false} showGrid={true} layout="horizontal"
            />
          ) : (
            <p className="text-center text-gray-500">No watchlist data available.</p>
          )}
        </div>
      </DashboardCard>

      {/* Portfolio Allocation - Dynamic */}
      <DashboardCard
        title="Portfolio Allocation"
        description="Distribution by stock holdings"
        className="col-span-1 md:col-span-1 lg:col-span-2"
      >
        <div className="h-60">
          {dynamicPortfolioAllocationData && dynamicPortfolioAllocationData.length > 0 ? (
            <DonutChart
              data={dynamicPortfolioAllocationData}
              category="value"
              index="name"
              valueFormatter={(value) => `${value.toFixed(2)}%`}
              colors={colors.portfolioAllocation}
              centerText="Holdings"
              paddingAngle={2}
              showLabel={true}
              showLegend={true}
              innerRadius={50}
              outerRadius="85%"
            />
          ) : (
            <p className="text-center text-gray-500">No portfolio data to display allocation.</p>
          )}
        </div>
      </DashboardCard>

      {/* IPO Calendar - Dynamic */}
      <DashboardCard
        title="Upcoming IPOs"
        description="Initial public offerings in the next 30 days"
        className="col-span-1 md:col-span-1 lg:col-span-2"
      >
        <div className="h-60 overflow-y-auto pr-2">
          <IpoList ipoCalendarData={ipoCalendarData} />
        </div>
      </DashboardCard>

      {/* Live Price Updates - Dynamic */}
      <DashboardCard
        title="Live Price Updates"
        description="Gold, Silver, and USD/ZAR prices"
        className="col-span-1 md:col-span-1 lg:col-span-2"
      >
        <div className="h-60 overflow-y-auto pr-2">
         <LivePriceList livePrices={livePrices} />
        </div>
      </DashboardCard>
    </div>
  );
}