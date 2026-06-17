const Producto = require('../models/producto.model');

function normalizarProducto(body) {
  return {
    nombre: String(body.nombre || '').trim(),
    descripcion: String(body.descripcion || '').trim(),
    imagenUrl: String(body.imagenUrl || '').trim(),
    categoria: String(body.categoria || 'General').trim(),
    precio: Number(body.precio || 0),
    stock: Number(body.stock || 0),
    stockMinimo: Number(body.stockMinimo || 0),
    marca: String(body.marca || '').trim(),
    disponible: body.disponible !== false
  };
}

exports.obtenerProductos = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const filtro = {};
    if (req.query.buscar) filtro.nombre = { $regex: req.query.buscar, $options: 'i' };
    if (req.query.categoria) filtro.categoria = req.query.categoria;

    const [productos, total] = await Promise.all([
      Producto.find(filtro).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Producto.countDocuments(filtro)
    ]);
    // Mantiene compatibilidad: sin page/limit devuelve array como antes.
    if (!req.query.page && !req.query.limit) return res.json(productos);
    res.json({ productos, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (_error) {
    res.status(500).json({ message: 'Error al obtener productos.' });
  }
};

exports.obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json(producto);
  } catch (_error) {
    res.status(400).json({ message: 'ID de producto inválido.' });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    const data = normalizarProducto(req.body);
    if (!data.nombre || !data.marca) {
      return res.status(400).json({ message: 'Nombre y marca son obligatorios.' });
    }
    const producto = await Producto.create(data);
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al crear producto.' });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const data = normalizarProducto(req.body);
    const producto = await Producto.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error al actualizar producto.' });
  }
};

exports.actualizarStockMinimo = async (req, res) => {
  try {
    const stockMinimo = Number(req.body.stockMinimo);
    if (!Number.isFinite(stockMinimo) || stockMinimo < 0) {
      return res.status(400).json({ message: 'El stock mínimo debe ser un número mayor o igual a cero.' });
    }
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { stockMinimo },
      { new: true, runValidators: true }
    );
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json(producto);
  } catch (_error) {
    res.status(400).json({ message: 'Error al actualizar stock mínimo.' });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (_error) {
    res.status(400).json({ message: 'Error al eliminar producto.' });
  }
};
