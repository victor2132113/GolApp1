// backend/models/cancha.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cancha extends Model {
    static associate(models) {
      // Una Cancha pertenece a un TipoCancha
      Cancha.belongsTo(models.TipoCancha, {
        foreignKey: 'id_tipo',
        as: 'tipoCancha'
      });
      // Una Cancha tiene muchas Tarifas
      Cancha.hasMany(models.Tarifa, {
        foreignKey: 'id_cancha',
        as: 'tarifas'
      });
      // Una Cancha tiene muchas Reservas
      Cancha.hasMany(models.Reserva, {
        foreignKey: 'id_cancha',
        as: 'reservas'
      });
    }
  }
  Cancha.init({
    nombre_cancha: DataTypes.STRING,
    estado: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Cancha',
  });
  return Cancha;
};