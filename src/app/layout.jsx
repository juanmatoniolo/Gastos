// src/app/layout.jsx
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

// 1. Metadatos usando los íconos que descargaste
export const metadata = {
  metadataBase: new URL('https://app-personal-751b7.web.app'), // Cambia esto por tu URL de Vercel si la tienes
  title: {
    default: 'Mis Finanzas | Control de Gastos e Ingresos',
    template: '%s | Mis Finanzas'
  },
  description: 'Lleva el control absoluto de tus ingresos, egresos, ahorros y cuotas de tarjetas de crédito.',
  keywords: ['finanzas personales', 'control de gastos', 'ahorros', 'presupuesto', 'tarjetas de credito'],

  // Open Graph (Para que se vea lindo en WhatsApp y Redes)
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: '/',
    title: 'Mis Finanzas | Control de Gastos',
    description: 'Toma el control de tu dinero con estadísticas, control de cuotas y proyecciones.',
    siteName: 'Mis Finanzas',
    images: [{
      url: '/og-image.png', // Recuerda tener esta imagen de 1200x630 en public
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

  // AQUÍ CONFIGURAMOS TUS ÍCONOS DESCARGADOS
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  // Meta para iOS
  appleWebApp: {
    title: 'Mis Gastos',
    statusBarStyle: 'black-translucent', // Opcional: hace que la barra de estado combine
  },

  // Usamos el manifest que generó la herramienta
  manifest: '/site.webmanifest',
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