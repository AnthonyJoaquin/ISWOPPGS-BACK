const Insumo = require('../models/insumo.model');
const Venta = require('../models/venta.model');
const OrdenCompra = require('../models/orden-compra.model');

exports.obtenerResumen = async (req, res) => {
  try {
    const insumosActivos = await Insumo.countDocuments();

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const ventasHoy = await Venta.find({
      createdAt: { $gte: inicioHoy, $lte: finHoy },
      estado: 'registrada',
    });

    const totalVentasHoy = ventasHoy.reduce((acc, venta) => {
      return acc + Number(venta.total || 0);
    }, 0);

    const ordenesPendientes = await OrdenCompra.countDocuments();

    const deliveryHoy = await Venta.countDocuments({
      createdAt: { $gte: inicioHoy, $lte: finHoy },
      estado: 'registrada',
      tipoPedido: 'delivery',
    });

    res.json({
      insumosActivos,
      ventasHoy: totalVentasHoy,
      ordenesPendientes,
      deliveryHoy,
    });
  } catch (error) {
    console.error('Error al obtener resumen del dashboard:', error);
    res.status(500).json({
      error: 'Error al obtener resumen del dashboard',
    });
  }
};

exports.obtenerActividadReciente = async (req, res) => {
  try {
    const actividades = [];

    const ventas = await Venta.find({ estado: 'registrada' })
      .sort({ createdAt: -1 })
      .limit(5);

    for (const venta of ventas) {
      actividades.push({
        descripcion: `Se registró una venta por S/ ${Number(venta.total || 0).toFixed(2)}`,
        fecha: venta.createdAt,
      });
    }

    const insumos = await Insumo.find()
      .sort({ createdAt: -1 })
      .limit(5);

    for (const insumo of insumos) {
      actividades.push({
        descripcion: `Se agregó el insumo "${insumo.nombre}"`,
        fecha: insumo.createdAt,
      });
    }

    const ordenes = await OrdenCompra.find()
      .sort({ createdAt: -1 })
      .limit(5);

    for (const orden of ordenes) {
      actividades.push({
        descripcion: `Se creó una orden de compra al proveedor "${orden.proveedor}"`,
        fecha: orden.createdAt,
      });
    }

    actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(actividades.slice(0, 5));
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    res.status(500).json({
      error: 'Error al obtener actividad reciente',
    });
  }
};