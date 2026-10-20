import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Trace — Real engineering problems. Better engineering judgment.",
  description:
    "A realistic software engineering practice platform. Investigate production incidents, inspect diffs, find faults, propose mitigations, and defend engineering decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-[#0B0D10] text-[#E8EAED] antialiased selection:bg-[#F5A524]/20 selection:text-[#F5A524]`}
      >
        {children}
      </body>
    </html>
  );
}
