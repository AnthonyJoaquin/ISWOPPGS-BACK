const Stock = require('../models/stock.model');
const Insumo = require('../models/insumo.model');

/* =========================
   OBTENER STOCK
   ========================= */
exports.obtenerStock = async (req, res) => {
  try {
    const data = await Stock.find()
      .populate('insumoId', 'nombre')
      .sort({ updatedAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener stock', error });
  }
};

/* =========================
   ACTUALIZAR STOCK
   ========================= */
exports.actualizarStock = async (req, res) => {
  try {
    const { stock, stockMinimo, unidadBase, unidad } = req.body;

    const stockItem = await Stock.findById(req.params.id);

    if (!stockItem) {
      return res.status(404).json({ msg: 'Registro de stock no encontrado' });
    }

    stockItem.stock = Number(stock) || 0;
    stockItem.stockMinimo = Number(stockMinimo) || 0;
    // Acepta tanto unidadBase (nuevo) como unidad (compatibilidad)
    stockItem.unidadBase = unidadBase || unidad || 'unidad';

    await stockItem.save();

    const stockActualizado = await Stock.findById(stockItem._id)
      .populate('insumoId', 'nombre');

    res.json({
      msg: 'Stock actualizado correctamente',
      stock: stockActualizado,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar stock' });
  }
};