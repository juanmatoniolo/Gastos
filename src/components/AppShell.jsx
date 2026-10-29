// src/components/AppShell.jsx
"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import LoginView from "./LoginView";

export default function AppShell({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

    if (!user) {
        return (
            <main className="min-h-screen bg-gray-900 flex flex-col justify-center">
                <LoginView />
            </main>
        );
    }

    return (
        // h-[100dvh] soluciona el problema de la barra de direcciones en iOS/Android
        <div className="flex h-[100dvh] overflow-hidden bg-gray-900">
            <Sidebar />

            {/* pb-[80px] para dejar espacio al navbar abajo */}
            <main className="flex-1 overflow-y-auto pb-[80px] md:pb-0 relative no-scrollbar">
                <div className="max-w-md mx-auto md:max-w-5xl md:mx-auto md:p-8">
                    {children}
                </div>
            </main>

            {/* Contenedor fixed del navbar para celular */}
            <div className="md:hidden fixed bottom-0 w-full z-50">
                <BottomNav />
            </div>
        </div>
    );
}