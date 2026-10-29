// src/utils/proyecciones.js
export function getTransaccionesDelMes(transacciones, mesStr) {
	if (!transacciones) return [];
	const resultado = [];
	const [anioStr, mesStrNum] = mesStr.split("-");
	const anio = parseInt(anioStr);
	const mes = parseInt(mesStrNum);

	// 1. Transacciones exactas de este mes (excluyendo virtuales y cuotas)
	const exactas = transacciones.filter((t) => {
		if (!t.fecha.startsWith(mesStr)) return false;
		if (t.metodoPago === "tarjeta_credito" && t.cuotasData?.cantidad > 1)
			return false;
		return !t.id.includes("cuota") && !t.id.includes("rec");
	});
	resultado.push(...exactas);

	// 2. Agrupar transacciones recurrentes (Ingresos Fijos y Gastos Fijos)
	const recurrentes = transacciones.filter((t) => t.esRecurrente);
	const grupos = {};

	recurrentes.forEach((t) => {
		const baseId = t.originalId || t.id;
		if (!grupos[baseId]) grupos[baseId] = [];
		grupos[baseId].push(t);
	});

	// 3. Proyectar la versión correcta para este mes
	Object.keys(grupos).forEach((baseId) => {
		const versiones = grupos[baseId];
		versiones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

		// Buscamos la versión más reciente que sea menor o igual a este mes
		const versionAplicable = versiones.find(
			(v) => v.fecha.slice(0, 7) <= mesStr,
		);

		if (versionAplicable) {
			const esExacta = versionAplicable.fecha.startsWith(mesStr);
			// Si no es exacta (no fue creada/editada este mes), la proyectamos como virtual
			if (!esExacta) {
				resultado.push({
					...versionAplicable,
					id: `rec-${versionAplicable.id}-${mesStr}`,
					fecha: `${mesStr}-01`,
					esRecurrenteVirtual: true,
				});
			}
		}
	});

	// 4. Cuotas de Tarjeta de Crédito
	transacciones.forEach((t) => {
		const [anioCompra, mesCompra] = t.fecha.split("-").map(Number);
		const diffMeses = (anio - anioCompra) * 12 + (mes - mesCompra);

		if (t.metodoPago === "tarjeta_credito" && t.cuotasData?.cantidad > 1) {
			if (diffMeses > 0 && diffMeses <= t.cuotasData.cantidad) {
				const hasOverride = transacciones.some(
					(ex) =>
						ex.originalId === t.id && ex.fecha.startsWith(mesStr),
				);

				if (!hasOverride) {
					const cleanDesc = (t.descripcion || "")
						.replace(/\s*\(Cuota \d+\/\d+\)/g, "")
						.trim();
					resultado.push({
						...t,
						id: `cuota-${t.id}-${mesStr}`,
						monto: t.cuotasData.montoPorCuota,
						fecha: `${mesStr}-01`,
						descripcion: `${cleanDesc} (Cuota ${diffMeses}/${t.cuotasData.cantidad})`,
						esCuotaVirtual: true,
					});
				}
			}
		}
	});

	return resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function getResumenMes(transacciones, mesStr) {
	const txs = getTransaccionesDelMes(transacciones, mesStr);
	let ingresos = 0;
	let egresos = 0;
	let ahorrosMes = 0;
	let gastosFijosMes = 0;

	txs.forEach((t) => {
		if (t.tipo === "ingreso") {
			ingresos += t.monto;
		} else {
			if (t.categoria === "ahorro") {
				ahorrosMes += t.monto;
			} else {
				egresos += t.monto;
				if (
					t.metodoPago === "tarjeta_credito" &&
					t.cuotasData?.activa
				) {
					gastosFijosMes += t.cuotasData.montoPorCuota;
				}
			}
		}
	});

	const balance = ingresos - egresos - ahorrosMes;
	return {
		ingresos,
		egresos,
		ahorrosMes,
		balance,
		gastosFijosMes,
		transacciones: txs,
	};
}
