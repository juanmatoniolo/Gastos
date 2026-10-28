// src/app/estadisticas/page.jsx
"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { formatCurrency } from "@/utils/formatters";
import { getTransaccionesDelMes } from "@/utils/proyecciones";
import { CATEGORIAS_EGRESOS } from "@/utils/constantes";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORES_TORTA = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'];

export default function PaginaEstadisticas() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));

    if (loading) return <div className="p-10 text-center text-gray-400">Cargando estadísticas...</div>;

    // Datos del mes seleccionado
    const transaccionesMes = getTransaccionesDelMes(transacciones, mesSeleccionado);

    // 1. Preparar datos para el Gráfico de Torta (Egresos por categoría)
    const egresosMes = transaccionesMes.filter(t => t.tipo === 'egreso' && t.categoria !== 'ahorro');
    const gastosPorCategoria = egresosMes.reduce((acc, t) => {
        const catLabel = CATEGORIAS_EGRESOS.find(c => c.id === t.categoria)?.label || t.categoria;
        if (!acc[catLabel]) acc[catLabel] = 0;
        acc[catLabel] += t.monto;
        return acc;
    }, {});

    const dataTorta = Object.keys(gastosPorCategoria).map(cat => ({
        name: cat,
        value: gastosPorCategoria[cat]
    })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor

    // 2. Preparar datos para el Gráfico de Barras (Ingresos vs Egresos vs Ahorro)
    let totalIngresos = 0, totalEgresos = 0, totalAhorro = 0;
    transaccionesMes.forEach(t => {
        if (t.tipo === 'ingreso') totalIngresos += t.monto;
        else if (t.categoria === 'ahorro') totalAhorro += t.monto;
        else totalEgresos += t.monto;
    });

    const dataBarras = [
        { name: 'Ingresos', monto: totalIngresos, fill: '#22c55e' },
        { name: 'Egresos', monto: totalEgresos, fill: '#ef4444' },
        { name: 'Ahorro', monto: totalAhorro, fill: '#14b8a6' }
    ];

    // Custom Tooltip para formatear el dinero
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pt-2 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Estadísticas</h1>
                    <p className="text-gray-400 text-sm mt-1">Analiza en qué se va tu dinero.</p>
                </div>
                <input
                    type="month"
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    className="bg-gray-800 text-white p-2.5 rounded-xl border border-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-sm w-full md:w-auto"
                />
            </div>

            {transaccionesMes.length === 0 ? (
                <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700/50 border-dashed">
                    <p className="text-gray-400">No hay datos para mostrar en este mes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Gráfico de Torta: Gastos por Categoría */}
                    <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Distribución de Egresos</h2>
                        {dataTorta.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">No hay egresos registrados.</p>
                        ) : (
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dataTorta}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {dataTorta.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Gráfico de Barras: Balance General */}
                    <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Balance General del Mes</h2>
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

                </div>
            )}
        </div>
    );
}