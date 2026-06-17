const mongoose = require('mongoose');
const { normalizarUnidad } = require('../utils/unidades');

const ingredienteSchema = new mongoose.Schema(
  {
    insumoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Insumo',
      required: [true, 'El insumo es obligatorio.'],
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad del insumo es obligatoria.'],
      min: [0.001, 'La cantidad debe ser mayor a 0.'],
      default: 0.001,
    },
    unidad: {
      type: String,
      trim: true,
      enum: ['kg', 'g', 'l', 'ml', 'unidad'],
      set: normalizarUnidad,
      default: 'kg',
    },
  },
  { _id: false }
);

const platoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del plato es obligatorio.'],
      trim: true,
    },
    categoria: {
      type: String,
      required: [true, 'La categoría del plato es obligatoria.'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [220, 'La descripción no debe superar los 220 caracteres.'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio del plato es obligatorio.'],
      min: [0, 'El precio no puede ser negativo.'],
    },
    tiempoPrepMin: {
      type: Number,
      default: 0,
      min: [0, 'El tiempo de preparación no puede ser negativo.'],
    },
    imagen: {
      type: String,
      default: '',
    },
    presentacion: {
      type: String,
      trim: true,
      default: 'Orden',
    },
    cantidadServicio: {
      type: Number,
      default: 10,
      min: [0, 'La cantidad servida no puede ser negativa.'],
    },
    unidadServicio: {
      type: String,
      trim: true,
      default: 'piezas',
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    ingredientes: {
      type: [ingredienteSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Plato', platoSchema);