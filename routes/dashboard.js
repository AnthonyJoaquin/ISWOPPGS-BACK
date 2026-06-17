const express = require('express');
const router = express.Router();
const {obtenerResumen,obtenerActividadReciente} = require('../controllers/dashboard.controller');

router.get('/resumen', obtenerResumen);
router.get('/actividad', obtenerActividadReciente);

module.exports = router;