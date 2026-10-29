// src/components/BottomNav.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", icon: "📊", label: "Inicio" },
        { href: "/movimientos", icon: "📝", label: "Movs" },
        { href: "/estadisticas", icon: "📈", label: "Stats" },
        { href: "/ahorros", icon: "💰", label: "Ahorro" },
        { href: "/fijos", icon: "📅", label: "Fijos" },
    ];

    return (
        <nav
            className="bg-gray-800 border-t border-gray-700 flex justify-around items-center pt-2 z-50 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.3)]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
        >
            {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center p-1 w-full transition-colors ${isActive ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
                            }`}
                    >
                        <span className={`text-xl mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}>{link.icon}</span>
                        <span className="text-[10px] font-bold tracking-wide uppercase">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}