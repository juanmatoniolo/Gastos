// hooks/useTransacciones.js
"use client";
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

export function useTransacciones(userId) {
	const [transacciones, setTransacciones] = useState([]);
	const [loading, setLoading] = useState(true);
	const [resumen, setResumen] = useState({
		ingresos: 0,
		egresos: 0,
		gastosFijosMes: 0,
	});

	useEffect(() => {
		if (!userId) return;

		const transaccionesRef = ref(
			database,
			`usuarios/${userId}/transacciones`,
		);

		const unsubscribe = onValue(transaccionesRef, (snapshot) => {
			const data = snapshot.val();
			const listaTransacciones = [];
			let totalIngresos = 0;
			let totalEgresos = 0;
			let totalCuotasMes = 0;

			if (data) {
				for (const key in data) {
					const t = { id: key, ...data[key] };
					listaTransacciones.push(t);

					// Cálculos
					if (t.tipo === "ingreso") {
						totalIngresos += t.monto;
					} else {
						totalEgresos += t.monto;

						// Sumar a gastos fijos si es tarjeta de crédito activa
						if (
							t.metodoPago === "tarjeta_credito" &&
							t.cuotasData?.activa
						) {
							totalCuotasMes += t.cuotasData.montoPorCuota;
						}
					}
				}
			}

			// Ordenar por fecha descendente
			listaTransacciones.sort(
				(a, b) => new Date(b.fecha) - new Date(a.fecha),
			);

			setTransacciones(listaTransacciones);
			setResumen({
				ingresos: totalIngresos,
				egresos: totalEgresos,
				balance: totalIngresos - totalEgresos,
				gastosFijosMes: totalCuotasMes, // Dinero comprometido en cuotas
			});
			setLoading(false);
		});

		return () => unsubscribe();
	}, [userId]);

	return { transacciones, resumen, loading };
}
