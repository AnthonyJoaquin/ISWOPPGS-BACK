const Cliente = require('../models/cliente.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const integraciones = require('../config/integraciones.config');

const secreto = () => process.env.JWT_SECRET || 'goldfish_cliente_dev_secret';
const googleClientId = () => integraciones.googleClientId;

function clientePublico(cliente) {
  return {
    id: cliente._id,
    nombres: cliente.nombres,
    apellidos: cliente.apellidos,
    correo: cliente.correo,
    celular: cliente.celular,
    proveedorAuth: cliente.proveedorAuth,
    foto: cliente.foto,
    direcciones: cliente.direcciones || []
  };
}
function tokenPara(cliente) {
  return jwt.sign({ id: cliente._id, correo: cliente.correo, rol: 'cliente' }, secreto(), { expiresIn: '8h' });
}
function responderSesion(res, cliente, mensaje) {
  res.json({ mensaje, token: tokenPara(cliente), cliente: clientePublico(cliente) });
}

exports.registrarCuenta = async (req, res) => {
  try {
    const { nombres, apellidos, correo, celular, password } = req.body;
    if (!nombres || !apellidos || !correo || !celular || !password) {
      return res.status(400).json({ mensaje: 'Completa todos los datos obligatorios.' });
    }
    if (String(password).length < 6) return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres.' });
    const normalizado = String(correo).trim().toLowerCase();
    if (await Cliente.findOne({ correo: normalizado })) return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    const cliente = await Cliente.create({
      nombres: String(nombres).trim(), apellidos: String(apellidos).trim(), correo: normalizado,
      celular: String(celular).trim(), passwordHash: await bcrypt.hash(password, 10), proveedorAuth: 'local'
    });
    responderSesion(res.status(201), cliente, 'Cuenta registrada en la base de datos correctamente.');
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible registrar al cliente.' });
  }
};

exports.iniciarSesionCliente = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const cliente = await Cliente.findOne({ correo: String(correo || '').trim().toLowerCase() }).select('+passwordHash');
    if (!cliente || !cliente.passwordHash || !(await bcrypt.compare(password || '', cliente.passwordHash))) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }
    responderSesion(res, cliente, 'Bienvenido a Goldfish.');
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible iniciar sesión.' });
  }
};

exports.iniciarSesionGoogle = async (req, res) => {
  try {
    const clientId = googleClientId();
    if (!clientId) return res.status(503).json({ mensaje: 'Configura GOOGLE_CLIENT_ID en el backend para activar Google.' });
    const credential = req.body.credential;
    if (!credential) return res.status(400).json({ mensaje: 'No se recibió credencial de Google.' });
    const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const perfil = await tokenInfoResponse.json();
    const correoVerificado = perfil.email_verified === 'true' || perfil.email_verified === true;
    if (!tokenInfoResponse.ok || perfil.aud !== clientId || !perfil.email || !correoVerificado) {
      return res.status(401).json({ mensaje: 'La cuenta Google no pudo ser validada.' });
    }
    let cliente = await Cliente.findOne({ correo: perfil.email.toLowerCase() });
    if (!cliente) {
      cliente = await Cliente.create({
        nombres: perfil.given_name || perfil.name || 'Cliente', apellidos: perfil.family_name || '',
        correo: perfil.email.toLowerCase(), proveedorAuth: 'google', googleSub: perfil.sub, foto: perfil.picture || ''
      });
    } else {
      cliente.proveedorAuth = cliente.proveedorAuth || 'google';
      cliente.googleSub = cliente.googleSub || perfil.sub;
      cliente.foto = cliente.foto || perfil.picture || '';
      await cliente.save();
    }
    responderSesion(res, cliente, 'Sesión iniciada con Google.');
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ mensaje: 'No fue posible validar la cuenta de Google.' });
  }
};

exports.recuperarAcceso = async (req, res) => {
  try {
    const { correo, passwordNueva } = req.body;
    if (!passwordNueva || passwordNueva.length < 6) return res.status(400).json({ mensaje: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
    const cliente = await Cliente.findOne({ correo: String(correo || '').trim().toLowerCase() }).select('+passwordHash');
    if (!cliente) return res.status(404).json({ mensaje: 'No se encontró una cuenta con ese correo.' });
    cliente.passwordHash = await bcrypt.hash(passwordNueva, 10);
    cliente.proveedorAuth = 'local';
    await cliente.save();
    res.json({ mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'No fue posible actualizar la contraseña.' });
  }
};

// Perfil y direcciones
exports.obtenerPerfil = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.clienteId);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    responderSesion(res, cliente, 'Perfil cargado correctamente.');
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible cargar el perfil.' });
  }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombres, apellidos, celular } = req.body;
    const cliente = await Cliente.findById(req.clienteId);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    if (nombres) cliente.nombres = String(nombres).trim();
    if (apellidos) cliente.apellidos = String(apellidos).trim();
    if (celular) cliente.celular = String(celular).trim();
    await cliente.save();
    res.json({ mensaje: 'Perfil actualizado correctamente.', cliente: clientePublico(cliente) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible actualizar el perfil.' });
  }
};

exports.agregarDireccion = async (req, res) => {
  try {
    const { alias, direccion, referencia, distrito, principal } = req.body;
    if (!alias || !direccion || !distrito) {
      return res.status(400).json({ mensaje: 'Completa alias, dirección y distrito.' });
    }
    const cliente = await Cliente.findById(req.clienteId);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    
    if (!cliente.direcciones) cliente.direcciones = [];
    
    // Si es principal, quitar el flag de las demás
    if (principal) {
      cliente.direcciones.forEach(d => d.principal = false);
    }
    
    cliente.direcciones.push({
      alias: String(alias).trim(),
      direccion: String(direccion).trim(),
      referencia: String(referencia || '').trim(),
      distrito: String(distrito).trim(),
      principal: Boolean(principal)
    });
    
    await cliente.save();
    res.status(201).json({ mensaje: 'Dirección agregada correctamente.', cliente: clientePublico(cliente) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible agregar la dirección.' });
  }
};

exports.marcarPrincipal = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.clienteId);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    
    const direccion = cliente.direcciones?.id(req.params.id);
    if (!direccion) return res.status(404).json({ mensaje: 'Dirección no encontrada.' });
    
    // Quitar principal de todas y marcar la seleccionada
    cliente.direcciones.forEach(d => d.principal = false);
    direccion.principal = true;
    
    await cliente.save();
    res.json({ mensaje: 'Dirección marcada como principal.', cliente: clientePublico(cliente) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible marcar la dirección.' });
  }
};

exports.eliminarDireccion = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.clienteId);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado.' });
    
    const direccion = cliente.direcciones?.id(req.params.id);
    if (!direccion) return res.status(404).json({ mensaje: 'Dirección no encontrada.' });
    
    direccion.deleteOne();
    await cliente.save();
    res.json({ mensaje: 'Dirección eliminada correctamente.', cliente: clientePublico(cliente) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No fue posible eliminar la dirección.' });
  }
};


// Métodos administrativos conservados para el módulo existente.
exports.listar = async (_req, res) => res.json(await Cliente.find().sort({ createdAt: -1 }));
exports.registrar = async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const cliente = await Cliente.create({ nombres: nombre || 'Cliente', nombre, telefono: req.body.telefono || '', direccion: req.body.direccion || '', celular: req.body.telefono || '' });
  res.status(201).json(cliente);
};
exports.actualizar = async (req, res) => res.json(await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.eliminar = async (req, res) => { await Cliente.findByIdAndDelete(req.params.id); res.json({ mensaje: 'Eliminado correctamente' }); };
