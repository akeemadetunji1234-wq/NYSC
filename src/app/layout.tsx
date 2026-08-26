import "../styles/index.css";
import { Toaster } from "./components/ui/sonner";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neat & Affordable - Secure NYSC Lodging",
  description: "Enables NYSC members to find and filter apartments by budget, location, and amenities, connecting them with verified agents for seamless bookings.",
  keywords: ["NYSC", "Nigeria", "Lodging", "Corpers", "Apartments", "Real Estate"],
  authors: [{ name: "Neat & Affordable Team" }],
  openGraph: {
    title: "Neat & Affordable - NYSC Lodging Made Easy",
    description: "Discover safe, affordable housing near your PPA or orientation camp.",
    url: "https://neat-affordable.ng",
    siteName: "Neat & Affordable",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neat & Affordable - NYSC Lodging Made Easy",
    description: "Discover safe, affordable housing near your PPA or orientation camp.",
  },
};

import { ThemeProvider } from "../components/ThemeProvider";
import { LowDataProvider } from "../contexts/LowDataContext";
import Script from "next/script";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { NavigationFeedback } from "../components/layout/NavigationFeedback";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LowDataProvider>
            <NavigationFeedback />
            {children}
            <Toaster />
          </LowDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

