// src/app/error.jsx
"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error("App error:", error);
    }, [error]);

    return (
        <div className="min-h-dvh bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6 pt-safe pb-safe">
            <div className="max-w-sm w-full bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center shadow-xl">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-900/40 flex items-center justify-center text-2xl">
                    ⚠️
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
                <p className="text-sm text-gray-400 mb-6">
                    {error?.message || "Ocurrió un error inesperado. Podés reintentar."}
                </p>
                <button
                    onClick={reset}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition active:scale-[0.97] min-h-12"
                >
                    Reintentar
                </button>
                <a
                    href="/"
                    className="mt-3 inline-block text-sm text-gray-400 hover:text-white min-h-11 leading-[44px]"
                >
                    Volver al inicio
                </a>
            </div>
        </div>
    );
}