const SecurityToken = require('../models/security-token.model');
const emailService = require('../services/email.service');
const crypto = require('crypto');

// Generar código de 6 dígitos
function generarCodigoSeguridad() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Solicitar código de seguridad
exports.solicitarCodigo = async (req, res) => {
  try {
    const { accion, datos } = req.body;
    const email = process.env.ADMIN_SECURITY_EMAIL || 'galvananthony967@gmail.com';

    // Validar acción
    const accionesPermitidas = ['modificar-stock', 'eliminar-stock', 'ajuste-masivo'];
    if (!accionesPermitidas.includes(accion)) {
      return res.status(400).json({ 
        message: 'Acción no válida.',
        accionesPermitidas 
      });
    }

    // Generar token único
    const token = generarCodigoSeguridad();
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Obtener IP del cliente
    const ipOrigen = req.ip || req.connection.remoteAddress;

    // Crear registro del token
    const securityToken = await SecurityToken.create({
      token,
      email,
      accion,
      datos: datos || {},
      expiraEn,
      ipOrigen
    });

    // Enviar email
    const emailResult = await emailService.enviarCodigoSeguridad(
      email,
      token,
      accion,
      datos
    );

    if (!emailResult.success) {
      // Si falla el envío de email, eliminamos el token
      await SecurityToken.findByIdAndDelete(securityToken._id);
      return res.status(500).json({ 
        message: 'Error al enviar el código de seguridad. Verifica la configuración de email.',
        error: emailResult.error 
      });
    }

    res.json({ 
      message: `Código de seguridad enviado a ${email.replace(/(.{3})(.*)(@.*)/, '$1***$3')}`,
      tokenId: securityToken._id,
      expiraEn,
      emailEnviado: true
    });

  } catch (error) {
    console.error('Error al solicitar código:', error);
    res.status(500).json({ 
      message: 'Error al generar código de seguridad.',
      error: error.message 
    });
  }
};

// Verificar código de seguridad
exports.verificarCodigo = async (req, res) => {
  try {
    const { token, accion } = req.body;

    if (!token || !accion) {
      return res.status(400).json({ 
        message: 'Token y acción son requeridos.' 
      });
    }

    // Buscar el token
    const securityToken = await SecurityToken.findOne({
      token: token.toString(),
      accion,
      usado: false
    });

    if (!securityToken) {
      return res.status(404).json({ 
        message: 'Código inválido o ya fue utilizado.',
        valido: false
      });
    }

    // Verificar si expiró
    if (new Date() > securityToken.expiraEn) {
      return res.status(400).json({ 
        message: 'El código ha expirado. Solicita uno nuevo.',
        valido: false,
        expirado: true
      });
    }

    // Marcar como usado
    securityToken.usado = true;
    securityToken.usadoEn = new Date();
    await securityToken.save();

    res.json({ 
      message: 'Código verificado correctamente.',
      valido: true,
      tokenId: securityToken._id,
      datos: securityToken.datos
    });

  } catch (error) {
    console.error('Error al verificar código:', error);
    res.status(500).json({ 
      message: 'Error al verificar código de seguridad.',
      error: error.message 
    });
  }
};

// Obtener historial de tokens (solo para admin)
exports.obtenerHistorial = async (req, res) => {
  try {
    const { limite = 50, accion } = req.query;
    
    const filtro = {};
    if (accion) filtro.accion = accion;

    const historial = await SecurityToken.find(filtro)
      .sort({ creadoEn: -1 })
      .limit(parseInt(limite))
      .select('-__v');

    res.json({ 
      historial,
      total: historial.length 
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      message: 'Error al obtener historial de tokens.',
      error: error.message 
    });
  }
};

// Limpiar tokens expirados manualmente (opcional, el índice TTL lo hace automáticamente)
exports.limpiarTokensExpirados = async (_req, res) => {
  try {
    const resultado = await SecurityToken.deleteMany({
      expiraEn: { $lt: new Date() }
    });

    res.json({ 
      message: 'Tokens expirados eliminados.',
      cantidad: resultado.deletedCount 
    });

  } catch (error) {
    console.error('Error al limpiar tokens:', error);
    res.status(500).json({ 
      message: 'Error al limpiar tokens expirados.',
      error: error.message 
    });
  }
};
