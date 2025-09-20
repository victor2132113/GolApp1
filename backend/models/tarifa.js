'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tarifa extends Model {
    static associate(models) {
      Tarifa.belongsTo(models.Cancha, {
        foreignKey: 'id_cancha',
        as: 'cancha'
      });
    }
  }
  Tarifa.init({
    precio: DataTypes.DECIMAL(10, 2),
    hora_inicio: DataTypes.TIME,
    hora_fin: DataTypes.TIME,
  }, {
    sequelize,
    modelName: 'Tarifa',
  });
  return Tarifa;
};