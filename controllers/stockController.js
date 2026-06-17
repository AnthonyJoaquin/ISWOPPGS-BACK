const Stock = require('../models/stock.model');
const MovimientoStock = require('../models/movimiento-stock.model');
const SecurityToken = require('../models/security-token.model');
const { normalizarUnidad } = require('../utils/unidades');

exports.obtenerStock = async (_req, res) => {
  try {
    const data = await Stock.find()
      .populate('insumoId', 'nombre marca descripcion')
      .sort({ updatedAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener stock.', error: error.message });
  }
};

exports.obtenerAlertas = async (_req, res) => {
  try {
    const alertas = await Stock.find({ $expr: { $lte: ['$stock', '$stockMinimo'] } })
      .populate('insumoId', 'nombre marca')
      .sort({ stock: 1 });
    res.json({ alertas, total: alertas.length });
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar alertas de stock.', error: error.message });
  }
};

exports.actualizarStock = async (req, res) => {
  try {
    const stockItem = await Stock.findById(req.params.id).populate('insumoId', 'nombre');
    if (!stockItem) return res.status(404).json({ message: 'Registro de stock no encontrado.' });

    const stockAnterior = Number(stockItem.stock);
    const nuevoStock = Number(req.body.stock);
    const stockMinimo = Number(req.body.stockMinimo);
    if (!Number.isFinite(nuevoStock) || nuevoStock < 0 || !Number.isFinite(stockMinimo) || stockMinimo < 0) {
      return res.status(400).json({ message: 'Stock y stock mínimo deben ser valores válidos.' });
    }

    stockItem.stock = nuevoStock;
    stockItem.stockMinimo = stockMinimo;
    stockItem.unidadBase = normalizarUnidad(req.body.unidadBase || req.body.unidad || stockItem.unidadBase);
    if (req.body.unidadCompra) stockItem.unidadCompra = normalizarUnidad(req.body.unidadCompra);
    if (req.body.cantidadPorUnidadCompra) stockItem.cantidadPorUnidadCompra = Number(req.body.cantidadPorUnidadCompra);
    if (req.body.almacen) stockItem.almacen = String(req.body.almacen).trim();
    await stockItem.save();

    if (stockAnterior !== nuevoStock) {
      await MovimientoStock.create({
        insumoId: stockItem.insumoId._id || stockItem.insumoId,
        tipo: 'ajuste',
        cantidad: Math.abs(nuevoStock - stockAnterior),
        unidadBase: stockItem.unidadBase,
        motivo: String(req.body.motivo || 'Ajuste manual desde inventario'),
        referenciaTipo: 'ajuste-manual',
        stockAnterior,
        stockResultante: nuevoStock,
        usuario: String(req.body.usuario || 'Administrador')
      });
    }

    res.json({ message: 'Stock actualizado correctamente.', data: stockItem });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al actualizar stock.' });
  }
};

// Actualizar múltiples ítems de stock con un solo token de seguridad
exports.actualizarStockBatch = async (req, res) => {
  try {
    const { items, token } = req.body;

    if (!token) {
      return res.status(403).json({
        message: 'Se requiere código de seguridad para esta operación.',
        requiereToken: true
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos un ítem para actualizar.' });
    }

    // Verificar el token UNA sola vez
    const securityToken = await SecurityToken.findOne({
      token: token.toString(),
      accion: 'modificar-stock',
      usado: false
    });

    if (!securityToken) {
      return res.status(403).json({ message: 'Código de seguridad inválido o ya fue utilizado.' });
    }

    if (new Date() > securityToken.expiraEn) {
      return res.status(403).json({ message: 'El código de seguridad ha expirado. Solicita uno nuevo.' });
    }

    // Marcar token como usado
    securityToken.usado = true;
    securityToken.usadoEn = new Date();
    await securityToken.save();

    // Actualizar todos los ítems
    const resultados = [];
    const errores = [];

    for (const item of items) {
      try {
        const stockItem = await Stock.findById(item._id).populate('insumoId', 'nombre');
        if (!stockItem) {
          errores.push({ id: item._id, error: 'No encontrado' });
          continue;
        }

        const stockAnterior = Number(stockItem.stock);
        const nuevoStock = Number(item.stock);
        const nuevoMinimo = Number(item.stockMinimo);

        if (!Number.isFinite(nuevoStock) || nuevoStock < 0 || !Number.isFinite(nuevoMinimo) || nuevoMinimo < 0) {
          errores.push({ id: item._id, error: 'Valores inválidos' });
          continue;
        }

        stockItem.stock = nuevoStock;
        stockItem.stockMinimo = nuevoMinimo;
        stockItem.unidadBase = normalizarUnidad(item.unidadBase || stockItem.unidadBase);
        await stockItem.save();

        if (stockAnterior !== nuevoStock) {
          await MovimientoStock.create({
            insumoId: stockItem.insumoId._id || stockItem.insumoId,
            tipo: 'ajuste',
            cantidad: Math.abs(nuevoStock - stockAnterior),
            unidadBase: stockItem.unidadBase,
            motivo: 'Ajuste manual desde inventario',
            referenciaTipo: 'ajuste-manual',
            stockAnterior,
            stockResultante: nuevoStock,
            usuario: 'Administrador'
          });
        }

        resultados.push({ id: item._id, ok: true });
      } catch (e) {
        errores.push({ id: item._id, error: e.message });
      }
    }

    res.json({
      message: `${resultados.length} ítem(s) actualizado(s) correctamente.`,
      actualizados: resultados.length,
      errores: errores.length,
      detalleErrores: errores
    });

  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al actualizar stock en batch.' });
  }
};
