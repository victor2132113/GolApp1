const express = require('express');
const router = express.Router();
const tipocanchasController = require('../controllers/tipocanchas.controller');

// Obtener todos los tipos de cancha
router.get('/', tipocanchasController.findAll); // ✅ Ruta corregida

// Crear un nuevo tipo de cancha
router.post('/', tipocanchasController.create);

// Obtener un solo tipo de cancha por su ID
router.get('/:id', tipocanchasController.findOne);

// Actualizar un tipo de cancha por su ID
router.put('/:id', tipocanchasController.update);

// Eliminar un tipo de cancha por su ID
router.delete('/:id', tipocanchasController.delete);

module.exports = router;