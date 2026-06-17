const Insumo = require('../models/insumo.model');
const Stock = require('../models/stock.model');

/* =========================
   OBTENER INSUMOS
   ========================= */
exports.obtenerInsumos = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const [insumos, total] = await Promise.all([
      Insumo.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Insumo.countDocuments()
    ]);
    // Compatibilidad con las pantallas actuales: sin parámetros retorna la lista.
    if (!req.query.page && !req.query.limit) return res.json(insumos);
    res.json({ insumos, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener insumos' });
  }
};

/* =========================
   CREAR INSUMO → crea Stock vinculado automáticamente
   ========================= */
exports.crearInsumo = async (req, res) => {
  try {
    const { nombre, marca, descripcion } = req.body;

    if (!nombre || !marca) {
      return res.status(400).json({ message: 'Nombre y marca son obligatorios' });
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
      console.log('✅ Stock creado para:', insumoGuardado.nombre);
    }

    res.status(201).json(insumoGuardado);
  } catch (error) {
    console.error('❌ Error creando insumo:', error);
    res.status(400).json({ message: 'Error al crear insumo' });
  }
};

/* =========================
   ACTUALIZAR INSUMO
   ========================= */
exports.actualizarInsumo = async (req, res) => {
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
      return res.status(404).json({ message: 'Insumo no encontrado' });
    }

    res.json(insumoActualizado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al actualizar insumo' });
  }
};
