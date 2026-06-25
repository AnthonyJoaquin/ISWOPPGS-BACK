const mongoose = require('mongoose');

const ItemPedidoSchema = new mongoose.Schema({
  uid: { type: String, default: '' },
  id: { type: mongoose.Schema.Types.Mixed },
  nombre: { type: String, required: true, trim: true },
  categoria: { type: String, default: '', trim: true },
  precioBase: { type: Number, required: true, min: 0 },
  precioUnitario: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
  imagen: { type: String, default: '' },
  ingredientesRetirados: { type: [String], default: [] },
  extras: { type: [mongoose.Schema.Types.Mixed], default: [] },
  tieneAlergia: { type: Boolean, default: false },
  alergias: { type: [String], default: [] },
  otraAlergia: { type: String, default: '' },
  observacion: { type: String, default: '' }
}, { _id: false });

const PedidoClienteSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, trim: true },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
  clienteCorreo: { type: String, default: '', lowercase: true, trim: true },
  fecha: { type: Date, default: Date.now },
  items: { type: [ItemPedidoSchema], required: true, validate: value => value.length > 0 },
  entrega: { type: mongoose.Schema.Types.Mixed, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  descuento: { type: Number, default: 0, min: 0 },
  codigoDescuento: { type: String, default: '' },
  costoServicio: { type: Number, default: 0, min: 0 },
  costoDelivery: { type: Number, default: 0, min: 0 },
  igvIncluido: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  estados: { type: [String], default: [] },
  estadoActual: { type: Number, default: 0, min: 0 },
  estado: { type: String, enum: ['Pendiente', 'En preparación', 'Listo para entrega', 'Entregado', 'Cancelado'], default: 'Pendiente' },
  activo: { type: Boolean, default: true },
  stockProcesado: { type: Boolean, default: false },
  stockProcesadoAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('PedidoCliente', PedidoClienteSchema);
