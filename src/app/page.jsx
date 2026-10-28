// src/app/page.jsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTransacciones } from "@/hooks/useTransacciones";
import FormularioTransaccion from "@/components/FormularioTransaccion";
import { eliminarTransaccion } from "@/services/transaccionesService";
import { formatCurrency } from "@/utils/formatters";
import { getResumenMes } from "@/utils/proyecciones";

export default function Home() {
  const { user, login, registro, loginConGoogle, logout } = useAuth();
  const { transacciones, loading: dataLoading } = useTransacciones(user?.uid);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().toISOString().slice(0, 7));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault(); setError(""); setBtnLoading(true);
    try {
      if (isRegister) await registro(email, password);
      else await login(email, password);
    } catch (err) {
      if (err.code === "auth/invalid-credential") setError("Correo o contraseña incorrectos.");
      else if (err.code === "auth/email-already-in-use") setError("El correo ya está registrado.");
      else if (err.code === "auth/weak-password") setError("La contraseña debe tener al menos 6 caracteres.");
      else setError("Ocurrió un error. Intenta de nuevo.");
    } finally { setBtnLoading(false); }
  };

  // --- PANTALLA DE LOGIN / REGISTRO ---
  if (!user) {
    return (
      <div>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-500 mb-2">Mis Finanzas</h1>
          <p className="text-gray-400">Toma el control de tu dinero hoy</p>
        </div>
        <form onSubmit={handleAuth} className="flex flex-col gap-4 bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 w-full">
          <h2 className="text-xl font-semibold mb-2 text-white text-center">{isRegister ? "Crear cuenta" : "Iniciar Sesión"}</h2>
          {error && <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-lg text-center">{error}</p>}
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:border-blue-500 outline-none" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:border-blue-500 outline-none" required />
          <button type="submit" disabled={btnLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl mt-2 transition-all">{btnLoading ? "Cargando..." : (isRegister ? "Registrarse" : "Entrar")}</button>
          <div className="flex items-center gap-2 my-1"><hr className="flex-1 border-gray-600" /><span className="text-gray-400 text-xs">O</span><hr className="flex-1 border-gray-600" /></div>
          <button type="button" onClick={loginConGoogle} className="flex items-center justify-center gap-3 bg-white text-gray-800 font-bold p-3 rounded-xl hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
            Google
          </button>
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-sm text-gray-400 mt-2 hover:text-white text-center">{isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}</button>
        </form>
      </div>
    );
  }

  // --- LÓGICA DEL DASHBOARD (Cuando ya está logueado) ---
  const resumen = getResumenMes(transacciones, mesSeleccionado);

  return (
    <div className="p-4 md:p-8 min-h-screen relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 pt-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Hola de nuevo,</p>
          <h1 className="text-xl md:text-3xl font-bold text-white capitalize">{user.email.split('@')[0]}</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <input
            type="month"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="bg-gray-800 text-white p-2.5 rounded-xl border border-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <div className="hidden md:flex gap-3">
            <button onClick={() => setMostrarForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-colors"><span className="text-xl">+</span> Nuevo</button>
            <button onClick={logout} className="text-sm bg-gray-800 px-4 py-2.5 rounded-xl text-red-400 hover:bg-gray-700 border border-gray-700 transition-colors">Salir</button>
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

            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-5 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <p className="text-blue-200 text-sm font-medium mb-2 relative z-10">Balance Disponible</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap relative z-10">
                {formatCurrency(resumen.balance)}
              </p>
            </div>
          </div>

          <section className="mt-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">Movimientos de este Mes</h2>
            {resumen.transacciones.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/50 rounded-2xl border border-gray-700/50 border-dashed">
                <p className="text-gray-400">No hay movimientos registrados en este mes.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {resumen.transacciones.map((t) => (
                  <li key={t.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700/50">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.tipo === 'ingreso' ? 'bg-green-900/50 text-green-400' : t.esCuotaVirtual ? 'bg-orange-900/50 text-orange-400' : 'bg-red-900/50 text-red-400'}`}>
                        {t.tipo === 'ingreso' ? "↓" : t.esCuotaVirtual ? "💳" : "↑"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-semibold text-sm text-gray-100 capitalize truncate">{t.descripcion}</p>
                        <p className="text-xs text-gray-400 capitalize truncate">
                          {t.categoria.replace(/_/g, ' ')} {t.id.includes('rec') && <span className="text-blue-400 font-bold ml-1">(Fijo)</span>}
                          {t.esCuotaVirtual && <span className="text-orange-400 font-bold ml-1">(Tarjeta)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <p className={`font-bold text-sm md:text-base whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-green-400' : 'text-white'}`}>
                        {t.tipo === 'ingreso' ? "+" : "-"}{formatCurrency(t.monto)}
                      </p>
                      {!t.id.includes('rec') && !t.esCuotaVirtual && (
                        <button onClick={() => { if (window.confirm("¿Eliminar?")) eliminarTransaccion(user.uid, t.id) }} className="text-[10px] text-gray-500 hover:text-red-400 uppercase mt-1">Borrar</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <button onClick={() => setMostrarForm(!mostrarForm)} className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl z-40 border-4 border-gray-900"><span className={mostrarForm ? "rotate-45 transition-transform" : ""}>+</span></button>

      {mostrarForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-start md:items-center p-4 overflow-y-auto" onClick={() => setMostrarForm(false)}>
          <div className="w-full max-w-md md:max-w-xl my-auto py-8" onClick={(e) => e.stopPropagation()}>
            <FormularioTransaccion userId={user.uid} onClose={() => setMostrarForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}