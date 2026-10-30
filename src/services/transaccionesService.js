// src/services/transaccionesService.js
import {
	ref,
	push,
	set,
	remove,
	update,
	serverTimestamp,
} from "firebase/database";
import { database } from "@/lib/firebase";

export const agregarTransaccion = async (userId, transaccionData) => {
	const transaccionesRef = ref(database, `usuarios/${userId}/transacciones`);
	const nuevaTransaccionRef = push(transaccionesRef);

	let cuotasData = null;
	if (
		transaccionData.metodoPago === "tarjeta_credito" &&
		transaccionData.cuotas > 1
	) {
		cuotasData = {
			cantidad: transaccionData.cuotas,
			montoPorCuota: transaccionData.monto / transaccionData.cuotas,
			cuotasPagadas: 0,
			activa: true,
		};
	}

	const dataToSave = {
		...transaccionData,
		cuotasData,
		fechaCreacion: serverTimestamp(),
	};

	await set(nuevaTransaccionRef, dataToSave);
	return nuevaTransaccionRef.key;
};

export const actualizarTransaccion = async (
	userId,
	transaccionId,
	transaccionData,
) => {
	const transaccionRef = ref(
		database,
		`usuarios/${userId}/transacciones/${transaccionId}`,
	);

	let cuotasData = null;
	if (
		transaccionData.metodoPago === "tarjeta_credito" &&
		transaccionData.cuotas > 1
	) {
		cuotasData = {
			cantidad: transaccionData.cuotas,
			montoPorCuota: transaccionData.monto / transaccionData.cuotas,
			cuotasPagadas: 0,
			activa: true,
		};
	}

	const dataToSave = {
		...transaccionData,
		cuotasData,
		fechaModificacion: serverTimestamp(),
	};

	await update(transaccionRef, dataToSave);
};

export const eliminarTransaccion = async (userId, transaccionId) => {
	const transaccionRef = ref(
		database,
		`usuarios/${userId}/transacciones/${transaccionId}`,
	);
	await remove(transaccionRef);
};

// NUEVA FUNCIÓN: Pasar saldo al mes siguiente
export const transferirSaldoMesSiguiente = async (
	userId,
	monto,
	mesActual,
	mesSiguiente,
) => {
	// 1. Egreso en el mes actual (último día del mes)
	const [anio, mes] = mesActual.split("-").map(Number);
	const lastDay = new Date(anio, mes, 0).getDate();
	const fechaEgreso = `${mesActual}-${lastDay.toString().padStart(2, "0")}`;

	await agregarTransaccion(userId, {
		tipo: "egreso",
		monto: monto,
		fecha: fechaEgreso,
		categoria: "otro",
		subcategoria: "Arrastre de saldo",
		descripcion: `Arrastre de saldo a ${mesSiguiente}`,
		metodoPago: "efectivo",
		esRecurrente: false,
	});

	// 2. Ingreso en el mes siguiente (primer día del mes)
	const fechaIngreso = `${mesSiguiente}-01`;

	await agregarTransaccion(userId, {
		tipo: "ingreso",
		monto: monto,
		fecha: fechaIngreso,
		categoria: "otro_ingreso",
		subcategoria: "Arrastre de saldo",
		descripcion: `Saldo arrastrado de ${mesActual}`,
		metodoPago: "transferencia",
		esRecurrente: false,
	});
};
