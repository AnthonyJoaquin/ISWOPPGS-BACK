const Plato = require('../models/plato.model');
const { normalizarUnidad } = require('../utils/unidades');

const POPULATE_INSUMO = 'nombre precio marca stock';

const convertirDecimal = (valor, defecto = 0) => {
  if (valor === null || valor === undefined || valor === '') {
    return defecto;
  }

  if (typeof valor === 'number') {
    return valor;
  }

  const limpio = String(valor).trim().replace(',', '.');
  const numero = Number(limpio);

  return Number.isNaN(numero) ? defecto : numero;
};

const normalizarIngredientes = (ingredientes) => {
  if (!Array.isArray(ingredientes)) {
    return [];
  }

  return ingredientes
    .filter((ing) => {
      const cantidad = convertirDecimal(ing?.cantidad, 0);
      return ing && ing.insumoId && cantidad > 0;
    })
    .map((ing) => ({
      insumoId: ing.insumoId,
      cantidad: convertirDecimal(ing.cantidad, 0.001),
      unidad: normalizarUnidad(ing.unidad || 'kg'),
    }));
};

const obtenerPlatos = async (req, res) => {
  try {
    const platos = await Plato.find()
      .populate('ingredientes.insumoId', POPULATE_INSUMO)
      .sort({ createdAt: -1 });

    res.json(platos);
  } catch (error) {
    console.error('Error al obtener platos:', error);
    res.status(500).json({
      mensaje: 'Error al obtener platos',
      detalle: error.message,
    });
  }
};

const obtenerPlatoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    let plato = null;

    // Intentar buscar por _id primero (ObjectId o id de texto)
    try {
      plato = await Plato.findById(id).populate(
        'ingredientes.insumoId',
        POPULATE_INSUMO
      );
    } catch (innerError) {
      if (innerError.name !== 'CastError') {
        throw innerError;
      }
    }

    if (!plato) {
      try {
        plato = await Plato.findOne({ _id: id }).populate(
          'ingredientes.insumoId',
          POPULATE_INSUMO
        );
      } catch (innerError) {
        if (innerError.name !== 'CastError') {
          throw innerError;
        }
      }
    }

    // Si no encontró por _id, buscar por nombre normalizado
    if (!plato) {
      const nombreNormalizado = id.toLowerCase().replace(/-/g, ' ');
      plato = await Plato.findOne({
        nombre: { $regex: `^${nombreNormalizado}$`, $options: 'i' }
      }).populate('ingredientes.insumoId', POPULATE_INSUMO);
    }

    if (!plato) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }

    res.json(plato);
  } catch (error) {
    console.error('Error al obtener plato:', error);
    res.status(500).json({
      mensaje: 'Error al obtener plato',
      detalle: error.message,
    });
  }
};

const crearPlato = async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      descripcion,
      precio,
      tiempoPrepMin,
      imagen,
      presentacion,
      cantidadServicio,
      unidadServicio,
      disponible,
      ingredientes,
    } = req.body;

    const nuevoPlato = new Plato({
      nombre,
      categoria,
      descripcion: descripcion || '',
      precio: convertirDecimal(precio, 0),
      tiempoPrepMin: convertirDecimal(tiempoPrepMin, 0),
      imagen: imagen || '',
      presentacion: presentacion || 'Orden',
      cantidadServicio: convertirDecimal(cantidadServicio, 10),
      unidadServicio: unidadServicio || 'piezas',
      disponible: disponible !== false,
      ingredientes: normalizarIngredientes(ingredientes),
    });

    const platoGuardado = await nuevoPlato.save();

    const platoCompleto = await Plato.findById(platoGuardado._id).populate(
      'ingredientes.insumoId',
      POPULATE_INSUMO
    );

    res.status(201).json(platoCompleto);
  } catch (error) {
    console.error('Error al crear plato:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        mensaje: 'Datos inválidos para crear el plato',
        detalle: error.message,
      });
    }

    res.status(500).json({
      mensaje: 'Error al crear plato',
      detalle: error.message,
    });
  }
};

const actualizarPlato = async (req, res) => {
  try {
    const {
      nombre,
      categoria,
      descripcion,
      precio,
      tiempoPrepMin,
      imagen,
      presentacion,
      cantidadServicio,
      unidadServicio,
      disponible,
      ingredientes,
    } = req.body;

    const platoActualizado = await Plato.findByIdAndUpdate(
      req.params.id,
      {
        nombre,
        categoria,
        descripcion: descripcion || '',
        precio: convertirDecimal(precio, 0),
        tiempoPrepMin: convertirDecimal(tiempoPrepMin, 0),
        imagen: imagen || '',
        presentacion: presentacion || 'Orden',
        cantidadServicio: convertirDecimal(cantidadServicio, 10),
        unidadServicio: unidadServicio || 'piezas',
        disponible: disponible !== false,
        ingredientes: normalizarIngredientes(ingredientes),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('ingredientes.insumoId', POPULATE_INSUMO);

    if (!platoActualizado) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }

    res.json(platoActualizado);
  } catch (error) {
    console.error('Error al actualizar plato:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        mensaje: 'Datos inválidos para actualizar el plato',
        detalle: error.message,
      });
    }

    res.status(500).json({
      mensaje: 'Error al actualizar plato',
      detalle: error.message,
    });
  }
};

const eliminarPlato = async (req, res) => {
  try {
    const platoEliminado = await Plato.findByIdAndDelete(req.params.id);

    if (!platoEliminado) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }

    res.json({ mensaje: 'Plato eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar plato:', error);
    res.status(500).json({
      mensaje: 'Error al eliminar plato',
      detalle: error.message,
    });
  }
};

module.exports = {
  obtenerPlatos,
  obtenerPlatoPorId,
  crearPlato,
  actualizarPlato,
  eliminarPlato,
};