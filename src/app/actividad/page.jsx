// src/app/actividad/page.jsx
"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { useToast } from "@/components/Toast";
import ConfirmSheet from "@/components/ConfirmSheet";
import { eliminarTransaccion } from "@/services/transaccionesService";
import FormularioTransaccion from "@/components/FormularioTransaccion";
import MonthPicker from "@/components/MonthPicker";
import { formatCurrency } from "@/utils/formatters";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";
import { getResumenMes, getTransaccionesDelMes } from "@/utils/proyecciones";

export default function Actividad() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);
    const toast = useToast();

    const [mostrarForm, setMostrarForm] = useState(false);
    const [transaccionAEditar, setTransaccionAEditar] = useState(null);
    const [transaccionAEliminar, setTransaccionAEliminar] = useState(null);
    const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7));
    const [tabActiva, setTabActiva] = useState("todos");

    const resumenDelMes = useMemo(
        () => getResumenMes(transacciones || [], filtroMes),
        [transacciones, filtroMes]
    );

    const movimientosBrutos = useMemo(() => {
        if (!transacciones) return [];
        return getTransaccionesDelMes(transacciones, filtroMes);
    }, [transacciones, filtroMes]);

    const movimientosFiltrados = useMemo(() => {
        return movimientosBrutos.filter((t) => {
            if (tabActiva === "fijos") return t.esRecurrente || t.esRecurrenteVirtual;
            if (tabActiva === "cuotas") return t.esCuotaVirtual;
            if (tabActiva === "ingresos") return t.tipo === "ingreso";
            if (tabActiva === "ahorros") return t.categoria === "ahorro";
            return true;
        });
    }, [movimientosBrutos, tabActiva]);

    // Calculamos totales separados
    const { totalIngresos, totalEgresos } = useMemo(() => {
        let ing = 0;
        let egr = 0;
        movimientosFiltrados.forEach(t => {
            if (t.tipo === "ingreso") ing += t.monto;
            else egr += t.monto;
        });
        return { totalIngresos: ing, totalEgresos: egr };
    }, [movimientosFiltrados]);

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando...</div>;

    const abrirEditar = (t) => { setTransaccionAEditar(t); setMostrarForm(true); };
    const abrirNuevo = () => { setTransaccionAEditar(null); setMostrarForm(true); };

    const confirmarBorrado = async () => {
        if (!transaccionAEliminar) return;
        try {
            const idReal = transaccionAEliminar.originalId || transaccionAEliminar.id;
            await eliminarTransaccion(user.uid, idReal);
            toast.success("Movimiento eliminado");
        } catch { toast.error("No se pudo eliminar"); } finally { setTransaccionAEliminar(null); }
    };

    const exportarLibroContable = async () => {
        if (movimientosFiltrados.length === 0) return toast.info("No hay movimientos para exportar.");
        const XLSX = await import("xlsx");
        const rows = [["Fecha", "Descripción", "Categoría", "Subcategoría", "Ingreso", "Egreso"]];
        movimientosFiltrados.forEach((t) => {
            const catLabel = CATEGORIAS_EGRESOS.find((c) => c.id === t.categoria)?.label || CATEGORIAS_INGRESOS.find((c) => c.id === t.categoria)?.label || t.categoria;
            rows.push([t.fecha, t.descripcion || "-", catLabel, t.subcategoria || "-", t.tipo === "ingreso" ? t.monto : "", t.tipo !== "ingreso" ? t.monto : ""]);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Actividad");
        XLSX.writeFile(wb, `Actividad_${filtroMes}_${tabActiva}.xlsx`);
        toast.success("Excel generado");
    };

    const TABS = [
        { id: "todos", label: "Todos" },
        { id: "fijos", label: "Fijos" },
        { id: "cuotas", label: "Cuotas" },
        { id: "ingresos", label: "Ingresos" },
        { id: "ahorros", label: "Ahorros" },
    ];

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h1 className="text-2xl font-bold text-white">Actividad y Movimientos</h1>
                <div className="flex flex-wrap w-full md:w-auto items-center gap-2">
                    <MonthPicker value={filtroMes} onChange={setFiltroMes} className="w-full sm:w-40" />
                    <button onClick={exportarLibroContable} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2 active:scale-[0.97] min-h-11">
                        ⬇️ Excel
                    </button>
                    <button onClick={abrirNuevo} className="md:hidden bg-blue-600 px-4 py-2.5 rounded-xl text-white font-bold whitespace-nowrap active:scale-[0.97] min-h-11">
                        + Nuevo
                    </button>
                </div>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 mb-4">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setTabActiva(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${tabActiva === tab.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TARJETAS DE TOTALES */}
            <div className="mb-6">
                {tabActiva === "todos" ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex flex-col justify-center shadow-sm">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Ingresos del Mes</p>
                            <p className="text-xl font-bold text-green-400">+{formatCurrency(totalIngresos)}</p>
                        </div>
                        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex flex-col justify-center shadow-sm">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Egresos del Mes</p>
                            <p className="text-xl font-bold text-red-400">-{formatCurrency(totalEgresos)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-sm text-gray-400 font-medium capitalize">Total en {TABS.find(t => t.id === tabActiva).label}</p>
                            <p className="text-xs text-gray-500">Mes seleccionado</p>
                        </div>
                        <p className={`text-xl font-bold ${tabActiva === 'ingresos' ? 'text-green-400' : 'text-white'}`}>
                            {tabActiva === 'ingresos' && '+'}{formatCurrency(tabActiva === 'ingresos' ? totalIngresos : totalEgresos)}
                        </p>
                    </div>
                )}
            </div>

            <ul className="flex flex-col gap-3">
                {movimientosFiltrados.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-700/50 border-dashed">
                        No hay movimientos en esta categoría este mes.
                    </div>
                ) : (
                    movimientosFiltrados.map((t) => {
                        const titulo = t.descripcion || t.subcategoria || "Sin descripción";
                        const labelCategoria = CATEGORIAS_EGRESOS.find((c) => c.id === t.categoria)?.label || CATEGORIAS_INGRESOS.find((c) => c.id === t.categoria)?.label || t.categoria.replace(/_/g, " ");
                        return (
                            <li key={t.id} className="bg-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:justify-between items-start md:items-center border border-gray-700 gap-3">
                                <div className="flex items-center gap-3 w-full md:w-auto flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.tipo === "ingreso" ? "bg-green-900/50 text-green-400" : t.categoria === "ahorro" ? "bg-teal-900/50 text-teal-400" : t.esCuotaVirtual ? "bg-orange-900/50 text-orange-400" : "bg-red-900/50 text-red-400"}`}>
                                        {t.tipo === "ingreso" ? "↓" : t.esCuotaVirtual ? "💳" : t.categoria === "ahorro" ? "💰" : "↑"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-white text-base capitalize truncate">{titulo}</p>
                                        <p className="text-xs text-gray-400 capitalize truncate mt-0.5">
                                            {labelCategoria} • {t.fecha.split("T")[0]}
                                            {t.esRecurrenteVirtual && <span className="text-blue-400 font-bold ml-1">(Fijo)</span>}
                                            {t.esCuotaVirtual && <span className="text-orange-400 font-bold ml-1">(Tarjeta)</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex w-full md:w-auto justify-between md:justify-end items-center gap-4 shrink-0 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-gray-700/50 md:border-0">
                                    <p className={`font-bold text-lg whitespace-nowrap ${t.tipo === "ingreso" ? "text-green-400" : t.categoria === "ahorro" ? "text-teal-400" : "text-red-400"}`}>
                                        {t.tipo === "ingreso" ? "+" : "-"}{formatCurrency(t.monto)}
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => abrirEditar(t)} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition active:scale-[0.97] min-h-9">Editar</button>
                                        <button onClick={() => setTransaccionAEliminar(t)} className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg transition active:scale-[0.97] min-h-9">Borrar</button>
                                    </div>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            {mostrarForm && (
                <FormularioTransaccion userId={user.uid} onClose={() => setMostrarForm(false)} transaccionAEditar={transaccionAEditar} transacciones={transacciones} mesSeleccionado={filtroMes} saldoDisponible={resumenDelMes.balance} />
            )}

            <ConfirmSheet open={!!transaccionAEliminar} title={`Eliminar "${transaccionAEliminar?.descripcion || "movimiento"}"`} description="¿Estás seguro? Si es una cuota, se borrará la compra original." actions={[{ label: "Eliminar", variant: "danger", onClick: confirmarBorrado }, { label: "Cancelar", variant: "ghost", onClick: () => setTransaccionAEliminar(null) }]} />
        </div>
    );
}