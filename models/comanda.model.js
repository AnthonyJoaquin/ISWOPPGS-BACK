const mongoose = require('mongoose');

const ComandaItemSchema = new mongoose.Schema(
  {
    nombre:   { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    estado:   { type: String, enum: ['Pendiente', 'Recibido'], default: 'Pendiente' },
  },
  { _id: false }
);

const ComandaSchema = new mongoose.Schema(
  {
    cliente:    { type: String, required: true, trim: true },
    tipoPedido: { type: String, default: 'salon' },
    mesa:       { type: String, default: '' },
    items:      { type: [ComandaItemSchema], default: [] },
    recibido:   { type: Boolean, default: false }, // true = marcado recibido en vista
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comanda', ComandaSchema);
