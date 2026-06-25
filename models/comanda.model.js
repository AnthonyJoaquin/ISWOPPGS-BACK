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
    pedidoCodigo: { type: String, default: '', trim: true, index: true },
    cliente:      { type: String, required: true, trim: true },
    tipoPedido:   { type: String, default: 'delivery' },
    mesa:         { type: String, default: '' },
    items:        { type: [ComandaItemSchema], default: [] },
    observacion:  { type: String, default: '' },
    total:        { type: Number, default: 0, min: 0 },
    recibido:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comanda', ComandaSchema);
