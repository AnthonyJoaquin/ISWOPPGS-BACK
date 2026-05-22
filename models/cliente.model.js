const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    telefono: { type: String },
    direccion: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model("Cliente", ClienteSchema);