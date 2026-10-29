// src/utils/proyecciones.js
export function getTransaccionesDelMes(transacciones, mesStr) {
	if (!transacciones) return [];
	const resultado = [];
	const [anioStr, mesStrNum] = mesStr.split("-");
	const anio = parseInt(anioStr);
	const mes = parseInt(mesStrNum);

	// 1. Tarjetas de crédito (Cuotas)
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
						originalId: t.id,
						monto: t.cuotasData.montoPorCuota,
						fecha: `${mesStr}-01`,
						descripcion: `${cleanDesc} (Cuota ${diffMeses}/${t.cuotasData.cantidad})`,
						esCuotaVirtual: true,
					});
				}
			}
		}
	});

	// 2. Recurrentes (Ingresos y Gastos Fijos)
	const recurrentes = transacciones.filter(
		(t) => t.esRecurrente || t.originalId,
	);
	const grupos = {};

	recurrentes.forEach((t) => {
		const baseId = t.originalId || t.id;
		if (!grupos[baseId]) grupos[baseId] = [];
		grupos[baseId].push(t);
	});

	Object.keys(grupos).forEach((baseId) => {
		const versiones = grupos[baseId];
		versiones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

		// Buscamos la versión que aplica para este mes (la más nueva antes o en este mes)
		const versionAplicable = versiones.find(
			(v) => v.fecha.slice(0, 7) <= mesStr,
		);

		if (versionAplicable) {
			const esExacta = versionAplicable.fecha.startsWith(mesStr);

			// Si la versión aplicable ya NO es recurrente, solo la mostramos en su mes exacto y no proyectamos más.
			if (!versionAplicable.esRecurrente && !esExacta) {
				return;
			}

			const fueCortada =
				versionAplicable.endDate && mesStr > versionAplicable.endDate;
			if (!fueCortada) {
				resultado.push({
					...versionAplicable,
					id: esExacta
						? versionAplicable.id
						: `rec-${versionAplicable.id}-${mesStr}`,
					originalId:
						versionAplicable.originalId || versionAplicable.id,
					fecha: esExacta ? versionAplicable.fecha : `${mesStr}-01`,
					esRecurrenteVirtual: !esExacta,
				});
			}
		}
	});

	// 3. Transacciones Exactas (No recurrentes, no cuotas)
	const exactas = transacciones.filter((t) => {
		if (t.esRecurrente || t.originalId) return false;
		if (!t.fecha.startsWith(mesStr)) return false;
		if (t.metodoPago === "tarjeta_credito" && t.cuotasData?.cantidad > 1)
			return false;
		return !t.id.includes("cuota") && !t.id.includes("rec");
	});
	resultado.push(...exactas);

	const unicos = Array.from(
		new Map(resultado.map((item) => [item.id, item])).values(),
	);
	return unicos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function getResumenMes(transacciones, mesStr) {
	const txs = getTransaccionesDelMes(transacciones, mesStr);
	let ingresos = 0,
		egresos = 0,
		ahorrosMes = 0,
		gastosFijosMes = 0;

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
