const Proveedor = require('../models/proveedor.model');

exports.listar = async (_req, res) => {
  try {
    const proveedores = await Proveedor.find({ activo: true }).sort({ nombre: 1 });
    res.json(proveedores);
  } catch (_error) {
    res.status(500).json({ message: 'Error al consultar proveedores.' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, ruc, telefono, email, direccion } = req.body;
    if (!nombre?.trim() || !ruc?.trim() || !telefono?.trim()) {
      return res.status(400).json({ message: 'Nombre, RUC y teléfono son obligatorios.' });
    }
    const proveedor = await Proveedor.create({
      nombre: nombre.trim(),
      ruc: ruc.trim(),
      telefono: telefono.replace(/\D/g, ''),
      email: email?.trim() || '',
      direccion: direccion?.trim() || ''
    });
    res.status(201).json(proveedor);
  } catch (error) {
    const message = error.code === 11000 ? 'Ya existe un proveedor con ese RUC.' : 'Error al registrar proveedor.';
    res.status(400).json({ message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const actualizado = await Proveedor.findByIdAndUpdate(req.params.id, {
      nombre: req.body.nombre?.trim(),
      ruc: req.body.ruc?.trim(),
      telefono: String(req.body.telefono || '').replace(/\D/g, ''),
      email: req.body.email?.trim() || '',
      direccion: req.body.direccion?.trim() || ''
    }, { new: true, runValidators: true });
    if (!actualizado) return res.status(404).json({ message: 'Proveedor no encontrado.' });
    res.json(actualizado);
  } catch (_error) {
    res.status(400).json({ message: 'Error al actualizar proveedor.' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, { activo: false }, { new: true });
    if (!proveedor) return res.status(404).json({ message: 'Proveedor no encontrado.' });
    res.json({ message: 'Proveedor desactivado correctamente.' });
  } catch (_error) {
    res.status(400).json({ message: 'Error al desactivar proveedor.' });
  }
};
