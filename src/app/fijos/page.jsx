// src/app/fijos/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { formatCurrency } from "@/utils/formatters";
import { getResumenMes } from "@/utils/proyecciones";
import { eliminarTransaccion } from "@/services/transaccionesService";
import FormularioTransaccion from "@/components/FormularioTransaccion";

export default function GastosFijos() {
    const { user } = useAuth();
    const { transacciones, loading } = useTransacciones(user?.uid);

    const [mesesProyectados, setMesesProyectados] = useState([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [transaccionAEditar, setTransaccionAEditar] = useState(null);

    // Filtramos las transacciones que son gastos fijos reales
    // (Servicios fijos o Tarjetas de crédito con más de 1 cuota)
    const gastosFijosBase = transacciones?.filter(t =>
        t.tipo === 'egreso' && (
            t.categoria === 'servicio_fijo' ||
            (t.metodoPago === 'tarjeta_credito' && t.cuotasData?.cantidad > 1)
        )
    ) || [];

    useEffect(() => {
        if (loading) return;

        const meses = [];
        const hoy = new Date();

        // Generar exactamente 12 meses a partir de este mes
        for (let i = 0; i < 12; i++) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
            const mesStr = fecha.toISOString().slice(0, 7); // YYYY-MM
            const mesNombre = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

            // Usamos la función inteligente de proyecciones
            const resumen = getResumenMes(transacciones, mesStr);

            // Separar los gastos para mostrar el detalle
            const servicios = resumen.transacciones.filter(t => t.tipo === "egreso" && t.categoria === "servicio_fijo");
            const cuotas = resumen.transacciones.filter(t => t.tipo === "egreso" && t.metodoPago === "tarjeta_credito" && t.cuotasData?.activa);

            meses.push({
                id: mesStr,
                nombre: mesNombre,
                ingreso: resumen.ingresos,
                egresos: resumen.egresos,
                balance: resumen.balance,
                servicios,
                cuotas
            });
        }
        setMesesProyectados(meses);
    }, [transacciones, loading]);

    const abrirEditar = (t) => {
        setTransaccionAEditar(t);
        setMostrarForm(true);
    };

    const abrirNuevo = () => {
        setTransaccionAEditar(null);
        setMostrarForm(true);
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Cargando gastos fijos...</div>;

    return (
        <div className="p-4 md:p-8 pt-8 pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Gastos Fijos y Cuotas</h1>
                    <p className="text-gray-400 text-sm">Administra tus servicios y prevee los próximos 12 meses.</p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
                >
                    <span className="text-xl">+</span> Nuevo Fijo
                </button>
            </div>

            {/* SECCIÓN 1: Gestión de Fijos Activos */}
            <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4 text-white border-b border-gray-700 pb-2">Fijos Activos</h2>

                {gastosFijosBase.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/50 rounded-2xl border border-gray-700/50 border-dashed">
                        <p className="text-gray-400">No tienes servicios fijos ni tarjetas registradas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gastosFijosBase.map((t) => (
                            <div key={t.id} className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-lg truncate pr-2" title={t.descripcion}>
                                            {t.descripcion}
                                        </h3>
                                        <span className={`text-xs px-2 py-1 rounded-md font-bold shrink-0 ${t.metodoPago === 'tarjeta_credito' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {t.metodoPago === 'tarjeta_credito' ? 'Tarjeta' : 'Servicio'}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-100 mb-1">{formatCurrency(t.monto)}</p>

                                    {t.metodoPago === 'tarjeta_credito' ? (
                                        <p className="text-sm text-gray-400">
                                            {t.cuotasData.cantidad} cuotas de {formatCurrency(t.cuotasData.montoPorCuota)}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">Mensual</p>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700/50">
                                    <button onClick={() => abrirEditar(t)} className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition font-medium">
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm("¿Seguro que quieres eliminar este gasto fijo? Se borrarán también sus proyecciones futuras.")) {
                                                eliminarTransaccion(user.uid, t.id);
                                            }
                                        }}
                                        className="flex-1 text-xs bg-red-900/30 hover:bg-red-900/60 text-red-400 py-2 rounded-lg transition font-medium"
                                    >
                                        Borrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* SECCIÓN 2: Proyección */}
            <section>
                <h2 className="text-lg font-semibold mb-4 text-white border-b border-gray-700 pb-2">Proyección a 12 Meses</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {mesesProyectados.map((mes, index) => (
                        <div key={mes.id} className={`bg-gray-800 p-5 rounded-2xl border ${index === 0 ? 'border-blue-500/50 shadow-blue-900/20' : 'border-gray-700'} shadow-lg`}>
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                                <span className="font-bold text-blue-400 capitalize text-lg">{mes.nombre}</span>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Balance Libre</p>
                                    <span className={`font-bold ${mes.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(mes.balance)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-900/50 p-2.5 rounded-lg">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Ingreso Proyectado</p>
                                    <p className="text-sm text-green-400 font-semibold truncate">{formatCurrency(mes.ingreso)}</p>
                                </div>
                                <div className="bg-gray-900/50 p-2.5 rounded-lg">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Gastos Fijos</p>
                                    <p className="text-sm text-orange-400 font-semibold truncate">{formatCurrency(mes.egresos)}</p>
                                </div>
                            </div>

                            {/* Detalles */}
                            <div className="flex flex-col gap-2">
                                {mes.servicios.map((s, i) => (
                                    <div key={`serv-${i}`} className="flex justify-between text-xs text-gray-300">
                                        <span className="flex items-center gap-1.5 truncate pr-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span> {s.descripcion}</span>
                                        <span className="text-gray-400 shrink-0">{formatCurrency(s.monto)}</span>
                                    </div>
                                ))}
                                {mes.cuotas.map((c, i) => (
                                    <div key={`cuota-${i}`} className="flex justify-between text-xs text-gray-300">
                                        <span className="flex items-center gap-1.5 truncate pr-2"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0"></span> {c.descripcion}</span>
                                        <span className="text-gray-400 shrink-0">{formatCurrency(c.cuotasData.montoPorCuota)}</span>
                                    </div>
                                ))}
                                {mes.servicios.length === 0 && mes.cuotas.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">Sin gastos fijos comprometidos</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Modal del Formulario */}
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