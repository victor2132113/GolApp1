const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// Crear un nuevo producto
router.post('/productos', productosController.create);

// Obtener todos los productos
router.get('/productos', productosController.findAll);

// Obtener un solo producto por su ID
router.get('/productos/:id', productosController.findOne);

// Actualizar un producto
router.put('/productos/:id', productosController.update);

// Eliminar un producto
router.delete('/productos/:id', productosController.delete);

module.exports = router;