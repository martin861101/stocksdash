"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { AreaChart } from "./ui/area-chart";
import { BarChart } from "./ui/bar-chart";
import { DonutChart } from "./ui/pie-chart";
import { SearchResults } from "./generative-ui/SearchResults";

// API Configurations
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const MARKETSTACK_API_KEY = process.env.NEXT_PUBLIC_MARKETSTACK_API_KEY;
// Note: Marketstack free tier often uses HTTP. If your app is on HTTPS, this might cause mixed content browser errors.
const MARKETSTACK_BASE_URL = 'http://api.marketstack.com/v1';

export function Dashboard() {
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

  useCopilotReadable({
    description: "Stock market dashboard data including S&P 500 trend, watchlist, portfolio metrics, and upcoming IPOs.",
    value: {
      sp500HistoricalData, watchlistData, portfolioAllocationData: dynamicPortfolioAllocationData, ipoCalendarData, livePrices,
      metrics: {
        currentPortfolioValue, dayGainLossAmount: dayGainLoss.amount, dayGainLossPercentage: dayGainLoss.percentage,
        totalReturnAmount: totalReturn.amount, totalReturnPercentage: totalReturn.percentage,
        sp500Current: sp500CurrentDisplay.value, sp500Change: sp500CurrentDisplay.change, sp500ChangePercent: sp500CurrentDisplay.changePercent,
        totalMarketVolume, portfolioYield,
      }
    }
  });

 

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
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Portfolio Value</p>
            <p className="text-xl font-semibold text-gray-900">${currentPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Day's Gain/Loss</p>
            <p className={`text-xl font-semibold ${dayGainLoss.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${dayGainLoss.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})} 
              ({dayGainLoss.percentage.toFixed(2)}%)
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">S&P 500 (SPY Quote)</p>
            <p className={`text-xl font-semibold ${sp500CurrentDisplay.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {sp500CurrentDisplay.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              <span className="text-sm ml-1">
                ({sp500CurrentDisplay.change.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'always'})}, {sp500CurrentDisplay.changePercent.toFixed(2)}%)
              </span>
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Total Return</p>
            <p className={`text-xl font-semibold ${totalReturn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalReturn.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({totalReturn.percentage.toFixed(2)}%)
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Market Volume</p>
            <p className="text-xl font-semibold text-gray-900">{(totalMarketVolume / 1_000_000_000).toFixed(2)}B</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500">Portfolio Yield</p>
            <p className="text-xl font-semibold text-gray-900">{portfolioYield.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* S&P 500 Historical AreaChart Card - Now using Marketstack data */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-base font-medium">S&P 500 Index Performance (SPY - EOD)</CardTitle>
          <CardDescription className="text-xs">Historical End-of-Day trend from Marketstack</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
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
        </CardContent>
      </Card>

      {/* Stock Watchlist - Dynamic */}
      <Card className="col-span-1 md:col-span-1 lg:col-span-2">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-base font-medium">Stock Watchlist</CardTitle>
          <CardDescription className="text-xs">Current price from Finnhub</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
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
        </CardContent>
      </Card>

      {/* Portfolio Allocation - Dynamic */}
      <Card className="col-span-1 md:col-span-1 lg:col-span-2">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-base font-medium">Portfolio Allocation</CardTitle>
          <CardDescription className="text-xs">Distribution by stock holdings</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
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
        </CardContent>
      </Card>

      {/* IPO Calendar - Dynamic */}
      <Card className="col-span-1 md:col-span-1 lg:col-span-2">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-base font-medium">Upcoming IPOs</CardTitle>
          <CardDescription className="text-xs">Initial public offerings in the next 30 days</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-60 overflow-y-auto pr-2">
            {ipoCalendarData && ipoCalendarData.length > 0 ? (
              <ul className="space-y-3">
                {ipoCalendarData.slice(0, 15).map((ipo) => (
                  <li key={ipo.symbol || ipo.name} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{ipo.symbol || 'N/A'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">{ipo.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-700">{ipo.date}</p>
                      <p className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{ipo.price || 'N/A'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No upcoming IPOs found in the selected range.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Price Updates - Dynamic */}
      <Card className="col-span-1 md:col-span-1 lg:col-span-2">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-base font-medium">Live Price Updates</CardTitle>
          <CardDescription className="text-xs">Gold, Silver, and USD/ZAR prices</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-60 overflow-y-auto pr-2">
            <ul className="space-y-4">
              <li className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-800">🥇 Gold (USD)</p>
                <p className="font-mono text-base text-gray-900 bg-gray-100 px-3 py-1 rounded">
                    {typeof livePrices['OANDA:XAU_USD'] === 'number' 
                        ? livePrices['OANDA:XAU_USD'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                        : livePrices['OANDA:XAU_USD']
                    }
                </p>
              </li>
              <li className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-800">🥈 Silver (USD)</p>
                <p className="font-mono text-base text-gray-900 bg-gray-100 px-3 py-1 rounded">
                    {typeof livePrices['OANDA:XAG_USD'] === 'number' 
                        ? livePrices['OANDA:XAG_USD'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                        : livePrices['OANDA:XAG_USD']
                    }
                </p>
              </li>
              <li className="flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-800">🇿🇦 USD/ZAR</p>
                <p className="font-mono text-base text-gray-900 bg-gray-100 px-3 py-1 rounded">
                    {typeof livePrices['OANDA:USD_ZAR'] === 'number' 
                        ? livePrices['OANDA:USD_ZAR'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                        : livePrices['OANDA:USD_ZAR']
                    }
                </p>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}