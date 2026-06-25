const express = require('express');
const router = express.Router();
const pedidos = require('../controllers/pedido-cliente.controller');
const autenticarClienteOpcional = require('../middleware/clienteAuthOpcional.middleware');

// CUS26: registra el pedido configurado y confirmado. Los módulos de pago, comprobante, historial y perfil quedan fuera del alcance actual.
router.post('/', autenticarClienteOpcional, pedidos.registrarPedido);
router.post('/comprobante/enviar', pedidos.enviarComprobanteCorreo);

module.exports = router;
