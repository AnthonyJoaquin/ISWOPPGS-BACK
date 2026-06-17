const mongoose = require('mongoose');

const MovimientoStockSchema = new mongoose.Schema({
  insumoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Insumo', required: true, index: true },
  tipo: { type: String, enum: ['entrada', 'salida', 'ajuste'], required: true, index: true },
  cantidad: { type: Number, required: true, min: 0 },
  unidadBase: { type: String, required: true, trim: true },
  motivo: { type: String, required: true, trim: true },
  referenciaTipo: { type: String, default: '', trim: true },
  referenciaId: { type: mongoose.Schema.Types.Mixed, default: null },
  stockAnterior: { type: Number, default: 0 },
  stockResultante: { type: Number, default: 0 },
  usuario: { type: String, default: 'Sistema', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('MovimientoStock', MovimientoStockSchema);
