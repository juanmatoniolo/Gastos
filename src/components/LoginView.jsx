// src/components/LoginView.jsx
"use client";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function LoginView() {
    const { login, registro, loginConGoogle } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState("");
    const [btnLoading, setBtnLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setBtnLoading(true);
        try {
            if (isRegister) {
                if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
                await registro(email, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            if (err.code === "auth/invalid-credential") setError("Correo o contraseña incorrectos.");
            else if (err.code === "auth/email-already-in-use") setError("El correo ya está registrado. Intenta iniciar sesión.");
            else if (err.code === "auth/weak-password") setError("La contraseña debe tener al menos 6 caracteres.");
            else if (err.code === "auth/operation-not-allowed") setError("El registro por correo está deshabilitado en Firebase.");
            else setError(err.message || "Ocurrió un error. Intenta de nuevo.");
        } finally {
            setBtnLoading(false);
        }
    };

    return (
        <div className="w-full min-h-dvh bg-[#289FA7] flex flex-col justify-center items-center pt-safe pb-safe">

            <div className="w-full max-w-md flex flex-col">
                {/* IMAGEN INTEGRADA AL FONDO */}
                <div className="w-full px-4 mb-6">
                    <div className="relative w-full aspect-[16/9]">
                        <Image
                            src="/og-image.png"
                            alt="Portada de Mis Finanzas"
                            fill
                            sizes="(max-width: 500px) 100vw, 448px"
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* FORMULARIO */}
                <div className="w-full px-4">
                    <form
                        onSubmit={handleAuth}
                        className="flex flex-col gap-4 bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700 w-full"
                    >
                        <h2 className="text-xl font-bold mb-1 text-white text-center">
                            {isRegister ? "Crear cuenta" : "Iniciar Sesión"}
                        </h2>

                        {error && (
                            <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-lg text-center">
                                {error}
                            </p>
                        )}

                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-3.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none text-base min-h-12 transition-all"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="p-3.5 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none text-base min-h-12 transition-all"
                            required
                        />

                        <button
                            type="submit"
                            disabled={btnLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3.5 rounded-xl mt-2 transition-all active:scale-[0.97] disabled:opacity-50 min-h-12 shadow-lg shadow-blue-900/30"
                        >
                            {btnLoading ? "Cargando..." : isRegister ? "Registrarse" : "Entrar"}
                        </button>

                        {/* SEPARADOR */}
                        <div className="flex items-center gap-3 my-1">
                            <hr className="flex-1 border-gray-600" />
                            <span className="text-gray-400 text-xs font-medium uppercase">O</span>
                            <hr className="flex-1 border-gray-600" />
                        </div>

                        {/* BOTÓN DE GOOGLE */}
                        <button
                            type="button"
                            onClick={loginConGoogle}
                            className="flex items-center justify-center gap-3 bg-white text-gray-800 font-bold p-3.5 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.97] min-h-12"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                            </svg>
                            Continuar con Google
                        </button>

                        {/* TOGGLE PARA CAMBIAR ENTRE LOGIN Y REGISTRO */}
                        <div className="text-center mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setError("");
                                }}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                {isRegister
                                    ? "¿Ya tienes cuenta? Inicia sesión"
                                    : "¿No tienes cuenta? Regístrate aquí"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}