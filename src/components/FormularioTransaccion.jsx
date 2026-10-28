// src/components/FormularioTransaccion.jsx
"use client";
import { useState, useEffect } from "react";
import { agregarTransaccion, actualizarTransaccion } from "@/services/transaccionesService";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";
import { formatInputNumber, parseInputNumber } from "@/utils/formatters";

export default function FormularioTransaccion({ userId, onClose, transaccionAEditar }) {
    const isEditing = !!transaccionAEditar;

    const [formData, setFormData] = useState({
        tipo: "egreso",
        montoStr: "", // Usamos string para el input formateado
        fecha: new Date().toISOString().split("T")[0],
        categoria: CATEGORIAS_EGRESOS[0].id,
        subcategoria: "",
        descripcion: "",
        esCredito: false,
        cuotas: 1,
        esRecurrente: false,
    });

    const [cargando, setCargando] = useState(false);

    // Si estamos editando, precargamos los datos
    useEffect(() => {
        if (isEditing) {
            setFormData({
                tipo: transaccionAEditar.tipo,
                montoStr: formatInputNumber(transaccionAEditar.monto.toString()),
                fecha: transaccionAEditar.fecha,
                categoria: transaccionAEditar.categoria,
                subcategoria: transaccionAEditar.subcategoria || "",
                descripcion: transaccionAEditar.descripcion || "",
                esCredito: transaccionAEditar.metodoPago === "tarjeta_credito",
                cuotas: transaccionAEditar.cuotasData?.cantidad || 1,
                esRecurrente: transaccionAEditar.esRecurrente || false,
            });
        }
    }, [transaccionAEditar, isEditing]);

    const esAhorro = formData.tipo === "egreso" && formData.categoria === "ahorro";

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // Manejador específico para el input de monto
    const handleMontoChange = (e) => {
        const rawValue = e.target.value;
        const formatted = formatInputNumber(rawValue);
        setFormData((prev) => ({ ...prev, montoStr: formatted }));
    };

    const handleTipoChange = (nuevoTipo) => {
        setFormData((prev) => ({
            ...prev,
            tipo: nuevoTipo,
            categoria: nuevoTipo === "ingreso" ? CATEGORIAS_INGRESOS[0].id : CATEGORIAS_EGRESOS[0].id,
            esCredito: false,
            esRecurrente: nuevoTipo === "ingreso" && CATEGORIAS_INGRESOS[0].id === "ingreso_fijo"
        }));
    };

    const handleCategoriaChange = (e) => {
        const nuevaCat = e.target.value;
        setFormData((prev) => ({
            ...prev,
            categoria: nuevaCat,
            esCredito: nuevaCat === "ahorro" ? false : prev.esCredito,
            esRecurrente: nuevaCat === "ingreso_fijo" ? true : prev.esRecurrente
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const montoNumerico = parseInputNumber(formData.montoStr);

        if (montoNumerico <= 0 || !userId) return;

        setCargando(true);

        const dataToSave = {
            tipo: formData.tipo,
            monto: montoNumerico,
            fecha: formData.fecha,
            categoria: formData.categoria,
            subcategoria: formData.subcategoria,
            descripcion: formData.descripcion.trim() ||
                (formData.tipo === "ingreso"
                    ? CATEGORIAS_INGRESOS.find(c => c.id === formData.categoria)?.label
                    : CATEGORIAS_EGRESOS.find(c => c.id === formData.categoria)?.label),
            cuotas: formData.esCredito ? parseInt(formData.cuotas) : 1,
            metodoPago: formData.tipo === "ingreso" || esAhorro ? "transferencia" : (formData.esCredito ? "tarjeta_credito" : "efectivo"),
            esRecurrente: formData.esRecurrente,
        };

        try {
            if (isEditing) {
                await actualizarTransaccion(userId, transaccionAEditar.id, dataToSave);
            } else {
                await agregarTransaccion(userId, dataToSave);
            }

            // Limpiamos el formulario
            setFormData({
                tipo: "egreso", montoStr: "", fecha: new Date().toISOString().split("T")[0],
                categoria: CATEGORIAS_EGRESOS[0].id, subcategoria: "", descripcion: "",
                esCredito: false, cuotas: 1, esRecurrente: false,
            });
            if (onClose) onClose();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error al guardar.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="bg-gray-800 p-5 md:p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md md:max-w-xl mx-auto max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-800 z-10 pb-2">
                <h2 className="text-xl font-bold text-white">{isEditing ? "Editar Movimiento" : "Registrar Movimiento"}</h2>
                {onClose && <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center transition">&times;</button>}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                {/* 1. TIPO Y MONTO */}
                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 flex flex-col gap-4">
                    <div className="flex bg-gray-800 p-1 rounded-xl w-full">
                        <button type="button" onClick={() => handleTipoChange("egreso")} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${formData.tipo === "egreso" ? "bg-red-500 text-white shadow-md" : "text-gray-400 hover:text-gray-200"}`}>Egreso / Ahorro</button>
                        <button type="button" onClick={() => handleTipoChange("ingreso")} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${formData.tipo === "ingreso" ? "bg-green-500 text-white shadow-md" : "text-gray-400 hover:text-gray-200"}`}>Ingreso</button>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase tracking-wider">Monto</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">$</span>
                            <input
                                type="text"
                                name="montoStr"
                                placeholder="0,00"
                                value={formData.montoStr}
                                onChange={handleMontoChange}
                                className="w-full bg-gray-700 text-white pl-10 pr-4 py-3.5 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-2xl font-bold tracking-wide transition-all outline-none"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 2. FECHA Y CATEGORÍA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase tracking-wider">Fecha</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" required />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase tracking-wider">Categoría</label>
                        <select name="categoria" value={formData.categoria} onChange={handleCategoriaChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer outline-none transition-all">
                            {formData.tipo === "ingreso"
                                ? CATEGORIAS_INGRESOS.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)
                                : CATEGORIAS_EGRESOS.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)
                            }
                        </select>
                    </div>
                </div>

                {/* 3. DETALLES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase tracking-wider">
                            {esAhorro ? "¿Qué compraste/guardaste?" : "Subcategoría / Detalle"}
                        </label>
                        <input type="text" name="subcategoria" placeholder={esAhorro ? "Ej: Dólares, Plazo Fijo..." : "Ej: Fibertel, Visa..."} value={formData.subcategoria} onChange={handleChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 focus:border-blue-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase tracking-wider">Descripción</label>
                        <input type="text" name="descripcion" placeholder={esAhorro ? "Ej: Ahorro mensual" : "Ej: Pago mensual"} value={formData.descripcion} onChange={handleChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 focus:border-blue-500 outline-none transition-all" />
                    </div>
                </div>

                {/* 4. TARJETA DE CRÉDITO */}
                {formData.tipo === "egreso" && !esAhorro && (
                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 mt-1 transition-all">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${formData.esCredito ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">¿Pagaste con Tarjeta de Crédito?</p>
                                </div>
                            </div>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" name="esCredito" checked={formData.esCredito} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            </div>
                        </label>

                        {formData.esCredito && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50 animate-fade-in flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase tracking-wider">Cuotas</label>
                                    <input type="number" name="cuotas" min="2" max="48" value={formData.cuotas} onChange={handleChange} className="w-full bg-gray-700 text-white p-3 rounded-xl border border-orange-500/50 focus:border-orange-500 text-center text-lg font-bold outline-none" />
                                </div>
                                <div className="flex-1 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 text-center">
                                    <p className="text-[10px] text-orange-300 uppercase font-bold">Cada mes pagarás</p>
                                    <p className="text-orange-400 font-bold text-lg">
                                        ${formData.montoStr && formData.cuotas ? (parseInputNumber(formData.montoStr) / parseInt(formData.cuotas)).toFixed(2) : "0.00"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. REPETIR (Ingreso Fijo) */}
                {formData.tipo === "ingreso" && formData.categoria === "ingreso_fijo" && (
                    <label className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-xl cursor-pointer border border-blue-800/50 hover:bg-blue-900/30 transition">
                        <input type="checkbox" name="esRecurrente" checked={formData.esRecurrente} onChange={handleChange} className="w-5 h-5 accent-blue-500 rounded cursor-pointer" />
                        <div className="flex flex-col">
                            <span className="text-blue-300 font-bold text-sm">Repetir todos los meses</span>
                            <span className="text-xs text-blue-400/70 leading-tight">Proyecta este ingreso a futuro automáticamente.</span>
                        </div>
                    </label>
                )}

                <div className="sticky bottom-0 bg-gray-800 pt-2 pb-1">
                    <button type="submit" disabled={cargando} className={`w-full p-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-[0.98] ${cargando ? "bg-gray-600" : formData.tipo === "ingreso" ? "bg-green-600 hover:bg-green-500" : esAhorro ? "bg-teal-600 hover:bg-teal-500" : "bg-blue-600 hover:bg-blue-500"}`}>
                        {cargando ? "Guardando..." : isEditing ? "Actualizar Transacción" : "Guardar Transacción"}
                    </button>
                </div>
            </form>
        </div>
    );
}