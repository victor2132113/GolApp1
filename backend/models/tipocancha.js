// backend/models/tipocancha.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TipoCancha extends Model {
    static associate(models) {
      // Una TipoCancha tiene muchas Canchas
      TipoCancha.hasMany(models.Cancha, {
        foreignKey: 'id_tipo',
        as: 'canchas'
      });
    }
  }
  TipoCancha.init({
    tipo: DataTypes.STRING,
    // La columna en BD es VARCHAR(20)
    precio: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TipoCancha',
  });
  return TipoCancha;
};