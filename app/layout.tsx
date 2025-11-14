import type { Metadata } from "next";
// Temporarily disabled due to network restrictions in build environment
// import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/react";

// const geistSans = Geist({
//   subsets: ["latin"],
//   variable: "--font-sans",
// });

// const geistMono = Geist_Mono({
//   subsets: ["latin"],
//   variable: "--font-mono",
// });

export const metadata: Metadata = {
  title: "KGC Compliance Cloud",
  description: "Multi-tenant compliance platform for professional services firms in Guyana",
  keywords: ["compliance", "GRA", "NIS", "DCRA", "Immigration", "Guyana", "tax", "filing"],
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="font-sans antialiased bg-white text-gray-900">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
