const Venta = require('../models/venta.model');
const Plato = require('../models/plato.model');
const Stock = require('../models/stock.model');
const EstadoPedido = require('../models/estado-pedido.model');

exports.crearVenta = async (req, res) => {
  try {
    const {
      cliente,
      items,
      total,
      tipoPedido,
      mesa,
      observacionGeneral
    } = req.body;

    if (!cliente || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Cliente e items son obligatorios.',
      });
    }

    const tipoPedidoFinal =
      tipoPedido === 'delivery' ? 'delivery' : 'salon';

    const mesaFinal = tipoPedidoFinal === 'salon' ? (mesa || '') : '';
    const observacionFinal = observacionGeneral?.trim() || '';

    // 🔥 NORMALIZAR ITEMS
    const itemsNormalizados = items.map((i) => ({
      plato: i.productoId,
      nombre: i.nombre,
      cantidad: Number(i.cantidad),
      precioUnitario: Number(i.precioUnitario ?? 0),
      subtotal: Number(i.subtotal ?? i.precioUnitario * i.cantidad),
    }));

    const descuentos = [];

    // 🔥 VALIDAR STOCK DESDE STOCK (NO INSUMO)
    for (const item of itemsNormalizados) {
      const platoDB = await Plato.findById(item.plato).populate(
        'ingredientes.insumoId'
      );

      if (!platoDB) {
        return res.status(404).json({
          message: `Plato no encontrado: ${item.nombre}`,
        });
      }

      for (const ing of platoDB.ingredientes) {
        const insumoId = ing.insumoId?._id;

        const stockDB = await Stock.findOne({ insumoId });

        if (!stockDB) {
          return res.status(404).json({
            message: `No existe stock para ${ing.insumoId.nombre}`,
          });
        }

        const cantidadNecesaria = ing.cantidad * item.cantidad;

        if (stockDB.stock < cantidadNecesaria) {
          return res.status(400).json({
            message: `Stock insuficiente de "${ing.insumoId.nombre}". Disponible: ${stockDB.stock}, requerido: ${cantidadNecesaria}`,
          });
        }

        descuentos.push({
          insumoId,
          nombre: ing.insumoId.nombre,
          cantidad: cantidadNecesaria,
        });
      }
    }

    const totalCalculado =
      total ??
      itemsNormalizados.reduce((acc, it) => acc + it.subtotal, 0);

    const venta = new Venta({
      cliente,
      tipoPedido: tipoPedidoFinal,
      mesa: mesaFinal,
      observacionGeneral: observacionFinal,
      items: itemsNormalizados,
      total: totalCalculado,
    });

    const guardada = await venta.save();

    // 🔥 ESTADO PEDIDO
    let numeroReferencia = 1;

    if (tipoPedidoFinal === 'salon') {
      const match = String(mesaFinal || '').match(/\d+/);
      numeroReferencia = match ? Number(match[0]) : 1;
    } else {
      const totalDelivery = await EstadoPedido.countDocuments({ tipo: 'Delivery' });
      numeroReferencia = totalDelivery + 1;
    }

    const codigoPedido = `PED-${String(guardada._id).slice(-4).toUpperCase()}`;

    await EstadoPedido.create({
      ventaId: guardada._id,
      codigoPedido,
      cliente,
      tipo: tipoPedidoFinal === 'delivery' ? 'Delivery' : 'Mesa',
      numeroReferencia,
      estado: 'En preparación',
      fecha: new Date(),
      observacionGeneral: observacionFinal,
      productos: itemsNormalizados.map((item) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
      })),
    });

    // 🔥 AGRUPAR DESCUENTOS
    const agrupados = {};

    for (const d of descuentos) {
      const key = String(d.insumoId);

      if (!agrupados[key]) {
        agrupados[key] = { ...d };
      } else {
        agrupados[key].cantidad += d.cantidad;
      }
    }

    // 🔥 DESCONTAR SOLO EN STOCK
    for (const key of Object.keys(agrupados)) {
      const d = agrupados[key];

      const actualizado = await Stock.findOneAndUpdate(
        { insumoId: d.insumoId },
        { $inc: { stock: -d.cantidad } },
        { new: true }
      );

      if (!actualizado) {
        return res.status(404).json({
          message: `No se pudo actualizar stock de ${d.nombre}`,
        });
      }

      console.log(`Stock actualizado -> ${d.nombre}: ${actualizado.stock}`);
    }

    return res.status(201).json({
      message: 'Venta registrada y stock actualizado correctamente',
      venta: guardada,
    });

  } catch (err) {
    console.error('Error creando venta', err);
    return res.status(500).json({
      message: 'Error creando venta',
      error: err.message,
    });
  }
};

exports.listarVentas = async (_req, res) => {
  try {
    const ventas = await Venta.find().sort({ fecha: -1 });
    res.json(ventas);
  } catch (err) {
    res.status(500).json({ message: 'Error listando ventas' });
  }
};

exports.obtenerVenta = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.json(venta);
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo venta' });
  }
};

exports.eliminarVenta = async (req, res) => {
  try {
    const venta = await Venta.findByIdAndDelete(req.params.id);
    if (!venta) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    res.json({ message: 'Venta eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error eliminando venta' });
  }
};