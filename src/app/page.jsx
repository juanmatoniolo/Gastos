// src/app/page.jsx
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import { useToast } from "@/components/Toast";
import ConfirmSheet from "@/components/ConfirmSheet";
import FormularioTransaccion from "@/components/FormularioTransaccion";
import MonthPicker from "@/components/MonthPicker";
import {
  eliminarTransaccion,
  transferirSaldoMesSiguiente,
} from "@/services/transaccionesService";
import { formatCurrency } from "@/utils/formatters";
import { getResumenMes } from "@/utils/proyecciones";
import { CATEGORIAS_EGRESOS, CATEGORIAS_INGRESOS } from "@/utils/constantes";

export default function Home() {
  const { user, logout } = useAuth();
  const { transacciones, loading: dataLoading } = useTransacciones(user?.uid);
  const toast = useToast();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [transaccionAEditar, setTransaccionAEditar] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [transaccionAEliminar, setTransaccionAEliminar] = useState(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transfiriendo, setTransfiriendo] = useState(false);

  const resumen = useMemo(
    () => getResumenMes(transacciones || [], mesSeleccionado),
    [transacciones, mesSeleccionado]
  );

  if (!user) return null;

  const abrirNuevo = () => {
    setTransaccionAEditar(null);
    setMostrarForm(true);
  };
  const abrirEditar = (t) => {
    setTransaccionAEditar(t);
    setMostrarForm(true);
  };

  const confirmarBorrado = async () => {
    if (!transaccionAEliminar) return;
    try {
      await eliminarTransaccion(user.uid, transaccionAEliminar.id);
      toast.success("Movimiento eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setTransaccionAEliminar(null);
    }
  };

  const handleTransferirSaldo = async () => {
    if (resumen.balance <= 0) return;
    setTransfiriendo(true);
    try {
      const [anio, mes] = mesSeleccionado.split("-").map(Number);
      const nextMonthDate = new Date(anio, mes, 1);
      const mesSiguiente = nextMonthDate.toISOString().slice(0, 7);

      await transferirSaldoMesSiguiente(
        user.uid,
        resumen.balance,
        mesSeleccionado,
        mesSiguiente
      );
      toast.success(`Saldo de ${formatCurrency(resumen.balance)} transferido a ${mesSiguiente}`);
      setShowTransferModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al transferir el saldo");
    } finally {
      setTransfiriendo(false);
    }
  };

  return (
    <div className="p-4 md:p-8 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 pt-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Hola de nuevo,</p>
          <h1 className="text-xl md:text-3xl font-bold text-white capitalize">
            {user.displayName || user.email.split("@")[0]}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <MonthPicker value={mesSeleccionado} onChange={setMesSeleccionado} className="w-40" />
          <div className="hidden md:flex gap-3">
            <button
              onClick={abrirNuevo}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-colors active:scale-[0.97]"
            >
              <span className="text-xl">+</span> Nuevo
            </button>
            <button
              onClick={logout}
              className="text-sm bg-gray-800 px-4 py-2.5 rounded-xl text-red-400 hover:bg-gray-700 border border-gray-700 transition-colors active:scale-[0.97]"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {dataLoading ? (
        <div className="text-center text-gray-400 py-20 animate-pulse">Cargando finanzas...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between">
              <p className="text-sm text-gray-400 mb-2 font-medium">Ingresos del Mes</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-green-400 whitespace-nowrap">
                {formatCurrency(resumen.ingresos)}
              </p>
            </div>
            <div className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between">
              <p className="text-sm text-gray-400 mb-2 font-medium">Egresos del Mes</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-red-400 whitespace-nowrap">
                {formatCurrency(resumen.egresos)}
              </p>
            </div>

            {/* TARJETA DE BALANCE CON BOTÓN DE ARRASTRE */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div>
                <p className="text-blue-200 text-sm font-medium mb-2 relative z-10">Balance Disponible</p>
                <p className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap relative z-10">
                  {formatCurrency(resumen.balance)}
                </p>
              </div>
              {resumen.balance > 0 && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="mt-3 relative z-10 text-xs font-bold bg-white/20 hover:bg-white/30 text-white py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 w-fit active:scale-[0.97]"
                >
                  <span>↗</span> Pasar al mes siguiente
                </button>
              )}
            </div>
          </div>

          <section className="mt-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">
              Movimientos de este Mes
            </h2>
            {resumen.transacciones.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/50 rounded-2xl border border-gray-700/50 border-dashed">
                <p className="text-gray-400">No hay movimientos registrados en este mes.</p>
                <button
                  onClick={abrirNuevo}
                  className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl active:scale-[0.97] transition min-h-11"
                >
                  Anotar el primero
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {resumen.transacciones.map((t) => {
                  const titulo = t.descripcion || t.subcategoria || "Sin descripción";
                  const labelCategoria =
                    CATEGORIAS_EGRESOS.find((c) => c.id === t.categoria)?.label ||
                    CATEGORIAS_INGRESOS.find((c) => c.id === t.categoria)?.label ||
                    t.categoria.replace(/_/g, " ");
                  const subtitulo =
                    t.subcategoria && t.subcategoria !== titulo ? t.subcategoria : labelCategoria;
                  const esVirtual = t.esRecurrenteVirtual || t.esCuotaVirtual;

                  return (
                    <li
                      key={t.id}
                      className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700/50"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.tipo === "ingreso"
                            ? "bg-green-900/50 text-green-400"
                            : t.esCuotaVirtual
                              ? "bg-orange-900/50 text-orange-400"
                              : "bg-red-900/50 text-red-400"
                            }`}
                        >
                          {t.tipo === "ingreso" ? "↓" : t.esCuotaVirtual ? "💳" : "↑"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="font-semibold text-sm text-gray-100 capitalize truncate">
                            {titulo}
                          </p>
                          <p className="text-xs text-gray-400 capitalize truncate">
                            {subtitulo}{" "}
                            {t.esRecurrenteVirtual && (
                              <span className="text-blue-400 font-bold ml-1">(Fijo)</span>
                            )}
                            {t.esCuotaVirtual && (
                              <span className="text-orange-400 font-bold ml-1">(Tarjeta)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <p
                          className={`font-bold text-sm md:text-base whitespace-nowrap ${t.tipo === "ingreso" ? "text-green-400" : "text-white"
                            }`}
                        >
                          {t.tipo === "ingreso" ? "+" : "-"}
                          {formatCurrency(t.monto)}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => abrirEditar(t)}
                            className="text-[11px] text-blue-400 hover:text-blue-300 uppercase font-bold px-2 py-1 rounded active:scale-[0.97]"
                          >
                            Editar
                          </button>
                          {!esVirtual && (
                            <button
                              onClick={() => setTransaccionAEliminar(t)}
                              className="text-[11px] text-gray-500 hover:text-red-400 uppercase font-bold px-2 py-1 rounded active:scale-[0.97]"
                            >
                              Borrar
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <button
        onClick={abrirNuevo}
        aria-label="Nuevo movimiento"
        className="md:hidden fixed right-5 z-40 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl border-4 border-gray-900 active:scale-[0.97] transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
      >
        +
      </button>

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
              mesSeleccionado={mesSeleccionado}
            />
          </div>
        </div>
      )}

      <ConfirmSheet
        open={!!transaccionAEliminar}
        title={`Eliminar "${transaccionAEliminar?.descripcion || transaccionAEliminar?.subcategoria || "movimiento"}"`}
        description="Esta acción no se puede deshacer."
        actions={[
          { label: "Eliminar", variant: "danger", onClick: confirmarBorrado },
          { label: "Cancelar", variant: "ghost", onClick: () => setTransaccionAEliminar(null) },
        ]}
      />

      {/* MODAL DE CONFIRMACIÓN PARA PASAR SALDO */}
      <ConfirmSheet
        open={showTransferModal}
        title="Pasar saldo al próximo mes"
        description={`Se creará un egreso de ${formatCurrency(resumen.balance)} en este mes y un ingreso del mismo monto el mes que viene, para arrastrar tu saldo.`}
        actions={[
          {
            label: transfiriendo ? "Transfiriendo..." : "Confirmar arrastre",
            variant: "primary",
            onClick: handleTransferirSaldo,
            disabled: transfiriendo,
          },
          {
            label: "Cancelar",
            variant: "ghost",
            onClick: () => setShowTransferModal(false),
          },
        ]}
      />
    </div>
  );
}