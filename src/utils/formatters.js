// src/utils/formatters.js
export const formatCurrency = (amount) => {
	if (amount === undefined || amount === null || isNaN(amount))
		return "$0,00";
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		minimumFractionDigits: 2,
	}).format(amount);
};

// Formatea un string para mostrarlo en el input con puntos de mil
export const formatInputNumber = (value) => {
	if (!value && value !== 0) return "";
	// Limpiamos todo excepto números y comas
	let str = value.toString().replace(/[^\d,]/g, "");

	// Manejamos la coma para decimales
	const parts = str.split(",");
	let integerPart = parts[0];
	let decimalPart = parts.length > 1 ? "," + parts[1].slice(0, 2) : "";

	// Agregamos los puntos de mil a la parte entera
	integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

	return integerPart + decimalPart;
};

// Convierte el string formateado ("1.059.000,50") a un número flotante (1059000.50)
export const parseInputNumber = (formattedString) => {
	if (!formattedString) return 0;
	const cleaned = formattedString
		.toString()
		.replace(/\./g, "")
		.replace(",", ".");
	return parseFloat(cleaned) || 0;
};
