import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

// Set up the Inter font from Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Updated metadata for your project
export const metadata: Metadata = {
  title: "AI Stock Market Dashboard",
  description: "An interactive stock dashboard powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font className to the body tag */}
      <body className={inter.className}>
        {/* Keep the CopilotKit provider wrapping your application */}
        <CopilotKit 
          runtimeUrl="/api/copilotkit"
          showDevConsole={false}
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}