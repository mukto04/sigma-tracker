import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SigmaTracker - The Ultimate Productivity Suite",
  description: "Employee time tracking, native activity monitoring, and automated screenshots.",
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
        </div>
      </body>
    </html>
  );
}
