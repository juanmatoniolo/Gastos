// src/app/estadisticas/page.jsx
"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useToast } from "@/components/Toast";
import MonthPicker from "@/components/MonthPicker";
import { formatCurrency } from "@/utils/formatters";
import { getResumenMes } from "@/utils/proyecciones";
import { CATEGORIAS_EGRESOS } from "@/utils/constantes";

const StatsCharts = dynamic(() => import("@/components/StatsCharts"), {
    ssr: false,
    loading: () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 h-80 rounded-2xl animate-pulse" />
            <div className="bg-gray-800 h-80 rounded-2xl animate-pulse" />
        </div>
    ),
});

const calcularDiferencia = (actual, anterior) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
};

export default function PaginaEstadisticas() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);
    const { subcategorias } = useSubcategorias(user?.uid);
    const toast = useToast();

    const hoy = new Date();
    const mesActual = hoy.toISOString().slice(0, 7);
    const mesAnteriorDate = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const mesAnterior = mesAnteriorDate.toISOString().slice(0, 7);

    const [mesBase, setMesBase] = useState(mesActual);
    const [mesComparacion, setMesComparacion] = useState(mesAnterior);
    const [verPor, setVerPor] = useState("categoria");

    const resumenBase = useMemo(
        () => getResumenMes(transacciones || [], mesBase),
        [transacciones, mesBase]
    );
    const resumenComp = useMemo(
        () => getResumenMes(transacciones || [], mesComparacion),
        [transacciones, mesComparacion]
    );

    const { variaciones, dataTorta, dataBarras } = useMemo(() => {
        const dictBase = {};
        if (verPor === "categoria") {
            CATEGORIAS_EGRESOS.forEach((c) => (dictBase[c.label] = 0));
        } else {
            subcategorias.egreso?.forEach((s) => (dictBase[s.nombre] = 0));
        }

        const agrupar = (resumen) => {
            const dict = { ...dictBase };
            resumen.transacciones
                .filter((t) => t.tipo === "egreso")
                .forEach((t) => {
                    const key =
                        verPor === "categoria"
                            ? CATEGORIAS_EGRESOS.find((c) => c.id === t.categoria)?.label || t.categoria
                            : t.subcategoria || "Sin Subcategoría";
                    if (!dict[key]) dict[key] = 0;
                    dict[key] += t.monto;
                });
            return dict;
        };

        const gBase = agrupar(resumenBase);
        const gComp = agrupar(resumenComp);
        const keys = Array.from(new Set([...Object.keys(gBase), ...Object.keys(gComp)]));

        const variaciones = keys
            .map((key) => {
                const actual = gBase[key] || 0;
                const anterior = gComp[key] || 0;
                return {
                    key,
                    actual,
                    anterior,
                    dif: actual - anterior,
                    porc: calcularDiferencia(actual, anterior),
                };
            })
            .sort((a, b) => Math.abs(b.actual) - Math.abs(a.actual));

        const dataTorta = Object.keys(gBase)
            .filter((k) => gBase[k] > 0)
            .map((k) => ({ name: k, value: gBase[k] }))
            .sort((a, b) => b.value - a.value);

        const dataBarras = [
            { name: "Ingresos", monto: resumenBase.ingresos, fill: "#22c55e" },
            { name: "Egresos", monto: resumenBase.egresos, fill: "#ef4444" },
            { name: "Ahorro", monto: resumenBase.ahorrosMes, fill: "#14b8a6" },
        ];

        return { variaciones, dataTorta, dataBarras };
    }, [resumenBase, resumenComp, verPor, subcategorias]);

    const formatMesString = (mesStr) => {
        if (!mesStr) return "";
        const [anio, mes] = mesStr.split("-");
        return new Date(anio, parseInt(mes) - 1, 1).toLocaleString("es-ES", {
            month: "long",
            year: "numeric",
        });
    };

    const handleMesBaseChange = (nuevoMes) => {
        setMesBase(nuevoMes);
        const [anio, mes] = nuevoMes.split("-");
        const d = new Date(anio, parseInt(mes) - 2, 1);
        setMesComparacion(d.toISOString().slice(0, 7));
    };

    const exportarEstadisticas = async () => {
        const XLSX = await import("xlsx");
        const data = variaciones.map((v) => ({
            [verPor === "categoria" ? "Categoría" : "Subcategoría"]: v.key,
            "Gasto Mes Anterior": v.anterior,
            "Gasto Mes Actual": v.actual,
            Diferencia: v.dif,
            Porcentaje: `${v.porc.toFixed(1)}%`,
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estadisticas");
        XLSX.writeFile(wb, `Estadisticas_${mesBase}.xlsx`);
        toast.success("Excel generado");
    };

    if (loading)
        return <div className="p-10 text-center text-gray-400">Cargando estadísticas...</div>;

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Tus Estadísticas</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Mirá en qué se te fue la plata y si gastaste más que antes.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-800 p-2 rounded-2xl border border-gray-700 gap-2 w-full md:w-auto">
                        <MonthPicker value={mesBase} onChange={handleMesBaseChange} className="w-full sm:w-36" />
                        <MonthPicker value={mesComparacion} onChange={setMesComparacion} className="w-full sm:w-36" />
                    </div>
                    <button
                        onClick={exportarEstadisticas}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 w-full md:w-auto active:scale-[0.97] min-h-11"
                    >
                        ⬇️ Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">💵 Plata que entró (Ingresos)</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(resumenBase.ingresos)}</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">💸 Plata que salió (Egresos)</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(resumenBase.egresos)}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-600 to-emerald-800 p-5 rounded-2xl shadow-xl">
                    <p className="text-teal-100 text-sm font-medium mb-1">🐷 Lo que guardaste (Ahorro)</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(resumenBase.ahorrosMes)}</p>
                </div>
            </div>

            <div className="flex justify-center mb-6">
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    <button
                        onClick={() => setVerPor("categoria")}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition min-h-10 ${verPor === "categoria" ? "bg-blue-600 text-white" : "text-gray-400"
                            }`}
                    >
                        Por Categoría
                    </button>
                    <button
                        onClick={() => setVerPor("subcategoria")}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition min-h-10 ${verPor === "subcategoria" ? "bg-blue-600 text-white" : "text-gray-400"
                            }`}
                    >
                        Por Subcategoría
                    </button>
                </div>
            </div>

            <section className="mb-8">
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                    <div className="bg-gray-900/50 p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold text-white">
                            Gastos de {formatMesString(mesBase)} (vs {formatMesString(mesComparacion)})
                        </h2>
                    </div>
                    <ul className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto custom-scrollbar overscroll-contain">
                        {variaciones.map((v) => (
                            <li key={v.key} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-white capitalize">{v.key}</p>
                                    <p className="text-xs text-gray-400">
                                        Mes anterior: {formatCurrency(v.anterior)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${v.actual > 0 ? "text-white" : "text-gray-500"}`}>
                                        {formatCurrency(v.actual)}
                                    </p>
                                    {v.actual !== v.anterior && (
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${v.dif > 0 ? "bg-red-900/30 text-red-400" : "bg-green-900/30 text-green-400"
                                                }`}
                                        >
                                            {v.dif > 0 ? "Subió" : "Bajó"} {Math.abs(v.porc).toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <StatsCharts dataTorta={dataTorta} dataBarras={dataBarras} />
        </div>
    );
}