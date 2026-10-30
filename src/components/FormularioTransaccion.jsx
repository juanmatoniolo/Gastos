// src/components/FormularioTransaccion.jsx
"use client";
import { useState, useEffect } from "react";
import styles from "./FormularioTransaccion.module.css";
import { agregarTransaccion, actualizarTransaccion } from "@/services/transaccionesService";
import { agregarSubcategoria } from "@/services/subcategoriasService";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";
import { formatInputNumber, parseInputNumber } from "@/utils/formatters";
import { useSubcategorias } from "@/hooks/useSubcategorias";
import { useToast } from "@/components/Toast";

export default function FormularioTransaccion({
    userId, onClose, transaccionAEditar, transacciones, mesSeleccionado, saldoDisponible = 0,
}) {
    const isEditingVirtual = transaccionAEditar?.id?.includes("rec-") || transaccionAEditar?.id?.includes("cuota-");
    const isEditingReal = transaccionAEditar && !isEditingVirtual;
    const idRealAEditar = isEditingReal ? transaccionAEditar.id : null;

    const { subcategorias } = useSubcategorias(userId);
    const toast = useToast();

    const [step, setStep] = useState(1); // 1 = Selección, 2 = Formulario
    const [mostrarNuevaSubcat, setMostrarNuevaSubcat] = useState(false);
    const [nuevaSubcatStr, setNuevaSubcatStr] = useState("");

    const fechaBase = mesSeleccionado ? `${mesSeleccionado}-01` : new Date().toISOString().split("T")[0];
    const [modo, setModo] = useState("unico"); // unico, fijo, cuotas, ingreso

    const [formData, setFormData] = useState({
        montoStr: "", cuotaStr: "", fecha: fechaBase, categoria: CATEGORIAS_EGRESOS[0].id,
        subcategoria: "", descripcion: "", cuotas: 2,
    });

    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (transaccionAEditar) {
            setStep(2); // Si estamos editando, vamos directo al formulario
            const isCredito = transaccionAEditar.metodoPago === "tarjeta_credito";
            const cantCuotas = transaccionAEditar.cuotasData?.cantidad || 1;
            const montoTotal = transaccionAEditar.monto || 0;
            const cleanDesc = (transaccionAEditar.descripcion || "").replace(/\s*\(Cuota \d+\/\d+\)/g, "").trim();

            if (transaccionAEditar.tipo === "ingreso") setModo("ingreso");
            else if (isCredito && cantCuotas > 1) setModo("cuotas");
            else if (transaccionAEditar.esRecurrente) setModo("fijo");
            else setModo("unico");

            setFormData({
                montoStr: formatInputNumber(montoTotal.toString()),
                cuotaStr: isCredito && cantCuotas > 1 && !isEditingVirtual ? formatInputNumber((montoTotal / cantCuotas).toString()) : "",
                fecha: isEditingVirtual ? `${mesSeleccionado}-01` : transaccionAEditar.fecha,
                categoria: transaccionAEditar.categoria,
                subcategoria: transaccionAEditar.subcategoria || "",
                descripcion: cleanDesc,
                cuotas: cantCuotas,
            });
        }
    }, [transaccionAEditar, isEditingVirtual, mesSeleccionado]);

    const esIngreso = modo === "ingreso";
    const esAhorro = !esIngreso && formData.categoria === "ahorro";
    const montoNumericoPreview = parseInputNumber(formData.montoStr);
    const puedeGuardar = montoNumericoPreview > 0 && !!userId && !cargando;
    const superaSaldo = !isEditingReal && !esIngreso && !esAhorro && montoNumericoPreview > saldoDisponible;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSeleccionarModo = (nuevoModo) => {
        setModo(nuevoModo);
        setFormData(prev => ({
            ...prev,
            categoria: nuevoModo === "ingreso" ? CATEGORIAS_INGRESOS[0].id : CATEGORIAS_EGRESOS[0].id,
            subcategoria: "",
            cuotas: nuevoModo === "cuotas" ? 2 : 1
        }));
        setStep(2);
    };

    const handleGuardarSubcategoria = async () => {
        if (!nuevaSubcatStr.trim()) return;
        try {
            await agregarSubcategoria(userId, nuevaSubcatStr.trim(), esIngreso ? "ingreso" : "egreso");
            setFormData((prev) => ({ ...prev, subcategoria: nuevaSubcatStr.trim() }));
            setNuevaSubcatStr("");
            setMostrarNuevaSubcat(false);
            toast.success("Subcategoría creada");
        } catch { toast.error("Error al guardar"); }
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
        setFormData((prev) => ({ ...prev, montoStr: formatted, cuotaStr: modo === "cuotas" && !isEditingVirtual ? formatInputNumber((numeric / prev.cuotas).toString()) : "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!puedeGuardar) return;
        setCargando(true);

        let finalOriginalId = transaccionAEditar?.originalId || null;
        if (isEditingVirtual && !finalOriginalId) finalOriginalId = transaccionAEditar.id.split("-")[1];

        const descFinal = formData.descripcion.trim() || (esIngreso ? CATEGORIAS_INGRESOS.find((c) => c.id === formData.categoria)?.label : CATEGORIAS_EGRESOS.find((c) => c.id === formData.categoria)?.label);

        const dataToSave = {
            tipo: esIngreso ? "ingreso" : "egreso",
            monto: montoNumericoPreview,
            fecha: formData.fecha,
            categoria: formData.categoria,
            subcategoria: formData.subcategoria,
            descripcion: descFinal,
            cuotas: modo === "cuotas" && !isEditingVirtual ? parseInt(formData.cuotas) : 1,
            metodoPago: isEditingVirtual ? "efectivo" : (esIngreso || esAhorro) ? "transferencia" : modo === "cuotas" ? "tarjeta_credito" : "efectivo",
            esRecurrente: modo === "fijo" ? true : (isEditingVirtual ? transaccionAEditar.esRecurrente : false),
            originalId: finalOriginalId,
        };

        try {
            if (isEditingReal && idRealAEditar) {
                await actualizarTransaccion(userId, idRealAEditar, dataToSave);
                toast.success("Movimiento actualizado");
            } else {
                await agregarTransaccion(userId, dataToSave);
                toast.success("Movimiento guardado");
            }
            if (onClose) onClose();
        } catch { toast.error("Hubo un error al guardar."); } finally { setCargando(false); }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>

                {/* HEADER CON BOTÓN DE VOLVER (SI ESTAMOS EN EL PASO 2) */}
                <div className={styles.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {step === 2 && !isEditingReal && !isEditingVirtual && (
                            <button type="button" onClick={() => setStep(1)} className={styles.backBtn}>←</button>
                        )}
                        <h2 className={styles.title}>
                            {isEditingReal || isEditingVirtual ? "Editar Movimiento" : step === 1 ? "¿Qué querés anotar?" : "Detalles del Movimiento"}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                <div className={styles.body}>

                    {/* PASO 1: SELECCIÓN DE TIPO */}
                    {step === 1 && (
                        <div className={styles.wizardGrid}>
                            {[
                                { id: "unico", icon: "💸", title: "Gasto Único", desc: "Sale de tu cuenta hoy" },
                                { id: "fijo", icon: "🔄", title: "Gasto Fijo", desc: "Se repite todos los meses" },
                                { id: "cuotas", icon: "💳", title: "Cuota Tarjeta", desc: "Compra en cuotas" },
                                { id: "ingreso", icon: "💵", title: "Ingreso", desc: "Dinero que entra" }
                            ].map(m => (
                                <div key={m.id} onClick={() => handleSeleccionarModo(m.id)} className={`${styles.wizardCard} ${modo === m.id ? styles.active : ""}`}>
                                    <div className={styles.wizardIcon}>{m.icon}</div>
                                    <div className={styles.wizardTitle}>{m.title}</div>
                                    <div className={styles.wizardDesc}>{m.desc}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PASO 2: FORMULARIO */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className={styles.formGrid}>

                            {/* ALERTA DE SALDO */}
                            {!isEditingReal && !isEditingVirtual && !esIngreso && (
                                <div className={styles.balanceInfo} style={{ marginBottom: "-0.5rem" }}>
                                    Saldo disponible: <span className={`${styles.balanceAmount} ${superaSaldo ? styles.danger : ""}`}>${formatInputNumber(saldoDisponible.toFixed(2).replace(".", ","))}</span>
                                    {superaSaldo && <span className={styles.balanceWarning}>⚠️ Ojo, este gasto supera tu saldo.</span>}
                                </div>
                            )}

                            <div className={styles.montoBox}>
                                {modo === "cuotas" && !isEditingVirtual ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        <div className={styles.cuotasGrid}>
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Valor Cuota</label>
                                                <div className={styles.inputWrapper}>
                                                    <span className={styles.currencySymbol}>$</span>
                                                    <input type="text" inputMode="decimal" placeholder="0" value={formData.cuotaStr} onChange={handleCuotaChange} className={styles.input} style={{ paddingLeft: "2rem" }} />
                                                </div>
                                            </div>
                                            <div className={styles.inputGroup}>
                                                <label className={styles.label}>Cant. Cuotas</label>
                                                <input type="number" min="2" max="48" value={formData.cuotas} onChange={handleCantidadCuotasChange} className={`${styles.input} ${styles.inputNormal}`} style={{ textAlign: "center" }} />
                                            </div>
                                        </div>
                                        <div className={styles.totalCuotaRow}>
                                            <span className={styles.totalCuotaLabel}>Monto Total:</span>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <span style={{ color: "#fb923c", fontWeight: "700", marginRight: "4px" }}>$</span>
                                                <input type="text" inputMode="decimal" placeholder="0" value={formData.montoStr} onChange={handleMontoTotalChange} className={styles.inputTotalCuota} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Monto Total</label>
                                        <div className={styles.inputWrapper}>
                                            <span className={styles.currencySymbol}>$</span>
                                            <input type="text" inputMode="decimal" placeholder="0" value={formData.montoStr} onChange={handleMontoTotalChange} className={`${styles.input} ${styles.inputLarge} ${superaSaldo ? styles.error : ""}`} required />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.grid2}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Categoría</label>
                                    <select name="categoria" value={formData.categoria} onChange={handleChange} className={styles.select}>
                                        {esIngreso ? CATEGORIAS_INGRESOS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>) : CATEGORIAS_EGRESOS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>

                                <div className={styles.inputGroup}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <label className={styles.label}>Subcategoría</label>
                                        {!mostrarNuevaSubcat && <button type="button" onClick={() => setMostrarNuevaSubcat(true)} style={{ color: "#60a5fa", background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", lineHeight: 1 }}>+</button>}
                                    </div>
                                    {mostrarNuevaSubcat ? (
                                        <div className={styles.subcatInline}>
                                            <input type="text" placeholder="Nueva..." value={nuevaSubcatStr} onChange={(e) => setNuevaSubcatStr(e.target.value)} className={styles.subcatInput} autoFocus />
                                            <button type="button" onClick={handleGuardarSubcategoria} className={styles.btnSmall}>OK</button>
                                            <button type="button" onClick={() => setMostrarNuevaSubcat(false)} className={`${styles.btnSmall} ${styles.cancel}`}>X</button>
                                        </div>
                                    ) : (
                                        <select name="subcategoria" value={formData.subcategoria} onChange={handleChange} className={styles.select}>
                                            <option value="">Sin subcategoría</option>
                                            {subcategorias[esIngreso ? "ingreso" : "egreso"]?.map((sub) => <option key={sub.id} value={sub.nombre}>{sub.nombre}</option>)}
                                            {formData.subcategoria && !subcategorias[esIngreso ? "ingreso" : "egreso"]?.find((s) => s.nombre === formData.subcategoria) && <option value={formData.subcategoria}>{formData.subcategoria}</option>}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className={styles.grid2}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Descripción</label>
                                    <input type="text" name="descripcion" placeholder="Ej: Pilates..." value={formData.descripcion} onChange={handleChange} className={`${styles.input} ${styles.inputNormal}`} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Fecha</label>
                                    <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={`${styles.input} ${styles.inputNormal}`} required />
                                </div>
                            </div>

                            <button type="submit" disabled={!puedeGuardar} className={`${styles.btnSubmit} ${esIngreso ? styles.ingreso : modo === "cuotas" ? styles.cuotas : styles.egreso}`}>
                                {cargando ? "Guardando..." : isEditingVirtual ? "Actualizar este mes y futuros" : isEditingReal ? "Guardar cambios" : "Guardar Movimiento"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}