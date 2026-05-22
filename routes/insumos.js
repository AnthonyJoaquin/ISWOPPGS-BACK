// routes/insumos.js
const express = require('express');
const router = express.Router();

const Insumo = require('../models/insumo.model');
const Stock = require('../models/stock.model');

/* =========================
   GET insumos
   ========================= */
async function listarInsumos(req, res) {
  try {
    const insumos = await Insumo.find().sort({ createdAt: -1 });
    res.json(insumos);
  } catch (error) {
    console.error('Error al obtener insumos:', error);
    res.status(500).json({ error: 'Error al obtener insumos' });
  }
}

router.get('/', listarInsumos);
router.get('/insumos', listarInsumos);

/* =========================
   POST insumo → crea Stock vinculado automáticamente
   ========================= */
async function crearInsumo(req, res) {
  try {
    const { nombre, marca, descripcion } = req.body;

    if (!nombre || !marca) {
      return res.status(400).json({ error: 'Nombre y marca son obligatorios' });
    }

    const nuevoInsumo = new Insumo({
      nombre: nombre.trim(),
      marca: marca.trim(),
      descripcion: descripcion?.trim() || '',
    });

    const insumoGuardado = await nuevoInsumo.save();

    // Crear registro en Stock vinculado (evitar duplicados)
    const existeStock = await Stock.findOne({ insumoId: insumoGuardado._id });
    if (!existeStock) {
      await Stock.create({
        insumoId: insumoGuardado._id,
        stock: 0,
        stockMinimo: 0,
        unidadBase: 'unidad',
        unidadCompra: 'unidad',
        cantidadPorUnidadCompra: 1,
        almacen: 'Almacén Principal',
      });
      console.log('✅ STOCK CREADO PARA:', insumoGuardado.nombre);
    }

    res.status(201).json({
      mensaje: 'Insumo registrado',
      insumo: insumoGuardado,
    });
  } catch (error) {
    console.error('Error al registrar insumo:', error);
    res.status(500).json({ error: 'Error al registrar insumo' });
  }
}

router.post('/', crearInsumo);
router.post('/insumos', crearInsumo);

/* =========================
   PUT insumo
   ========================= */
async function actualizarInsumo(req, res) {
  try {
    const { nombre, marca, descripcion } = req.body;

    const insumoActualizado = await Insumo.findByIdAndUpdate(
      req.params.id,
      {
        nombre: nombre?.trim(),
        marca: marca?.trim(),
        descripcion: descripcion?.trim() || '',
      },
      { new: true, runValidators: true }
    );

    if (!insumoActualizado) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    res.json({
      mensaje: 'Insumo actualizado',
      insumo: insumoActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar insumo:', error);
    res.status(500).json({ error: 'Error al actualizar insumo' });
  }
}

router.put('/:id', actualizarInsumo);
router.put('/insumos/:id', actualizarInsumo);

/* =========================
   DELETE insumo + Stock vinculado
   ========================= */
async function eliminarInsumo(req, res) {
  try {
    const insumoEliminado = await Insumo.findByIdAndDelete(req.params.id);

    if (!insumoEliminado) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    // Eliminar stock relacionado
    await Stock.findOneAndDelete({ insumoId: insumoEliminado._id });

    res.json({ mensaje: 'Insumo y stock eliminados correctamente' });
  } catch (error) {
    console.error('Error al eliminar insumo:', error);
    res.status(500).json({ error: 'Error al eliminar insumo' });
  }
}

router.delete('/:id', eliminarInsumo);
router.delete('/insumos/:id', eliminarInsumo);

module.exports = router;
