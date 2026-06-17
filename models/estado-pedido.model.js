const mongoose = require('mongoose');

const ProductoPedidoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const EstadoPedidoSchema = new mongoose.Schema(
  {
    ventaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venta',
      required: true,
    },
    codigoPedido: {
      type: String,
      required: true,
      trim: true,
    },
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['Mesa', 'Delivery'],
      required: true,
    },
    numeroReferencia: {
      type: Number,
      required: true,
      min: 1,
    },
    estado: {
      type: String,
      enum: ['Registrado', 'En preparación', 'Entregado'],
      default: 'En preparación',
    },
    productos: {
      type: [ProductoPedidoSchema],
      default: [],
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    observacionGeneral: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EstadoPedido', EstadoPedidoSchema);