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
    const { id_cancha, id_usuario, fecha_reserva, hora_inicio, hora_fin, estado, observaciones, telefono_cliente } = req.body;
    
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
      hora_inicio: hora_inicio, // Enviar como string TIME, no como Date
      hora_fin: hora_fin, // Enviar como string TIME, no como Date
      estado: estado || 'pendiente',
      observaciones: observaciones || null,
      telefono_cliente: telefono_cliente || null
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

// Obtener reservas por usuario específico
exports.findByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Buscando reservas para el usuario:', userId);
    
    const reservas = await Reserva.findAll({
      where: { id_usuario: userId },
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
      ],
      order: [['fecha_reserva', 'DESC'], ['hora_inicio', 'DESC']]
    });

    console.log(`Encontradas ${reservas.length} reservas para el usuario ${userId}`);

    // Mapear y calcular los datos antes de enviarlos
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
    console.error('Error al obtener las reservas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener las reservas del usuario' });
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
      // Convertir las horas a objetos Date correctamente
      const fechaReserva = reserva.fecha_reserva;
      const horaInicio = reserva.hora_inicio;
      const horaFin = reserva.hora_fin;
      
      // Crear objetos Date completos para el cálculo
      const startTime = new Date(`${fechaReserva}T${horaInicio}`);
      const endTime = new Date(`${fechaReserva}T${horaFin}`);
      
      // Calcular duración en horas
      const durationInMs = endTime - startTime;
      const durationInHours = durationInMs / (1000 * 60 * 60);

      // Obtener precio por hora - ahora los precios son números en la BD
      let precioPorHora = 50000; // Precio por defecto
      if (reserva.cancha?.tipoCancha?.precio) {
        // Los precios ahora son strings de números puros: "50000"
        precioPorHora = parseInt(reserva.cancha.tipoCancha.precio) || 50000;
      }
      
      const precioTotal = Math.max(0, durationInHours * precioPorHora);

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
    // Procesar los datos antes de actualizar
    const updateData = { ...req.body };
    
    // Si se están actualizando las horas, mantenerlas como strings
    if (updateData.hora_inicio && typeof updateData.hora_inicio === 'string') {
      // Ya está en formato correcto
    }
    if (updateData.hora_fin && typeof updateData.hora_fin === 'string') {
      // Ya está en formato correcto
    }
    
    // Si se está actualizando la fecha, convertir a Date
    if (updateData.fecha_reserva) {
      updateData.fecha_reserva = new Date(updateData.fecha_reserva);
    }
    
    const [updated] = await Reserva.update(updateData, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedReserva = await Reserva.findByPk(req.params.id);
      return res.status(200).json(updatedReserva);
    }
    throw new Error('Reserva no encontrada');
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
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

// Obtener reservas de hoy
exports.getReservationsToday = async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const reservas = await Reserva.findAll({
      where: {
        fecha_reserva: todayStr
      },
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
      ],
      order: [['hora_inicio', 'ASC']]
    });

    const reservasEnriquecidas = reservas.map(reserva => {
      const fechaReserva = reserva.fecha_reserva;
      const horaInicio = reserva.hora_inicio;
      const horaFin = reserva.hora_fin;
      
      const startTime = new Date(`${fechaReserva}T${horaInicio}`);
      const endTime = new Date(`${fechaReserva}T${horaFin}`);
      const durationInHours = (endTime - startTime) / (1000 * 60 * 60);

      let precioPorHora = 50000;
      if (reserva.cancha?.tipoCancha?.precio) {
        precioPorHora = parseInt(reserva.cancha.tipoCancha.precio);
      }

      const precioTotal = durationInHours * precioPorHora;

      return {
        ...reserva.toJSON(),
        customerName: reserva.usuario?.nombre ?? 'N/A',
        customerPhone: reserva.usuario?.telefono ?? 'N/A',
        totalPrice: precioTotal,
        duration: durationInHours
      };
    });

    const confirmadas = reservasEnriquecidas.filter(r => r.estado === 'confirmada').length;
    const pendientes = reservasEnriquecidas.filter(r => r.estado === 'pendiente').length;
    const canceladas = reservasEnriquecidas.filter(r => r.estado === 'cancelada').length;

    res.status(200).json({
      total: reservasEnriquecidas.length,
      confirmadas,
      pendientes,
      canceladas,
      reservas: reservasEnriquecidas
    });
  } catch (error) {
    console.error('Error al obtener reservas de hoy:', error);
    res.status(500).json({ error: 'Error al obtener reservas de hoy' });
  }
};

// Obtener ingresos mensuales
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const reservas = await Reserva.findAll({
      where: {
        fecha_reserva: {
          [db.Sequelize.Op.between]: [firstDayOfMonth, lastDayOfMonth]
        },
        estado: ['confirmada', 'finalizada']
      },
      include: [
        {
          model: Cancha,
          as: 'cancha',
          include: {
            model: TipoCancha,
            as: 'tipoCancha'
          }
        }
      ]
    });

    let totalIngresos = 0;
    let reservasConfirmadas = 0;

    reservas.forEach(reserva => {
      const fechaReserva = reserva.fecha_reserva;
      const horaInicio = reserva.hora_inicio;
      const horaFin = reserva.hora_fin;
      
      const startTime = new Date(`${fechaReserva}T${horaInicio}`);
      const endTime = new Date(`${fechaReserva}T${horaFin}`);
      const durationInHours = (endTime - startTime) / (1000 * 60 * 60);

      let precioPorHora = 50000;
      if (reserva.cancha?.tipoCancha?.precio) {
        precioPorHora = parseInt(reserva.cancha.tipoCancha.precio);
      }

      const precioTotal = durationInHours * precioPorHora;
      totalIngresos += precioTotal;
      reservasConfirmadas++;
    });

    // Calcular crecimiento comparado con el mes anterior
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const reservasMesAnterior = await Reserva.findAll({
      where: {
        fecha_reserva: {
          [db.Sequelize.Op.between]: [previousMonth, lastDayPreviousMonth]
        },
        estado: ['confirmada', 'finalizada']
      },
      include: [
        {
          model: Cancha,
          as: 'cancha',
          include: {
            model: TipoCancha,
            as: 'tipoCancha'
          }
        }
      ]
    });

    let ingresosMesAnterior = 0;
    reservasMesAnterior.forEach(reserva => {
      const fechaReserva = reserva.fecha_reserva;
      const horaInicio = reserva.hora_inicio;
      const horaFin = reserva.hora_fin;
      
      const startTime = new Date(`${fechaReserva}T${horaInicio}`);
      const endTime = new Date(`${fechaReserva}T${horaFin}`);
      const durationInHours = (endTime - startTime) / (1000 * 60 * 60);

      let precioPorHora = 50000;
      if (reserva.cancha?.tipoCancha?.precio) {
        precioPorHora = parseInt(reserva.cancha.tipoCancha.precio);
      }

      ingresosMesAnterior += durationInHours * precioPorHora;
    });

    const crecimiento = ingresosMesAnterior > 0 
      ? Math.round(((totalIngresos - ingresosMesAnterior) / ingresosMesAnterior) * 100)
      : 0;

    res.status(200).json({
      ingresos_totales: totalIngresos,
      reservas_confirmadas: reservasConfirmadas,
      mes: now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      crecimiento_porcentual: crecimiento
    });
  } catch (error) {
    console.error('Error al obtener ingresos mensuales:', error);
    res.status(500).json({ error: 'Error al obtener ingresos mensuales' });
  }
};

// Obtener ocupación promedio
exports.getAverageOccupancy = async (req, res) => {
  try {
    // Obtener todas las canchas activas
    const canchas = await Cancha.findAll({
      where: { estado: 'disponible' }
    });

    if (canchas.length === 0) {
      return res.status(200).json({ ocupacion_promedio: 0 });
    }

    // Calcular ocupación de la última semana
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const reservas = await Reserva.findAll({
      where: {
        fecha_reserva: {
          [db.Sequelize.Op.between]: [weekAgo, now]
        },
        estado: ['confirmada', 'finalizada']
      }
    });

    // Calcular horas totales disponibles en la semana (asumiendo 12 horas por día por cancha)
    const horasPorDia = 12;
    const diasSemana = 7;
    const horasTotalesDisponibles = canchas.length * horasPorDia * diasSemana;

    // Calcular horas ocupadas
    let horasOcupadas = 0;
    reservas.forEach(reserva => {
      const horaInicio = reserva.hora_inicio;
      const horaFin = reserva.hora_fin;
      
      const startTime = new Date(`2000-01-01T${horaInicio}`);
      const endTime = new Date(`2000-01-01T${horaFin}`);
      const durationInHours = (endTime - startTime) / (1000 * 60 * 60);
      
      horasOcupadas += durationInHours;
    });

    const ocupacionPromedio = horasTotalesDisponibles > 0 
      ? Math.round((horasOcupadas / horasTotalesDisponibles) * 100)
      : 0;

    res.status(200).json({
      ocupacion_promedio: ocupacionPromedio,
      horas_ocupadas: horasOcupadas,
      horas_disponibles: horasTotalesDisponibles,
      canchas_activas: canchas.length,
      periodo: 'última semana'
    });
  } catch (error) {
    console.error('Error al obtener ocupación promedio:', error);
    res.status(500).json({ error: 'Error al obtener ocupación promedio' });
  }
};