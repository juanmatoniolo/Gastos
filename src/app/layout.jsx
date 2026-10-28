// src/app/layout.jsx
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata = {
  // ⚠️ IMPORTANTE: Cambia esto por tu URL real de Vercel para que las redes sociales encuentren las imágenes
  metadataBase: new URL('https://liberta-de-gastos.vercel.app'),
  title: {
    default: 'Mis Finanzas | Control de Gastos',
    template: '%s | Mis Finanzas'
  },
  description: 'Lleva el control absoluto de tus ingresos, egresos, ahorros y cuotas de tarjetas de crédito.',

  // Configuración para cuando compartes el link por WhatsApp, Twitter, etc.
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: '/',
    title: 'Mis Finanzas | Control de Gastos',
    description: 'Toma el control de tu dinero con estadísticas, control de cuotas y proyecciones.',
    siteName: 'Mis Finanzas',
    images: [{
      url: '/og-image.png', // ⚠️ Asegúrate de crear esta imagen y ponerla en la carpeta public
      width: 1200,
      height: 630,
      alt: 'Mis Finanzas - Dashboard',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mis Finanzas | Control de Gastos',
    description: 'Toma el control de tu dinero con estadísticas y proyecciones.',
    images: ['/og-image.png'],
  },

  // Aquí apuntamos a TUS archivos reales
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  appleWebApp: {
    title: 'Mis Finanzas',
    statusBarStyle: 'black-translucent',
  },

  // Apuntamos a manifest.json, no al webmanifest
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="bg-gray-900 text-gray-100 min-h-screen" suppressHydrationWarning={true}>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}