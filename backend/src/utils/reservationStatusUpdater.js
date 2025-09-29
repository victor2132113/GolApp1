const db = require('../../models');
const Reserva = db.Reserva;

/**
 * Actualiza automáticamente el estado de las reservas según su fecha y hora
 */
async function updateReservationStatuses() {
    try {
        // Usar la hora local del sistema (Colombia)
        const now = new Date();
        console.log('Actualizando estados de reservas...', now.toISOString());
        console.log('Hora actual local:', now.toLocaleString('es-CO', { timeZone: 'America/Bogota' }));

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
        // Usar fecha local de Colombia correctamente
        const colombiaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 para Colombia
        const today = colombiaTime.toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
        const currentHour = colombiaTime.getUTCHours();
        const currentMinute = colombiaTime.getUTCMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute; // Convertir a minutos desde medianoche
        
        console.log(`Comparando con fecha: ${today} y hora: ${currentHour}:${currentMinute.toString().padStart(2, '0')} (${currentTimeInMinutes} minutos)`);
        
        // Obtener todas las reservas confirmadas para evaluar manualmente
        const reservasConfirmadas = await Reserva.findAll({
            where: {
                estado: 'confirmada'
            }
        });
        
        let completedUpdated = 0;
        
        for (const reserva of reservasConfirmadas) {
            // Convertir fecha_reserva a Date si es string
            let fechaReserva;
            if (typeof reserva.fecha_reserva === 'string') {
                fechaReserva = reserva.fecha_reserva; // Ya está en formato YYYY-MM-DD
            } else {
                fechaReserva = reserva.fecha_reserva.toISOString().split('T')[0];
            }
            
            let debeActualizar = false;
            
            // Si es una fecha pasada, actualizar
            if (fechaReserva < today) {
                debeActualizar = true;
                console.log(`Reserva ${reserva.id}: Fecha pasada (${fechaReserva} < ${today})`);
            }
            // Si es hoy, verificar la hora
            else if (fechaReserva === today) {
                // Convertir hora_fin a minutos
                const [horaFin, minutoFin] = reserva.hora_fin.split(':').map(Number);
                const horaFinEnMinutos = horaFin * 60 + minutoFin;
                
                // Solo actualizar si la hora de fin YA PASÓ (es menor que la hora actual)
                if (horaFinEnMinutos < currentTimeInMinutes) {
                    debeActualizar = true;
                    console.log(`Reserva ${reserva.id}: Hora pasada (${reserva.hora_fin} < ${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
                }
            }
            
            if (debeActualizar) {
                await Reserva.update(
                    { estado: 'finalizada' },
                    { where: { id: reserva.id } }
                );
                completedUpdated++;
            }
        }

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
    
    // Ejecutar cada hora para evaluar reservas según horarios
    setInterval(updateReservationStatuses, 60 * 60 * 1000);
}

module.exports = {
    updateReservationStatuses,
    startAutomaticStatusUpdater
};