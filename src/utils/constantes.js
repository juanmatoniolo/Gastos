// src/utils/constantes.js
export const CATEGORIAS_EGRESOS = [
	{ id: "servicio_variable", label: "Servicios Variables (Agua, Luz, Gas)" },
	{ id: "servicio_fijo", label: "Servicios Fijos (Internet, Alquiler)" },
	{ id: "gasto_necesario", label: "Gasto Necesario" },
	{ id: "gasto_innecesario", label: "Gasto Innecesario (Placer/Ocio)" },
	{ id: "comida", label: "Comida" },
	{ id: "vestimenta", label: "Vestimenta" },
	{ id: "salud", label: "Salud (Médico, Farmacia)" },
	{ id: "recreacion", label: "Recreación (Salidas, Asados)" },
	{ id: "ahorro", label: "Ahorro / Inversión (Dólares, Plazo Fijo, etc.)" },
	{ id: "otro", label: "Otro Gasto" }, // <-- NUEVO
];

export const CATEGORIAS_INGRESOS = [
	{ id: "ingreso_fijo", label: "Ingreso Fijo (Sueldo)" },
	{ id: "ingreso_variable", label: "Ingreso Variable (Extras)" },
	{ id: "otro_ingreso", label: "Otro Ingreso" }, // <-- NUEVO
];
