const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/orden-compra.controller');

// LISTAR ÓRDENES DE COMPRA
router.get('/', ordenCompraController.obtenerOrdenes);

// CREAR ORDEN DE COMPRA
router.post('/', ordenCompraController.crearOrden);

// MODIFICAR ORDEN DE COMPRA
router.put('/:id', ordenCompraController.actualizarOrden);

// ELIMINAR ORDEN DE COMPRA
router.delete('/:id', ordenCompraController.eliminarOrden);

// ACTUALIZAR ESTADO DE ORDEN
router.put('/:id/estado', ordenCompraController.actualizarEstado);

module.exports = router;