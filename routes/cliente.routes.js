const express = require('express');
const router = express.Router();
const clienteCtrl = require('../controllers/cliente.controller');
const clienteAuth = require('../middleware/clienteAuth.middleware');

// Cuenta cliente
router.post('/registro', clienteCtrl.registrarCuenta);
router.post('/login', clienteCtrl.iniciarSesionCliente);
router.post('/auth/google', clienteCtrl.iniciarSesionGoogle);
router.post('/recuperar-acceso', clienteCtrl.recuperarAcceso);

// Perfil y direcciones (requiere autenticación)
router.get('/perfil', clienteAuth, clienteCtrl.obtenerPerfil);
router.put('/perfil', clienteAuth, clienteCtrl.actualizarPerfil);
router.post('/direcciones', clienteAuth, clienteCtrl.agregarDireccion);
router.put('/direcciones/:id/principal', clienteAuth, clienteCtrl.marcarPrincipal);
router.delete('/direcciones/:id', clienteAuth, clienteCtrl.eliminarDireccion);

// Operaciones administrativas conservadas
router.get('/', clienteCtrl.listar);
router.post('/', clienteCtrl.registrar);
router.put('/:id', clienteCtrl.actualizar);
router.delete('/:id', clienteCtrl.eliminar);
module.exports = router;
