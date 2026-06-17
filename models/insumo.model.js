const mongoose = require("mongoose");

const InsumoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    marca: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      default: '',
      trim: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Insumo", InsumoSchema);