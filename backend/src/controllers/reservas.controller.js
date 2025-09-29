const db = require('../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');
const Reserva = db.Reserva;
const Cancha = db.Cancha;
const Usuario = db.Usuario;
const TipoCancha = db.TipoCancha; // ⚠️ Paso 1: Importa el modelo TipoCancha
const Prestamo = db.Prestamo;
const Producto = db.Producto;

// Importar la función de validación de disponibilidad
const { validarDisponibilidad } = require('./prestamos.controller');

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

    // Verificar que la cancha existe y obtener su tipo
    const cancha = await db.Cancha.findByPk(id_cancha, {
      include: [{
        model: TipoCancha,
        as: 'tipoCancha'
      }]
    });
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

    // Verificar disponibilidad de horario
    const conflictos = await Reserva.findAll({
      where: {
        id_cancha: parseInt(id_cancha),
        fecha_reserva: new Date(fecha_reserva + 'T12:00:00'),
        estado: ['pendiente', 'confirmada'], // Solo verificar reservas activas, no finalizadas
        [db.Sequelize.Op.or]: [
          {
            // Caso 1: La nueva reserva empieza durante una reserva existente
            [db.Sequelize.Op.and]: [
              { hora_inicio: { [db.Sequelize.Op.lte]: hora_inicio } },
              { hora_fin: { [db.Sequelize.Op.gt]: hora_inicio } }
            ]
          },
          {
            // Caso 2: La nueva reserva termina durante una reserva existente
            [db.Sequelize.Op.and]: [
              { hora_inicio: { [db.Sequelize.Op.lt]: hora_fin } },
              { hora_fin: { [db.Sequelize.Op.gte]: hora_fin } }
            ]
          },
          {
            // Caso 3: La nueva reserva contiene completamente una reserva existente
            [db.Sequelize.Op.and]: [
              { hora_inicio: { [db.Sequelize.Op.gte]: hora_inicio } },
              { hora_fin: { [db.Sequelize.Op.lte]: hora_fin } }
            ]
          }
        ]
      }
    });

    if (conflictos.length > 0) {
      console.error('ERROR: Horario no disponible - conflicto encontrado');
      return res.status(409).json({ 
        error: 'El horario seleccionado no está disponible',
        message: 'Ya existe una reserva en ese horario para esta cancha',
        conflictos: conflictos.map(c => ({
          fecha: c.fecha_reserva,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          estado: c.estado
        }))
      });
    }

    console.log('Validaciones pasadas, creando reserva...');
    
    // Corregir el problema de zona horaria para la fecha
    const fechaCorrecta = new Date(fecha_reserva + 'T12:00:00');
    console.log('📅 Fecha original:', fecha_reserva);
    console.log('📅 Fecha procesada:', fechaCorrecta);
    
    const nuevaReserva = await Reserva.create({
      id_cancha: parseInt(id_cancha),
      id_usuario: parseInt(id_usuario),
      fecha_reserva: fechaCorrecta,
      hora_inicio: hora_inicio, // Enviar como string TIME, no como Date
      hora_fin: hora_fin, // Enviar como string TIME, no como Date
      estado: estado || 'pendiente',
      observaciones: observaciones || null,
      telefono_cliente: telefono_cliente || null
    });
    
    console.log('✅ Reserva creada exitosamente:', nuevaReserva.toJSON());
    
    // ========================================
    // ASIGNACIÓN AUTOMÁTICA DE IMPLEMENTOS BÁSICOS
    // ========================================
    // ⚠️ IMPORTANTE: Solo asignar implementos si la reserva se crea directamente como 'confirmada'
    if (nuevaReserva.estado === 'confirmada') {
      try {
        console.log('🏈 Iniciando asignación automática de implementos para reserva confirmada...');
        
        // Definir reglas de asignación según tipo de cancha
        const tipoCancha = cancha.tipoCancha?.tipo;
        let cantidadPetos = 0;
        
        switch (tipoCancha) {
          case 'Fútbol 11':
            cantidadPetos = 11; // 22 jugadores / 2 = 11 petos
            break;
          case 'Fútbol 7':
            cantidadPetos = 7; // 14 jugadores / 2 = 7 petos
            break;
          case 'Fútbol 5':
            cantidadPetos = 5; // 10 jugadores / 2 = 5 petos
            break;
          default:
            console.log('⚠️ Tipo de cancha no reconocido para asignación automática:', tipoCancha);
            cantidadPetos = 0;
        }
        
        console.log(`📋 Tipo de cancha: ${tipoCancha}, Petos a asignar: ${cantidadPetos}`);
        
        // Buscar productos específicos (Balón Fútbol ID:1 y Chalecos ID:7)
        const balon = await Producto.findByPk(1); // Balón Fútbol
        const chalecos = await Producto.findByPk(7); // Chalecos
        
        const prestamosCreados = [];
        const erroresValidacion = [];
        
        // Crear préstamo para balón (siempre 1 balón para canchas de fútbol)
        if (balon && cantidadPetos > 0) {
          try {
            // Validar disponibilidad del balón
            const validacionBalon = await validarDisponibilidad(balon.id, 1);
            
            if (validacionBalon.esValido) {
              const prestamoBalon = await Prestamo.create({
                cantidad_prestada: 1,
                id_reserva: nuevaReserva.id,
                id_producto: balon.id,
                estado: 'activo'
              });
              prestamosCreados.push({
                producto: balon.nombre_producto,
                cantidad: 1
              });
              console.log('⚽ Balón asignado automáticamente');
            } else {
              erroresValidacion.push({
                producto: balon.nombre_producto,
                error: `Stock insuficiente. Disponible: ${validacionBalon.cantidadDisponible}, Solicitado: 1`
              });
              console.log(`⚠️ No se pudo asignar balón: stock insuficiente (disponible: ${validacionBalon.cantidadDisponible})`);
            }
          } catch (error) {
            erroresValidacion.push({
              producto: balon.nombre_producto,
              error: 'Error al validar disponibilidad del balón'
            });
            console.error('Error al validar balón:', error);
          }
        }
        
        // Crear préstamo para chalecos/petos
        if (chalecos && cantidadPetos > 0) {
          try {
            // Validar disponibilidad de chalecos
            const validacionChalecos = await validarDisponibilidad(chalecos.id, cantidadPetos);
            
            if (validacionChalecos.esValido) {
              const prestamoPetos = await Prestamo.create({
                cantidad_prestada: cantidadPetos,
                id_reserva: nuevaReserva.id,
                id_producto: chalecos.id,
                estado: 'activo'
              });
              prestamosCreados.push({
                producto: chalecos.nombre_producto,
                cantidad: cantidadPetos
              });
              console.log(`👕 ${cantidadPetos} chalecos asignados automáticamente`);
            } else {
              erroresValidacion.push({
                producto: chalecos.nombre_producto,
                error: `Stock insuficiente. Disponible: ${validacionChalecos.cantidadDisponible}, Solicitado: ${cantidadPetos}`
              });
              console.log(`⚠️ No se pudieron asignar ${cantidadPetos} chalecos: stock insuficiente (disponible: ${validacionChalecos.cantidadDisponible})`);
            }
          } catch (error) {
            erroresValidacion.push({
              producto: chalecos.nombre_producto,
              error: 'Error al validar disponibilidad de chalecos'
            });
            console.error('Error al validar chalecos:', error);
          }
        }
        
        console.log('✅ Implementos básicos procesados:', prestamosCreados);
        if (erroresValidacion.length > 0) {
          console.log('⚠️ Errores en asignación de implementos:', erroresValidacion);
        }
        
        // Incluir información de préstamos en la respuesta
        const respuesta = {
          ...nuevaReserva.toJSON(),
          implementos_asignados: prestamosCreados
        };
        
        if (erroresValidacion.length > 0) {
          respuesta.errores_implementos = erroresValidacion;
          respuesta.warning = 'Reserva creada pero algunos implementos no pudieron ser asignados por falta de stock';
        }
        
        res.status(201).json(respuesta);
        
      } catch (implementosError) {
        console.error('⚠️ Error al asignar implementos automáticos:', implementosError);
        // No fallar la reserva por errores en implementos, solo registrar el error
        res.status(201).json({
          ...nuevaReserva.toJSON(),
          warning: 'Reserva creada pero hubo un problema al asignar implementos automáticos'
        });
      }
    } else {
      // Si la reserva se crea como 'pendiente', no asignar implementos
      console.log('ℹ️ Reserva creada como pendiente - Los implementos se asignarán cuando se confirme');
      res.status(201).json(nuevaReserva.toJSON());
    }
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
    // Construir filtros dinámicamente
    const whereClause = {};
    
    // Si se proporciona fecha, filtrar por ella
    if (req.query.fecha) {
      whereClause.fecha_reserva = {
        [Op.like]: `%${req.query.fecha}%`
      };
      console.log(`Filtrando reservas por fecha: ${req.query.fecha}`);
    }
    
    const reservas = await Reserva.findAll({
      where: whereClause,
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
    // Obtener la reserva actual para comparar estados
    const reservaActual = await Reserva.findByPk(req.params.id, {
      include: [
        {
          model: Cancha,
          as: 'cancha',
          include: [{ model: TipoCancha, as: 'tipoCancha' }]
        }
      ]
    });

    if (!reservaActual) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

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
      updateData.fecha_reserva = new Date(updateData.fecha_reserva + 'T12:00:00');
    }
    
    const [updated] = await Reserva.update(updateData, {
      where: { id: req.params.id }
    });

    if (updated) {
      const updatedReserva = await Reserva.findByPk(req.params.id, {
        include: [
          {
            model: Cancha,
            as: 'cancha',
            include: [{ model: TipoCancha, as: 'tipoCancha' }]
          }
        ]
      });

      // 🎯 NUEVA LÓGICA: Crear préstamos automáticos cuando el estado cambie a 'confirmada'
      if (updateData.estado === 'confirmada' && reservaActual.estado !== 'confirmada') {
        console.log('🔄 Estado cambiado a CONFIRMADA - Creando préstamos automáticos...');
        
        try {
          // Verificar si ya existen préstamos para esta reserva
          const prestamosExistentes = await Prestamo.findAll({
            where: { id_reserva: req.params.id }
          });

          if (prestamosExistentes.length === 0) {
            console.log('📦 No hay préstamos existentes, creando implementos automáticos...');
            
            // Obtener productos disponibles
            const [balon, chalecos] = await Promise.all([
              Producto.findOne({ where: { nombre_producto: 'Balón Fútbol' } }),
              Producto.findOne({ where: { nombre_producto: 'Chalecos' } })
            ]);

            const prestamosCreados = [];
            const tipoCancha = updatedReserva.cancha?.tipoCancha?.tipo;
            
            // Determinar cantidad de chalecos según el tipo de cancha
            let cantidadPetos = 0;
            if (tipoCancha === 'Fútbol 11') {
              cantidadPetos = 11;
            } else if (tipoCancha === 'Fútbol 7') {
              cantidadPetos = 7;
            } else if (tipoCancha === 'Fútbol 5') {
              cantidadPetos = 5;
            }

            console.log(`🏟️ Tipo de cancha: ${tipoCancha}, Chalecos a asignar: ${cantidadPetos}`);

            // Crear préstamo para balón
            if (balon) {
              await Prestamo.create({
                cantidad_prestada: 1,
                id_reserva: req.params.id,
                id_producto: balon.id
              });
              prestamosCreados.push({
                producto: balon.nombre_producto,
                cantidad: 1
              });
              console.log('⚽ Balón asignado automáticamente');
            }
            
            // Crear préstamo para chalecos/petos
            if (chalecos && cantidadPetos > 0) {
              await Prestamo.create({
                cantidad_prestada: cantidadPetos,
                id_reserva: req.params.id,
                id_producto: chalecos.id
              });
              prestamosCreados.push({
                producto: chalecos.nombre_producto,
                cantidad: cantidadPetos
              });
              console.log(`👕 ${cantidadPetos} chalecos asignados automáticamente`);
            }

            console.log('✅ Implementos básicos asignados exitosamente al confirmar reserva:', prestamosCreados);
            
            // Incluir información de préstamos en la respuesta
            return res.status(200).json({
              ...updatedReserva.toJSON(),
              implementos_asignados: prestamosCreados
            });
          } else {
            console.log('ℹ️ Ya existen préstamos para esta reserva, no se crean nuevos');
          }
        } catch (implementosError) {
          console.error('⚠️ Error al asignar implementos automáticos al confirmar:', implementosError);
          // No fallar la actualización por errores en implementos
        }
      }

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

// Obtener horarios ocupados para una cancha en una fecha específica
exports.getOccupiedTimes = async (req, res) => {
  try {
    const { id_cancha, fecha } = req.query;
    
    if (!id_cancha || !fecha) {
      return res.status(400).json({ 
        error: 'Parámetros requeridos: id_cancha y fecha' 
      });
    }

    console.log(`🔍 Consultando horarios ocupados para cancha ${id_cancha} en fecha ${fecha}`);
    console.log(`📊 Tipos de datos: id_cancha=${typeof id_cancha}, fecha=${typeof fecha}`);

    // Usar consulta SQL directa para evitar problemas de timezone de Sequelize
    const { QueryTypes } = require('sequelize');

    const query = `
      SELECT hora_inicio, hora_fin, estado, fecha_reserva
      FROM reservas 
      WHERE id_cancha = :id_cancha 
        AND DATE(fecha_reserva) = :fecha
        AND estado IN ('pendiente', 'confirmada')
      ORDER BY hora_inicio ASC
    `;

    console.log(`🗄️ Ejecutando consulta SQL directa:`);
    console.log(`   Query: ${query}`);
    console.log(`   Parámetros: id_cancha=${id_cancha}, fecha=${fecha}`);

    const reservas = await sequelize.query(query, {
      replacements: { 
        id_cancha: parseInt(id_cancha), 
        fecha: fecha 
      },
      type: QueryTypes.SELECT
    });

    console.log(`📋 Reservas encontradas (${reservas.length}):`);
    reservas.forEach((reserva, index) => {
      console.log(`   ${index + 1}. Fecha: ${reserva.fecha_reserva}, Horario: ${reserva.hora_inicio}-${reserva.hora_fin}, Estado: ${reserva.estado}`);
    });

    const horariosOcupados = reservas.map(reserva => ({
      hora_inicio: reserva.hora_inicio,
      hora_fin: reserva.hora_fin,
      estado: reserva.estado
    }));

    console.log(`✅ Devolviendo ${horariosOcupados.length} horarios ocupados para fecha ${fecha}`);

    res.status(200).json({
      cancha_id: parseInt(id_cancha),
      fecha: fecha,
      horarios_ocupados: horariosOcupados
    });
  } catch (error) {
    console.error('❌ Error al obtener horarios ocupados:', error);
    res.status(500).json({ error: 'Error al obtener horarios ocupados' });
  }
};

// Obtener implementos prestados por reserva
exports.getImplementosByReserva = async (req, res) => {
  console.log('=== CONTROLADOR: Obteniendo implementos por reserva ===');
  
  try {
    const reservaId = req.params.id;
    console.log('ID de reserva:', reservaId);

    // Verificar que la reserva existe
    const reserva = await Reserva.findByPk(reservaId);
    if (!reserva) {
      console.error('ERROR: Reserva no encontrada:', reservaId);
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Obtener todos los préstamos asociados a esta reserva
    const prestamos = await Prestamo.findAll({
      where: {
        id_reserva: reservaId
      },
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre_producto', 'cantidad_total']
      }],
      attributes: ['id', 'cantidad_prestada', 'estado', 'createdAt', 'updatedAt']
    });

    console.log('Préstamos encontrados:', prestamos.length);

    // Formatear los datos para el frontend
    const implementos = prestamos.map(prestamo => ({
      id: prestamo.id,
      nombre: prestamo.producto ? prestamo.producto.nombre_producto : 'Producto no disponible',
      cantidad_total: prestamo.producto ? prestamo.producto.cantidad_total : 0,
      cantidad: prestamo.cantidad_prestada,
      estado: prestamo.estado,
      fecha_prestamo: prestamo.createdAt,
      fecha_actualizacion: prestamo.updatedAt
    }));

    console.log('Implementos formateados:', implementos);

    res.status(200).json({
      success: true,
      data: implementos
    });

  } catch (error) {
    console.error('ERROR al obtener implementos por reserva:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
};