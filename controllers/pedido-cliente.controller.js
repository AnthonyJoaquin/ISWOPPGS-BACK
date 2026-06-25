const PedidoCliente = require('../models/pedido-cliente.model');
const Comanda = require('../models/comanda.model');
const { descontarStockPorPlatos } = require('../services/inventario.service');

function codigoNuevo() {
  return `GF-${Date.now().toString().slice(-6)}`;
}

function normalizarPedido(body, token) {
  return {
    codigo: String(body.codigo || codigoNuevo()).trim(),
    clienteId: token?.id || null,
    clienteCorreo: String(token?.correo || '').trim().toLowerCase(),
    fecha: body.fecha ? new Date(body.fecha) : new Date(),
    items: Array.isArray(body.items) ? body.items : [],
    entrega: body.entrega || {},
    subtotal: Number(body.subtotal || 0),
    descuento: Number(body.descuento || 0),
    codigoDescuento: String(body.codigoDescuento || ''),
    costoServicio: Number(body.costoServicio || 0),
    costoDelivery: Number(body.costoDelivery || 0),
    igvIncluido: Number(body.igvIncluido || 0),
    total: Number(body.total || 0),
    estados: Array.isArray(body.estados) && body.estados.length ? body.estados : ['Pendiente', 'En preparación', 'Listo para entrega', 'Entregado'],
    estadoActual: Number.isInteger(body.estadoActual) ? body.estadoActual : 0,
    estado: String(body.estado || 'Pendiente')
  };
}

async function notificarCocina(datos, pedido) {
  const cliente = datos.clienteCorreo || datos.entrega?.telefono || 'Cliente web';
  const observacion = [
    datos.entrega?.direccion ? `${datos.entrega.direccion}, ${datos.entrega.distrito || ''}`.trim() : '',
    datos.entrega?.referencia || ''
  ].filter(Boolean).join(' | ');

  return Comanda.findOneAndUpdate(
    { pedidoCodigo: pedido.codigo },
    {
      pedidoCodigo: pedido.codigo,
      cliente,
      tipoPedido: datos.entrega?.modalidad || 'delivery',
      mesa: '',
      items: datos.items.map(item => ({
        nombre: item.nombre,
        cantidad: Number(item.cantidad) || 1,
        estado: 'Pendiente'
      })),
      observacion,
      total: datos.total,
      recibido: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

exports.registrarPedido = async (req, res) => {
  try {
    const datos = normalizarPedido(req.body, req.clienteToken);
    if (!datos.items.length) return res.status(400).json({ mensaje: 'El pedido debe contener productos.' });
    if (!datos.entrega.modalidad) return res.status(400).json({ mensaje: 'Selecciona Delivery o Recojo.' });

    let pedido = await PedidoCliente.findOne({ codigo: datos.codigo });
    let inventario = { procesado: false, movimientos: [] };

    if (!pedido || !pedido.stockProcesado) {
      inventario = await descontarStockPorPlatos(datos.items, {
        motivo: `Salida por pedido web ${datos.codigo}`,
        tipo: 'pedido-cliente',
        id: pedido?._id || datos.codigo,
        usuario: datos.clienteCorreo || 'Cliente web'
      });
    }

    if (pedido) {
      Object.assign(pedido, datos);
      if (inventario.procesado) {
        pedido.stockProcesado = true;
        pedido.stockProcesadoAt = new Date();
      }
      await pedido.save();
    } else {
      pedido = await PedidoCliente.create({
        ...datos,
        stockProcesado: inventario.procesado,
        stockProcesadoAt: inventario.procesado ? new Date() : null
      });
    }

    const comanda = await notificarCocina(datos, pedido);

    return res.status(201).json({
      mensaje: inventario.procesado
        ? 'Pedido confirmado, stock descontado y orden enviada a cocina.'
        : 'Pedido confirmado y orden enviada a cocina.',
      pedido,
      comanda,
      movimientosStock: inventario.movimientos
    });
  } catch (error) {
    console.error('Error registrando pedido cliente:', error);
    return res.status(400).json({ mensaje: error.message || 'No fue posible registrar el pedido.' });
  }
};
