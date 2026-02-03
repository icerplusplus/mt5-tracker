import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MT5 Trading Dashboard",
  description: "Real-time MetaTrader 5 trading dashboard with EA Bot integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
