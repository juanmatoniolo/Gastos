// src/app/layout.jsx
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import AppShell from "@/components/AppShell";
import "./globals.css";

const APP_URL = "https://liberta-de-gastos-omega.vercel.app";
const OG_IMAGE_URL = `${APP_URL}/og-image.png`; // URL absoluta directa

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Mis Finanzas | Control de Gastos",
    template: "%s | Mis Finanzas",
  },
  description:
    "Lleva el control absoluto de tus ingresos, egresos, ahorros y cuotas de tarjetas de crédito.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: APP_URL, // URL absoluta
    title: "Mis Finanzas | Control de Gastos",
    description: "Toma el control de tu dinero con estadísticas, control de cuotas y proyecciones.",
    siteName: "Mis Finanzas",
    images: [
      {
        url: OG_IMAGE_URL, // URL absoluta directa
        width: 1200,
        height: 630,
        alt: "Mis Finanzas - Dashboard",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mis Finanzas | Control de Gastos",
    description: "Toma el control de tu dinero con estadísticas y proyecciones.",
    images: [OG_IMAGE_URL], // URL absoluta directa
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Mis Finanzas",
    statusBarStyle: "black-translucent"
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="bg-gray-900 text-gray-100 min-h-dvh" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}