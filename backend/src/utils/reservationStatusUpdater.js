const db = require('../../models');
const Reserva = db.Reserva;

/**
 * Actualiza automáticamente el estado de las reservas según su fecha y hora
 */
async function updateReservationStatuses() {
    try {
        const now = new Date();
        console.log('Actualizando estados de reservas...', now.toISOString());

        // Actualizar reservas pendientes a confirmadas (automáticamente después de 1 hora de creación)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const [pendingUpdated] = await Reserva.update(
            { estado: 'confirmada' },
            {
                where: {
                    estado: 'pendiente',
                    createdAt: {
                        [db.Sequelize.Op.lte]: oneHourAgo
                    }
                }
            }
        );

        console.log(`${pendingUpdated} reservas pendientes actualizadas a confirmadas`);

        // Actualizar reservas confirmadas a finalizada cuando pase la fecha y hora
        const [completedUpdated] = await Reserva.update(
            { estado: 'finalizada' },
            {
                where: {
                    estado: 'confirmada',
                    hora_fin: {
                        [db.Sequelize.Op.lt]: now
                    }
                }
            }
        );

        console.log(`${completedUpdated} reservas confirmadas actualizadas a finalizadas`);

        return {
            pendingToConfirmed: pendingUpdated,
            confirmedToCompleted: completedUpdated
        };

    } catch (error) {
        console.error('Error actualizando estados de reservas:', error);
        throw error;
    }
}

/**
 * Inicia el proceso automático de actualización de estados
 */
function startAutomaticStatusUpdater() {
    console.log('Iniciando actualizador automático de estados de reservas...');
    
    // Ejecutar inmediatamente
    updateReservationStatuses();
    
    // Ejecutar cada 30 minutos
    setInterval(updateReservationStatuses, 30 * 60 * 1000);
}

module.exports = {
    updateReservationStatuses,
    startAutomaticStatusUpdater
};