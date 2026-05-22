const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema(
  {
    insumoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insumo',
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    stockMinimo: {
      type: Number,
      default: 0,
    },
    // Unidad con la que se mide y descuenta el stock (ej: kg, g, ml, unidad)
    unidadBase: {
      type: String,
      default: 'unidad',
    },
    // Unidad en la que se compra el insumo (ej: bolsa, caja, botella)
    unidadCompra: {
      type: String,
      default: 'unidad',
    },
    // Cuántas unidadBase hay en 1 unidadCompra (ej: 1 bolsa = 5 kg → 5)
    cantidadPorUnidadCompra: {
      type: Number,
      default: 1,
    },
    almacen: {
      type: String,
      default: 'Almacén Principal',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stock', StockSchema);