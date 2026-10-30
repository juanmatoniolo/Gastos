// src/app/notas/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ref, onValue, push, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";

export default function Notas() {
    const { user } = useAuth();
    const [notas, setNotas] = useState([]);
    const [nuevaNota, setNuevaNota] = useState("");

    useEffect(() => {
        if (!user) return;
        const notasRef = ref(database, `usuarios/${user.uid}/notas`);
        const unsubscribe = onValue(notasRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const lista = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setNotas(lista.reverse());
            } else {
                setNotas([]);
            }
        });
        return () => unsubscribe();
    }, [user]);

    const agregarNota = async (e) => {
        e.preventDefault();
        if (!nuevaNota.trim()) return;
        const notasRef = ref(database, `usuarios/${user.uid}/notas`);
        const nuevaRef = push(notasRef);
        await set(nuevaRef, {
            texto: nuevaNota,
            fecha: new Date().toISOString(),
        });
        setNuevaNota("");
    };

    return (
        <div className="p-4 md:p-8 pt-8">
            <h1 className="text-2xl font-bold text-white mb-6">Datos Útiles</h1>

            <form onSubmit={agregarNota} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Ej: Vencimiento Visa 15/11..."
                    className="flex-1 bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-blue-500 outline-none text-base min-h-12"
                />
                <button
                    type="submit"
                    className="bg-blue-600 px-4 rounded-xl font-bold text-white active:scale-[0.97] min-w-12 min-h-12"
                    aria-label="Agregar nota"
                >
                    +
                </button>
            </form>

            <div className="flex flex-col gap-3">
                {notas.map((nota) => (
                    <div
                        key={nota.id}
                        className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-start"
                    >
                        <p className="text-gray-200 text-sm whitespace-pre-wrap">
                            {nota.texto}
                        </p>
                        <button
                            onClick={() =>
                                remove(ref(database, `usuarios/${user.uid}/notas/${nota.id}`))
                            }
                            className="text-gray-500 hover:text-red-400 text-xs ml-2 px-2 py-1 rounded active:scale-[0.97]"
                        >
                            Borrar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}