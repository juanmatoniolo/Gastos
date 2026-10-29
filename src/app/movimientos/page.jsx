// src/app/movimientos/page.jsx
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { eliminarTransaccion } from "@/services/transaccionesService";
import FormularioTransaccion from "@/components/FormularioTransaccion";
import { formatCurrency } from "@/utils/formatters";
import { CATEGORIAS_EGRESOS } from "@/utils/constantes";

export default function Movimientos() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [transaccionAEditar, setTransaccionAEditar] = useState(null);
    const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando...</div>;

    const movimientosReales = transacciones.filter(t => !t.id.includes('rec') && !t.id.includes('cuota'));
    const movimientosFiltrados = movimientosReales.filter(t => t.fecha.startsWith(filtroMes));

    const abrirEditar = (t) => {
        setTransaccionAEditar(t);
        setMostrarForm(true);
    };

    const abrirNuevo = () => {
        setTransaccionAEditar(null);
        setMostrarForm(true);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pt-4 gap-4">
                <h1 className="text-2xl font-bold text-white">Historial Real</h1>
                <div className="flex w-full md:w-auto items-center gap-3">
                    <input
                        type="month"
                        value={filtroMes}
                        onChange={(e) => setFiltroMes(e.target.value)}
                        className="bg-gray-800 text-white p-2.5 rounded-xl border border-gray-700 text-sm font-medium focus:border-blue-500 outline-none w-full md:w-auto"
                    />
                    <button onClick={abrirNuevo} className="md:hidden bg-blue-600 px-4 py-2.5 rounded-xl text-white font-bold whitespace-nowrap">+ Nuevo</button>
                </div>
            </div>

            <ul className="flex flex-col gap-3">
                {movimientosFiltrados.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No hay movimientos registrados este mes.</div>
                ) : (
                    movimientosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((t) => {
                        const titulo = t.subcategoria || t.descripcion;
                        const labelCategoria = CATEGORIAS_EGRESOS.find(c => c.id === t.categoria)?.label || t.categoria.replace(/_/g, ' ');

                        return (
                            <li key={t.id} className="bg-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:justify-between items-start md:items-center border border-gray-700 gap-3">

                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.tipo === 'ingreso' ? 'bg-green-900/50 text-green-400' : t.categoria === 'ahorro' ? 'bg-teal-900/50 text-teal-400' : 'bg-red-900/50 text-red-400'}`}>
                                        {t.tipo === 'ingreso' ? "↓" : t.categoria === 'ahorro' ? "💰" : "↑"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white truncate text-base capitalize">{titulo}</p>
                                        <p className="text-xs text-gray-400 truncate capitalize">
                                            {labelCategoria} • {t.fecha}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full md:w-auto justify-between md:justify-end items-center gap-4 shrink-0">
                                    <p className={`font-bold text-lg ${t.tipo === 'ingreso' ? 'text-green-400' : t.categoria === 'ahorro' ? 'text-teal-400' : 'text-red-400'}`}>
                                        {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => abrirEditar(t)} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition">Editar</button>
                                        <button onClick={() => { if (window.confirm("¿Seguro?")) eliminarTransaccion(user.uid, t.id) }} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition">Borrar</button>
                                    </div>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            {mostrarForm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start md:items-center p-4 overflow-y-auto" onClick={() => setMostrarForm(false)}>
                    <div className="w-full max-w-md md:max-w-xl my-auto py-8" onClick={(e) => e.stopPropagation()}>
                        <FormularioTransaccion
                            userId={user.uid}
                            onClose={() => setMostrarForm(false)}
                            transaccionAEditar={transaccionAEditar}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}