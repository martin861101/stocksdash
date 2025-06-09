"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import { Dashboard, CopilotActionConfig } from "../components/Dashboard"; // Import CopilotActionConfig
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SearchResults } from "../components/generative-ui/SearchResults"; // Import SearchResults
import { CustomAssistantMessage } from "../components/AssistantMessage";
import { prompt } from "../lib/prompt";
import { useCopilotReadable } from "@copilotkit/react-core";

export default function Home() {
  useCopilotReadable({
    description: "Current time",
    value: new Date().toLocaleTimeString(),
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex-grow">
        <Dashboard
          copilotReadableDescription="Stock market dashboard data including S&P 500 trend, watchlist, portfolio metrics, and upcoming IPOs."
          // copilotReadableData is not passed, so Dashboard will use its internal state due to the fallback.
          copilotActions={[
            {
              name: "searchInternet",
              available: "disabled",
              description: "Searches the internet for information based on a query.",
              parameters: [
                {
                  name: "query",
                  type: "string",
                  description: "The query to search the internet for.",
                  required: true,
                }
              ],
              render: ({args, status}) => {
                return <SearchResults query={args.query || 'No query provided'} status={status} />;
              }
            } as CopilotActionConfig<any> // Type assertion
          ]}
        />
      </main>
      <Footer />
      <CopilotSidebar
        instructions={prompt}
        AssistantMessage={CustomAssistantMessage}
        labels={{
          title: "Data Assistant",
          initial: "Hello, I'm here to help you understand your data. How can I help?",
          placeholder: "Ask about sales, trends, or metrics...",
        }}
      />
    </div>
  );
}
