import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShopAuthProvider } from "@/lib/shop-auth";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "GGM&S Wholesale - જથ્થાબંધ ઓર્ડર",
  description: "GGM&S Wholesale - Shopkeeper ordering app for bulk grocery orders",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-100">
        <AdminAuthProvider>
          <ShopAuthProvider>
            <CartProvider>{children}</CartProvider>
          </ShopAuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
