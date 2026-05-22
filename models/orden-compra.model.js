const mongoose = require('mongoose');

const OrdenCompraSchema = new mongoose.Schema(
  {
    numeroOrden: {
      type: Number,
    },
    proveedor: {
      type: String,
      required: true,
      trim: true,
    },
    fecha: {
      type: String,
      required: true,
    },
    observacion: {
      type: String,
      default: '',
      trim: true,
    },
    estado: {
      type: String,
      enum: ['Pendiente', 'Enviado', 'Recibido'],
      default: 'Pendiente',
      trim: true,
    },
    items: [
      {
        insumo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Insumo',
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: 1,
        },
        unidad: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-incrementar numeroOrden antes de guardar
OrdenCompraSchema.pre('save', async function (next) {
  if (this.isNew) {
    const ultima = await mongoose.model('OrdenCompra').findOne(
      {},
      { numeroOrden: 1 },
      { sort: { numeroOrden: -1 } }
    );
    this.numeroOrden = (ultima?.numeroOrden ?? 0) + 1;
  }
  next();
});

module.exports = mongoose.model('OrdenCompra', OrdenCompraSchema);