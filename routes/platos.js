const express = require('express');
const router = express.Router();
const platoController = require('../controllers/plato.controller');

router.get('/platos', platoController.obtenerPlatos);
router.get('/platos/:id', platoController.obtenerPlatoPorId);
router.post('/platos', platoController.crearPlato);
router.put('/platos/:id', platoController.actualizarPlato);
router.delete('/platos/:id', platoController.eliminarPlato);

module.exports = router;