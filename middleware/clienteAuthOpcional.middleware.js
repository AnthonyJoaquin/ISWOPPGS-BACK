const jwt = require('jsonwebtoken');

/**
 * Permite registrar un pedido como invitado, pero identifica al cliente
 * cuando envía un token válido para habilitar su historial personal.
 */
module.exports = function autenticarClienteOpcional(req, _res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return next();
  try {
    req.clienteToken = jwt.verify(token, process.env.JWT_SECRET || 'goldfish_cliente_dev_secret');
  } catch (_error) {
    req.clienteToken = null;
  }
  next();
};
