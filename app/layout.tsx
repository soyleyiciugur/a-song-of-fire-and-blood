// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Cinzel } from "next/font/google";
import { Crimson_Text } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import Navbar from "@/components/nav/Navbar";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-hotd",
  weight: ["400", "600", "700", "900"],
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

const siteUrl = "https://a-song-of-fire-and-blood.vercel.app";
const siteName = "A Song of Fire and Blood";
const siteDescription = "A living chronicle of House Targaryen.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
    template: "%s | A Song of Fire and Blood",
  },

  description: siteDescription,

  openGraph: {
    title: siteName,
    description: siteDescription,
    url: siteUrl,
    siteName,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${cinzel.variable} ${crimsonText.variable}`}
      >
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}