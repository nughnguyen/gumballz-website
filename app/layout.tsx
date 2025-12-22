import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "GumballZ System",
  description: "Cổng nạp GumballZ - Nạp Coiz tự động, an toàn, nhanh chóng.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="grow bg-slate-50">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
