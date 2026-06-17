const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'goldfish_super_secret_key';

// =========================
// REGISTRAR USUARIO
// =========================
exports.registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // 🔴 VALIDACIÓN BÁSICA
    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
    }

    // 🔍 VERIFICAR SI YA EXISTE
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ msg: 'El correo ya está registrado' });
    }

    // 🔐 ENCRIPTAR PASSWORD
    const hash = await bcrypt.hash(password, 10);

    // 🧠 NORMALIZAR ROL
    const rolFinal = rol === 'admin' ? 'admin' : 'cliente';

    // 👤 CREAR USUARIO
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hash,
      rol: rolFinal
    });

    await nuevoUsuario.save();

    res.json({
      msg: 'Usuario registrado correctamente',
      usuario: {
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (err) {
    console.error(err); // 🔥 IMPORTANTE para debug
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔴 VALIDACIÓN
    if (!email || !password) {
      return res.status(400).json({ msg: 'Ingrese email y contraseña' });
    }

    // 🔍 BUSCAR USUARIO
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // 🔐 VALIDAR PASSWORD
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      return res.status(401).json({ msg: 'Contraseña incorrecta' });
    }

    // 🎟️ TOKEN
    const token = jwt.sign(
      {
        id: usuario._id,
        email: usuario.email,
        rol: usuario.rol
      },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    // ✅ RESPUESTA (CLAVE PARA TU FRONTEND)
    res.json({
      msg: 'Login exitoso',
      token,
      usuario: {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};