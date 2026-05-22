const mongoose = require('mongoose');
const OrdenCompra = require('../models/orden-compra.model');
const Insumo = require('../models/insumo.model');
const Stock = require('../models/stock.model');

exports.crearOrden = async (req, res) => {
  try {
    const { proveedor, fecha, observacion, items } = req.body;

    if (!proveedor || !fecha || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    for (const item of items) {
      if (!item.insumo || !item.cantidad || !item.unidad) {
        return res.status(400).json({
          error: 'Cada item debe tener insumo, cantidad y unidad',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.insumo)) {
        return res.status(400).json({
          error: `Insumo inválido en item: ${item.insumo}`,
        });
      }

      if (Number(item.cantidad) <= 0) {
        return res.status(400).json({
          error: 'La cantidad debe ser mayor a 0',
        });
      }
    }

    const nuevaOrden = new OrdenCompra({
      proveedor,
      fecha,
      observacion: observacion || '',
      items,
    });

    await nuevaOrden.save();

    const ordenCompleta = await OrdenCompra.findById(nuevaOrden._id).populate(
      'items.insumo',
      'nombre marca stock'
    );

    res.status(201).json(ordenCompleta);
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate('items.insumo', 'nombre marca stock')
      .sort({ createdAt: -1 });

    res.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarOrden = async (req, res) => {
  try {
    const { id } = req.params;
    const { proveedor, fecha, observacion, items } = req.body;

    if (!proveedor || !fecha || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para actualizar' });
    }

    for (const item of items) {
      if (!item.insumo || !item.cantidad || !item.unidad) {
        return res.status(400).json({
          error: 'Cada item debe tener insumo, cantidad y unidad',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.insumo)) {
        return res.status(400).json({
          error: `Insumo inválido en item: ${item.insumo}`,
        });
      }

      if (Number(item.cantidad) <= 0) {
        return res.status(400).json({
          error: 'La cantidad debe ser mayor a 0',
        });
      }
    }

    const ordenActualizada = await OrdenCompra.findByIdAndUpdate(
      id,
      {
        proveedor,
        fecha,
        observacion: observacion || '',
        items,
      },
      { new: true }
    ).populate('items.insumo', 'nombre marca stock');

    if (!ordenActualizada) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarOrden = async (req, res) => {
  try {
    const { id } = req.params;

    const ordenEliminada = await OrdenCompra.findByIdAndDelete(id);

    if (!ordenEliminada) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json({ message: 'Orden eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'Estado requerido' });
    }

    const orden = await OrdenCompra.findById(id).populate(
      'items.insumo',
      'nombre marca stock'
    );

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (estado.toLowerCase() === 'recibido') {
      for (const item of orden.items) {
        const insumoId = item.insumo?._id || item.insumo;
        const cantidad = Number(item.cantidad);

        if (!insumoId || cantidad <= 0) {
          return res.status(400).json({
            error: 'Hay items inválidos en la orden',
          });
        }

        // Verificar que el insumo existe
        const insumoExiste = await Insumo.findById(insumoId);
        if (!insumoExiste) {
          return res.status(404).json({
            error: `No se encontró el insumo con id ${insumoId}`,
          });
        }

        // Actualizar stock SOLO en la colección Stock
        const stockActualizado = await Stock.findOneAndUpdate(
          { insumoId },
          { $inc: { stock: cantidad } },
          { new: true }
        );

        if (!stockActualizado) {
          console.warn(`No existe registro en Stock para insumo ${insumoId}`);
        } else {
          console.log(
            `✅ Stock actualizado: ${insumoExiste.nombre} -> stock: ${stockActualizado.stock}`
          );
        }
      }

      await OrdenCompra.findByIdAndDelete(id);

      return res.json({
        message: 'Orden recibida, stock actualizado y registro eliminado correctamente',
      });
    }

    orden.estado = estado;
    await orden.save();

    const ordenActualizada = await OrdenCompra.findById(id).populate(
      'items.insumo',
      'nombre marca stock'
    );

    res.json(ordenActualizada);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(400).json({ error: error.message });
  }
};