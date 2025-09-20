const db = require('../../models');
const Producto = db.Producto;
const Prestamo = db.Prestamo;

// Crear un nuevo implemento deportivo
exports.create = async (req, res) => {
  try {
    const { nombre_producto, cantidad_total } = req.body;
    
    // Validaciones básicas
    if (!nombre_producto || nombre_producto.trim() === '') {
      return res.status(400).json({ 
        error: 'El nombre del implemento es requerido' 
      });
    }
    
    if (cantidad_total < 0) {
      return res.status(400).json({ 
        error: 'La cantidad no puede ser negativa' 
      });
    }

    const nuevoProducto = await Producto.create({
      nombre_producto: nombre_producto.trim(),
      cantidad_total: cantidad_total || 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Implemento creado exitosamente',
      data: nuevoProducto
    });
  } catch (error) {
    console.error('Error al crear implemento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al crear el implemento' 
    });
  }
};

// Obtener todos los implementos
exports.findAll = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [{
        model: Prestamo,
        as: 'prestamos',
        required: false
      }],
      order: [['nombre_producto', 'ASC']]
    });

    // Calcular cantidad disponible para cada producto
    const productosConDisponibilidad = productos.map(producto => {
      const cantidadPrestada = producto.prestamos.reduce((total, prestamo) => {
        return total + prestamo.cantidad_prestada;
      }, 0);
      
      return {
        ...producto.toJSON(),
        cantidad_disponible: producto.cantidad_total - cantidadPrestada,
        cantidad_prestada: cantidadPrestada
      };
    });

    res.status(200).json({
      success: true,
      data: productosConDisponibilidad
    });
  } catch (error) {
    console.error('Error al obtener implementos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener los implementos' 
    });
  }
};

// Obtener un implemento por ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.findByPk(id, {
      include: [{
        model: Prestamo,
        as: 'prestamos',
        required: false
      }]
    });

    if (!producto) {
      return res.status(404).json({ 
        error: 'Implemento no encontrado' 
      });
    }

    // Calcular disponibilidad
    const cantidadPrestada = producto.prestamos.reduce((total, prestamo) => {
      return total + prestamo.cantidad_prestada;
    }, 0);

    const productoConDisponibilidad = {
      ...producto.toJSON(),
      cantidad_disponible: producto.cantidad_total - cantidadPrestada,
      cantidad_prestada: cantidadPrestada
    };

    res.status(200).json({
      success: true,
      data: productoConDisponibilidad
    });
  } catch (error) {
    console.error('Error al obtener implemento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener el implemento' 
    });
  }
};

// Actualizar un implemento
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_producto, cantidad_total } = req.body;

    // Validaciones
    if (!nombre_producto || nombre_producto.trim() === '') {
      return res.status(400).json({ 
        error: 'El nombre del implemento es requerido' 
      });
    }
    
    if (cantidad_total < 0) {
      return res.status(400).json({ 
        error: 'La cantidad no puede ser negativa' 
      });
    }

    const [updated] = await Producto.update({
      nombre_producto: nombre_producto.trim(),
      cantidad_total: cantidad_total
    }, {
      where: { id }
    });

    if (updated) {
      const productoActualizado = await Producto.findByPk(id);
      res.status(200).json({
        success: true,
        message: 'Implemento actualizado exitosamente',
        data: productoActualizado
      });
    } else {
      res.status(404).json({ 
        error: 'Implemento no encontrado' 
      });
    }
  } catch (error) {
    console.error('Error al actualizar implemento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al actualizar el implemento' 
    });
  }
};

// Eliminar un implemento
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el implemento tiene préstamos activos
    const prestamosActivos = await Prestamo.count({
      where: { id_producto: id }
    });

    if (prestamosActivos > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el implemento porque tiene préstamos asociados' 
      });
    }

    const deleted = await Producto.destroy({
      where: { id }
    });

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Implemento eliminado exitosamente'
      });
    } else {
      res.status(404).json({ 
        error: 'Implemento no encontrado' 
      });
    }
  } catch (error) {
    console.error('Error al eliminar implemento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al eliminar el implemento' 
    });
  }
};

// Obtener estadísticas de implementos
exports.getStats = async (req, res) => {
  try {
    const totalImplementos = await Producto.count();
    const implementosConStock = await Producto.count({
      where: {
        cantidad_total: {
          [db.Sequelize.Op.gt]: 0
        }
      }
    });

    const productos = await Producto.findAll({
      include: [{
        model: Prestamo,
        as: 'prestamos',
        required: false
      }]
    });

    let totalStock = 0;
    let totalPrestado = 0;

    productos.forEach(producto => {
      totalStock += producto.cantidad_total;
      const prestado = producto.prestamos.reduce((total, prestamo) => {
        return total + prestamo.cantidad_prestada;
      }, 0);
      totalPrestado += prestado;
    });

    res.status(200).json({
      success: true,
      data: {
        total_implementos: totalImplementos,
        implementos_con_stock: implementosConStock,
        total_stock: totalStock,
        total_prestado: totalPrestado,
        total_disponible: totalStock - totalPrestado
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener las estadísticas' 
    });
  }
};