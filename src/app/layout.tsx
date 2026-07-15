import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LocalDataProvider } from "@/components/providers/local-data-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "AniVerse — Stories beyond the stars", template: "%s · AniVerse" },
  description: "Discover original and creator-owned animation, follow new releases, and support the storytellers behind every universe.",
  applicationName: "AniVerse",
  keywords: ["anime", "animation", "creators", "streaming", "community"],
  openGraph: { type: "website", siteName: "AniVerse", title: "AniVerse", description: "Stories worth discovering. Creators worth supporting." },
  twitter: { card: "summary_large_image", title: "AniVerse", description: "Stories worth discovering. Creators worth supporting." },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content"><LocalDataProvider>{children}<PwaProvider/></LocalDataProvider></div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
