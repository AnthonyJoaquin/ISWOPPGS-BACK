const Insumo = require('../models/insumo.model');
const Venta = require('../models/venta.model');
const OrdenCompra = require('../models/orden-compra.model');
const Stock = require('../models/stock.model');
const MovimientoStock = require('../models/movimiento-stock.model');

exports.obtenerResumen = async (_req, res) => {
  try {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const [insumosActivos, ventasHoy, ordenesPendientes, deliveryHoy, alertasStock] = await Promise.all([
      Insumo.countDocuments(),
      Venta.find({ createdAt: { $gte: inicioHoy, $lte: finHoy }, estado: { $ne: 'anulada' } }),
      OrdenCompra.countDocuments({ estado: { $in: ['Pendiente', 'Enviado'] } }),
      Venta.countDocuments({ createdAt: { $gte: inicioHoy, $lte: finHoy }, estado: { $ne: 'anulada' }, tipoPedido: 'delivery' }),
      Stock.countDocuments({ $expr: { $lte: ['$stock', '$stockMinimo'] } })
    ]);

    res.json({
      insumosActivos,
      ventasHoy: ventasHoy.reduce((acc, venta) => acc + Number(venta.total || 0), 0),
      ordenesPendientes,
      deliveryHoy,
      alertasStock
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen del dashboard.', detalle: error.message });
  }
};

exports.obtenerActividadReciente = async (_req, res) => {
  try {
    const actividades = [];
    const [ventas, insumos, ordenes, movimientos] = await Promise.all([
      Venta.find({ estado: { $ne: 'anulada' } }).sort({ createdAt: -1 }).limit(4),
      Insumo.find().sort({ createdAt: -1 }).limit(3),
      OrdenCompra.find().sort({ createdAt: -1 }).limit(4),
      MovimientoStock.find().populate('insumoId', 'nombre').sort({ createdAt: -1 }).limit(5)
    ]);

    ventas.forEach((venta) => actividades.push({
      descripcion: `Venta registrada por S/ ${Number(venta.total || 0).toFixed(2)}`,
      fecha: venta.createdAt
    }));
    insumos.forEach((insumo) => actividades.push({
      descripcion: `Insumo registrado: "${insumo.nombre}"`,
      fecha: insumo.createdAt
    }));
    ordenes.forEach((orden) => actividades.push({
      descripcion: `OC-${orden.numeroOrden}: ${orden.proveedor} · ${orden.estado}`,
      fecha: orden.updatedAt || orden.createdAt
    }));
    movimientos.forEach((mov) => actividades.push({
      descripcion: `${mov.tipo.toUpperCase()} de stock: ${mov.insumoId?.nombre || 'Insumo'} (${mov.cantidad} ${mov.unidadBase})`,
      fecha: mov.createdAt
    }));

    actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(actividades.slice(0, 8));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividad reciente.', detalle: error.message });
  }
};
