'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Corregir Cancha Principal (ID 1) - Ya está bien
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Principal',
      ubicacion: 'Sector Norte - Campo Principal',
      capacidad: 22,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {
      id: 1
    });

    // Corregir Cancha Norte (ID 2) - Nombre y ubicación no coinciden
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Norte',
      ubicacion: 'Sector Norte - Campo Secundario',
      capacidad: 14,
      horario_inicio: '07:00:00',
      horario_fin: '21:00:00'
    }, {
      id: 2
    });

    // Cancha Sur (ID 3) - Ya está corregida
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Sur',
      ubicacion: 'Sector Sur - Campo de Fútbol 5',
      capacidad: 10,
      horario_inicio: '08:00:00',
      horario_fin: '20:00:00'
    }, {
      id: 3
    });

    // Corregir Cancha Este (ID 4) - Ya está bien
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Este',
      ubicacion: 'Sector Este - Campo de Entrenamiento',
      capacidad: 14,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {
      id: 4
    });

    // Corregir Cancha Oeste (ID 5) - Ya está bien
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Oeste',
      ubicacion: 'Sector Oeste - Campo Recreativo',
      capacidad: 10,
      horario_inicio: '09:00:00',
      horario_fin: '19:00:00'
    }, {
      id: 5
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios si es necesario
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Ubicación no especificada',
      capacidad: 22,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {});
  }
};