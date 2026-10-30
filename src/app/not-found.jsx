// src/app/not-found.jsx
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-dvh bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6 pt-safe pb-safe">
            <div className="text-center">
                <h1 className="text-6xl font-extrabold text-blue-500 mb-2">404</h1>
                <p className="text-gray-300 mb-6">Esta página no existe.</p>
                <Link
                    href="/"
                    className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition active:scale-[0.97] min-h-12"
                >
                    Ir al inicio
                </Link>
            </div>
        </div>
    );
}