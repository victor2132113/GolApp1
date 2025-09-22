'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Corregir específicamente la Cancha Sur (ID 3)
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Sur - Campo de Fútbol 5',
      capacidad: 10, // Fútbol 5 típicamente tiene menos jugadores
      horario_inicio: '08:00:00',
      horario_fin: '20:00:00'
    }, {
      id: 3
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Centro - Campo Múltiple',
      capacidad: 10,
      horario_inicio: '08:00:00',
      horario_fin: '20:00:00'
    }, {
      id: 3
    });
  }
};