const db = require('../../models');
const TipoCancha = db.TipoCancha;

// Crear un nuevo tipo de cancha
exports.create = async (req, res) => {
  try {
    const { tipo, precio } = req.body;
    const precioStr = precio != null ? String(precio) : null;
    const nuevoTipoCancha = await TipoCancha.create({ tipo, precio: precioStr });
    res.status(201).json(nuevoTipoCancha);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el tipo de cancha' });
  }
};

// Obtener todos los tipos de cancha
exports.findAll = async (req, res) => {
  try {
    const tiposDeCancha = await TipoCancha.findAll();
    res.status(200).json(tiposDeCancha);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los tipos de cancha' });
  }
};

// Obtener un solo tipo de cancha por su ID
exports.findOne = async (req, res) => {
  try {
    const tipoDeCancha = await TipoCancha.findByPk(req.params.id);
    if (!tipoDeCancha) {
      return res.status(404).json({ error: 'Tipo de cancha no encontrado' });
    }
    res.status(200).json(tipoDeCancha);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el tipo de cancha' });
  }
};

// Actualizar un tipo de cancha por su ID
exports.update = async (req, res) => {
  try {
    const [updated] = await TipoCancha.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedTipoCancha = await TipoCancha.findByPk(req.params.id);
      return res.status(200).json(updatedTipoCancha);
    }
    throw new Error('Tipo de cancha no encontrado');
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el tipo de cancha' });
  }
};

// Eliminar un tipo de cancha por su ID
exports.delete = async (req, res) => {
  try {
    const deleted = await TipoCancha.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.status(204).json({ message: 'Tipo de cancha eliminado' });
    }
    throw new Error('Tipo de cancha no encontrado');
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el tipo de cancha' });
  }
};