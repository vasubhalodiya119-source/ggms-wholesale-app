import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShopAuthProvider } from "@/lib/shop-auth";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { CartProvider } from "@/lib/cart-context";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ForceUpdatePrompt from "@/components/ForceUpdatePrompt";

export const metadata: Metadata = {
  title: "GGM&S Wholesale - જથ્થાબંધ ઓર્ડર",
  description: "GGM&S Wholesale - Shopkeeper ordering app for bulk grocery orders",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GGM&S",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-100" suppressHydrationWarning>
        <ForceUpdatePrompt />
        <ServiceWorkerRegister />
        <AdminAuthProvider>
          <ShopAuthProvider>
            <CartProvider>{children}</CartProvider>
          </ShopAuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
