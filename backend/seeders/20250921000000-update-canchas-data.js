'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Norte - Campo Principal',
      capacidad: 22,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {
      id: 1
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Sur - Campo Secundario',
      capacidad: 14,
      horario_inicio: '07:00:00',
      horario_fin: '21:00:00'
    }, {
      id: 2
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Centro - Campo Múltiple',
      capacidad: 10,
      horario_inicio: '08:00:00',
      horario_fin: '20:00:00'
    }, {
      id: 3
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Este - Campo de Entrenamiento',
      capacidad: 14,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {
      id: 4
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Oeste - Campo Recreativo',
      capacidad: 10,
      horario_inicio: '09:00:00',
      horario_fin: '19:00:00'
    }, {
      id: 5
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Ubicación no especificada',
      capacidad: 22,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {});
  }
};