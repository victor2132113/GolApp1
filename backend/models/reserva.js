'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reserva extends Model {
    static associate(models) {
      Reserva.belongsTo(models.Cancha, {
        foreignKey: 'id_cancha',
        as: 'cancha'
      });
      Reserva.belongsTo(models.Usuario, {
        foreignKey: 'id_usuario',
        as: 'usuario'
      });
      Reserva.hasMany(models.Prestamo, {
        foreignKey: 'id_reserva',
        as: 'prestamos'
      });
    }
  }
  Reserva.init({
    fecha_reserva: DataTypes.DATE,
    hora_inicio: DataTypes.TIME,
    hora_fin: DataTypes.TIME,
    estado: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'finalizada')
  }, {
    sequelize,
    modelName: 'Reserva',
  });
  return Reserva;
};