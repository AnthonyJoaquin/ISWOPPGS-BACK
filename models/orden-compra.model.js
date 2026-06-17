const mongoose = require('mongoose');
const { normalizarUnidad } = require('../utils/unidades');

const ItemOrdenSchema = new mongoose.Schema({
  insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Insumo', required: true },
  cantidad: { type: Number, required: true, min: 0.001 },
  unidad: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'unidad', 'paquete'],
    required: true,
    set: normalizarUnidad
  },
  precioUnitario: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, default: 0, min: 0 }
}, { _id: false });

const OrdenCompraSchema = new mongoose.Schema({
  numeroOrden: Number,
  proveedor: { type: String, required: true, trim: true }, // nombre histórico visible
  proveedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', default: null },
  proveedorTelefono: { type: String, default: '', trim: true },
  proveedorRuc: { type: String, default: '', trim: true },
  fecha: { type: String, required: true },
  fechaEnvio: { type: Date, default: null },
  fechaRecepcion: { type: Date, default: null },
  observacion: { type: String, default: '', trim: true },
  estado: {
    type: String,
    enum: ['Pendiente', 'Enviado', 'Recibido'],
    default: 'Pendiente',
    trim: true
  },
  items: { type: [ItemOrdenSchema], default: [] },
  total: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

OrdenCompraSchema.pre('save', async function(next) {
  if (this.isNew) {
    const ultima = await mongoose.model('OrdenCompra')
      .findOne({}, { numeroOrden: 1 }, { sort: { numeroOrden: -1 } });
    this.numeroOrden = (ultima?.numeroOrden ?? 0) + 1;
  }
  this.items = this.items.map(item => {
    item.subtotal = Number((Number(item.cantidad) * Number(item.precioUnitario || 0)).toFixed(2));
    return item;
  });
  this.total = Number(this.items.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));
  next();
});

module.exports = mongoose.model('OrdenCompra', OrdenCompraSchema);
