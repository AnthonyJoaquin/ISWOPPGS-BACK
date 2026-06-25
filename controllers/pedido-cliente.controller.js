const PedidoCliente = require('../models/pedido-cliente.model');
const { descontarStockPorPlatos } = require('../services/inventario.service');
const emailService = require('../services/email.service');

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
    estados: Array.isArray(body.estados) && body.estados.length ? body.estados : ['Pedido configurado', 'Pendiente de pago', 'En preparación', 'Entregado'],
    estadoActual: Number.isInteger(body.estadoActual) ? body.estadoActual : 0
  };
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

    return res.status(201).json({
      mensaje: inventario.procesado
        ? 'Pedido registrado y stock descontado correctamente.'
        : 'Pedido registrado correctamente.',
      pedido,
      movimientosStock: inventario.movimientos
    });
  } catch (error) {
    console.error('Error registrando pedido cliente:', error);
    return res.status(400).json({ mensaje: error.message || 'No fue posible registrar el pedido.' });
  }
};

<<<<<<< Updated upstream
=======
exports.enviarComprobanteCorreo = async (req, res) => {
  try {
    const { correo, pdfBase64, nombreArchivo, comprobante } = req.body || {};

    const email = String(correo || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ mensaje: 'El correo electrónico no es válido.' });
    }

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return res.status(400).json({ mensaje: 'Debe adjuntar el PDF del comprobante en base64.' });
    }

    const envio = await emailService.enviarComprobanteCliente({
      correo: email,
      pdfBase64,
      nombreArchivo: String(nombreArchivo || '').trim() || undefined,
      comprobante: comprobante || {}
    });

    if (!envio.success) {
      return res.status(500).json({
        mensaje: 'No se pudo enviar el comprobante al correo indicado.',
        error: envio.error
      });
    }

    return res.status(200).json({
      mensaje: `Comprobante enviado correctamente a ${email}.`,
      messageId: envio.messageId
    });
  } catch (error) {
    console.error('Error enviando comprobante por correo:', error);
    return res.status(500).json({
      mensaje: 'Ocurrió un error al enviar el comprobante por correo.',
      error: error.message
    });
  }
};
>>>>>>> Stashed changes
