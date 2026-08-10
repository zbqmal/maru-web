import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maru",
  description: "A private space to share daily moments with the people who matter most.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
