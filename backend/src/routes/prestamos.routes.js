const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamos.controller');

// Crear un nuevo préstamo
router.post('/', prestamosController.create);

// Obtener todos los préstamos
router.get('/', prestamosController.findAll);

// Obtener un solo préstamo por su ID
router.get('/:id', prestamosController.findOne);

// Actualizar un préstamo
router.put('/:id', prestamosController.update);

// Eliminar un préstamo
router.delete('/:id', prestamosController.delete);

module.exports = router;