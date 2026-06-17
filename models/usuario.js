const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ['admin', 'cliente'],
    default: 'cliente'
  }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);