const db = require('../../models');
const Reserva = db.Reserva;
const Cancha = db.Cancha;
const Usuario = db.Usuario;
const TipoCancha = db.TipoCancha; // ⚠️ Paso 1: Importa el modelo TipoCancha

// Crear una nueva reserva
exports.create = async (req, res) => {
  console.log('=== CONTROLADOR: Creando nueva reserva ===');
  console.log('Datos recibidos:', req.body);
  
  try {
    // Validar datos requeridos
    const { id_cancha, id_usuario, fecha_reserva, hora_inicio, hora_fin, estado } = req.body;
    
    if (!id_cancha || !id_usuario || !fecha_reserva || !hora_inicio || !hora_fin) {
      console.error('ERROR: Campos requeridos faltantes');
      return res.status(400).json({ 
        error: 'Campos requeridos faltantes',
        required: ['id_cancha', 'id_usuario', 'fecha_reserva', 'hora_inicio', 'hora_fin']
      });
    }

    // Verificar que la cancha existe
    const cancha = await db.Cancha.findByPk(id_cancha);
    if (!cancha) {
      console.error('ERROR: Cancha no encontrada:', id_cancha);
      return res.status(404).json({ error: 'Cancha no encontrada' });
    }

    // Verificar que el usuario existe
    const usuario = await db.Usuario.findByPk(id_usuario);
    if (!usuario) {
      console.error('ERROR: Usuario no encontrado:', id_usuario);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('Validaciones pasadas, creando reserva...');
    
    const nuevaReserva = await Reserva.create({
      id_cancha: parseInt(id_cancha),
      id_usuario: parseInt(id_usuario),
      fecha_reserva: new Date(fecha_reserva),
      hora_inicio: new Date(hora_inicio),
      hora_fin: new Date(hora_fin),
      estado: estado || 'confirmada'
    });
    
    console.log('✅ Reserva creada exitosamente:', nuevaReserva.toJSON());
    res.status(201).json(nuevaReserva);
  } catch (error) {
    console.error('❌ ERROR al crear la reserva:', error);
    console.error('Stack trace:', error.stack);
    
    // Manejar errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Error de validación',
        details: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        error: 'Error de clave foránea: Verifique que la cancha y usuario existan'
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor al crear la reserva',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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