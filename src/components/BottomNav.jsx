// src/components/BottomNav.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", icon: "📊", label: "Inicio" },
        { href: "/actividad", icon: "📝", label: "Actividad" },
        { href: "/estadisticas", icon: "📈", label: "Stats" },
        { href: "/ahorros", icon: "💰", label: "Ahorro" },
    ];

    return (
        <nav className="bg-gray-800/95 backdrop-blur-md border-t border-gray-700 flex justify-around items-end pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.3)]" role="tablist">
            {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link key={link.href} href={link.href} role="tab" className={`flex flex-col items-center justify-center min-h-11 min-w-11 py-1 px-1 w-full transition-colors active:scale-[0.97] ${isActive ? "text-blue-400" : "text-gray-400"}`}>
                        <span className={`text-xl mb-1 transition-transform ${isActive ? "scale-110" : ""}`}>{link.icon}</span>
                        <span className="text-[10px] font-bold tracking-wide uppercase">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}