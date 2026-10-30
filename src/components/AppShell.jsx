// src/components/AppShell.jsx
"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import LoginView from "./LoginView";

export default function AppShell({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-dvh items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <main className="min-h-dvh bg-gray-900 flex flex-col justify-center pt-safe pb-safe">
                <LoginView />
            </main>
        );
    }

    return (
        <div className="flex h-dvh overflow-hidden bg-gray-900">
            <Sidebar />

            <main className="flex-1 overflow-y-auto pb-nav md:pb-8 pt-safe relative no-scrollbar overscroll-contain">
                <div className="max-w-md mx-auto md:max-w-5xl md:mx-auto md:p-8">
                    {children}
                </div>
            </main>

            <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
                <BottomNav />
            </div>
        </div>
    );
}