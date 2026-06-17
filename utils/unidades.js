const ALIASES = {
  kg: 'kg', kilo: 'kg', kilos: 'kg',
  gr: 'g', g: 'g', gramo: 'g', gramos: 'g',
  lt: 'l', l: 'l', litro: 'l', litros: 'l',
  ml: 'ml', mililitro: 'ml', mililitros: 'ml',
  unidad: 'unidad', unidades: 'unidad', und: 'unidad',
  paquete: 'paquete', paquetes: 'paquete',
  bolsa: 'paquete', caja: 'paquete', botella: 'paquete'
};

function normalizarUnidad(unidad) {
  const key = String(unidad || 'unidad').trim().toLowerCase();
  return ALIASES[key] || key;
}

function redondear(valor) {
  return Number(Number(valor).toFixed(3));
}

function convertirCantidad(cantidad, desde, hacia, cantidadPorUnidadCompra = 1) {
  const valor = Number(cantidad);
  if (!Number.isFinite(valor) || valor < 0) {
    throw new Error('Cantidad no válida para conversión de unidades.');
  }

  const origen = normalizarUnidad(desde);
  const destino = normalizarUnidad(hacia);

  if (origen === destino) return redondear(valor);

  if (origen === 'paquete') {
    return redondear(valor * Number(cantidadPorUnidadCompra || 1));
  }

  const conversiones = {
    'g:kg': valor / 1000,
    'kg:g': valor * 1000,
    'ml:l': valor / 1000,
    'l:ml': valor * 1000
  };

  const convertido = conversiones[`${origen}:${destino}`];
  if (convertido === undefined) {
    throw new Error(`No es posible convertir ${origen} a ${destino}. Configura unidades compatibles.`);
  }

  return redondear(convertido);
}

module.exports = { normalizarUnidad, convertirCantidad, redondear };
