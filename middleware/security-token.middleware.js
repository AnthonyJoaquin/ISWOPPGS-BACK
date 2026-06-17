const SecurityToken = require('../models/security-token.model');

/**
 * Middleware para verificar que la operación tiene un token de seguridad válido
 * Debe usarse en rutas que requieren verificación por email
 */
async function verificarTokenSeguridad(accionRequerida) {
  return async (req, res, next) => {
    try {
      const tokenProporcionado = req.headers['x-security-token'] || req.body.securityToken;

      if (!tokenProporcionado) {
        return res.status(403).json({
          message: 'Se requiere código de seguridad para esta operación.',
          requiereToken: true,
          accion: accionRequerida
        });
      }

      // Buscar el token
      const securityToken = await SecurityToken.findOne({
        token: tokenProporcionado.toString(),
        accion: accionRequerida,
        usado: false
      });

      if (!securityToken) {
        return res.status(403).json({
          message: 'Código de seguridad inválido o ya fue utilizado.',
          valido: false
        });
      }

      // Verificar si expiró
      if (new Date() > securityToken.expiraEn) {
        return res.status(403).json({
          message: 'El código de seguridad ha expirado. Solicita uno nuevo.',
          valido: false,
          expirado: true
        });
      }

      // Marcar como usado
      securityToken.usado = true;
      securityToken.usadoEn = new Date();
      await securityToken.save();

      // Agregar información del token a la request
      req.securityToken = {
        id: securityToken._id,
        datos: securityToken.datos,
        email: securityToken.email
      };

      next();

    } catch (error) {
      console.error('Error en middleware de seguridad:', error);
      res.status(500).json({
        message: 'Error al verificar código de seguridad.',
        error: error.message
      });
    }
  };
}

module.exports = { verificarTokenSeguridad };
