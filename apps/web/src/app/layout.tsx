import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroAssist AI — Clinical MRI Decision Support",
  description:
    "AI-powered clinical MRI decision-support tool for healthcare professionals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
