const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// Rutas para implementos deportivos

// GET /api/productos/stats - Obtener estadísticas de implementos (debe ir antes de /:id)
router.get('/stats', productosController.getStats);

// GET /api/productos - Obtener todos los implementos
router.get('/', productosController.findAll);

// GET /api/productos/:id - Obtener un implemento por ID
router.get('/:id', productosController.findOne);

// POST /api/productos - Crear un nuevo implemento
router.post('/', productosController.create);

// PUT /api/productos/:id - Actualizar un implemento
router.put('/:id', productosController.update);

// DELETE /api/productos/:id - Eliminar un implemento
router.delete('/:id', productosController.delete);

module.exports = router;