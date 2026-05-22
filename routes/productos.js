// routes/productos.js
const express = require('express');
const router = express.Router();
const Producto = require('../models/producto.model');
const Stock = require('../models/stock.model');

// Handler reutilizable para listar
async function listarProductos(req, res) {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

/* =========================
   GET productos
   ========================= */
// Si el router está montado en '/', responderá en:
//   GET /           y  GET /productos
router.get('/', listarProductos);
router.get('/productos', listarProductos);

/* =========================
   POST productos
   ========================= */
// Soporta POST /  y POST /productos
async function crearProducto(req, res) {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();

    const nuevoStock = new Stock({
      productoId: nuevoProducto._id,
      nombre: nuevoProducto.nombre,
      stock: nuevoProducto.stock,
      almacen: 'Almacén Principal',
    });

    await nuevoStock.save();

    res.json({
      mensaje: 'Producto registrado',
      producto: nuevoProducto,
      stock: nuevoStock,
    });
  } catch (error) {
    console.error('Error al registrar producto:', error);
    res.status(500).json({ error: 'Error al registrar producto' });
  }
}

router.post('/', crearProducto);
router.post('/productos', crearProducto);

/* =========================
   PUT productos
   ========================= */
// Soporta PUT /:id  y PUT /productos/:id
async function actualizarProducto(req, res) {
  try {
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await Stock.findOneAndUpdate(
      { productoId: req.params.id },
      {
        nombre: productoActualizado.nombre,
        stock: productoActualizado.stock,
        ultimaActualizacion: Date.now(),
      },
      { new: true }
    );

    res.json({
      mensaje: 'Producto actualizado y stock sincronizado',
      producto: productoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

router.put('/:id', actualizarProducto);
router.put('/productos/:id', actualizarProducto);

module.exports = router;
