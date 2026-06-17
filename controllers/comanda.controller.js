const Comanda = require('../models/comanda.model');

// GET /api/comandas — todas (incluyendo recibidas, para historial)
exports.listarComandas = async (_req, res) => {
  try {
    const comandas = await Comanda.find().sort({ createdAt: -1 });
    res.json(comandas);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar comandas', error: error.message });
  }
};

// POST /api/comandas — crear nueva comanda
exports.crearComanda = async (req, res) => {
  try {
    const { cliente, tipoPedido, mesa, items } = req.body;

    if (!cliente || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cliente e items son obligatorios.' });
    }

    const nueva = new Comanda({
      cliente,
      tipoPedido: tipoPedido || 'salon',
      mesa: mesa || '',
      items: items.map(i => ({
        nombre:   i.nombre,
        cantidad: Number(i.cantidad) || 1,
        estado:   'Pendiente',
      })),
      recibido: false,
    });

    const guardada = await nueva.save();
    res.status(201).json(guardada);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear comanda', error: error.message });
  }
};

// PUT /api/comandas/:id/recibido — marcar como recibido (solo en BD, no borra)
exports.marcarRecibido = async (req, res) => {
  try {
    const { id } = req.params;

    const actualizada = await Comanda.findByIdAndUpdate(
      id,
      {
        recibido: true,
        'items.$[].estado': 'Recibido',
      },
      { new: true }
    );

    if (!actualizada) {
      return res.status(404).json({ message: 'Comanda no encontrada.' });
    }

    res.json({ message: 'Comanda marcada como recibida.', comanda: actualizada });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar comanda', error: error.message });
  }
};
