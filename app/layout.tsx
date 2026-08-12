import type { Metadata } from "next";
import type { ReactNode } from "react";
import QueryProvider from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARU",
  description: "A private space to share daily moments with the people who matter most.",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
