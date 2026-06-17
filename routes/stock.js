const express = require('express');
const router = express.Router();
const controller = require('../controllers/stockController');

router.get('/alertas', controller.obtenerAlertas);
router.get('/', controller.obtenerStock);
router.put('/:id', controller.actualizarStock);

// Endpoint batch: actualiza todos los ítems con un solo token de seguridad
router.post('/batch', controller.actualizarStockBatch);

module.exports = router;
