const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// Crear un nuevo producto
router.post('/', productosController.create);

// Obtener todos los productos
router.get('/', productosController.findAll);

// Obtener un solo producto por su ID
router.get('/:id', productosController.findOne);

// Actualizar un producto
router.put('/:id', productosController.update);

// Eliminar un producto
router.delete('/:id', productosController.delete);

module.exports = router;