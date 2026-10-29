// src/hooks/useSubcategorias.js
"use client";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

export function useSubcategorias(userId) {
	const [subcategorias, setSubcategorias] = useState({
		egreso: [],
		ingreso: [],
	});

	useEffect(() => {
		if (!userId) return;

		const subcatRef = ref(database, `usuarios/${userId}/subcategorias`);

		const unsubscribe = onValue(subcatRef, (snapshot) => {
			const data = snapshot.val();
			if (data) {
				const egresosArray = data.egreso
					? Object.keys(data.egreso).map((key) => ({
							id: key,
							nombre: data.egreso[key].nombre,
						}))
					: [];
				const ingresosArray = data.ingreso
					? Object.keys(data.ingreso).map((key) => ({
							id: key,
							nombre: data.ingreso[key].nombre,
						}))
					: [];

				setSubcategorias({
					egreso: egresosArray,
					ingreso: ingresosArray,
				});
			} else {
				setSubcategorias({ egreso: [], ingreso: [] });
			}
		});

		return () => unsubscribe();
	}, [userId]);

	return { subcategorias };
}
