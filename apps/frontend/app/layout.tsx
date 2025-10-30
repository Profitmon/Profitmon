import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/providers/WalletProvider";
import Navbar from "@/components/layouts/Navbar";
import { cn } from "@/lib/utils"; // optional utility for class merging (shadcn default)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Egg Hatch | Solana Game",
  description: "Hatch Solana eggs and collect rare cards!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <WalletContextProvider>
          <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-40">
            <Navbar />
          </header>

          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </WalletContextProvider>
      </body>
    </html>
  );
}
