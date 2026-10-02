import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/app-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gugi OS Dashboard",
  description: "Personal mission control untuk monitor Hermes Agent dan orchestration harian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppNav />
        {/* Ruang buat sidebar (desktop) dan bottom tab bar (mobile) */}
        <div className="pb-16 md:pb-0 md:pl-52">{children}</div>
      </body>
    </html>
  );
}
