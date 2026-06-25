// index.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
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
const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/cliente.routes');
const pedidosClienteRoutes = require('./routes/pedido-cliente.routes');
const proveedoresRoutes = require('./routes/proveedores');
const movimientosStockRoutes = require('./routes/movimientos-stock');
const securityTokenRoutes = require('./routes/security-token');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Security-Token']
}));
app.use(express.json());

// 🔐 Auth
app.use('/api/auth', authRoutes);

// 🔒 Security Tokens (códigos de seguridad por email)
app.use('/api/security-token', securityTokenRoutes);

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

// 🍣 Platos: administración y carta pública consumen la misma colección MongoDB
app.use('/get', platosRoutes);
app.use('/api', platosRoutes);

// 🍣 Estado (usado por /get/estado-pedido)
app.use('/api/estado-pedidos', estadoPedidoRoutes);

// 📋 Comandas
app.use('/api/comandas', comandasRoutes);

// 🧺 Productos / ingredientes administrativos
app.use('/api/productos', productosRoutes);

// 👥 Clientes registrados desde administración
app.use('/api/clientes', clientesRoutes);

// 🛍️ Pedidos web del cliente: configuración y confirmación (CUS26)
app.use('/api/pedidos-cliente', pedidosClienteRoutes);

// 🚚 Proveedores dinámicos y auditoría de inventario
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/movimientos-stock', movimientosStockRoutes);

// 🚀 MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goldfish')
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// 🚀 Servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
