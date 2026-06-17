const EstadoPedido = require('../models/estado-pedido.model');

exports.listarEstadoPedidos = async (_req, res) => {
  try {
    const pedidos = await EstadoPedido.find().sort({ createdAt: -1 });
    return res.json(pedidos);
  } catch (error) {
    console.error('Error listando estados de pedido:', error);
    return res.status(500).json({
      message: 'Error al listar estados de pedido',
      error: error.message,
    });
  }
};

exports.actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ message: 'El estado es obligatorio.' });
    }

    if (!['Registrado', 'En preparación', 'Entregado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido.' });
    }

    const pedido = await EstadoPedido.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Si se marca entregado, NO se elimina de MongoDB — solo cambia estado
    // La vista lo filtra localmente para quitarlo de pantalla

    return res.json({
      message:
        estado === 'Entregado'
          ? 'Pedido marcado como entregado.'
          : 'Estado actualizado correctamente.',
      pedido,
    });
  } catch (error) {
    console.error('Error actualizando estado de pedido:', error);
    return res.status(500).json({
      message: 'Error al actualizar estado de pedido',
      error: error.message,
    });
  }
};