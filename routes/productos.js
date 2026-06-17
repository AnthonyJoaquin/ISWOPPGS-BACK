const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');

router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProducto);
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.patch('/:id/stock-minimo', productoController.actualizarStockMinimo);
router.delete('/:id', productoController.eliminarProducto);

module.exports = router;
