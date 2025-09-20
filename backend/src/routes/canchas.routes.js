const express = require('express');
const router = express.Router();
const canchasController = require('../controllers/canchas.controller');

// GET /api/canchas
router.get('/', canchasController.findAll);

// POST /api/canchas
router.post('/', canchasController.create);

// PUT /api/canchas/:id
router.put('/:id', canchasController.update);

// DELETE /api/canchas/:id
router.delete('/:id', canchasController.delete);

module.exports = router;