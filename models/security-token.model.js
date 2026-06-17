const mongoose = require('mongoose');

const securityTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  accion: {
    type: String,
    required: true,
    enum: ['modificar-stock', 'eliminar-stock', 'ajuste-masivo']
  },
  datos: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  usado: {
    type: Boolean,
    default: false
  },
  expiraEn: {
    type: Date,
    required: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  },
  usadoEn: {
    type: Date
  },
  ipOrigen: String
});

// Índice TTL para eliminar tokens expirados automáticamente
securityTokenSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SecurityToken', securityTokenSchema);
