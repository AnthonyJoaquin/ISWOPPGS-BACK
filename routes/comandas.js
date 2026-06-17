const express = require('express');
const router = express.Router();
const { listarComandas, crearComanda, marcarRecibido } = require('../controllers/comanda.controller');

router.get('/',           listarComandas);
router.post('/',          crearComanda);
router.put('/:id/recibido', marcarRecibido);

module.exports = router;
