import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans } from "next/font/google";
import "./globals.css";
import ShaderGradientBg from "@/components/ShaderGradientBg";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slot Stalker — Restaurant Reservation Agent",
  description:
    "AI-powered restaurant slot monitoring and booking agent for Swiggy Dineout. Never miss a table again.",
  keywords: ["restaurant", "reservation", "dineout", "booking", "AI agent"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-black font-sans text-white antialiased">
        <ShaderGradientBg />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
