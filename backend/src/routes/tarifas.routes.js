const express = require('express');
const router = express.Router();
const tarifasController = require('../controllers/tarifas.controller');

// POST /api/tarifas
router.post('/', tarifasController.create);

// GET /api/tarifas
router.get('/', tarifasController.findAll);

// GET /api/tarifas/:id
router.get('/:id', tarifasController.findOne);

// PUT /api/tarifas/:id
router.put('/:id', tarifasController.update);

// DELETE /api/tarifas/:id
router.delete('/:id', tarifasController.delete);

module.exports = router;