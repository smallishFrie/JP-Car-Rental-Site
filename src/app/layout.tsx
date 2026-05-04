import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppMotionShell from "@/app/components/AppMotionShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JP Car Rental",
    template: "%s · JP Car Rental",
  },
  description:
    "Book a clean vehicle in minutes. JP Car Rental offers simple online booking, flexible pickup locations, and straightforward pricing.",
  openGraph: {
    title: "JP Car Rental",
    description:
      "Book a clean vehicle in minutes. Simple online booking and flexible pickup locations.",
    siteName: "JP Car Rental",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppMotionShell>{children}</AppMotionShell>
      </body>
    </html>
  );
}
