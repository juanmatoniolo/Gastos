// src/app/ahorros/page.jsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { formatCurrency } from "@/utils/formatters";
import { eliminarTransaccion } from "@/services/transaccionesService";

export default function PaginaAhorros() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);

    if (loading) return <div className="p-10 text-center text-gray-400">Cargando...</div>;

    // Filtramos solo los ahorros reales (ignorando las proyecciones)
    const ahorros = transacciones.filter(t => t.categoria === "ahorro" && !t.id.includes('rec'));

    // Sumamos el total ahorrado
    const totalAhorrado = ahorros.reduce((acc, curr) => acc + curr.monto, 0);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 pt-4">Mi Ahorro</h1>
            <p className="text-gray-400 text-sm mb-6">Fondos apartados que estás construyendo.</p>

            {/* Tarjeta de Total */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-800 p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <p className="text-teal-100 text-sm font-medium mb-1 relative z-10">Total Ahorrado</p>
                <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight relative z-10 break-words">
                    {formatCurrency(totalAhorrado)}
                </p>
            </div>

            <h2 className="text-lg font-semibold mb-4 text-white">Historial de Ahorros</h2>

            {ahorros.length === 0 ? (
                <div className="text-center py-10 bg-gray-800/50 rounded-2xl border border-gray-700/50 border-dashed">
                    <p className="text-gray-400">Aún no registraste ningún ahorro.</p>
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {ahorros.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((t) => (
                        <li key={t.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-teal-900/50 text-teal-400">
                                    💰
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="font-semibold text-white capitalize truncate">{t.subcategoria || t.descripcion}</p>
                                    <p className="text-xs text-gray-400 truncate">{t.fecha.split('T')[0]}</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0">
                                <p className="font-bold text-teal-400 break-words">
                                    +{formatCurrency(t.monto)}
                                </p>
                                <button onClick={() => { if (window.confirm("¿Eliminar este ahorro?")) eliminarTransaccion(user.uid, t.id) }} className="text-xs text-gray-500 hover:text-red-400 mt-1 uppercase font-semibold">Borrar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}