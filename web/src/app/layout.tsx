'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import AgentPanel from '@/components/AgentPanel';
import { Bot } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NirmalMandi — India's B2B Dead Inventory Marketplace</title>
        <meta name="description" content="Liquidate excess, returns and ageing stock to verified bulk buyers — escrow-protected, freight included, paid out fast." />
        {/* Google Fonts — Bricolage Grotesque + Hanken Grotesk */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <div className={`transition-all duration-300 ${agentOpen ? 'sm:mr-[380px]' : ''}`}>
            {children}
          </div>

          <AgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />

          {!agentOpen && (
            <button
              onClick={() => setAgentOpen(true)}
              className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full text-white shadow-lift hover:opacity-90 active:scale-95 transition-all flex items-center justify-center group"
              style={{ background: 'var(--nm-green)' }}
              aria-label="Open AI Assistant"
            >
              <Bot className="w-6 h-6" />
              <span className="absolute right-16 bg-ink text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-display">
                AI Assistant
              </span>
            </button>
          )}

          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: { background: 'var(--nm-card)', border: '1px solid var(--nm-line)', color: 'var(--nm-ink)' },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
