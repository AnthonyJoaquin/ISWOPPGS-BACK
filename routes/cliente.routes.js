const express = require('express');
const router = express.Router();
const clienteCtrl = require('../controllers/cliente.controller');

router.get('/', clienteCtrl.listar);
router.post('/', clienteCtrl.registrar);
router.put('/:id', clienteCtrl.actualizar);
router.delete('/:id', clienteCtrl.eliminar);

module.exports = router;