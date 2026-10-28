// src/app/layout.jsx
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata = { title: "Mis Finanzas" };
export const viewport = { themeColor: "#111827", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

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