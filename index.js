// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const insumosRoutes = require('./routes/insumos');
const stockRoutes = require('./routes/stock');
const ventasRoutes = require('./routes/ventas');
const ordenCompraRoutes = require('./routes/ordenes-compra');
const platosRoutes = require('./routes/platos');
const dashboardRoutes = require('./routes/dashboard');
const estadoPedidoRoutes = require('./routes/estado-pedido.routes');
const comandasRoutes = require('./routes/comandas');

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 Auth
app.use('/api/auth', authRoutes);

// Dashboard
app.use('/api/dashboard', dashboardRoutes);

// 🧾 Insumos
// Versión con /api (por si la usas en otro lado)
app.use('/api/insumos', insumosRoutes);
// Versión "corta" que tu front está llamando: http://localhost:3000/insumos
app.use('/insumos', insumosRoutes);

// 📦 Stock
app.use('/api/stock', stockRoutes);
app.use('/get', stockRoutes);          // para /get/stock que ya usas en el front

// 💸 Ventas (rutas tipo /ventas, etc.)
app.use('/api/ventas', ventasRoutes);

// 📑 Órdenes de compra
// Si llamas a http://localhost:3000/api/ordenes-compra
app.use('/api/ordenes-compra', ordenCompraRoutes);
// Y también a http://localhost:3000/ordenes-compra (como sale en tu error)
app.use('/ordenes-compra', ordenCompraRoutes);

// 🍣 Platos (usado por /get/platos)
app.use('/get', platosRoutes);

// 🍣 Estado (usado por /get/estado-pedido)
app.use('/api/estado-pedidos', estadoPedidoRoutes);

// 📋 Comandas
app.use('/api/comandas', comandasRoutes);

// 🚀 MongoDB
mongoose.connect('mongodb://localhost:27017/goldfish')
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// 🚀 Servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
