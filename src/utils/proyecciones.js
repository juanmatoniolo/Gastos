// src/utils/proyecciones.js
export function getTransaccionesDelMes(transacciones, mesStr) {
	if (!transacciones) return [];
	const resultado = [];
	const [anioStr, mesStrNum] = mesStr.split("-");
	const anio = parseInt(anioStr);
	const mes = parseInt(mesStrNum); // 1-12

	transacciones.forEach((t) => {
		const [anioCompra, mesCompra] = t.fecha.split("-").map(Number);

		// Diferencia de meses entre la compra y el mes que estamos viendo
		const diffMeses = (anio - anioCompra) * 12 + (mes - mesCompra);

		// 1. TARJETA DE CRÉDITO EN CUOTAS
		if (t.metodoPago === "tarjeta_credito" && t.cuotasData?.cantidad > 1) {
			// Impacta desde el mes siguiente a la compra (diffMeses > 0) hasta terminar las cuotas
			if (diffMeses > 0 && diffMeses <= t.cuotasData.cantidad) {
				resultado.push({
					...t,
					id: `cuota-${t.id}-${mesStr}`, // ID único virtual
					monto: t.cuotasData.montoPorCuota, // Solo impacta el monto de 1 cuota
					fecha: `${mesStr}-01`, // Fecha ficticia para ubicarlo en el mes
					descripcion: `${t.descripcion} (Cuota ${diffMeses}/${t.cuotasData.cantidad})`,
					esCuotaVirtual: true, // Bandera para la UI
				});
			}
			// NOTA: En el mes de la compra (diffMeses === 0) NO lo sumamos a los egresos,
			// porque con tarjeta de crédito se empieza a pagar al mes siguiente.
		}

		// 2. TRANSACCIÓN NORMAL (Efectivo, Débito, o Tarjeta en 1 pago)
		else if (t.fecha.startsWith(mesStr)) {
			resultado.push(t);
		}

		// 3. INGRESOS RECURRENTES (Sueldo)
		else if (t.esRecurrente && t.fecha.slice(0, 7) < mesStr) {
			// Evitar duplicados si el usuario ya cargó un sueldo nuevo este mes
			const tieneOverride = transacciones.some(
				(ex) =>
					ex.descripcion === t.descripcion &&
					ex.tipo === t.tipo &&
					ex.fecha.startsWith(mesStr) &&
					ex.esRecurrente,
			);
			if (!tieneOverride) {
				resultado.push({
					...t,
					id: `rec-${t.id}`,
					fecha: `${mesStr}-01`,
				});
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
				egresos += t.monto; // Aquí se suman las cuotas virtuales de las tarjetas
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
