// src/components/StatsCharts.jsx
"use client";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { formatCurrency } from "@/utils/formatters";

const COLORES_TORTA = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#14b8a6",
];

function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-xl">
                <p className="text-gray-200 font-medium">{payload[0].name}</p>
                <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
    return null;
}

export default function StatsCharts({ dataTorta, dataBarras }) {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
                <h3 className="text-md font-semibold text-gray-200 mb-4 text-center">
                    ¿En qué se fue tu plata?
                </h3>
                {dataTorta.length === 0 ? (
                    <p className="text-gray-400 text-center py-10">No gastaste plata este mes.</p>
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
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dataTorta.map((_, i) => (
                                        <Cell key={i} fill={COLORES_TORTA[i % COLORES_TORTA.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(v) => <span className="text-gray-300 text-sm">{v}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700">
                <h3 className="text-md font-semibold text-gray-200 mb-4 text-center">
                    Resumen General
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                            <Tooltip cursor={{ fill: "#374151" }} content={<CustomTooltip />} />
                            <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                                {dataBarras.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
}