// src/services/subcategoriasService.js
import { ref, push, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";

export const agregarSubcategoria = async (userId, nombre, tipo) => {
	// tipo puede ser 'ingreso' o 'egreso'
	const subcatRef = ref(database, `usuarios/${userId}/subcategorias/${tipo}`);
	const nuevaRef = push(subcatRef);
	await set(nuevaRef, { nombre });
	return nuevaRef.key;
};

export const eliminarSubcategoria = async (userId, tipo, id) => {
	const subcatRef = ref(
		database,
		`usuarios/${userId}/subcategorias/${tipo}/${id}`,
	);
	await remove(subcatRef);
};
