const mongoose = require('mongoose');
const { normalizarUnidad } = require('../utils/unidades');

const StockSchema = new mongoose.Schema(
  {
    insumoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insumo',
      required: true,
      unique: true,
      index: true
    },
    stock: { type: Number, default: 0, min: 0 },
    stockMinimo: { type: Number, default: 0, min: 0 },
    unidadBase: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'unidad'],
      default: 'unidad',
      set: normalizarUnidad
    },
    unidadCompra: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'unidad', 'paquete'],
      default: 'unidad',
      set: normalizarUnidad
    },
    cantidadPorUnidadCompra: { type: Number, default: 1, min: 0.001 },
    almacen: { type: String, default: 'Almacén Principal', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stock', StockSchema);
