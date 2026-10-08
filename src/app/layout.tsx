import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BrowserAlertBridge } from '@/components/ui/BrowserAlertBridge';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SigmaTracker",
  description: "Employee time tracking, native activity monitoring, and automated screenshots.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/app-icon.png', type: 'image/png', sizes: '512x512' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ minHeight: '100vh' }}>
          {children}
          <BrowserAlertBridge />
        </div>
      </body>
    </html>
  );
}
