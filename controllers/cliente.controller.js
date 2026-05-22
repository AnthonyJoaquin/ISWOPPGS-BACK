const Cliente = require('../models/cliente.model');

// GET todos
exports.listar = async (req, res) => {
    const clientes = await Cliente.find();
    res.json(clientes);
};

// POST registrar
exports.registrar = async (req, res) => {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.json(cliente);
};

// PUT actualizar
exports.actualizar = async (req, res) => {
    const cliente = await Cliente.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(cliente);
};

// DELETE eliminar
exports.eliminar = async (req, res) => {
    await Cliente.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Eliminado correctamente" });
};