// src/context/AuthContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider, // <-- Nuevo
    signInWithPopup       // <-- Nuevo
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const registro = (email, password) => createUserWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    // Nueva función para Google
    const loginConGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error al iniciar sesión con Google:", error);
            alert("No se pudo iniciar sesión con Google. Intenta de nuevo.");
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, registro, logout, loginConGoogle, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}