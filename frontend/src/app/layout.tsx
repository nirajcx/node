import type { Metadata } from "next";
import "./globals.css";
import "./dayflow.css";

export const metadata: Metadata = {
  title: "Dayflow — A little more focus",
  description: "A calm space for your tasks, plans, and everyday progress.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
