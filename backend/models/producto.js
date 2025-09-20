'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {
      Producto.hasMany(models.Prestamo, {
        foreignKey: 'id_producto',
        as: 'prestamos'
      });
    }
  }
  Producto.init({
    nombre_producto: DataTypes.STRING,
    cantidad_total: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Producto',
  });
  return Producto;
};