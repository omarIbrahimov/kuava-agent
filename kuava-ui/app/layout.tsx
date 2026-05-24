import type { Metadata } from "next";
import "./globals.css"; // Imports the Tailwind styles we just checked

export const metadata: Metadata = {
  title: "KUAVA AI - Engineering Agent",
  description: "Internal AI Agent for Engineering Specs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* This "children" prop is where your page.tsx content is injected */}
        {children}
      </body>
    </html>
  );
}