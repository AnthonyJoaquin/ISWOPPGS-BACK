const Venta = require('../models/venta.model');
const EstadoPedido = require('../models/estado-pedido.model');
const mongoose = require('mongoose');
const { descontarStockPorPlatos } = require('../services/inventario.service');

exports.crearVenta = async (req, res) => {
  try {
    const { cliente, items, total, tipoPedido, mesa, observacionGeneral } = req.body;
    if (!cliente || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cliente e items son obligatorios.' });
    }

    const tipoPedidoFinal = tipoPedido === 'delivery' ? 'delivery' : 'salon';
    const itemsNormalizados = items.map((item) => ({
      plato: mongoose.Types.ObjectId.isValid(String(item.productoId || item.plato || ''))
        ? (item.productoId || item.plato)
        : null,
      nombre: String(item.nombre || '').trim(),
      cantidad: Number(item.cantidad),
      precioUnitario: Number(item.precioUnitario || 0),
      subtotal: Number(item.subtotal ?? Number(item.precioUnitario || 0) * Number(item.cantidad))
    }));
    const totalCalculado = Number(total ?? itemsNormalizados.reduce((acc, item) => acc + item.subtotal, 0));

    // Intentar descontar inventario, pero sin bloquear la venta si falla
    let inventario = { procesado: false, movimientos: [] };
    let advertenciaInventario = null;
    try {
      inventario = await descontarStockPorPlatos(itemsNormalizados, {
        motivo: 'Salida por venta confirmada',
        tipo: 'venta',
        usuario: 'Administrador'
      });
    } catch (invErr) {
      advertenciaInventario = invErr.message;
      console.warn('⚠️ Advertencia inventario:', invErr.message);
    }

    const venta = await Venta.create({
      cliente: String(cliente).trim(),
      tipoPedido: tipoPedidoFinal,
      mesa: tipoPedidoFinal === 'salon' ? String(mesa || '') : '',
      observacionGeneral: String(observacionGeneral || '').trim(),
      items: itemsNormalizados,
      total: totalCalculado
    });

    const numeroReferencia = tipoPedidoFinal === 'salon'
      ? Number(String(mesa || '1').match(/\d+/)?.[0] || 1)
      : (await EstadoPedido.countDocuments({ tipo: 'Delivery' })) + 1;

    await EstadoPedido.create({
      ventaId: venta._id,
      codigoPedido: `PED-${String(venta._id).slice(-4).toUpperCase()}`,
      cliente: venta.cliente,
      tipo: tipoPedidoFinal === 'delivery' ? 'Delivery' : 'Mesa',
      numeroReferencia,
      estado: 'En preparación',
      fecha: new Date(),
      observacionGeneral: venta.observacionGeneral,
      productos: itemsNormalizados.map((item) => ({ nombre: item.nombre, cantidad: item.cantidad }))
    });

    res.status(201).json({
      message: advertenciaInventario
        ? `Venta registrada. Advertencia de inventario: ${advertenciaInventario}`
        : inventario.procesado
          ? 'Venta registrada y stock descontado correctamente.'
          : 'Venta registrada. No se descontó inventario porque los productos no tienen receta vinculada.',
      venta,
      movimientosStock: inventario.movimientos
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creando venta.' });
  }
};

exports.listarVentas = async (_req, res) => {
  try {
    res.json(await Venta.find().sort({ fecha: -1 }));
  } catch (_error) {
    res.status(500).json({ message: 'Error listando ventas.' });
  }
};

exports.obtenerVenta = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id);
    if (!venta) return res.status(404).json({ message: 'Venta no encontrada.' });
    res.json(venta);
  } catch (_error) {
    res.status(500).json({ message: 'Error obteniendo venta.' });
  }
};

exports.eliminarVenta = async (req, res) => {
  try {
    const venta = await Venta.findByIdAndUpdate(req.params.id, { estado: 'anulada' }, { new: true });
    if (!venta) return res.status(404).json({ message: 'Venta no encontrada.' });
    res.json({ message: 'Venta anulada. El movimiento de inventario se conserva para auditoría.', venta });
  } catch (_error) {
    res.status(500).json({ message: 'Error anulando venta.' });
  }
};
