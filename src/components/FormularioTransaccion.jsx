// src/components/FormularioTransaccion.jsx
"use client";
import { useState, useEffect } from "react";
import { agregarTransaccion, actualizarTransaccion } from "@/services/transaccionesService";
import { agregarSubcategoria } from "@/services/subcategoriasService";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";
import { formatInputNumber, parseInputNumber } from "@/utils/formatters";
import { useSubcategorias } from "@/hooks/useSubcategorias";

export default function FormularioTransaccion({ userId, onClose, transaccionAEditar, transacciones, mesSeleccionado }) {
    const isEditingVirtual = transaccionAEditar?.id?.includes('rec-') || transaccionAEditar?.id?.includes('cuota-');
    const isEditingReal = transaccionAEditar && !isEditingVirtual;
    const idRealAEditar = isEditingReal ? transaccionAEditar.id : null;

    const { subcategorias } = useSubcategorias(userId);
    const [mostrarNuevaSubcat, setMostrarNuevaSubcat] = useState(false);
    const [nuevaSubcatStr, setNuevaSubcatStr] = useState("");

    const fechaBase = mesSeleccionado ? `${mesSeleccionado}-01` : new Date().toISOString().split("T")[0];

    const [formData, setFormData] = useState({
        tipo: "egreso", montoStr: "", cuotaStr: "", fecha: fechaBase,
        categoria: CATEGORIAS_EGRESOS[0].id, subcategoria: "", descripcion: "",
        esCredito: false, cuotas: 1, esRecurrente: false,
    });

    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (transaccionAEditar) {
            const isCredito = transaccionAEditar.metodoPago === "tarjeta_credito";
            const cantCuotas = transaccionAEditar.cuotasData?.cantidad || 1;
            const montoTotal = transaccionAEditar.monto || 0;
            const cleanDesc = (transaccionAEditar.descripcion || '').replace(/\s*\(Cuota \d+\/\d+\)/g, '').trim();

            setFormData({
                tipo: transaccionAEditar.tipo,
                montoStr: formatInputNumber(montoTotal.toString()),
                cuotaStr: isCredito && cantCuotas > 1 ? formatInputNumber((montoTotal / cantCuotas).toString()) : "",
                fecha: isEditingVirtual ? `${mesSeleccionado}-01` : transaccionAEditar.fecha,
                categoria: transaccionAEditar.categoria,
                subcategoria: transaccionAEditar.subcategoria || "",
                descripcion: cleanDesc,
                esCredito: isCredito,
                cuotas: cantCuotas,
                esRecurrente: transaccionAEditar.esRecurrente || false,
            });
        }
    }, [transaccionAEditar, isEditingVirtual, mesSeleccionado]);

    const esAhorro = formData.tipo === "egreso" && formData.categoria === "ahorro";
    const permiteRecurrencia = formData.tipo === "ingreso" || (formData.tipo === "egreso" && !esAhorro);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleGuardarSubcategoria = async () => {
        if (!nuevaSubcatStr.trim()) return;
        try {
            await agregarSubcategoria(userId, nuevaSubcatStr.trim(), formData.tipo);
            setFormData(prev => ({ ...prev, subcategoria: nuevaSubcatStr.trim() }));
            setNuevaSubcatStr("");
            setMostrarNuevaSubcat(false);
        } catch (error) {
            console.error("Error al guardar subcategoría", error);
        }
    };

    const handleCuotaChange = (e) => {
        const formatted = formatInputNumber(e.target.value);
        const numericCuota = parseInputNumber(formatted);
        setFormData((prev) => ({ ...prev, cuotaStr: formatted, montoStr: formatInputNumber((numericCuota * prev.cuotas).toString()) }));
    };

    const handleCantidadCuotasChange = (e) => {
        const cant = parseInt(e.target.value) || 1;
        const numericCuota = parseInputNumber(formData.cuotaStr);
        setFormData((prev) => ({ ...prev, cuotas: cant, montoStr: formatInputNumber((numericCuota * cant).toString()) }));
    };

    const handleMontoTotalChange = (e) => {
        const formatted = formatInputNumber(e.target.value);
        const numeric = parseInputNumber(formatted);
        setFormData((prev) => ({ ...prev, montoStr: formatted, cuotaStr: formData.esCredito ? formatInputNumber((numeric / prev.cuotas).toString()) : "" }));
    };

    const handleTipoChange = (nuevoTipo) => {
        setFormData((prev) => ({
            ...prev, tipo: nuevoTipo, categoria: nuevoTipo === "ingreso" ? CATEGORIAS_INGRESOS[0].id : CATEGORIAS_EGRESOS[0].id,
            esCredito: false, esRecurrente: false, cuotaStr: "", cuotas: 1, subcategoria: ""
        }));
    };

    const handleCategoriaChange = (e) => {
        const nuevaCat = e.target.value;
        const esFijo = ["servicio_fijo", "servicio_variable", "gasto_necesario"].includes(nuevaCat);
        setFormData((prev) => ({
            ...prev, categoria: nuevaCat, esCredito: nuevaCat === "ahorro" ? false : prev.esCredito,
            esRecurrente: esFijo || nuevaCat === "ingreso_fijo" ? true : prev.esRecurrente
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const montoNumerico = parseInputNumber(formData.montoStr);
        if (montoNumerico <= 0 || !userId) return;

        setCargando(true);

        let finalOriginalId = transaccionAEditar?.originalId || null;
        if (isEditingVirtual && !finalOriginalId) {
            finalOriginalId = transaccionAEditar.id.split('-')[1];
        }

        const descFinal = formData.descripcion.trim() || (formData.tipo === "ingreso" ? CATEGORIAS_INGRESOS.find(c => c.id === formData.categoria)?.label : CATEGORIAS_EGRESOS.find(c => c.id === formData.categoria)?.label);

        // Validación para creación de nuevos recurrentes (evitar duplicados)
        if (!isEditingReal && !isEditingVirtual && formData.esRecurrente) {
            const existente = transacciones?.find(t =>
                t.descripcion.toLowerCase() === descFinal.toLowerCase() &&
                t.tipo === formData.tipo &&
                t.esRecurrente &&
                !t.id.includes('rec-') &&
                !t.id.includes('cuota-')
            );
            if (existente) {
                finalOriginalId = existente.originalId || existente.id;
            }
        }

        const dataToSave = {
            tipo: formData.tipo, monto: montoNumerico, fecha: formData.fecha, categoria: formData.categoria,
            subcategoria: formData.subcategoria,
            descripcion: descFinal,
            cuotas: isEditingVirtual ? 1 : (formData.esCredito ? parseInt(formData.cuotas) : 1),
            metodoPago: isEditingVirtual ? "efectivo" : (formData.tipo === "ingreso" || esAhorro ? "transferencia" : (formData.esCredito ? "tarjeta_credito" : "efectivo")),
            esRecurrente: formData.esRecurrente,
            originalId: finalOriginalId,
        };

        try {
            // LÓGICA ESTRICTA: Si tiene ID real, ACTUALIZA. Si no, AGREGA.
            if (isEditingReal && idRealAEditar) {
                await actualizarTransaccion(userId, idRealAEditar, dataToSave);
            } else {
                await agregarTransaccion(userId, dataToSave);
            }
            if (onClose) onClose();
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un error al guardar.");
        } finally { setCargando(false); }
    };

    return (
        <div className="bg-gray-800 p-5 md:p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md md:max-w-xl mx-auto max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-800 z-10 pb-2">
                <h2 className="text-xl font-bold text-white">{isEditingReal || isEditingVirtual ? "Editar Movimiento" : "Anotar Movimiento"}</h2>
                {onClose && <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center transition">&times;</button>}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex bg-gray-900 p-1 rounded-xl w-full">
                    <button type="button" onClick={() => handleTipoChange("egreso")} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${formData.tipo === "egreso" ? "bg-red-500 text-white shadow-md" : "text-gray-400"}`}>Gasto</button>
                    <button type="button" onClick={() => handleTipoChange("ingreso")} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition ${formData.tipo === "ingreso" ? "bg-green-500 text-white shadow-md" : "text-gray-400"}`}>Ingreso</button>
                </div>

                {formData.tipo === "egreso" && !esAhorro && !isEditingVirtual && (
                    <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-700">
                        <button type="button" onClick={() => setFormData({ ...formData, esCredito: false, cuotaStr: "", cuotas: 1 })} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${!formData.esCredito ? "bg-gray-700 text-white shadow-md" : "text-gray-400"}`}>Efectivo / Débito</button>
                        <button type="button" onClick={() => setFormData({ ...formData, esCredito: true })} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${formData.esCredito ? "bg-orange-500 text-white shadow-md" : "text-gray-400"}`}>Tarjeta Crédito</button>
                    </div>
                )}

                <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                    {formData.esCredito && formData.tipo === "egreso" && !isEditingVirtual ? (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase">Valor de cada Cuota</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input type="text" inputMode="decimal" name="cuotaStr" placeholder="0" value={formData.cuotaStr} onChange={handleCuotaChange} className="w-full bg-gray-700 text-white pl-8 pr-3 py-3 rounded-xl border border-gray-600 focus:border-orange-500 text-xl font-bold outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase">Cant. de Cuotas</label>
                                    <input type="number" name="cuotas" min="2" max="48" value={formData.cuotas} onChange={handleCantidadCuotasChange} className="w-full bg-gray-700 text-white p-3 rounded-xl border border-gray-600 focus:border-orange-500 text-center text-xl font-bold outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 mt-1">
                                <span className="text-sm text-orange-300 font-bold uppercase block">Monto Total:</span>
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-400 font-bold">$</span>
                                    <input type="text" inputMode="decimal" name="montoStr" placeholder="0" value={formData.montoStr} onChange={handleMontoTotalChange} className="bg-transparent text-orange-400 font-bold text-xl text-right pr-1 outline-none w-32 border-b border-orange-500/30 focus:border-orange-500" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase">Monto Total</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">$</span>
                                <input type="text" inputMode="decimal" name="montoStr" placeholder="0" value={formData.montoStr} onChange={handleMontoTotalChange} className="w-full bg-gray-700 text-white pl-10 pr-4 py-3.5 rounded-xl border border-gray-600 focus:border-blue-500 text-2xl font-bold outline-none" required />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase">Categoría</label>
                        <select name="categoria" value={formData.categoria} onChange={handleCategoriaChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 outline-none cursor-pointer">
                            {formData.tipo === "ingreso" ? CATEGORIAS_INGRESOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>) : CATEGORIAS_EGRESOS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase flex justify-between items-center">
                            Subcategoría
                            {!mostrarNuevaSubcat && (
                                <button type="button" onClick={() => setMostrarNuevaSubcat(true)} className="text-blue-400 hover:text-blue-300 text-lg leading-none" title="Agregar nueva">+</button>
                            )}
                        </label>
                        {mostrarNuevaSubcat ? (
                            <div className="flex gap-2">
                                <input type="text" placeholder="Nueva subcategoría..." value={nuevaSubcatStr} onChange={(e) => setNuevaSubcatStr(e.target.value)} className="flex-1 bg-gray-700 text-white p-3 rounded-xl border border-blue-500 outline-none text-sm" autoFocus />
                                <button type="button" onClick={handleGuardarSubcategoria} className="bg-blue-600 text-white px-4 rounded-xl font-bold">OK</button>
                                <button type="button" onClick={() => setMostrarNuevaSubcat(false)} className="bg-gray-600 text-white px-3 rounded-xl">&times;</button>
                            </div>
                        ) : (
                            <select name="subcategoria" value={formData.subcategoria} onChange={handleChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 outline-none cursor-pointer">
                                <option value="">Sin subcategoría</option>
                                {subcategorias[formData.tipo]?.map(sub => (
                                    <option key={sub.id} value={sub.nombre}>{sub.nombre}</option>
                                ))}
                                {formData.subcategoria && !subcategorias[formData.tipo]?.find(s => s.nombre === formData.subcategoria) && (
                                    <option value={formData.subcategoria}>{formData.subcategoria}</option>
                                )}
                            </select>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase">Descripción (Título)</label>
                        <input type="text" name="descripcion" placeholder="Ej: Clases de Pilates..." value={formData.descripcion} onChange={handleChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1.5 ml-1 text-xs font-bold uppercase">Fecha</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full bg-gray-700 text-white p-3.5 rounded-xl border border-gray-600 outline-none" required />
                    </div>
                </div>

                {permiteRecurrencia && !formData.esCredito && (
                    <label className="flex items-center gap-3 bg-blue-900/20 p-4 rounded-xl cursor-pointer border border-blue-800/50 hover:bg-blue-900/30 transition">
                        <input type="checkbox" name="esRecurrente" checked={formData.esRecurrente} onChange={handleChange} className="w-5 h-5 accent-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-blue-300 font-bold text-sm">Repetir todos los meses</span>
                            <span className="text-xs text-blue-400/70">Desmarcalo si este mes fue el último que pagaste/cobraste.</span>
                        </div>
                    </label>
                )}

                <button type="submit" disabled={cargando} className={`w-full p-4 rounded-xl font-bold text-white mt-2 transition-all shadow-lg active:scale-95 ${cargando ? "bg-gray-600" : formData.tipo === "ingreso" ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"}`}>
                    {cargando ? "Guardando..." : isEditingVirtual ? "Actualizar este mes y futuros" : "Guardar Movimiento"}
                </button>
            </form>
        </div>
    );
}