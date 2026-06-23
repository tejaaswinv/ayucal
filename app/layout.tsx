import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AyuPulse Scheduler",
  description: "No-OAuth Calendly-style scheduler for AyuPulse."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
