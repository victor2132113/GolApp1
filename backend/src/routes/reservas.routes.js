const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservas.controller');

// POST /api/reservas
router.post('/', reservasController.create);

// GET /api/reservas
router.get('/', reservasController.findAll);

// GET /api/reservas/hoy - Obtener reservas de hoy
router.get('/hoy', reservasController.getReservationsToday);

// GET /api/reservas/ingresos-mensuales - Obtener ingresos mensuales
router.get('/ingresos-mensuales', reservasController.getMonthlyRevenue);

// GET /api/reservas/ocupacion-promedio - Obtener ocupación promedio
router.get('/ocupacion-promedio', reservasController.getAverageOccupancy);

// GET /api/reservas/horarios-ocupados - Obtener horarios ocupados por cancha y fecha
router.get('/horarios-ocupados', reservasController.getOccupiedTimes);

// GET /api/reservas/:id/implementos - Obtener implementos prestados por reserva
router.get('/:id/implementos', reservasController.getImplementosByReserva);

// GET /api/reservas/usuario/:id - Obtener reservas por usuario
router.get('/usuario/:id', reservasController.findByUser);

// GET /api/reservas/:id - DEBE IR AL FINAL para evitar conflictos
router.get('/:id', reservasController.findOne);

// PUT /api/reservas/:id
router.put('/:id', reservasController.update);

// DELETE /api/reservas/:id
router.delete('/:id', reservasController.delete);

module.exports = router;