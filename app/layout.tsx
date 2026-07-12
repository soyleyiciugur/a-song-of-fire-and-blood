// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/nav/Navbar";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "A Song of Fire and Blood",
    template: "%s | A Song of Fire and Blood",
  },
  description: "A living chronicle of House Targaryen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
