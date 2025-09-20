const db = require('../../models');
const Prestamo = db.Prestamo;
const Reserva = db.Reserva;
const Producto = db.Producto;

// Crear un nuevo préstamo
exports.create = async (req, res) => {
  try {
    const nuevoPrestamo = await Prestamo.create(req.body);
    res.status(201).json(nuevoPrestamo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el préstamo' });
  }
};

// Obtener todos los préstamos
exports.findAll = async (req, res) => {
  try {
    const prestamos = await Prestamo.findAll({
      include: [
        { model: Reserva, as: 'reserva' },
        { model: Producto, as: 'producto' }
      ]
    });
    res.status(200).json(prestamos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los préstamos' });
  }
};

// Obtener un solo préstamo por su ID
exports.findOne = async (req, res) => {
  try {
    const prestamo = await Prestamo.findByPk(req.params.id, {
      include: [
        { model: Reserva, as: 'reserva' },
        { model: Producto, as: 'producto' }
      ]
    });
    if (!prestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    res.status(200).json(prestamo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el préstamo' });
  }
};

// Actualizar un préstamo
exports.update = async (req, res) => {
  try {
    const [updated] = await Prestamo.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedPrestamo = await Prestamo.findByPk(req.params.id);
      return res.status(200).json(updatedPrestamo);
    }
    throw new Error('Préstamo no encontrado');
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el préstamo' });
  }
};

// Eliminar un préstamo
exports.delete = async (req, res) => {
  try {
    const deleted = await Prestamo.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.status(204).json({ message: 'Préstamo eliminado' });
    }
    throw new Error('Préstamo no encontrado');
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el préstamo' });
  }
};