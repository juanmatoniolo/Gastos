// src/app/estadisticas/page.jsx
"use client";
import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { useSubcategorias } from "@/hooks/useSubcategorias"; // Importamos para traer todas las subcategorías
import MonthPicker from "@/components/MonthPicker";
import { formatCurrency } from "@/utils/formatters";
import { getResumenMes } from "@/utils/proyecciones";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORES_TORTA = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#14b8a6'];

const calcularDiferencia = (actual, anterior) => {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return ((actual - anterior) / anterior) * 100;
};

export default function PaginaEstadisticas() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);
    const { subcategorias } = useSubcategorias(user?.uid); // Traemos las subcats del usuario

    const hoy = new Date();
    const mesActual = hoy.toISOString().slice(0, 7);
    const mesAnteriorDate = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const mesAnterior = mesAnteriorDate.toISOString().slice(0, 7);

    const [mesBase, setMesBase] = useState(mesActual);
    const [mesComparacion, setMesComparacion] = useState(mesAnterior);
    const [verPor, setVerPor] = useState("categoria");

    const formatMesString = (mesStr) => {
        if (!mesStr) return "";
        const [anio, mes] = mesStr.split("-");
        const fecha = new Date(anio, parseInt(mes) - 1, 1);
        return fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    };

    const handleMesBaseChange = (nuevoMes) => {
        setMesBase(nuevoMes);
        const [anio, mes] = nuevoMes.split("-");
        const d = new Date(anio, parseInt(mes) - 2, 1);
        setMesComparacion(d.toISOString().slice(0, 7));
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Cargando estadísticas...</div>;

    const resumenBase = getResumenMes(transacciones, mesBase);
    const resumenComp = getResumenMes(transacciones, mesComparacion);

    // --- PREPARAR TODAS LAS CATEGORÍAS/SUBCATEGORÍAS (INCLUSO EN 0) ---
    const generarDiccionarioBase = () => {
        const dict = {};
        if (verPor === "categoria") {
            CATEGORIAS_EGRESOS.forEach(c => dict[c.label] = 0);
        } else {
            // Si vemos por subcategoría, inicializamos con las que el usuario creó
            subcategorias.egreso?.forEach(s => dict[s.nombre] = 0);
        }
        return dict;
    };

    const agruparGastos = (resumen) => {
        const dict = generarDiccionarioBase();
        // Incluimos TODOS los egresos (incluyendo Ahorro)
        const egresos = resumen.transacciones.filter(t => t.tipo === 'egreso');

        egresos.forEach(t => {
            let key;
            if (verPor === "categoria") {
                key = CATEGORIAS_EGRESOS.find(c => c.id === t.categoria)?.label || t.categoria;
            } else {
                key = t.subcategoria || "Sin Subcategoría";
                if (!dict[key]) dict[key] = 0; // Por si hay una subcat que no está en la lista base
            }
            dict[key] += t.monto;
        });
        return dict;
    };

    const gastosBase = agruparGastos(resumenBase);
    const gastosComp = agruparGastos(resumenComp);

    // Unimos todas las keys para la tabla de variaciones
    const todasLasKeys = Array.from(new Set([...Object.keys(gastosBase), ...Object.keys(gastosComp)]));

    const variaciones = todasLasKeys.map(key => {
        const actual = gastosBase[key] || 0;
        const anterior = gastosComp[key] || 0;
        const dif = actual - anterior;
        const porc = calcularDiferencia(actual, anterior);
        return { key, actual, anterior, dif, porc };
    }).sort((a, b) => Math.abs(b.actual) - Math.abs(a.actual)); // Ordenar por los que más gastaste

    // Datos para Gráficos
    const dataTorta = Object.keys(gastosBase)
        .filter(k => gastosBase[k] > 0) // En la torta solo mostramos los que tienen plata
        .map(k => ({ name: k, value: gastosBase[k] }))
        .sort((a, b) => b.value - a.value);

    const dataBarras = [
        { name: 'Ingresos', monto: resumenBase.ingresos, fill: '#22c55e' },
        { name: 'Egresos', monto: resumenBase.egresos, fill: '#ef4444' },
        { name: 'Ahorro', monto: resumenBase.ahorrosMes, fill: '#14b8a6' }
    ];

    // --- EXPORTAR ESTADÍSTICAS A EXCEL ---
    const exportarEstadisticas = () => {
        const dataToExport = variaciones.map(v => ({
            [verPor === "categoria" ? "Categoría" : "Subcategoría"]: v.key,
            "Gasto Mes Anterior": v.anterior,
            "Gasto Mes Actual": v.actual,
            "Diferencia": v.dif,
            "Porcentaje": `${v.porc.toFixed(1)}%`
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estadisticas");
        XLSX.writeFile(wb, `Estadisticas_${mesBase}.xlsx`);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-xl">
                    <p className="text-gray-200 font-medium">{payload[0].name}</p>
                    <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-4 md:p-8 pb-24 md:pb-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Tus Estadísticas</h1>
                    <p className="text-gray-400 text-sm mt-1">Mirá en qué se te fue la plata y si gastaste más que antes.</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-800 p-2 rounded-2xl border border-gray-700 gap-2 w-full md:w-auto">
                        <MonthPicker value={mesBase} onChange={handleMesBaseChange} className="w-full sm:w-36" />
                        <MonthPicker value={mesComparacion} onChange={setMesComparacion} className="w-full sm:w-36" />
                    </div>
                    <button onClick={exportarEstadisticas} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2 w-full md:w-auto">
                        ⬇️ Excel
                    </button>
                </div>
            </div>

            {/* TARJETAS DE ARRIBA (PLATA ENTRÓ VS PLATA SALIÓ) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex flex-col justify-between">
                    <p className="text-sm text-gray-400 mb-1">💵 Plata que entró (Ingresos)</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(resumenBase.ingresos)}</p>
                </div>
                <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex flex-col justify-between">
                    <p className="text-sm text-gray-400 mb-1">💸 Plata que salió (Egresos)</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(resumenBase.egresos)}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-600 to-emerald-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                    <p className="text-teal-100 text-sm font-medium mb-1">🐷 Lo que guardaste (Ahorro)</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(resumenBase.ahorrosMes)}</p>
                </div>
            </div>

            {/* SELECTOR CATEGORIA / SUBCATEGORIA */}
            <div className="flex justify-center mb-6">
                <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    <button onClick={() => setVerPor("categoria")} className={`px-6 py-2 text-sm font-bold rounded-lg transition ${verPor === "categoria" ? "bg-blue-600 text-white" : "text-gray-400"}`}>Por Categoría</button>
                    <button onClick={() => setVerPor("subcategoria")} className={`px-6 py-2 text-sm font-bold rounded-lg transition ${verPor === "subcategoria" ? "bg-blue-600 text-white" : "text-gray-400"}`}>Por Subcategoría</button>
                </div>
            </div>

            {/* TABLA DE TODAS LAS CATEGORIAS (INCLUSO EN 0) */}
            <section className="mb-8">
                <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                    <div className="bg-gray-900/50 p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold text-white">Gastos de {formatMesString(mesBase)} (vs {formatMesString(mesComparacion)})</h2>
                    </div>
                    <ul className="divide-y divide-gray-700/50 max-h-96 overflow-y-auto custom-scrollbar">
                        {variaciones.map((v) => (
                            <li key={v.key} className="p-4 flex justify-between items-center hover:bg-gray-750 transition-colors">
                                <div>
                                    <p className="font-semibold text-white capitalize">{v.key}</p>
                                    <p className="text-xs text-gray-400">Mes anterior: {formatCurrency(v.anterior)}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${v.actual > 0 ? 'text-white' : 'text-gray-500'}`}>{formatCurrency(v.actual)}</p>
                                    {v.actual !== v.anterior && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${v.dif > 0 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                            {v.dif > 0 ? "Subió" : "Bajó"} {Math.abs(v.porc).toFixed(1)}%
                                        </span>
                                    )}
                                    {v.actual === v.anterior && <span className="text-xs text-gray-500">Igual</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* GRÁFICOS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
                    <h3 className="text-md font-semibold text-gray-200 mb-4 text-center">¿En qué se fue tu plata?</h3>
                    {dataTorta.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">No gastaste plata este mes.</p>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dataTorta} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                                        {dataTorta.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
                    <h3 className="text-md font-semibold text-gray-200 mb-4 text-center">Resumen General</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip cursor={{ fill: '#374151' }} content={<CustomTooltip />} />
                                <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                                    {dataBarras.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    );
}