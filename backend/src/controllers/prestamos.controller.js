const db = require('../../models');
const Prestamo = db.Prestamo;
const Reserva = db.Reserva;
const Producto = db.Producto;
const Usuario = db.Usuario;

// Función auxiliar para validar disponibilidad de stock
const validarDisponibilidad = async (id_producto, cantidad_solicitada) => {
  const producto = await Producto.findByPk(id_producto, {
    include: [{
      model: Prestamo,
      as: 'prestamos',
      required: false,
      where: {
        estado: 'activo'
      }
    }]
  });

  if (!producto) {
    throw new Error('Producto no encontrado');
  }

  const cantidadActualmentePrestada = producto.prestamos.reduce((total, prestamo) => {
    return total + prestamo.cantidad_prestada;
  }, 0);

  const cantidadDisponible = producto.cantidad_total - cantidadActualmentePrestada;

  return {
    producto,
    cantidadDisponible,
    cantidadActualmentePrestada,
    esValido: cantidad_solicitada <= cantidadDisponible
  };
};

// Crear un nuevo préstamo
exports.create = async (req, res) => {
  try {
    const { id_producto, cantidad_prestada, id_reserva } = req.body;

    // Validaciones básicas
    if (!id_producto || !cantidad_prestada || !id_reserva) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos: id_producto, cantidad_prestada, id_reserva' 
      });
    }

    if (cantidad_prestada <= 0) {
      return res.status(400).json({ 
        error: 'La cantidad prestada debe ser mayor a 0' 
      });
    }

    // Validar disponibilidad usando la función auxiliar
    const validacion = await validarDisponibilidad(id_producto, cantidad_prestada);
    
    if (!validacion.esValido) {
      return res.status(400).json({ 
        error: `Stock insuficiente. Disponible: ${validacion.cantidadDisponible}, Solicitado: ${cantidad_prestada}`,
        disponible: validacion.cantidadDisponible,
        solicitado: cantidad_prestada,
        total: validacion.producto.cantidad_total,
        prestado: validacion.cantidadActualmentePrestada
      });
    }

    // Crear el préstamo con estado activo por defecto
    const nuevoPrestamo = await Prestamo.create({
      ...req.body,
      estado: req.body.estado || 'activo'
    });

    // Obtener el préstamo creado con sus relaciones
    const prestamoCompleto = await Prestamo.findByPk(nuevoPrestamo.id, {
      include: [
        { 
          model: Reserva, 
          as: 'reserva',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'correo']
            }
          ]
        },
        { 
          model: Producto, 
          as: 'producto',
          attributes: ['id', 'nombre_producto', 'cantidad_total']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Préstamo creado exitosamente',
      data: prestamoCompleto
    });
  } catch (error) {
    console.error('Error al crear el préstamo:', error);
    res.status(500).json({ error: 'Error al crear el préstamo' });
  }
};

// Exportar la función auxiliar para uso en otros controladores
exports.validarDisponibilidad = validarDisponibilidad;

// Obtener todos los préstamos con filtros opcionales
exports.findAll = async (req, res) => {
  try {
    const { timeFilter } = req.query;
    let whereCondition = {};

    // Aplicar filtros de tiempo si se especifica
    if (timeFilter) {
      const now = new Date();
      let fechaInicio;

      switch (timeFilter) {
        case '3days':
          fechaInicio = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
          break;
        case 'week':
          fechaInicio = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          fechaInicio = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'year':
          fechaInicio = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
          break;
        default:
          // Si no es un filtro válido, no aplicar filtro de tiempo
          break;
      }

      if (fechaInicio) {
        whereCondition.createdAt = {
          [db.Sequelize.Op.gte]: fechaInicio
        };
      }
    }

    const prestamos = await Prestamo.findAll({
      where: whereCondition,
      include: [
        { 
          model: Reserva, 
          as: 'reserva',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'correo']
            }
          ]
        },
        { 
          model: Producto, 
          as: 'producto',
          attributes: ['id', 'nombre_producto']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: prestamos,
      filtro_aplicado: timeFilter || 'todos',
      total: prestamos.length
    });
  } catch (error) {
    console.error('Error al obtener los préstamos:', error);
    res.status(500).json({ error: 'Error al obtener los préstamos' });
  }
};

// Obtener un solo préstamo por su ID
exports.findOne = async (req, res) => {
  try {
    const prestamo = await Prestamo.findByPk(req.params.id, {
      include: [
        { 
          model: Reserva, 
          as: 'reserva',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'correo']
            }
          ]
        },
        { 
          model: Producto, 
          as: 'producto',
          attributes: ['id', 'nombre_producto']
        }
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

// Cambiar estado de un préstamo
exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que el estado sea válido
    const estadosValidos = ['activo', 'devuelto', 'vencido', 'perdido', 'dañado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Estados válidos: ' + estadosValidos.join(', ') 
      });
    }

    const [updated] = await Prestamo.update(
      { estado },
      { where: { id } }
    );

    if (updated) {
      const updatedPrestamo = await Prestamo.findByPk(id, {
        include: [
          { model: Reserva, as: 'reserva' },
          { model: Producto, as: 'producto' }
        ]
      });
      return res.status(200).json({
        success: true,
        message: `Estado del préstamo actualizado a '${estado}'`,
        data: updatedPrestamo
      });
    }
    
    return res.status(404).json({ error: 'Préstamo no encontrado' });
  } catch (error) {
    console.error('Error al cambiar estado del préstamo:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del préstamo' });
  }
};

// Obtener estadísticas de préstamos
exports.getStats = async (req, res) => {
  try {
    const stats = await Prestamo.findAll({
      attributes: [
        'estado',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'cantidad']
      ],
      group: ['estado']
    });

    const totalPrestamos = await Prestamo.count();

    // Formatear estadísticas
    const estadisticas = {
      total: totalPrestamos,
      activos: 0,
      devueltos: 0,
      vencidos: 0,
      perdidos: 0,
      dañados: 0
    };

    stats.forEach(stat => {
      estadisticas[stat.estado] = parseInt(stat.dataValues.cantidad);
    });

    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de préstamos:', error);
    res.status(500).json({ error: 'Error al obtener las estadísticas' });
  }
};

// Obtener préstamos por estado
exports.findByStatus = async (req, res) => {
  try {
    const { estado } = req.params;
    
    const prestamos = await Prestamo.findAll({
      where: { estado },
      include: [
        { 
          model: Reserva, 
          as: 'reserva',
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nombre', 'correo']
            }
          ]
        },
        { 
          model: Producto, 
          as: 'producto',
          attributes: ['id', 'nombre_producto']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: prestamos
    });
  } catch (error) {
    console.error('Error al obtener préstamos por estado:', error);
    res.status(500).json({ error: 'Error al obtener los préstamos' });
  }
};

// Marcar préstamos como vencidos automáticamente
exports.markOverdue = async (req, res) => {
  try {
    // Obtener préstamos activos de reservas finalizadas hace más de 24 horas
    const prestamosVencidos = await Prestamo.update(
      { estado: 'vencido' },
      {
        where: {
          estado: 'activo',
          id_reserva: {
            [db.Sequelize.Op.in]: db.Sequelize.literal(`(
              SELECT id FROM Reservas 
              WHERE estado = 'finalizada' 
              AND updatedAt < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            )`)
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `${prestamosVencidos[0]} préstamos marcados como vencidos`,
      prestamos_actualizados: prestamosVencidos[0]
    });
  } catch (error) {
    console.error('Error al marcar préstamos vencidos:', error);
    res.status(500).json({ error: 'Error al procesar préstamos vencidos' });
  }
};