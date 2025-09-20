const db = require('../../models');
const Tarifa = db.Tarifa;
const Cancha = db.Cancha;

// Crear una nueva tarifa
exports.create = async (req, res) => {
  try {
    const nuevaTarifa = await Tarifa.create(req.body);
    res.status(201).json(nuevaTarifa);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tarifa' });
  }
};

// Obtener todas las tarifas, incluyendo la cancha asociada
exports.findAll = async (req, res) => {
  try {
    const tarifas = await Tarifa.findAll({
      include: [{ model: Cancha, as: 'cancha' }]
    });
    res.status(200).json(tarifas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las tarifas' });
  }
};

// Obtener una tarifa por su ID
exports.findOne = async (req, res) => {
  try {
    const tarifa = await Tarifa.findByPk(req.params.id, {
      include: [{ model: Cancha, as: 'cancha' }]
    });
    if (!tarifa) {
      return res.status(404).json({ error: 'Tarifa no encontrada' });
    }
    res.status(200).json(tarifa);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarifa' });
  }
};

// Actualizar una tarifa
exports.update = async (req, res) => {
  try {
    const [updated] = await Tarifa.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedTarifa = await Tarifa.findByPk(req.params.id);
      return res.status(200).json(updatedTarifa);
    }
    throw new Error('Tarifa no encontrada');
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la tarifa' });
  }
};

// Eliminar una tarifa
exports.delete = async (req, res) => {
  try {
    const deleted = await Tarifa.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.status(204).json({ message: 'Tarifa eliminada' });
    }
    throw new Error('Tarifa no encontrada');
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarifa' });
  }
};