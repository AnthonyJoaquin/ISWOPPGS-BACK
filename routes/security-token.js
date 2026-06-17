const express = require('express');
const router = express.Router();
const controller = require('../controllers/security-token.controller');

// Solicitar código de seguridad
router.post('/solicitar', controller.solicitarCodigo);

// Verificar código de seguridad
router.post('/verificar', controller.verificarCodigo);

// Obtener historial de tokens (admin)
router.get('/historial', controller.obtenerHistorial);

// Limpiar tokens expirados manualmente
router.delete('/limpiar', controller.limpiarTokensExpirados);

module.exports = router;
