const jwt = require('jsonwebtoken');

module.exports = function autenticarCliente(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'goldfish_cliente_dev_secret');
    req.clienteToken = decoded;
    req.clienteId = decoded.id;
    next();
  } catch (_error) {
    res.status(401).json({ mensaje: 'Sesión vencida o inválida.' });
  }
};
