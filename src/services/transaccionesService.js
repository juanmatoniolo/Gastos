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
