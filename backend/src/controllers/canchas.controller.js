// backend/src/controllers/canchas.controller.js

// Importa los modelos de Sequelize
const db = require('../../models');
const Cancha = db.Cancha;
const TipoCancha = db.TipoCancha;

// Lógica para crear una nueva cancha
exports.create = async (req, res) => {
  try {
    const nuevaCancha = await Cancha.create({
      nombre_cancha: req.body.nombre_cancha,
      estado: req.body.estado,
      id_tipo: req.body.id_tipo
    });
    res.status(201).json(nuevaCancha);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la cancha' });
  }
};

// Lógica para obtener todas las canchas
exports.findAll = async (req, res) => {
  try {
    const canchas = await Cancha.findAll({
      // Incluir el tipo de cancha asociado
      include: [{
        model: TipoCancha,
        as: 'tipoCancha'
      }]
    });
    res.status(200).json(canchas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las canchas' });
  }
};

// Lógica para actualizar una cancha
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_cancha, estado, id_tipo } = req.body;

    const [updated] = await Cancha.update(
      { nombre_cancha, estado, id_tipo },
      { where: { id } }
    );

    if (updated) {
      const updatedCancha = await Cancha.findByPk(id, {
        include: [{
          model: TipoCancha,
          as: 'tipoCancha'
        }]
      });
      res.status(200).json(updatedCancha);
    } else {
      res.status(404).json({ error: 'Cancha no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cancha' });
  }
};

// Lógica para eliminar una cancha
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Cancha.destroy({ where: { id } });
    
    if (deleted) {
      res.status(200).json({ message: 'Cancha eliminada exitosamente' });
    } else {
      res.status(404).json({ error: 'Cancha no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la cancha' });
  }
};

exports.obtenerCanchas = (req, res) => {
  // tu lógica aquí
  res.json([]);
};