// src/components/Sidebar.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    const links = [
        { href: "/", icon: "📊", label: "Dashboard" },
        { href: "/actividad", icon: "📝", label: "Actividad" },
        { href: "/ahorros", icon: "💰", label: "Ahorros" },
        { href: "/estadisticas", icon: "📈", label: "Estadísticas" },
        { href: "/notas", icon: "🔐", label: "Bóveda" },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700 h-full p-6">
            <div className="mb-10">
                <h1 className="text-2xl font-extrabold text-blue-500">Mis Finanzas</h1>
                <p className="text-xs text-gray-400 mt-1">Control de capital</p>
            </div>

            <nav className="flex-1 flex flex-col gap-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-11 ${isActive
                                ? "bg-blue-600 text-white font-medium shadow-md"
                                : "text-gray-400 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={logout}
                className="mt-auto bg-gray-700 hover:bg-red-900/50 text-red-400 p-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 min-h-11"
            >
                Cerrar Sesión
            </button>
        </aside>
    );
}