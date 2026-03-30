# CopilotKit Dashboard Integration Guide

This guide explains how to integrate the refactored `Dashboard` component, powered by CopilotKit, into your Next.js application. The Dashboard provides a rich, AI-assisted view of financial data, and can be customized with your own data and actions.

## Core Concepts

The `Dashboard` component is designed to display various financial metrics, charts, and lists. It leverages CopilotKit to provide AI capabilities, allowing users to interact with and query the displayed data using natural language.

**Key Components:**

*   **`Dashboard.tsx`**: The main component that orchestrates data fetching (optional, can be provided via props), UI rendering, and CopilotKit integration.
*   **`DashboardCard.tsx`**: A reusable UI component for displaying content within a card layout.
*   **`MetricDisplay.tsx`**: A reusable UI component for displaying individual metrics.
*   **`IpoList.tsx`**: A component to display a list of upcoming IPOs.
*   **`LivePriceList.tsx`**: A component to display live price updates (e.g., for commodities).
*   **`SearchResults.tsx`**: A component used by the default `searchInternet` action to display search results.

These components work together to create a dynamic and interactive dashboard experience.

## Prerequisites

Before integrating the Dashboard, ensure your project has the following:

*   **Node.js** (version recommended by Next.js)
*   **Next.js** (version ~14.2.3 or compatible)
*   **React** (version ~18.2.0 or compatible)
*   **Tailwind CSS**: The components are styled with Tailwind CSS. Ensure it's set up in your project.
*   **shadcn/ui**: Some UI elements like `Card` are based on shadcn/ui. You should have this initialized or be prepared to adapt the styles. (`components.json` suggests its usage).

**Key Dependencies from `package.json`:**

*   `@copilotkit/react-core`: For core CopilotKit functionalities.
*   `@copilotkit/react-ui`: For UI components like `CopilotSidebar`.
*   `@copilotkit/runtime`: For backend runtime capabilities.
*   `next`: The Next.js framework.
*   `react`, `react-dom`: React library.
*   `recharts`: For rendering charts (AreaChart, BarChart, DonutChart).
*   `tailwindcss`: For styling.
*   `clsx`, `tailwind-merge`: Utilities for managing Tailwind CSS classes.
*   `lucide-react`: For icons.
*   `@tremor/react`: Some chart components (`area-chart.tsx`, `bar-chart.tsx`, `pie-chart.tsx` located in `components/ui/`) are based on Tremor components, which are then used by the Dashboard.

Ensure these or compatible versions are listed in your project's `package.json`.

## Integration Steps

### 1. Copying Files

Copy the following files and directories from this repository into your project:

*   **Main Dashboard Component:**
    *   `components/Dashboard.tsx`
*   **UI Components (used by Dashboard):**
    *   `components/ui/DashboardCard.tsx`
    *   `components/ui/MetricDisplay.tsx`
    *   `components/ui/area-chart.tsx` (and its dependencies if any, based on Tremor)
    *   `components/ui/bar-chart.tsx` (and its dependencies if any, based on Tremor)
    *   `components/ui/pie-chart.tsx` (and its dependencies if any, based on Tremor)
    *   `components/ui/card.tsx` (if using the shadcn/ui Card component directly)
*   **Specific List Components (used by Dashboard):**
    *   `components/IpoList.tsx`
    *   `components/LivePriceList.tsx`
*   **Generative UI Components (used by actions):**
    *   `components/generative-ui/SearchResults.tsx`
*   **Supporting Libraries/Utilities (if any specific to the dashboard functionality):**
    *   `lib/utils.ts` (if it contains `cn` or other utilities used by the components)
*   **Type Definitions (if separated, otherwise they are in `Dashboard.tsx`):**
    *   Ensure `CopilotReadableDashboardData`, `CopilotReadableDashboardMetrics`, `CopilotActionConfig`, and `CopilotActionParameter` interfaces are available to your page component and the Dashboard. These are currently defined in `components/Dashboard.tsx` but can be moved to a central `types/copilot.ts` or similar.

### 2. CopilotKit Backend Setup

You need a CopilotKit backend endpoint to handle actions that require server-side processing. The `searchInternet` action, for instance, can be implemented via a backend.

Create a route handler in your Next.js project, for example, at `app/api/copilotkit/route.ts`:

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime } from "@copilotkit/runtime";
import { TavilyResearch } from "./tavily"; // Example: Using Tavily for search

export async function POST(req: Request): Promise<Response> {
  const copilotKit = new CopilotRuntime();

  // Example: Implementing a research action using Tavily
  const researchAction = async ({ query }: { query: string }) => {
    console.log("Researching query: ", query);
    if (!process.env.TAVILY_API_KEY) {
      throw new Error("Tavily API key not set.");
    }
    const tavily = new TavilyResearch(process.env.TAVILY_API_KEY);
    const result = await tavily.search(query);
    console.log("Research result: ", result);
    return result;
  };

  return copilotKit.response(req, researchAction);
  // If you have multiple backend actions, you can chain them or use a more sophisticated handler.
  // For example, if your action is named "searchInternet" in the frontend config:
  //
  // return copilotKit.response(req, new CopilotRuntime({
  //   actions: [
  //     {
  //       name: "searchInternet", // Must match the name in frontend CopilotActionConfig
  //       description: "Performs a search on the internet.",
  //       parameters: [
  //         { name: "query", type: "string", description: "The search query." }
  //       ],
  //       handler: async ({ query }) => {
  //         console.log("Backend searchInternet action called with query:", query);
  //         // Implement your actual search logic here (e.g., using Tavily or other search API)
  //         // This is a placeholder for the actual search implementation
  //         if (!process.env.TAVILY_API_KEY) {
  //            console.error("Tavily API key not set for backend searchInternet action.");
  //            return { error: "Search API key not configured." };
  //         }
  //         const tavily = new TavilyResearch(process.env.TAVILY_API_KEY);
  //         try {
  //           const result = await tavily.search(query, { maxResults: 5 });
  //           return { searchResults: result };
  //         } catch (error) {
  //           console.error("Error during Tavily search:", error);
  //           return { error: "Failed to perform search." };
  //         }
  //       }
  //     }
  //   ]
  // }));
}

// Example helper for Tavily (e.g., in app/api/copilotkit/tavily.ts)
/*
import TavilyCore from '@tavily/core';

export class TavilyResearch {
  private tavily: TavilyCore;

  constructor(apiKey: string) {
    this.tavily = new TavilyCore({ apiKey });
  }

  async search(query: string, options?: any): Promise<any> {
    try {
      const searchResponse = await this.tavily.search(query, { ...options, topic: "general" });
      return searchResponse.results; // Adjust based on actual TavilyCore response structure
    } catch (error) {
      console.error('Error performing search with Tavily:', error);
      throw error;
    }
  }
}
*/
```
**Note:** The above example uses Tavily for the search. You'll need to install `@tavily/core` and set up the `TAVILY_API_KEY` environment variable. Adapt this to your preferred search provider or backend service. If your `searchInternet` action is purely frontend (using the `render` function to display results from a client-side fetch), you might not need a specific backend handler for it, but the API route is still essential for CopilotKit's core functionality.

### 3. Using the `Dashboard` Component

Import and render the `Dashboard` component in your desired page (e.g., `app/page.tsx`).

```typescript
// app/page.tsx
"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { Dashboard, CopilotActionConfig, CopilotReadableDashboardData } from "../components/Dashboard"; // Adjust path as needed
import { Header } from "../components/Header"; // Your app's Header
import { Footer } from "../components/Footer"; // Your app's Footer
import { SearchResults } from "../components/generative-ui/SearchResults"; // For the searchInternet action
// Potentially import other components for custom messages, etc.

export default function MyDashboardPage() {
  // Define the data to be made readable by Copilot
  // This can be fetched, static, or come from state management
  const dashboardDataForCopilot: CopilotReadableDashboardData | undefined = undefined;
  // If undefined, Dashboard uses its internal fetched data for Copilot.
  // Example structure (ensure it matches CopilotReadableDashboardData):
  /*
  const dashboardDataForCopilot: CopilotReadableDashboardData = {
    sp500HistoricalData: [{ date: "2023-01-01", value: 4000 }], // Sample data
    watchlistData: [{ ticker: "AAPL", currentPrice: 150 }], // Sample data
    portfolioAllocationData: [{ name: "AAPL", value: 50 }], // Sample data
    ipoCalendarData: [{ symbol: "NEWCO", name: "New Company Inc.", date: "2024-12-01", price: "20-25 USD" }], // Sample data
    livePrices: { "OANDA:XAU_USD": "Connecting..." }, // Sample data
    metrics: {
      currentPortfolioValue: 100000,
      dayGainLossAmount: 500,
      dayGainLossPercentage: 0.5,
      totalReturnAmount: 10000,
      totalReturnPercentage: 10,
      sp500Current: 4500,
      sp500Change: 10,
      sp500ChangePercent: 0.22,
      totalMarketVolume: 5000000000,
      portfolioYield: 2.1,
    },
  };
  */

  // Define actions for Copilot
  const actions: CopilotActionConfig<any>[] = [
    {
      name: "searchInternet",
      available: "disabled", // 'disabled' means AI can use it, but not shown as a button for user to click
      description: "Searches the internet for information based on a query.",
      parameters: [
        { name: "query", type: "string", description: "The query to search for.", required: true }
      ],
      // For frontend rendering of results:
      render: ({ args, status }) => <SearchResults query={args.query || ""} status={status} />,
      // Or, for a backend handler (if you set up the backend route for it):
      // handler: async ({ query }) => { /* This will be handled by your backend API route */ }
    },
    // Add more custom actions here
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow">
        <Dashboard
          copilotReadableDescription="My custom dashboard providing financial insights."
          copilotReadableData={dashboardDataForCopilot} // Optional: Dashboard falls back to internal data if not provided
          copilotActions={actions}
        />
      </main>
      <Footer />
      <CopilotSidebar
        labels={{
          title: "Dashboard AI Assistant",
          initial: "Hello! Ask me about the data in the dashboard.",
        }}
        // You might need to provide the backend service URL if it's different from the default /api/copilotkit
        // serviceUrl="/api/copilotkit"
      />
    </div>
  );
}
```

**Key Props for `<Dashboard />`:**

*   **`copilotReadableDescription`** (string, optional): A high-level description of the data context you're providing to the AI. Defaults to a generic stock market description if not provided.
*   **`copilotReadableData`** (object, optional): The actual data object that CopilotKit will use. Its structure must match the `CopilotReadableDashboardData` interface (see below). If this prop is not provided, the `Dashboard` component will use its own internally fetched financial data and make that readable to Copilot.
*   **`copilotActions`** (array of `CopilotActionConfig`, optional): An array of action configurations that the AI can invoke. If not provided, a default `searchInternet` action (frontend rendered) is available.

### 4. Data Structure for `copilotReadableData`

The `copilotReadableData` prop should conform to the `CopilotReadableDashboardData` interface. This interface is (or can be) defined in `components/Dashboard.tsx` or a shared types file:

```typescript
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
  sp500HistoricalData: any[]; // e.g., { date: string, value: number }[]
  watchlistData: any[];      // e.g., { ticker: string, currentPrice: number, ... }[]
  portfolioAllocationData: any[]; // e.g., { name: string, value: number }[]
  ipoCalendarData: any[];       // e.g., { symbol?: string, name: string, date: string, price?: string }[]
  livePrices: Record<string, string | number>; // e.g., { "OANDA:XAU_USD": 1980.50 }
  metrics: CopilotReadableDashboardMetrics;
}
```
Ensure the data you provide matches this structure for the AI to understand it correctly.

### 5. Customizing Actions

You can define custom actions and pass them to the `Dashboard` via the `copilotActions` prop. Each action configuration is an object:

```typescript
// Example of a custom frontend action
const myCustomFrontendAction: CopilotActionConfig = {
  name: "showCustomAlert",
  description: "Shows a custom alert message.",
  parameters: [{ name: "message", type: "string", description: "The message to display.", required: true }],
  render: ({ args }) => {
    alert(args.message); // Simple alert, could be a modal or any React component
    return "Alert shown with message: " + args.message; // Feedback to Copilot
  },
};

// Example of a custom backend action
const myCustomBackendAction: CopilotActionConfig = {
  name: "processDataOnServer",
  description: "Processes some data on the server.",
  parameters: [{ name: "dataId", type: "string", description: "The ID of the data to process." }],
  // 'handler' implies this will be handled by your backend /api/copilotkit/route.ts
  // Ensure your backend route is set up to handle an action with this name.
  handler: async ({ dataId }) => {
    // This function itself doesn't run on the client.
    // CopilotKit sends this action to the backend.
    // The backend would have a corresponding handler for "processDataOnServer".
    console.log(`Action 'processDataOnServer' called for dataId: ${dataId}. Will be sent to backend.`);
    // You might return a summary or status from the backend.
    return { status: "processing_initiated", dataId };
  }
};

// Then pass these in your page:
// copilotActions={[searchInternetAction, myCustomFrontendAction, myCustomBackendAction]}
```

For backend actions, ensure your `/api/copilotkit/route.ts` is set up to handle the action by its `name`.

## Styling

The `Dashboard` and its sub-components are styled using **Tailwind CSS**. Many UI elements like `Card`, charts, etc., are based on **shadcn/ui** and **Tremor**. For the components to render correctly:

*   Ensure Tailwind CSS is correctly configured in your project.
*   If you haven't already, initialize shadcn/ui in your project (`npx shadcn-ui@latest init`) or ensure you have equivalent styles for card-like elements.
*   The Tremor-based charts (`area-chart.tsx`, etc.) are designed to work with Tailwind and have their own specific class dependencies that should be met by your Tailwind setup.

## Example Usage (`app/page.tsx` snippet)

This provides a more complete example of how `app/page.tsx` (or any other page) might integrate the Dashboard.

```typescript
// app/page.tsx (Simplified Example)
"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import {
  Dashboard,
  type CopilotActionConfig, // Import type
  type CopilotReadableDashboardData // Import type
} from "../components/Dashboard"; // Adjust path
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SearchResults } from "../components/generative-ui/SearchResults";
import { useEffect, useState } from "react"; // For fetching custom data example

// Define custom types for your data if needed, e.g., for sp500HistoricalData
type HistoricalDataItem = { date: string; value: number; };

export default function MyPage() {
  const [customDashboardData, setCustomDashboardData] = useState<CopilotReadableDashboardData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Example: Fetch or prepare data for the dashboard
  useEffect(() => {
    // Simulate data fetching
    const fetchData = async () => {
      setIsLoading(true);
      // In a real app, fetch this data from your APIs
      const sampleHistoricalData: HistoricalDataItem[] = [
        { date: "2024-01-01", value: 4700 },
        { date: "2024-01-02", value: 4720 },
      ];
      const sampleMetrics: CopilotReadableDashboardData['metrics'] = {
        currentPortfolioValue: 150000, dayGainLossAmount: 1200, dayGainLossPercentage: 0.8,
        totalReturnAmount: 30000, totalReturnPercentage: 25, sp500Current: 4720,
        sp500Change: 20, sp500ChangePercent: 0.42, totalMarketVolume: 6e9, portfolioYield: 1.9,
      };
      setCustomDashboardData({
        sp500HistoricalData: sampleHistoricalData,
        watchlistData: [{ ticker: "MSFT", currentPrice: 400, dayChangeAbsolute: 2.5, dayChangePercent: 0.63 }],
        portfolioAllocationData: [{ name: "MSFT", value: 100 }],
        ipoCalendarData: [], // Assume no IPOs for this custom data
        livePrices: { "OANDA:XAU_USD": 1990.75 },
        metrics: sampleMetrics,
      });
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const dashboardActions: CopilotActionConfig<any>[] = [
    {
      name: "searchInternet",
      available: "disabled",
      description: "Searches the internet for information.",
      parameters: [{ name: "query", type: "string", required: true }],
      render: ({ args, status }) => <SearchResults query={args.query || ""} status={status} />,
    },
    {
      name: "requestDetailedReport",
      description: "Requests a detailed PDF report for a specific stock ticker.",
      parameters: [{ name: "ticker", type: "string", description: "The stock ticker symbol.", required: true }],
      handler: async ({ ticker }) => {
        // This would be handled by your backend: app/api/copilotkit/route.ts
        // The backend would generate/fetch the report and perhaps return a URL or status.
        console.log(`Action: requestDetailedReport for ${ticker} - will be sent to backend.`);
        return { status: "Report generation initiated for " + ticker };
      }
    }
  ];

  if (isLoading && !customDashboardData) {
    return <div>Loading dashboard configuration...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow">
        <Dashboard
          copilotReadableDescription="Custom company financial overview."
          copilotReadableData={customDashboardData} // Pass your fetched/prepared data
          copilotActions={dashboardActions}
        />
      </main>
      <Footer />
      <CopilotSidebar
        labels={{ title: "AI Financial Assistant" }}
        // Ensure your CopilotKit backend is correctly configured,
        // especially if you have backend actions.
        // serviceUrl="/api/copilotkit"
      />
    </div>
  );
}
```

This guide should provide a comprehensive starting point for integrating the AI Dashboard into other applications. Remember to adjust paths and configurations according to the target project's structure.
