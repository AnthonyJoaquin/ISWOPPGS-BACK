const mongoose = require('mongoose');
const { Schema } = mongoose;

const DetalleSchema = new Schema(
  {
    plato: {
      type: Schema.Types.ObjectId,
      ref: 'Plato',
      required: false,   // no obligatorio, puede venir null si es plato manual
      default: null,
    },

    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },

    precioUnitario: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const VentaSchema = new Schema(
  {
    cliente: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    items: {
      type: [DetalleSchema],
      required: true,
      validate: [
        (arr) => arr.length > 0,
        'Debe haber al menos un item en la venta',
      ],
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    fecha: {
      type: Date,
      default: Date.now,
      index: true,
    },

    estado: {
      type: String,
      enum: ['registrada', 'anulada', 'completada'],
      default: 'registrada',
      index: true,
    },

    tipoPedido: {
      type: String,
      enum: ['salon', 'delivery'],
      required: true,
      default: 'salon',
    },

    mesa: {
      type: String,
      default: '',
    },

    observacionGeneral: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 OPCIONAL PERO PRO: VALIDAR CONSISTENCIA TOTAL
VentaSchema.pre('save', function (next) {
  const totalCalculado = this.items.reduce(
    (acc, item) => acc + item.subtotal,
    0
  );

  if (Math.abs(totalCalculado - this.total) > 0.01) {
    return next(new Error('El total no coincide con los subtotales.'));
  }

  next();
});

module.exports = mongoose.model('Venta', VentaSchema);