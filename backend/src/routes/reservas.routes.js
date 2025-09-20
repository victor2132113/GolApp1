const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservas.controller');

// POST /api/reservas
router.post('/', reservasController.create);

// GET /api/reservas
router.get('/', reservasController.findAll);

// GET /api/reservas/:id
router.get('/:id', reservasController.findOne);

// PUT /api/reservas/:id
router.put('/:id', reservasController.update);

// DELETE /api/reservas/:id
router.delete('/:id', reservasController.delete);

module.exports = router;