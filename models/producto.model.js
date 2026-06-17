const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '', trim: true },
  imagenUrl: { type: String, default: '' },
  categoria: { type: String, default: 'General', trim: true },
  precio: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  stockMinimo: { type: Number, required: true, min: 0, default: 0 },
  marca: { type: String, required: true, trim: true },
  disponible: { type: Boolean, default: true }
}, { timestamps: true });

ProductoSchema.index({ nombre: 1, marca: 1 });

module.exports = mongoose.model('Producto', ProductoSchema);
