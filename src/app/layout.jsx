// src/app/layout.jsx
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata = { title: "Mis Finanzas" };
export const viewport = { themeColor: "#111827", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="bg-gray-900 text-gray-100 min-h-screen" suppressHydrationWarning={true}>
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">

            {/* Menú Lateral (Solo visible en PC) */}
            <Sidebar />

            {/* Contenido Principal */}
            <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative no-scrollbar">
              <div className="max-w-md mx-auto md:max-w-5xl md:mx-auto md:p-8">
                {children}
              </div>
            </main>

            {/* Menú Inferior (Solo visible en celular) */}
            <div className="md:hidden fixed bottom-0 w-full z-50">
              <BottomNav />
            </div>

          </div>
        </AuthProvider>
      </body>
    </html>
  );
}