const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  ruc: { type: String, required: true, trim: true, unique: true },
  telefono: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true, lowercase: true },
  direccion: { type: String, default: '', trim: true },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Proveedor', ProveedorSchema);
