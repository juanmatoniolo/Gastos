// src/app/movimientos/page.jsx
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { eliminarTransaccion } from "@/services/transaccionesService";
import FormularioTransaccion from "@/components/FormularioTransaccion";
import MonthPicker from "@/components/MonthPicker";
import { formatCurrency } from "@/utils/formatters";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";
import * as XLSX from "xlsx";

export default function Movimientos() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [transaccionAEditar, setTransaccionAEditar] = useState(null);
    const [filtroMes, setFiltroMes] = useState(
        new Date().toISOString().slice(0, 7)
    );

    if (loading)
        return (
            <div className="p-10 text-center animate-pulse text-gray-400">
                Cargando...
            </div>
        );

    const movimientosReales = transacciones.filter(
        (t) => !t.id.includes("rec") && !t.id.includes("cuota")
    );
    const movimientosFiltrados = movimientosReales.filter((t) =>
        t.fecha.startsWith(filtroMes)
    );
    const movimientosOrdenados = movimientosFiltrados.sort(
        (a, b) => new Date(a.fecha) - new Date(b.fecha)
    );

    const abrirEditar = (t) => {
        setTransaccionAEditar(t);
        setMostrarForm(true);
    };

    const abrirNuevo = () => {
        setTransaccionAEditar(null);
        setMostrarForm(true);
    };

    const exportarLibroContable = () => {
        if (movimientosOrdenados.length === 0) {
            alert("No hay movimientos para exportar en este mes.");
            return;
        }

        const rows = [
            ["Fecha", "Descripción", "Categoría", "Subcategoría", "Ingreso", "Egreso"],
        ];

        let totalIngresos = 0;
        let totalEgresos = 0;

        movimientosOrdenados.forEach((t) => {
            const catLabel =
                CATEGORIAS_EGRESOS.find((c) => c.id === t.categoria)?.label ||
                CATEGORIAS_INGRESOS.find((c) => c.id === t.categoria)?.label ||
                t.categoria;

            const monto = Number(t.monto) || 0;
            const esIngreso = t.tipo === "ingreso";

            if (esIngreso) totalIngresos += monto;
            else totalEgresos += monto;

            rows.push([
                t.fecha,
                t.descripcion || t.subcategoria || "-",
                catLabel,
                t.subcategoria || "-",
                esIngreso ? monto : "",
                !esIngreso ? monto : "",
            ]);
        });

        rows.push(["", "", "", "", "", ""]);
        rows.push(["", "", "", "SUBTOTALES", totalIngresos, totalEgresos]);

        const balance = totalIngresos - totalEgresos;
        rows.push([
            "",
            "",
            "",
            "BALANCE FINAL",
            balance > 0 ? balance : "",
            balance < 0 ? Math.abs(balance) : "",
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [
            { wch: 12 },
            { wch: 30 },
            { wch: 30 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Libro Contable");
        XLSX.writeFile(wb, `Libro_Contable_${filtroMes}.xlsx`);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pt-4 gap-4">
                <h1 className="text-2xl font-bold text-white">
                    Historial y Libro Contable
                </h1>
                <div className="flex flex-wrap w-full md:w-auto items-center gap-2 md:gap-3">
                    <MonthPicker
                        value={filtroMes}
                        onChange={setFiltroMes}
                        className="w-full sm:w-40"
                    />

                    <button
                        onClick={exportarLibroContable}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2 active:scale-[0.97] min-h-11"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Excel Contable
                    </button>

                    <button
                        onClick={abrirNuevo}
                        className="md:hidden bg-blue-600 px-4 py-2.5 rounded-xl text-white font-bold whitespace-nowrap active:scale-[0.97] min-h-11"
                    >
                        + Nuevo
                    </button>
                </div>
            </div>

            <ul className="flex flex-col gap-3">
                {movimientosFiltrados.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No hay movimientos registrados este mes.
                    </div>
                ) : (
                    movimientosOrdenados.reverse().map((t) => {
                        const titulo = t.descripcion || t.subcategoria || "Sin descripción";
                        const labelCategoria =
                            CATEGORIAS_EGRESOS.find((c) => c.id === t.categoria)?.label ||
                            CATEGORIAS_INGRESOS.find((c) => c.id === t.categoria)?.label ||
                            t.categoria.replace(/_/g, " ");

                        return (
                            <li
                                key={t.id}
                                className="bg-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:justify-between items-start md:items-center border border-gray-700 gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.tipo === "ingreso"
                                            ? "bg-green-900/50 text-green-400"
                                            : t.categoria === "ahorro"
                                                ? "bg-teal-900/50 text-teal-400"
                                                : "bg-red-900/50 text-red-400"
                                            }`}
                                    >
                                        {t.tipo === "ingreso"
                                            ? "↓"
                                            : t.categoria === "ahorro"
                                                ? "💰"
                                                : "↑"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-white truncate text-base capitalize">
                                            {titulo}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate capitalize">
                                            {labelCategoria}{" "}
                                            {t.subcategoria && t.subcategoria !== titulo
                                                ? `• ${t.subcategoria}`
                                                : ""}{" "}
                                            • {t.fecha}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full md:w-auto justify-between md:justify-end items-center gap-4 shrink-0">
                                    <p
                                        className={`font-bold text-lg ${t.tipo === "ingreso"
                                            ? "text-green-400"
                                            : t.categoria === "ahorro"
                                                ? "text-teal-400"
                                                : "text-red-400"
                                            }`}
                                    >
                                        {t.tipo === "ingreso" ? "+" : "-"}
                                        {formatCurrency(t.monto)}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => abrirEditar(t)}
                                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition active:scale-[0.97] min-h-9"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("¿Seguro?"))
                                                    eliminarTransaccion(user.uid, t.id);
                                            }}
                                            className="text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-lg transition active:scale-[0.97] min-h-9"
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>

            {mostrarForm && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start md:items-center p-4 overflow-y-auto overscroll-contain"
                    onClick={() => setMostrarForm(false)}
                >
                    <div
                        className="w-full max-w-md md:max-w-xl my-auto py-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FormularioTransaccion
                            userId={user.uid}
                            onClose={() => setMostrarForm(false)}
                            transaccionAEditar={transaccionAEditar}
                            transacciones={transacciones}
                            mesSeleccionado={filtroMes}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}