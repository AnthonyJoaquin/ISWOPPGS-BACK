const mongoose = require('mongoose');

const DireccionSchema = new mongoose.Schema({
  alias: { type: String, required: true, trim: true },
  direccion: { type: String, required: true, trim: true },
  referencia: { type: String, trim: true, default: '' },
  distrito: { type: String, required: true, trim: true },
  principal: { type: Boolean, default: false }
}, { timestamps: true });

const ClienteSchema = new mongoose.Schema({
  nombres: { type: String, trim: true, required: true },
  apellidos: { type: String, trim: true, default: '' },
  correo: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  celular: { type: String, trim: true, default: '' },
  passwordHash: { type: String, select: false },
  proveedorAuth: { type: String, enum: ['local', 'google'], default: 'local' },
  googleSub: { type: String, select: false, default: '' },
  foto: { type: String, default: '' },
  direcciones: { type: [DireccionSchema], default: [] },
  activo: { type: Boolean, default: true },
  // Compatibilidad con el módulo administrativo anterior
  nombre: { type: String, trim: true, default: '' },
  telefono: { type: String, trim: true, default: '' },
  direccion: { type: String, trim: true, default: '' }
}, { timestamps: true });

ClienteSchema.pre('save', function siguiente(next) {
  if (!this.nombre) this.nombre = `${this.nombres} ${this.apellidos}`.trim();
  if (!this.telefono) this.telefono = this.celular;
  next();
});

module.exports = mongoose.model('Cliente', ClienteSchema);



