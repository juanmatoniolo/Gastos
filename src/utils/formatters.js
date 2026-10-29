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

export const formatInputNumber = (value) => {
	if (value === undefined || value === null || value === "") return "";

	let str = value.toString().replace(/[^\d.,]/g, "");

	let decimalSeparator = "";
	const lastComma = str.lastIndexOf(",");
	const lastDot = str.lastIndexOf(".");

	if (lastComma !== -1) {
		decimalSeparator = ",";
		str = str.replace(/\./g, "");
	} else if (lastDot !== -1) {
		const dotParts = str.split(".");
		if (dotParts.length > 1) {
			const lastPart = dotParts[dotParts.length - 1];
			if (lastPart.length > 0 && lastPart.length <= 2) {
				decimalSeparator = ",";
				str = str.slice(0, lastDot).replace(/\./g, "") + "," + lastPart;
			} else {
				str = str.replace(/\./g, "");
			}
		} else {
			str = str.replace(".", ",");
			decimalSeparator = ",";
		}
	}

	if (decimalSeparator === ",") {
		const parts = str.split(",");
		let integerPart = parts[0].replace(/[^\d]/g, "");
		let decimalPart =
			parts.length > 1 ? parts[1].replace(/[^\d]/g, "").slice(0, 2) : "";

		integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

		if (parts.length > 1) {
			return `${integerPart},${decimalPart}`;
		}
		return integerPart;
	}

	let integerPart = str.replace(/[^\d]/g, "");
	return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseInputNumber = (formattedString) => {
	if (!formattedString) return 0;
	const cleaned = formattedString
		.toString()
		.replace(/\./g, "")
		.replace(",", ".");
	return parseFloat(cleaned) || 0;
};
