const mongoose = require('mongoose');
const OrdenCompra = require('../models/orden-compra.model');
const Proveedor = require('../models/proveedor.model');
const Stock = require('../models/stock.model');
const MovimientoStock = require('../models/movimiento-stock.model');
const { convertirCantidad, normalizarUnidad } = require('../utils/unidades');

async function proveedorSnapshot(body) {
  const proveedorId = body.proveedorId || (mongoose.Types.ObjectId.isValid(String(body.proveedor || '')) ? body.proveedor : null);
  if (proveedorId) {
    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor || !proveedor.activo) throw new Error('El proveedor seleccionado no está disponible.');
    return {
      proveedorId: proveedor._id,
      proveedor: proveedor.nombre,
      proveedorTelefono: proveedor.telefono,
      proveedorRuc: proveedor.ruc
    };
  }
  // Compatibilidad con órdenes antiguas o carga manual.
  if (!String(body.proveedor || '').trim()) throw new Error('Selecciona un proveedor.');
  return {
    proveedorId: null,
    proveedor: String(body.proveedor).trim(),
    proveedorTelefono: String(body.proveedorTelefono || '').replace(/\D/g, ''),
    proveedorRuc: String(body.proveedorRuc || '').trim()
  };
}

function normalizarItems(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('Agrega al menos un insumo a la orden.');
  return items.map((item) => {
    if (!mongoose.Types.ObjectId.isValid(String(item.insumo || ''))) throw new Error('Existe un insumo inválido en la orden.');
    const cantidad = Number(item.cantidad);
    const precioUnitario = Number(item.precioUnitario || 0);
    if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) throw new Error('El precio unitario no es válido.');
    return {
      insumo: item.insumo,
      cantidad,
      unidad: normalizarUnidad(item.unidad),
      precioUnitario,
      subtotal: Number((cantidad * precioUnitario).toFixed(2))
    };
  });
}

exports.crearOrden = async (req, res) => {
  try {
    if (!req.body.fecha) return res.status(400).json({ error: 'Selecciona la fecha de la orden.' });
    const datosProveedor = await proveedorSnapshot(req.body);
    const orden = new OrdenCompra({
      ...datosProveedor,
      fecha: req.body.fecha,
      observacion: String(req.body.observacion || '').trim(),
      items: normalizarItems(req.body.items)
    });
    await orden.save();
    const completa = await OrdenCompra.findById(orden._id)
      .populate('proveedorId', 'nombre ruc telefono email')
      .populate('items.insumo', 'nombre marca');
    res.status(201).json(completa);
  } catch (error) {
    res.status(400).json({ error: error.message || 'No fue posible registrar la orden.' });
  }
};

exports.obtenerOrdenes = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const filtro = req.query.estado ? { estado: req.query.estado } : {};
    const [ordenes, total] = await Promise.all([
      OrdenCompra.find(filtro)
        .populate('proveedorId', 'nombre ruc telefono email')
        .populate('items.insumo', 'nombre marca')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      OrdenCompra.countDocuments(filtro)
    ]);
    if (!req.query.page && !req.query.limit) return res.json(ordenes);
    res.json({ ordenes, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener órdenes.' });
  }
};

exports.actualizarOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
    if (orden.estado === 'Recibido') {
      return res.status(400).json({ error: 'Una orden recibida forma parte del historial y ya no puede editarse.' });
    }
    const datosProveedor = await proveedorSnapshot(req.body);
    Object.assign(orden, datosProveedor, {
      fecha: req.body.fecha,
      observacion: String(req.body.observacion || '').trim(),
      items: normalizarItems(req.body.items)
    });
    await orden.save();
    const actualizada = await OrdenCompra.findById(orden._id)
      .populate('proveedorId', 'nombre ruc telefono email')
      .populate('items.insumo', 'nombre marca');
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Error al actualizar orden.' });
  }
};

exports.eliminarOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findById(req.params.id);
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
    if (orden.estado === 'Recibido') {
      return res.status(400).json({ error: 'No se puede eliminar una orden recibida porque forma parte del historial de compras.' });
    }
    await orden.deleteOne();
    res.json({ message: 'Orden eliminada correctamente.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Error al eliminar orden.' });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const estado = String(req.body.estado || '').trim();
    if (!['Pendiente', 'Enviado', 'Recibido'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Utiliza Pendiente, Enviado o Recibido.' });
    }

    const orden = await OrdenCompra.findById(req.params.id).populate('items.insumo', 'nombre marca');
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });
    if (orden.estado === 'Recibido') {
      return res.json({ message: 'La orden ya fue recibida previamente; no se duplicó el ingreso a stock.', orden });
    }

    if (estado === 'Enviado') {
      orden.estado = 'Enviado';
      orden.fechaEnvio = orden.fechaEnvio || new Date();
      await orden.save();
      return res.json(orden);
    }

    if (estado === 'Recibido') {
      // Validar toda la orden antes de aplicar entradas para evitar recepciones parciales.
      const ingresos = [];
      for (const item of orden.items) {
        const insumoId = item.insumo?._id || item.insumo;
        const registro = await Stock.findOne({ insumoId });
        if (!registro) throw new Error(`No existe registro de stock para ${item.insumo?.nombre || 'un insumo'}.`);
        const cantidadBase = convertirCantidad(item.cantidad, item.unidad, registro.unidadBase, registro.cantidadPorUnidadCompra);
        ingresos.push({ insumoId, registro, cantidadBase });
      }

      const entradas = [];
      for (const ingreso of ingresos) {
        const stockAnterior = Number(ingreso.registro.stock);
        ingreso.registro.stock = Number((stockAnterior + ingreso.cantidadBase).toFixed(3));
        await ingreso.registro.save();

        entradas.push(await MovimientoStock.create({
          insumoId: ingreso.insumoId,
          tipo: 'entrada',
          cantidad: ingreso.cantidadBase,
          unidadBase: ingreso.registro.unidadBase,
          motivo: `Recepción de orden OC-${orden.numeroOrden}`,
          referenciaTipo: 'orden-compra',
          referenciaId: orden._id,
          stockAnterior,
          stockResultante: ingreso.registro.stock,
          usuario: 'Administrador'
        }));
      }
      orden.estado = 'Recibido';
      orden.fechaRecepcion = new Date();
      await orden.save();
      const historica = await OrdenCompra.findById(orden._id)
        .populate('proveedorId', 'nombre ruc telefono email')
        .populate('items.insumo', 'nombre marca');
      return res.json({
        message: 'Orden recibida. Stock actualizado y orden conservada en el historial.',
        orden: historica,
        movimientos: entradas
      });
    }

    orden.estado = 'Pendiente';
    await orden.save();
    res.json(orden);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Error al actualizar estado.' });
  }
};
