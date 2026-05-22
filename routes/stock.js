const express = require('express');
const router = express.Router();
const Stock = require('../models/stock.model');

/* =========================
   GET STOCK
   ========================= */
router.get('/', async (req, res) => {
  try {
    const stock = await Stock.find()
      .populate('insumoId', 'nombre marca');

    res.json(stock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener stock' });
  }
});

/* =========================
   PUT ACTUALIZAR STOCK
   ========================= */
router.put('/:id', async (req, res) => {
  try {
    const { stock, stockMinimo, unidadBase, unidad } = req.body;

    const actualizado = await Stock.findByIdAndUpdate(
      req.params.id,
      {
        stock: Number(stock) || 0,
        stockMinimo: Number(stockMinimo) || 0,
        // Acepta tanto unidadBase (nuevo) como unidad (compatibilidad)
        unidadBase: unidadBase || unidad || 'unidad',
      },
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ error: 'Stock no encontrado' });
    }

    res.json({
      message: 'Stock actualizado',
      data: actualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

module.exports = router;