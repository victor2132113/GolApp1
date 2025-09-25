'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Prestamo extends Model {
    static associate(models) {
      Prestamo.belongsTo(models.Reserva, {
        foreignKey: 'id_reserva',
        as: 'reserva'
      });
      Prestamo.belongsTo(models.Producto, {
        foreignKey: 'id_producto',
        as: 'producto'
      });
    }
  }
  Prestamo.init({
    cantidad_prestada: DataTypes.INTEGER,
    estado: {
      type: DataTypes.ENUM('activo', 'devuelto', 'vencido', 'perdido', 'dañado'),
      allowNull: false,
      defaultValue: 'activo',
      validate: {
        isIn: [['activo', 'devuelto', 'vencido', 'perdido', 'dañado']]
      }
    }
  }, {
    sequelize,
    modelName: 'Prestamo',
  });
  return Prestamo;
};