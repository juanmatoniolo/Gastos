// src/components/Toast.jsx
"use client";
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const add = useCallback((message, type = "info") => {
        const id = Math.random().toString(36).slice(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    }, []);

    const toast = {
        success: (msg) => add(msg, "success"),
        error: (msg) => add(msg, "error"),
        info: (msg) => add(msg, "info"),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {mounted &&
                createPortal(
                    <div
                        role="status"
                        aria-live="polite"
                        className="fixed top-0 inset-x-0 z-[200] flex flex-col items-center gap-2 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 pointer-events-none"
                    >
                        {toasts.map((t) => (
                            <div
                                key={t.id}
                                className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm w-full animate-fade-in-down ${t.type === "success"
                                    ? "bg-green-600 text-white"
                                    : t.type === "error"
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-800 text-white border border-gray-700"
                                    }`}
                            >
                                {t.message}
                            </div>
                        ))}
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
    return ctx;
}