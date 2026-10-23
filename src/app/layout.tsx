import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FinPilot AI — Finance OS for Indian businesses",
    template: "%s · FinPilot AI",
  },
  description:
    "AI-powered finance operations for Indian small businesses: cash flow, invoicing, GST-ready reports, budgets, documents and a copilot that understands your books.",
  applicationName: "FinPilot AI",
  keywords: [
    "finance",
    "accounting",
    "invoicing",
    "GST",
    "cash flow",
    "AI copilot",
    "India",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-slate-900">{children}</body>
    </html>
  );
}
