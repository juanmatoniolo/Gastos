// src/components/AppShell.jsx
"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }) {
    const { user, loading } = useAuth();

    // 1. Mientras carga, mostramos un spinner
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // 2. Si no hay usuario, mostramos SOLO el login (sin menús)
    if (!user) {
        return (
            <main className="min-h-screen bg-gray-900 flex flex-col justify-center">
                <div className="w-full max-w-md mx-auto p-6 pb-safe">
                    {children}
                </div>
            </main>
        );
    }

    // 3. Si hay usuario, mostramos la app completa con menús
    return (
        <div className="flex h-screen overflow-hidden bg-gray-900">
            <Sidebar />

            <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative no-scrollbar">
                <div className="max-w-md mx-auto md:max-w-5xl md:mx-auto md:p-8">
                    {children}
                </div>
            </main>

            <div className="md:hidden fixed bottom-0 w-full z-50">
                <BottomNav />
            </div>
        </div>
    );
}