const express = require('express');
const router = express.Router();
const {
  listarEstadoPedidos,
  actualizarEstadoPedido,
} = require('../controllers/estado-pedido.controller');

router.get('/', listarEstadoPedidos);
router.put('/:id/estado', actualizarEstadoPedido);

module.exports = router;