const MovimientoStock = require('../models/movimiento-stock.model');

exports.listar = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const filtro = {};
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.insumoId) filtro.insumoId = req.query.insumoId;

    const [movimientos, total] = await Promise.all([
      MovimientoStock.find(filtro)
        .populate('insumoId', 'nombre marca')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MovimientoStock.countDocuments(filtro)
    ]);

    res.json({ movimientos, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (_error) {
    res.status(500).json({ message: 'Error al consultar movimientos de stock.' });
  }
};
