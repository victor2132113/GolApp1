const express = require('express');
const router = express.Router();
const prestamosController = require('../controllers/prestamos.controller');

// Crear un nuevo préstamo
router.post('/', prestamosController.create);

// Obtener todos los préstamos
router.get('/', prestamosController.findAll);

// Obtener estadísticas de préstamos
router.get('/stats', prestamosController.getStats);

// Obtener préstamos por estado
router.get('/estado/:estado', prestamosController.findByStatus);

// Marcar préstamos vencidos automáticamente
router.post('/mark-overdue', prestamosController.markOverdue);

// Obtener un solo préstamo por su ID
router.get('/:id', prestamosController.findOne);

// Actualizar un préstamo
router.put('/:id', prestamosController.update);

// Cambiar estado de un préstamo
router.patch('/:id/estado', prestamosController.changeStatus);

// Eliminar un préstamo
router.delete('/:id', prestamosController.delete);

module.exports = router;