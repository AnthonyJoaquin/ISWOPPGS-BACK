const mongoose = require('mongoose');
const Plato = require('../models/plato.model');
const Stock = require('../models/stock.model');
const MovimientoStock = require('../models/movimiento-stock.model');
const { convertirCantidad, normalizarUnidad, redondear } = require('../utils/unidades');

async function obtenerConsumos(items) {
  const agrupados = new Map();

  for (const item of items || []) {
    const platoId = item.plato || item.productoId || item.id;
    if (!mongoose.Types.ObjectId.isValid(String(platoId || ''))) continue;

    const plato = await Plato.findById(platoId).populate('ingredientes.insumoId', 'nombre');
    if (!plato) throw new Error(`Plato no encontrado: ${item.nombre || platoId}.`);

    for (const ing of plato.ingredientes || []) {
      const insumoId = ing.insumoId?._id || ing.insumoId;
      const stock = await Stock.findOne({ insumoId });
      if (!stock) throw new Error(`No existe stock registrado para ${ing.insumoId?.nombre || 'un insumo'}.`);

      const totalReceta = Number(ing.cantidad) * Number(item.cantidad || 1);
      const cantidadBase = convertirCantidad(
        totalReceta,
        ing.unidad,
        stock.unidadBase,
        stock.cantidadPorUnidadCompra
      );
      const key = String(insumoId);
      const anterior = agrupados.get(key);

      if (anterior) anterior.cantidad = redondear(anterior.cantidad + cantidadBase);
      else agrupados.set(key, {
        insumoId,
        nombre: ing.insumoId?.nombre || 'Insumo',
        cantidad: cantidadBase,
        unidadBase: normalizarUnidad(stock.unidadBase),
        stock
      });
    }
  }
  return [...agrupados.values()];
}

async function descontarStockPorPlatos(items, referencia = {}) {
  const consumos = await obtenerConsumos(items);
  if (!consumos.length) return { movimientos: [], procesado: false };

  for (const consumo of consumos) {
    if (Number(consumo.stock.stock) < consumo.cantidad) {
      throw new Error(`Stock insuficiente de "${consumo.nombre}". Disponible: ${consumo.stock.stock} ${consumo.unidadBase}; requerido: ${consumo.cantidad} ${consumo.unidadBase}.`);
    }
  }

  const movimientos = [];
  for (const consumo of consumos) {
    const stockAnterior = Number(consumo.stock.stock);
    const actualizado = await Stock.findOneAndUpdate(
      { insumoId: consumo.insumoId, stock: { $gte: consumo.cantidad } },
      { $inc: { stock: -consumo.cantidad } },
      { new: true }
    );
    if (!actualizado) throw new Error(`No se pudo descontar stock de ${consumo.nombre}.`);

    const movimiento = await MovimientoStock.create({
      insumoId: consumo.insumoId,
      tipo: 'salida',
      cantidad: consumo.cantidad,
      unidadBase: consumo.unidadBase,
      motivo: referencia.motivo || 'Consumo por pedido',
      referenciaTipo: referencia.tipo || 'pedido',
      referenciaId: referencia.id || null,
      stockAnterior,
      stockResultante: actualizado.stock,
      usuario: referencia.usuario || 'Sistema'
    });
    movimientos.push(movimiento);
  }
  return { movimientos, procesado: true };
}

module.exports = { descontarStockPorPlatos };
