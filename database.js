const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/goldfish')
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Error al conectar MongoDB:', err));