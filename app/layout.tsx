import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BabyBot",
  description: "Track baby feeding times and amounts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
