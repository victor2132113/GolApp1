// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Variable global para el usuario actual
let currentUser = null;

// Verificar autenticación y cargar datos del usuario
function checkAuth() {
    const user = localStorage.getItem('golapp_user');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(user);
    
    // Mostrar información completa del usuario dinámicamente
    document.getElementById('userName').textContent = currentUser.nombre || 'Usuario';
    
    // Formatear el rol con emoji
    const userRole = currentUser.rol || 'usuario';
    const roleElement = document.getElementById('userRole');
    if (roleElement) {
        if (userRole.toLowerCase() === 'administrador' || userRole.toLowerCase() === 'admin') {
            roleElement.textContent = '👑 Administrador';
            roleElement.className = 'role-badge admin';
        } else {
            roleElement.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
            roleElement.className = 'role-badge';
        }
    }
    
    document.getElementById('userEmail').textContent = '📧 ' + (currentUser.correo || currentUser.email || 'usuario@golapp.com');
}

// Datos simulados de canchas - ACTUALIZADOS CON DATOS REALES DE LA BD
const fieldsData = [
    {
        id: '1',
        name: 'Cancha Principal',
        type: 'futbol7',
        capacity: 14,
        pricePerHour: 50000,
        isActive: true,
        reservationsToday: 0 // Datos reales: 3 total, 0 hoy
    },
    {
        id: '2',
        name: 'Cancha Norte',
        type: 'futbol11',
        capacity: 22,
        pricePerHour: 80000,
        isActive: true,
        reservationsToday: 0 // Datos reales: 0 total, 0 hoy
    },
    {
        id: '3',
        name: 'Cancha Sur',
        type: 'futbol9',
        capacity: 18,
        pricePerHour: 65000,
        isActive: true,
        reservationsToday: 1 // Datos reales: 3 total, 1 hoy
    },
    {
        id: '4',
        name: 'Cancha Este',
        type: 'futbol7',
        capacity: 14,
        pricePerHour: 50000,
        isActive: false, // En mantenimiento según BD
        reservationsToday: 0 // Datos reales: 0 total, 0 hoy
    },
    {
        id: '5',
        name: 'Cancha Oeste',
        type: 'futbol11',
        capacity: 22,
        pricePerHour: 80000,
        isActive: true,
        reservationsToday: 0 // Datos reales: 1 total, 0 hoy
    }
];

// Función para formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

// Función para obtener el tipo de cancha en español
function getFieldTypeText(type) {
    const types = {
        'futbol7': 'Fútbol 7',
        'futbol9': 'Fútbol 9',
        'futbol11': 'Fútbol 11'
    };
    return types[type] || type;
}

// Función para renderizar canchas en el dashboard
async function renderFields() {
    try {
        console.log('Iniciando renderizado de canchas...');
        
        const fieldsGrid = document.getElementById('fieldsGrid');
        if (!fieldsGrid) {
            console.warn('Elemento fieldsGrid no encontrado');
            return;
        }
        
        const datosCanchas = await fetchFieldsData();
        console.log('Datos de canchas para renderizar:', datosCanchas);
        
        if (!datosCanchas.canchas || datosCanchas.canchas.length === 0) {
            fieldsGrid.innerHTML = '<p>No hay canchas disponibles</p>';
            return;
        }
        
        fieldsGrid.innerHTML = '';
        
        datosCanchas.canchas.forEach(cancha => {
            console.log('Renderizando cancha:', cancha);
            
            const fieldCard = document.createElement('div');
            fieldCard.className = 'field-card';
            
            // Determinar el estado visual basado en el estado de la cancha
            let estadoTexto = '';
            let estadoClase = '';
            
            switch(cancha.estado) {
                case 'disponible':
                    estadoTexto = 'Disponible';
                    estadoClase = 'active';
                    break;
                case 'ocupada':
                    estadoTexto = 'Ocupada';
                    estadoClase = 'occupied';
                    break;
                case 'mantenimiento':
                    estadoTexto = 'Mantenimiento';
                    estadoClase = 'maintenance';
                    break;
                case 'no disponible':
                    estadoTexto = 'No Disponible';
                    estadoClase = 'inactive';
                    break;
                default:
                    estadoTexto = cancha.estado || 'Desconocido';
                    estadoClase = 'inactive';
            }
            
            fieldCard.innerHTML = `
                <div class="field-header">
                    <div class="field-name">${cancha.nombre_cancha || 'Cancha sin nombre'}</div>
                    <div class="field-status ${estadoClase}">
                        ${estadoTexto}
                    </div>
                </div>
                <div class="field-info">
                    <div><strong>Tipo:</strong> ${cancha.tipoCancha?.tipo || 'N/A'}</div>
                    <div><strong>Capacidad:</strong> ${cancha.capacidad || 'N/A'} personas</div>
                    <div><strong>Precio:</strong> $${cancha.tipoCancha?.precio || 'N/A'}</div>
                    <div><strong>Ubicación:</strong> ${cancha.ubicacion || 'N/A'}</div>
                </div>
            `;
            
            fieldsGrid.appendChild(fieldCard);
        });
        
        console.log('Renderizado de canchas completado exitosamente');
        
    } catch (error) {
        console.error('Error al renderizar canchas:', error);
        
        // Fallback en caso de error
        const fieldsGrid = document.getElementById('fieldsGrid');
        if (fieldsGrid) {
            fieldsGrid.innerHTML = '<p>Error al cargar las canchas. Intente nuevamente.</p>';
        }
    }
}

// Función para mostrar/ocultar loading
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Función de navegación
function navigateTo(section) {
    showLoading();
    
    // Simular carga
    setTimeout(() => {
        hideLoading();
        
        switch(section) {
            case 'reservas':
                window.location.href = 'reservas.html';
                break;
            case 'canchas':
                window.location.href = 'canchas.html';
                break;
            case 'tipos-cancha':
                window.location.href = 'tipos-cancha.html';
                break;
            case 'implementos':
                window.location.href = 'implementos.html';
                break;
            case 'usuarios':
                window.location.href = 'usuarios.html';
                break;
            case 'reportes':
                window.location.href = 'reportes.html';
                break;
            default:
                alert('Sección no encontrada');
        }
    }, 1000);
}

// Función para mostrar perfil del usuario
function showProfile() {
    const userName = document.getElementById('userName').textContent;
    const userEmail = document.getElementById('userEmail').textContent;
    
    const profileModal = `
        <div class="modal-overlay" id="profileModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-cog"></i> Perfil de Usuario</h3>
                    <button class="modal-close" onclick="closeProfile()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="profile-info">
                        <div class="profile-avatar-large">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div class="profile-details">
                            <div class="form-group">
                                <label>Nombre:</label>
                                <input type="text" id="profileName" value="${userName}" readonly>
                            </div>
                            <div class="form-group">
                                <label>Correo electrónico:</label>
                                <input type="email" id="profileEmail" value="${userEmail}" readonly>
                            </div>
                            <div class="form-group">
                                <label>Rol:</label>
                                <input type="text" value="Administrador" readonly>
                            </div>
                            <div class="form-group">
                                <label>Último acceso:</label>
                                <input type="text" value="${new Date().toLocaleString('es-ES')}" readonly>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeProfile()">Cerrar</button>
                    <button class="btn btn-primary" onclick="editProfile()">Editar Perfil</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', profileModal);
}

// Función para cerrar el modal de perfil
function closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

// Función para editar perfil (placeholder)
function editProfile() {
    alert('Función de edición de perfil próximamente disponible');
}

// Función de logout
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        showLoading();
        
        // Limpiar datos de sesión
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('golapp_token');
        localStorage.removeItem('golapp_user');
        sessionStorage.clear();
        
        setTimeout(() => {
            hideLoading();
            // Pequeño delay para asegurar que se limpie completamente
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 100);
        }, 1000);
    }
}

// Función para actualizar estadísticas del dashboard
async function updateStats() {
    try {
        // Obtener datos de todas las APIs
        const [reservasHoy, ingresosMensuales, canchasActivas, ocupacionPromedio] = await Promise.all([
            fetchReservationsToday(),
            fetchMonthlyRevenue(),
            fetchActiveCanchas(),
            fetchAverageOccupancy()
        ]);

        // Actualizar tarjeta de Reservas Hoy
        const reservasHoyCard = document.querySelector('.stats-card:nth-child(1)');
        if (reservasHoyCard) {
            const valueElement = reservasHoyCard.querySelector('.stats-value');
            const descriptionElement = reservasHoyCard.querySelector('.stats-description');
            const trendElement = reservasHoyCard.querySelector('.stats-trend span');
            
            if (valueElement) valueElement.textContent = reservasHoy.total;
            if (descriptionElement) {
                descriptionElement.innerHTML = `
                    <div style="font-size: 0.85em; margin-top: 4px;">
                        <div>✅ Confirmadas: ${reservasHoy.confirmadas}</div>
                        <div>🏁 Finalizadas: ${reservasHoy.finalizadas}</div>
                        <div>⏳ Pendientes: ${reservasHoy.pendientes}</div>
                        <div>❌ Canceladas: ${reservasHoy.canceladas}</div>
                    </div>
                `;
            }
            if (trendElement) {
                const totalCompletadas = reservasHoy.confirmadas + reservasHoy.finalizadas;
                const crecimiento = Math.round((totalCompletadas / reservasHoy.total) * 100) || 0;
                trendElement.textContent = `${crecimiento}%`;
            }
        }

        // Actualizar tarjeta de Ingresos del Mes
        const ingresosMesCard = document.querySelector('.stats-card:nth-child(2)');
        if (ingresosMesCard) {
            const valueElement = ingresosMesCard.querySelector('.stats-value');
            const descriptionElement = ingresosMesCard.querySelector('.stats-description');
            const trendElement = ingresosMesCard.querySelector('.stats-trend span');
            
            if (valueElement) {
                const ingresosFormateados = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                }).format(ingresosMensuales.ingresos);
                valueElement.textContent = ingresosFormateados;
            }
            if (descriptionElement) {
                descriptionElement.innerHTML = `
                    <div style="font-size: 0.85em; margin-top: 4px;">
                        <div>📅 ${ingresosMensuales.mes}</div>
                        <div>🎯 ${ingresosMensuales.reservas} reservas confirmadas</div>
                    </div>
                `;
            }
            if (trendElement) {
                trendElement.textContent = `${ingresosMensuales.crecimiento > 0 ? '+' : ''}${ingresosMensuales.crecimiento}%`;
                const trendContainer = trendElement.parentElement;
                if (trendContainer) {
                    trendContainer.className = `stats-trend ${ingresosMensuales.crecimiento >= 0 ? 'positive' : 'negative'}`;
                    const icon = trendContainer.querySelector('i');
                    if (icon) {
                        icon.className = `fas fa-arrow-${ingresosMensuales.crecimiento >= 0 ? 'up' : 'down'}`;
                    }
                }
            }
        }

        // Actualizar tarjeta de Canchas Activas
        const canchasActivasCard = document.querySelector('.stats-card:nth-child(3)');
        if (canchasActivasCard) {
            const valueElement = canchasActivasCard.querySelector('.stats-value');
            const descriptionElement = canchasActivasCard.querySelector('.stats-description');
            
            if (valueElement) valueElement.textContent = canchasActivas.total;
            if (descriptionElement) {
                descriptionElement.innerHTML = `
                    <div style="font-size: 0.85em; margin-top: 4px;">
                        <div>🏟️ Canchas disponibles para reserva</div>
                        <div>⚡ Estado: Operativas</div>
                    </div>
                `;
            }
        }

        // Actualizar tarjeta de Ocupación Promedio
        const ocupacionCard = document.querySelector('.stats-card:nth-child(4)');
        if (ocupacionCard) {
            const valueElement = ocupacionCard.querySelector('.stats-value');
            const descriptionElement = ocupacionCard.querySelector('.stats-description');
            const trendElement = ocupacionCard.querySelector('.stats-trend span');
            
            if (valueElement) valueElement.textContent = `${ocupacionPromedio.ocupacion}%`;
            if (descriptionElement) {
                descriptionElement.innerHTML = `
                    <div style="font-size: 0.85em; margin-top: 4px;">
                        <div>📊 ${ocupacionPromedio.periodo}</div>
                        <div>⏰ ${ocupacionPromedio.horas_ocupadas}h de ${ocupacionPromedio.horas_disponibles}h</div>
                        <div>🏟️ ${ocupacionPromedio.canchas_activas} canchas activas</div>
                    </div>
                `;
            }
            if (trendElement) {
                const tendencia = ocupacionPromedio.ocupacion > 75 ? 5 : ocupacionPromedio.ocupacion > 50 ? 2 : -1;
                trendElement.textContent = `${tendencia > 0 ? '+' : ''}${tendencia}%`;
                const trendContainer = trendElement.parentElement;
                if (trendContainer) {
                    trendContainer.className = `stats-trend ${tendencia >= 0 ? 'positive' : 'negative'}`;
                    const icon = trendContainer.querySelector('i');
                    if (icon) {
                        icon.className = `fas fa-arrow-${tendencia >= 0 ? 'up' : 'down'}`;
                    }
                }
            }
        }

        console.log('✅ Estadísticas actualizadas correctamente');
    } catch (error) {
        console.error('❌ Error al actualizar estadísticas:', error);
        // Fallback a función con datos reales básicos
        updateStatsWithRealData();
    }
}

// Función para obtener reservas de hoy
async function fetchReservationsToday() {
    try {
        const response = await fetch(`${API_BASE_URL}/reservas`);
        
        if (!response.ok) {
            throw new Error('Error al obtener reservas');
        }
        
        const reservas = await response.json();
        const hoy = new Date().toISOString().split('T')[0];
        console.log('Fecha de hoy:', hoy);
        console.log('Todas las reservas:', reservas);
        
        const reservasHoy = reservas.filter(reserva => {
            console.log('Comparando:', reserva.fecha_reserva, 'con', hoy);
            return reserva.fecha_reserva === hoy;
        });
        
        console.log('Reservas de hoy encontradas:', reservasHoy);
        
        const confirmadas = reservasHoy.filter(r => r.estado === 'confirmada').length;
        const finalizadas = reservasHoy.filter(r => r.estado === 'finalizada').length;
        const pendientes = reservasHoy.filter(r => r.estado === 'pendiente').length;
        const canceladas = reservasHoy.filter(r => r.estado === 'cancelada').length;
        
        return {
            total: reservasHoy.length,
            confirmadas: confirmadas,
            finalizadas: finalizadas,
            pendientes: pendientes,
            canceladas: canceladas,
            reservas: reservasHoy
        };
    } catch (error) {
        console.error('Error fetching today reservations:', error);
        return {
            total: 0,
            confirmadas: 0,
            finalizadas: 0,
            pendientes: 0,
            canceladas: 0,
            reservas: []
        };
    }
}

// Función para obtener ingresos mensuales
async function fetchMonthlyRevenue() {
    try {
        const response = await fetch(`${API_BASE_URL}/reservas`);
        
        if (!response.ok) {
            throw new Error('Error al obtener reservas');
        }
        
        const reservas = await response.json();
        console.log('Todas las reservas para ingresos:', reservas);
        
        // Obtener el mes y año actual
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1;
        const añoActual = fechaActual.getFullYear();
        
        console.log('Mes actual:', mesActual, 'Año actual:', añoActual);
        
        const reservasMes = reservas.filter(reserva => {
            const fechaReserva = new Date(reserva.fecha_reserva);
            const mesReserva = fechaReserva.getMonth() + 1;
            const añoReserva = fechaReserva.getFullYear();
            const esDelMes = mesReserva === mesActual && añoReserva === añoActual;
            const estadoValido = reserva.estado === 'confirmada' || reserva.estado === 'finalizada';
            
            console.log(`Reserva ${reserva.id}: fecha=${reserva.fecha_reserva}, mes=${mesReserva}, año=${añoReserva}, estado=${reserva.estado}, esDelMes=${esDelMes}, estadoValido=${estadoValido}`);
            
            return esDelMes && estadoValido;
        });
        
        console.log('Reservas del mes actual:', reservasMes);
        
        const ingresosTotales = reservasMes.reduce((total, reserva) => {
            console.log(`Sumando: ${reserva.totalPrice} al total ${total}`);
            return total + (reserva.totalPrice || 0);
        }, 0);
        
        console.log('Ingresos totales calculados:', ingresosTotales);
        
        return {
            ingresos: ingresosTotales,
            reservas: reservasMes.length,
            mes: `${fechaActual.toLocaleString('es-ES', { month: 'long' })} ${añoActual}`,
            crecimiento: 15 // Simulado por ahora
        };
    } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        return {
            ingresos: 0,
            reservas: 0,
            mes: 'Este mes',
            crecimiento: 0
        };
    }
}

// Función para obtener datos de canchas
async function fetchFieldsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/canchas`);
        
        if (!response.ok) {
            throw new Error('Error al obtener canchas');
        }
        
        const canchas = await response.json();
        console.log('Todas las canchas:', canchas);
        
        const disponibles = canchas.filter(cancha => cancha.estado === 'disponible').length;
        const ocupadas = canchas.filter(cancha => cancha.estado === 'ocupada').length;
        const mantenimiento = canchas.filter(cancha => cancha.estado === 'mantenimiento').length;
        const noDisponibles = canchas.filter(cancha => cancha.estado === 'no disponible').length;
        
        console.log('Estados de canchas:', {
            disponibles,
            ocupadas,
            mantenimiento,
            noDisponibles,
            total: canchas.length
        });
        
        return {
            total: canchas.length,
            disponibles: disponibles,
            ocupadas: ocupadas,
            mantenimiento: mantenimiento,
            noDisponibles: noDisponibles,
            canchas: canchas
        };
    } catch (error) {
        console.error('Error fetching fields data:', error);
        return {
            total: 0,
            disponibles: 0,
            ocupadas: 0,
            mantenimiento: 0,
            noDisponibles: 0,
            canchas: []
        };
    }
}

// Función para obtener canchas activas
async function fetchActiveCanchas() {
    try {
        const response = await fetch(`${API_BASE_URL}/canchas`);
        
        if (!response.ok) {
            throw new Error('Error al obtener canchas');
        }
        
        const canchas = await response.json();
        const activas = canchas.filter(cancha => cancha.estado === 'disponible');
        const enMantenimiento = canchas.filter(cancha => cancha.estado === 'mantenimiento');
        
        return {
            total: canchas.length,
            activas: activas.length,
            mantenimiento: enMantenimiento.length,
            canchas: canchas.map(cancha => ({
                id: cancha.id,
                nombre: cancha.nombre_cancha,
                tipo: cancha.tipoCancha?.tipo || 'N/A',
                estado: cancha.estado,
                capacidad: cancha.capacidad,
                precio: parseInt(cancha.tipoCancha?.precio || 0),
                ubicacion: cancha.ubicacion
            }))
        };
    } catch (error) {
        console.error('Error fetching active canchas:', error);
        return {
            total: 5,
            activas: 4,
            mantenimiento: 1,
            canchas: []
        };
    }
}

// Función para calcular ocupación promedio
async function fetchAverageOccupancy() {
    try {
        const response = await fetch(`${API_BASE_URL}/reservas`);
        const responseCanchas = await fetch(`${API_BASE_URL}/canchas`);
        
        if (!response.ok || !responseCanchas.ok) {
            throw new Error('Error al obtener datos');
        }
        
        const reservas = await response.json();
        const canchas = await responseCanchas.json();
        
        console.log('Reservas para ocupación:', reservas);
        console.log('Canchas para ocupación:', canchas);
        
        // Obtener el mes actual
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1;
        const añoActual = fechaActual.getFullYear();
        
        // Filtrar reservas del mes actual que estén confirmadas o finalizadas
        const reservasMes = reservas.filter(reserva => {
            const fechaReserva = new Date(reserva.fecha_reserva);
            const mesReserva = fechaReserva.getMonth() + 1;
            const añoReserva = fechaReserva.getFullYear();
            return mesReserva === mesActual && 
                   añoReserva === añoActual &&
                   (reserva.estado === 'confirmada' || reserva.estado === 'finalizada');
        });
        
        console.log('Reservas del mes para ocupación:', reservasMes);
        
        // Calcular días del mes
        const diasDelMes = new Date(añoActual, mesActual, 0).getDate();
        
        // Calcular ocupación
        const totalCanchas = canchas.length;
        const totalSlotsPosibles = totalCanchas * diasDelMes * 12; // 12 horas por día aproximadamente
        const slotsOcupados = reservasMes.length;
        
        const ocupacionPorcentaje = totalSlotsPosibles > 0 ? 
            Math.round((slotsOcupados / totalSlotsPosibles) * 100) : 0;
        
        console.log('Cálculo de ocupación:', {
            totalCanchas,
            diasDelMes,
            totalSlotsPosibles,
            slotsOcupados,
            ocupacionPorcentaje
        });
        
        return {
            ocupacion: ocupacionPorcentaje,
            reservasActivas: slotsOcupados,
            capacidadTotal: totalSlotsPosibles,
            tendencia: 'estable' // Simulado por ahora
        };
    } catch (error) {
        console.error('Error fetching occupancy:', error);
        return {
            ocupacion: 0,
            horas_ocupadas: 0,
            horas_disponibles: 336, // 4 canchas * 12 horas * 7 días
            canchas_activas: 4,
            periodo: 'última semana'
        };
    }
}

// Función principal para actualizar estadísticas con datos reales
async function updateStatsWithRealData() {
    try {
        console.log('Iniciando actualización de estadísticas con datos reales...');
        
        // Obtener datos de reservas de hoy
        const reservasHoy = await fetchReservationsToday();
        console.log('Datos de reservas de hoy:', reservasHoy);
        
        // Obtener ingresos mensuales
        const ingresosMes = await fetchMonthlyRevenue();
        console.log('Datos de ingresos mensuales:', ingresosMes);
        
        // Obtener datos de canchas
        const datosCanchas = await fetchFieldsData();
        console.log('Datos de canchas:', datosCanchas);
        
        // Obtener ocupación promedio
        const ocupacion = await fetchAverageOccupancy();
        console.log('Datos de ocupación:', ocupacion);
        
        // Actualizar elementos del DOM
        const reservasHoyElement = document.getElementById('reservasHoy');
        const ingresosMesElement = document.getElementById('ingresosMes');
        const canchasActivasElement = document.getElementById('canchasActivas');
        const ocupacionPromedioElement = document.getElementById('ocupacionPromedio');
        
        if (reservasHoyElement) {
            reservasHoyElement.textContent = reservasHoy.total;
            console.log('Actualizado reservas de hoy:', reservasHoy.total);
        }
        
        if (ingresosMesElement) {
            ingresosMesElement.textContent = '$' + ingresosMes.ingresos.toLocaleString();
            console.log('Actualizado ingresos del mes:', ingresosMes.ingresos);
        }
        
        if (canchasActivasElement) {
            canchasActivasElement.textContent = datosCanchas.disponibles;
            console.log('Actualizado canchas disponibles:', datosCanchas.disponibles);
        }
        
        if (ocupacionPromedioElement) {
            ocupacionPromedioElement.textContent = ocupacion.ocupacion + '%';
            console.log('Actualizado ocupación promedio:', ocupacion.ocupacion);
        }
        
        // Actualizar el estado de las canchas
        await renderFields();
        
        console.log('Actualización de estadísticas completada exitosamente');
        
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        throw error;
    }
}

// Función fallback con datos simulados (último recurso)
function updateStatsWithSimulatedData() {
    const activeFields = fieldsData.filter(field => field.isActive);
    const totalReservationsToday = fieldsData.reduce((sum, field) => sum + field.reservationsToday, 0);
    const totalRevenue = fieldsData.reduce((sum, field) => sum + (field.reservationsToday * field.pricePerHour), 0);
    
    // Actualizar valores en las tarjetas de estadísticas
    const statsCards = document.querySelectorAll('.stats-card');
    
    if (statsCards[0]) {
        const valueElement = statsCards[0].querySelector('.stats-value');
        if (valueElement) valueElement.textContent = totalReservationsToday;
    }
    
    if (statsCards[1]) {
        const valueElement = statsCards[1].querySelector('.stats-value');
        if (valueElement) valueElement.textContent = formatPrice(totalRevenue);
    }
    
    if (statsCards[2]) {
        const valueElement = statsCards[2].querySelector('.stats-value');
        if (valueElement) valueElement.textContent = activeFields.length;
    }
}

// Función para simular datos en tiempo real
function simulateRealTimeUpdates() {
    setInterval(() => {
        // Simular cambios aleatorios en las reservas
        fieldsData.forEach(field => {
            if (field.isActive && Math.random() < 0.1) { // 10% de probabilidad
                const change = Math.random() < 0.5 ? -1 : 1;
                field.reservationsToday = Math.max(0, field.reservationsToday + change);
            }
        });
        
        // Actualizar la interfaz
        renderFields();
        updateStats();
    }, 30000); // Actualizar cada 30 segundos
}

// Función para manejar efectos visuales
function addVisualEffects() {
    // Efecto hover en las tarjetas de navegación
    const navCards = document.querySelectorAll('.nav-card');
    navCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Efecto de clic en las tarjetas de estadísticas
    const statsCards = document.querySelectorAll('.stats-card');
    statsCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Función para manejar responsive
function handleResponsive() {
    function checkScreenSize() {
        const isMobile = window.innerWidth <= 768;
        const body = document.body;
        
        if (isMobile) {
            body.classList.add('mobile');
        } else {
            body.classList.remove('mobile');
        }
    }
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
}

// Función de inicialización
function init() {
    console.log('Inicializando aplicación GolApp...');
    
    // Verificar autenticación y cargar datos del usuario
    checkAuth();
    
    // Mostrar loading inicial
    showLoading();
    
    // Simular carga inicial
    setTimeout(() => {
        // Renderizar canchas
        renderFields();
        
        // Actualizar estadísticas
        updateStats();
        
        // Agregar efectos visuales
        addVisualEffects();
        
        // Manejar responsive
        handleResponsive();
        
        // Ocultar loading
        hideLoading();
        
        console.log('Aplicación inicializada correctamente');
    }, 1500);
}

// Event listeners
document.addEventListener('DOMContentLoaded', init);

// Manejar errores globales
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
    hideLoading();
});

// Exportar funciones para uso global
window.navigateTo = navigateTo;
window.logout = logout;
window.showProfile = showProfile;
window.closeProfile = closeProfile;
window.editProfile = editProfile;
