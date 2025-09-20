const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamos.controller');

// Crear un nuevo préstamo
router.post('/prestamos', prestamosController.create);

// Obtener todos los préstamos
router.get('/prestamos', prestamosController.findAll);

// Obtener un solo préstamo por su ID
router.get('/prestamos/:id', prestamosController.findOne);

// Actualizar un préstamo
router.put('/prestamos/:id', prestamosController.update);

// Eliminar un préstamo
router.delete('/prestamos/:id', prestamosController.delete);

module.exports = router;