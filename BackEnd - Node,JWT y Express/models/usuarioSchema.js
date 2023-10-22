var mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: {
      type: String,
      required: true
    },
    correo: {
      type: String,
      required: true,
      unique: true
    },
    clave: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      required: true
    }
  });
  
  const Usuario = mongoose.model('Usuario', usuarioSchema);
  
  module.exports = Usuario;