// routes/ventas.js
const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/venta.controller');

// BASE: /api/ventas
router.get('/', VentaController.listarVentas);
router.get('/:id', VentaController.obtenerVenta);
router.post('/', VentaController.crearVenta);
router.delete('/:id', VentaController.eliminarVenta);

module.exports = router;