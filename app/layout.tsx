import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RACS",
  description: "Reasonably Automated Course Scheduler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="w-full bg-purple-800 p-3 overflow-auto text-white h-12">
          <Link href="/schedule" className="text-white float-right">
            Schedule
          </Link>
          <Link href="/" className="text-white">
            RACS
          </Link>
        </header>
        <div className="dark:bg-gray-800 bg-gray-50 min-h-[calc(100vh-6rem)] p-2">
          {children}
        </div>
        <div className="w-full bg-purple-800 p-3 overflow-auto text-white h-12">
          <a
            href="https://github.com/lavalleeale/racs"
            target="_blank"
            rel="noreferrer"
            className="text-white"
          >
            Github
          </a>
        </div>
      </body>
    </html>
  );
}
