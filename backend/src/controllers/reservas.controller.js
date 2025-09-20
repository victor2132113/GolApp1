const db = require('../../models');
const Reserva = db.Reserva;
const Cancha = db.Cancha;
const Usuario = db.Usuario;
const TipoCancha = db.TipoCancha; // ⚠️ Paso 1: Importa el modelo TipoCancha

// Crear una nueva reserva
exports.create = async (req, res) => {
  try {
    const nuevaReserva = await Reserva.create(req.body);
    res.status(201).json(nuevaReserva);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
};

// Obtener todas las reservas con datos enriquecidos
exports.findAll = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      include: [
        {
          model: Cancha,
          as: 'cancha',
          // ⚠️ Paso 2: Unión anidada para obtener el precio
          include: {
            model: TipoCancha,
            as: 'tipoCancha'
          }
        },
        { model: Usuario, as: 'usuario' }
      ]
    });

    // ⚠️ Paso 3: Mapear y calcular los datos antes de enviarlos
    const reservasEnriquecidas = reservas.map(reserva => {
      const startTime = new Date(reserva.hora_inicio);
      const endTime = new Date(reserva.hora_fin);
      const durationInHours = (endTime - startTime) / (1000 * 60 * 60);

      const precioPorHora = reserva.cancha?.tipoCancha?.precio ?? 0;
      const precioTotal = durationInHours * precioPorHora;

      return {
        ...reserva.toJSON(),
        customerName: reserva.usuario?.nombre ?? 'N/A',
        customerPhone: reserva.usuario?.telefono ?? 'N/A',
        totalPrice: precioTotal,
      };
    });

    res.status(200).json(reservasEnriquecidas);
  } catch (error) {
    console.error('Error al obtener las reservas:', error);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

// Obtener una reserva por su ID con datos enriquecidos
exports.findOne = async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id, {
      include: [
        {
          model: Cancha,
          as: 'cancha',
          include: {
            model: TipoCancha,
            as: 'tipoCancha'
          }
        },
        { model: Usuario, as: 'usuario' }
      ]
    });
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const startTime = new Date(reserva.hora_inicio);
    const endTime = new Date(reserva.hora_fin);
    const durationInHours = (endTime - startTime) / (1000 * 60 * 60);

    const precioPorHora = reserva.cancha?.tipoCancha?.precio ?? 0;
    const precioTotal = durationInHours * precioPorHora;

    const reservaEnriquecida = {
      ...reserva.toJSON(),
      customerName: reserva.usuario?.nombre ?? 'N/A',
      customerPhone: reserva.usuario?.telefono ?? 'N/A',
      totalPrice: precioTotal,
    };

    res.status(200).json(reservaEnriquecida);
  } catch (error) {
    console.error('Error al obtener la reserva:', error);
    res.status(500).json({ error: 'Error al obtener la reserva' });
  }
};

// Actualizar una reserva
exports.update = async (req, res) => {
  try {
    const [updated] = await Reserva.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedReserva = await Reserva.findByPk(req.params.id);
      return res.status(200).json(updatedReserva);
    }
    throw new Error('Reserva no encontrada');
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la reserva' });
  }
};

// Eliminar una reserva
exports.delete = async (req, res) => {
  try {
    const deleted = await Reserva.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.status(204).json({ message: 'Reserva eliminada' });
    }
    throw new Error('Reserva no encontrada');
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la reserva' });
  }
};