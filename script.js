// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Variable global para el usuario actual
let currentUser = null;

// Verificar autenticación y cargar datos del usuario
function checkAuth() {
    console.log('🔐 Verificando autenticación...');
    
    const user = localStorage.getItem('golapp_user');
    if (!user) {
        console.log('⚠️ No hay usuario autenticado, redirigiendo al login');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(user);
        console.log('✅ Usuario autenticado:', currentUser.nombre);
        
        // Mostrar información completa del usuario dinámicamente
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = currentUser.nombre || 'Usuario';
        }
        
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
        
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = '📧 ' + (currentUser.correo || currentUser.email || 'usuario@golapp.com');
        }
        
    } catch (error) {
        console.error('❌ Error al parsear datos del usuario:', error);
        window.location.href = 'login.html';
    }
}

// Variables globales para datos reales
let fieldsData = [];
let reservasData = [];
let dashboardStats = {
    reservasHoy: 0,
    ingresosMes: 0,
    canchasActivas: 0,
    ocupacionPromedio: 0
};

// Función para cargar datos reales desde la API
async function loadRealData() {
    console.log('🔄 Iniciando carga de datos reales...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    try {
        showLoading();
        
        // Cargar canchas
        console.log('📡 Cargando canchas desde:', `${API_BASE_URL}/canchas`);
        const canchasResponse = await fetch(`${API_BASE_URL}/canchas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📊 Respuesta canchas:', {
            status: canchasResponse.status,
            ok: canchasResponse.ok,
            statusText: canchasResponse.statusText
        });
        
        if (canchasResponse.ok) {
            const canchasOriginales = await canchasResponse.json();
            console.log('✅ Canchas cargadas:', canchasOriginales.length, 'canchas');
            console.log('📋 Datos de canchas:', canchasOriginales);
            
            fieldsData = canchasOriginales.map(cancha => ({
                id: cancha.id,
                name: cancha.nombre_cancha,
                type: cancha.TipoCancha?.nombre || cancha.tipoCancha?.nombre || 'Fútbol',
                capacity: cancha.capacidad,
                pricePerHour: parseInt(cancha.tipoCancha?.precio) || parseInt(cancha.TipoCancha?.precio) || 50000,
                isActive: cancha.estado === 'disponible',
                reservationsToday: 0, // Se calculará con las reservas
                ubicacion: cancha.ubicacion,
                horario_inicio: cancha.horario_inicio,
                horario_fin: cancha.horario_fin
            }));
            console.log('🏟️ fieldsData procesado:', fieldsData.length, 'elementos');
            console.log('🔍 Primer elemento fieldsData:', fieldsData[0]);
            
            // Guardar datos originales para cálculos
            window.canchasOriginales = canchasOriginales;
        } else {
            console.error('❌ Error al cargar canchas:', {
                status: canchasResponse.status,
                statusText: canchasResponse.statusText
            });
            throw new Error(`Error ${canchasResponse.status}: ${canchasResponse.statusText}`);
        }
        
        // Cargar reservas
        console.log('📡 Cargando reservas desde:', `${API_BASE_URL}/reservas`);
        const reservasResponse = await fetch(`${API_BASE_URL}/reservas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📊 Respuesta reservas:', {
            status: reservasResponse.status,
            ok: reservasResponse.ok,
            statusText: reservasResponse.statusText
        });
        
        if (reservasResponse.ok) {
            reservasData = await reservasResponse.json();
            console.log('✅ Reservas cargadas:', reservasData.length, 'reservas');
            console.log('📋 Datos de reservas:', reservasData.slice(0, 3)); // Mostrar solo las primeras 3
            
            // Calcular estadísticas reales usando los datos originales del backend
            console.log('🧮 Calculando estadísticas con datos reales...');
            dashboardStats = calculateDashboardStats(window.canchasOriginales, reservasData);
            console.log('📈 Estadísticas calculadas:', dashboardStats);
            
            // Calcular estadísticas adicionales y actualizar conteo por cancha
            calculateRealStats();
        } else {
            console.error('❌ Error al cargar reservas:', {
                status: reservasResponse.status,
                statusText: reservasResponse.statusText
            });
            throw new Error(`Error ${reservasResponse.status}: ${reservasResponse.statusText}`);
        }
        
        hideLoading();
        
        // Actualizar la interfaz con datos reales
        console.log('🎨 Actualizando interfaz...');
        renderFields();
        updateStats();
        console.log('✅ Carga de datos completada exitosamente');
        
    } catch (error) {
        console.error('💥 Error cargando datos reales:', error);
        console.error('🔍 Detalles del error:', {
            message: error.message,
            stack: error.stack
        });
        
        hideLoading();
        
        // Mostrar mensaje de error al usuario
        showErrorMessage(`Error al cargar los datos: ${error.message}`);
        
        // Usar datos de fallback para que la aplicación no se rompa
        console.log('🔄 Usando datos de fallback...');
        useFallbackData();
    }
}

// Función para usar datos de fallback cuando falla la carga
function useFallbackData() {
    console.log('📦 Cargando datos de fallback...');
    
    // Datos de fallback para canchas
    fieldsData = [
        {
            id: 1,
            name: "Cancha Principal",
            type: "Fútbol",
            capacity: 22,
            pricePerHour: 50000,
            isActive: true,
            reservationsToday: 3,
            ubicacion: "Sector Central"
        },
        {
            id: 2,
            name: "Cancha Norte",
            type: "Fútbol",
            capacity: 22,
            pricePerHour: 50000,
            isActive: false,
            reservationsToday: 0,
            ubicacion: "Sector Norte"
        }
    ];
    
    // Datos de fallback para estadísticas
    dashboardStats = {
        reservasHoy: 12,
        ingresosMes: 450000,
        canchasActivas: 8,
        ocupacionPromedio: 78
    };
    
    // Actualizar interfaz con datos de fallback
    renderFields();
    updateStats();
    
    console.log('✅ Datos de fallback cargados');
}

// Función para calcular estadísticas reales
// Función para calcular estadísticas del dashboard
function calculateDashboardStats(canchas, reservas) {
    console.log('📊 Calculando estadísticas del dashboard...');
    console.log('📋 Canchas recibidas:', canchas?.length || 0);
    console.log('📋 Reservas recibidas:', reservas?.length || 0);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    console.log('📅 Fecha de hoy:', todayStr);
    console.log('📅 Mes actual:', currentMonth + 1, 'Año:', currentYear);
    
    // Calcular reservas de hoy
    const reservasHoy = reservas ? reservas.filter(reserva => {
        try {
            // Intentar diferentes formatos de fecha
            let reservaDate;
            if (reserva.fecha) {
                reservaDate = new Date(reserva.fecha).toISOString().split('T')[0];
            } else if (reserva.fecha_reserva) {
                reservaDate = new Date(reserva.fecha_reserva).toISOString().split('T')[0];
            } else {
                console.warn('⚠️ Reserva sin fecha válida:', reserva);
                return false;
            }
            return reservaDate === todayStr;
        } catch (error) {
            console.warn('⚠️ Error procesando fecha de reserva:', reserva, error);
            return false;
        }
    }).length : 0;
    
    console.log('📊 Reservas de hoy calculadas:', reservasHoy);
    
    // Calcular ingresos del mes
    const ingresosMes = reservas ? reservas.filter(reserva => {
        try {
            let reservaDate;
            if (reserva.fecha) {
                reservaDate = new Date(reserva.fecha);
            } else if (reserva.fecha_reserva) {
                reservaDate = new Date(reserva.fecha_reserva);
            } else {
                return false;
            }
            
            return reservaDate.getMonth() === currentMonth && 
                   reservaDate.getFullYear() === currentYear &&
                   (reserva.estado === 'confirmada' || reserva.estado === 'finalizada' || reserva.estado === 'pagada');
        } catch (error) {
            console.warn('⚠️ Error procesando fecha para ingresos:', reserva, error);
            return false;
        }
    }).reduce((total, reserva) => {
        // Usar totalPrice primero, luego precio o monto
        const precio = parseFloat(reserva.totalPrice) || parseFloat(reserva.precio) || parseFloat(reserva.monto) || 0;
        console.log('💰 Sumando precio de reserva:', precio, 'Estado:', reserva.estado);
        return total + precio;
    }, 0) : 0;
    
    console.log('💰 Ingresos del mes calculados:', ingresosMes);
    
    // Calcular canchas activas
    console.log('🔍 Datos de canchas recibidos para cálculo:', canchas);
    const canchasActivas = canchas ? canchas.filter(cancha => {
        console.log(`🏟️ Evaluando cancha ${cancha.nombre_cancha}: estado="${cancha.estado}"`);
        return cancha.estado === 'disponible' || cancha.estado === 'activa';
    }).length : 0;
    
    console.log('🏟️ Canchas activas calculadas:', canchasActivas);
    console.log('📊 Total de canchas:', canchas ? canchas.length : 0);
    console.log('📋 Estados de canchas:', canchas ? canchas.map(c => `${c.nombre_cancha}: ${c.estado}`).join(', ') : 'No hay canchas');
    
    // Calcular ocupación promedio (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const reservasUltimaSemana = reservas ? reservas.filter(reserva => {
        try {
            let reservaDate;
            if (reserva.fecha) {
                reservaDate = new Date(reserva.fecha);
            } else if (reserva.fecha_reserva) {
                reservaDate = new Date(reserva.fecha_reserva);
            } else {
                return false;
            }
            return reservaDate >= sevenDaysAgo && reservaDate <= today;
        } catch (error) {
            console.warn('⚠️ Error procesando fecha para ocupación:', reserva, error);
            return false;
        }
    }) : [];
    
    // Calcular ocupación basada en horarios disponibles vs reservados
    const totalSlotsDisponibles = canchasActivas * 7 * 12; // 7 días * 12 horas por día
    const slotsReservados = reservasUltimaSemana.length;
    const ocupacionPromedio = totalSlotsDisponibles > 0 ? 
        Math.round((slotsReservados / totalSlotsDisponibles) * 100) : 0;
    
    console.log('📈 Ocupación promedio calculada:', ocupacionPromedio + '%');
    
    const stats = {
        reservasHoy,
        ingresosMes,
        canchasActivas,
        ocupacionPromedio
    };
    
    console.log('✅ Estadísticas finales calculadas:', stats);
    return stats;
}

function calculateRealStats() {
    // Definir variables de fecha
    const today = new Date();
    const hoy = today.toISOString().split('T')[0];
    const mesActual = today.getMonth() + 1;
    const añoActual = today.getFullYear();
    
    console.log('📅 Calculando estadísticas reales para:', hoy);
    
    // Reservas de hoy
    const reservasHoy = reservasData.filter(reserva => {
        const fechaReserva = reserva.fecha_reserva.split('T')[0];
        const esHoy = fechaReserva === hoy;
        if (esHoy) {
            console.log('✅ Reserva de hoy encontrada:', reserva.id, fechaReserva);
        }
        return esHoy;
    });
    
    // Reservas del mes actual
    const reservasMes = reservasData.filter(reserva => {
        const fechaReserva = new Date(reserva.fecha_reserva);
        const esMesActual = fechaReserva.getMonth() + 1 === mesActual && 
               fechaReserva.getFullYear() === añoActual;
        return esMesActual;
    });
    
    console.log('📈 Reservas de hoy:', reservasHoy.length);
    console.log('📈 Reservas del mes:', reservasMes.length);
    
    // Calcular ingresos del mes usando datos reales
    let ingresosMes = 0;
    reservasMes.forEach(reserva => {
        // Usar el totalPrice si está disponible, sino calcular
        if (reserva.totalPrice) {
            ingresosMes += reserva.totalPrice;
        } else {
            // Calcular basado en duración y precio por hora
            const horaInicio = new Date(`${reserva.fecha_reserva}T${reserva.hora_inicio}`);
            const horaFin = new Date(`${reserva.fecha_reserva}T${reserva.hora_fin}`);
            const duracionHoras = (horaFin - horaInicio) / (1000 * 60 * 60);
            const precioPorHora = 50000; // Precio base
            ingresosMes += duracionHoras * precioPorHora;
        }
    });
    
    // Canchas activas
    const canchasActivas = fieldsData.filter(cancha => cancha.isActive).length;
    
    console.log('🏟️ Canchas activas:', canchasActivas);
    console.log('💰 Ingresos del mes calculados:', ingresosMes);
    
    // Calcular reservas por cancha para hoy
    fieldsData.forEach(cancha => {
        cancha.reservationsToday = reservasHoy.filter(reserva => 
            reserva.id_cancha === cancha.id
        ).length;
        console.log(`🏟️ Cancha ${cancha.name} (ID: ${cancha.id}): ${cancha.reservationsToday} reservas hoy`);
    });

    // Ocupación promedio mejorada
    const totalReservasPosibles = canchasActivas * 12; // 12 horas promedio por día
    let ocupacionPromedio = 0;
    if (totalReservasPosibles > 0) {
        ocupacionPromedio = Math.round((reservasHoy.length / totalReservasPosibles) * 100);
    }
    
    // Si no hay reservas de hoy, usar un cálculo basado en reservas totales
    if (reservasHoy.length === 0 && reservasData.length > 0) {
        // Usar un porcentaje basado en la actividad general
        ocupacionPromedio = Math.min(Math.round((reservasData.length / 100) * 10), 85);
    }
    
    // Actualizar estadísticas globales
    dashboardStats = {
        reservasHoy: reservasHoy.length,
        ingresosMes: Math.round(ingresosMes),
        canchasActivas: canchasActivas,
        ocupacionPromedio: Math.min(ocupacionPromedio, 100)
    };
    
    console.log('✅ Estadísticas finales calculadas:', dashboardStats);
}

// Función para mostrar mensaje de error
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

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

// Función para renderizar las canchas
function renderFields() {
    console.log('🏟️ Renderizando canchas...');
    console.log('📋 fieldsData:', fieldsData.length, 'canchas');
    
    const fieldsGrid = document.getElementById('fieldsGrid');
    
    if (!fieldsGrid) {
        console.error('❌ No se encontró el elemento fieldsGrid');
        return;
    }
    
    if (fieldsData.length === 0) {
        console.log('⚠️ No hay datos de canchas para mostrar');
        fieldsGrid.innerHTML = '<p>No hay canchas disponibles</p>';
        return;
    }
    
    fieldsGrid.innerHTML = fieldsData.map(field => `
        <div class="field-card ${field.isActive ? 'active' : 'inactive'}">
            <div class="field-header">
                <div class="field-info">
                    <h3>${field.name}</h3>
                    <div class="field-type">${getFieldTypeText(field.type)}</div>
                </div>
                <div class="field-status ${field.isActive ? 'active' : 'inactive'}">
                    ${field.isActive ? 'Activa' : 'Inactiva'}
                </div>
            </div>
            
            <div class="field-details">
                <p><strong>Capacidad:</strong> ${field.capacity} jugadores</p>
                <p><strong>Precio por hora:</strong> ${formatPrice(field.pricePerHour)}</p>
                <p><strong>Ubicación:</strong> ${field.ubicacion || 'No especificada'}</p>
                <p><strong>Horario:</strong> ${field.horario_inicio} - ${field.horario_fin}</p>
            </div>
            
            <div class="field-stats">
                <div class="stat">
                    <span class="stat-label">Reservas hoy:</span>
                    <span class="stat-value">${field.reservationsToday}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Canchas renderizadas correctamente');
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
                window.location.href = 'admin-canchas.html';
                break;
            case 'tipos-cancha':
                alert('Navegando a Tipos de Cancha...\n\nEsta sección permitiría:\n Gestionar tipos de cancha\n Configurar precios por tipo\n Definir características');
                break;
            case 'implementos':
                window.location.href = 'implementos.html';
                break;
            default:
                alert('Sección no encontrada');
        }
    }, 1000);
}

// Función de logout
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        showLoading();
        
        setTimeout(() => {
            hideLoading();
            alert('Sesión cerrada exitosamente.\n\nEn una aplicación real, esto redirigiría al login.');
        }, 1000);
    }
}

// Función para actualizar las estadísticas en el DOM
function updateStats() {
    console.log('🔄 Actualizando estadísticas en el DOM...');
    console.log('📊 Dashboard stats:', dashboardStats);
    
    if (dashboardStats && Object.keys(dashboardStats).length > 0) {
        // Actualizar reservas de hoy
        const reservasElement = document.getElementById('reservasHoy');
        if (reservasElement) {
            reservasElement.textContent = dashboardStats.reservasHoy;
            console.log('✅ Reservas de hoy actualizadas:', dashboardStats.reservasHoy);
        } else {
            console.warn('⚠️ Elemento reservasHoy no encontrado');
        }
        
        // Actualizar ingresos del mes
        const ingresosElement = document.getElementById('ingresosMes');
        if (ingresosElement) {
            ingresosElement.textContent = `$${dashboardStats.ingresosMes.toLocaleString()}`;
            console.log('✅ Ingresos del mes actualizados:', dashboardStats.ingresosMes);
        } else {
            console.warn('⚠️ Elemento ingresosMes no encontrado');
        }
        
        // Actualizar canchas activas
        const canchasElement = document.getElementById('canchasActivas');
        if (canchasElement) {
            canchasElement.textContent = dashboardStats.canchasActivas;
            console.log('✅ Canchas activas actualizadas:', dashboardStats.canchasActivas);
        } else {
            console.warn('⚠️ Elemento canchasActivas no encontrado');
        }
        
        // Actualizar ocupación promedio
        const ocupacionElement = document.getElementById('ocupacionPromedio');
        if (ocupacionElement) {
            ocupacionElement.textContent = `${dashboardStats.ocupacionPromedio}%`;
            console.log('✅ Ocupación promedio actualizada:', dashboardStats.ocupacionPromedio);
        } else {
            console.warn('⚠️ Elemento ocupacionPromedio no encontrado');
        }
        
        // Actualizar indicadores de cambio (opcional)
        updateChangeIndicators();
        
        console.log('✅ Todas las estadísticas han sido actualizadas en el DOM');
        
    } else {
        console.log('⚠️ No hay datos de estadísticas disponibles, usando datos de respaldo');
        // Usar datos de respaldo si no hay datos reales
        const fallbackStats = {
            reservasHoy: 12,
            ingresosMes: 45230,
            canchasActivas: 8,
            ocupacionPromedio: 78
        };
        
        const reservasEl = document.getElementById('reservasHoy');
        const ingresosEl = document.getElementById('ingresosMes');
        const canchasEl = document.getElementById('canchasActivas');
        const ocupacionEl = document.getElementById('ocupacionPromedio');
        
        if (reservasEl) reservasEl.textContent = fallbackStats.reservasHoy;
        if (ingresosEl) ingresosEl.textContent = `$${fallbackStats.ingresosMes.toLocaleString()}`;
        if (canchasEl) canchasEl.textContent = fallbackStats.canchasActivas;
        if (ocupacionEl) ocupacionEl.textContent = `${fallbackStats.ocupacionPromedio}%`;
        
        console.log('✅ Datos de respaldo aplicados');
    }
}

// Función para actualizar indicadores de cambio
function updateChangeIndicators() {
    // Simular cambios positivos para mostrar mejoras
    const changeElements = document.querySelectorAll('.stat-change');
    const changes = ['+12%', '+8%', '+5%', '+3%'];
    
    changeElements.forEach((element, index) => {
        if (changes[index]) {
            element.textContent = changes[index];
            element.className = 'stat-change positive';
        }
    });
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
    checkAuth();
    
    // Cargar datos reales desde la API
    loadRealData();
    
    // Configurar efectos visuales
    addVisualEffects();
    
    // Configurar responsive
    handleResponsive();
    
    // Inicializar actualizaciones en tiempo real (cada 5 minutos)
    setInterval(() => {
        loadRealData();
    }, 300000); // 5 minutos
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', handleResponsive);
    
    // Configurar navegación
    const navCards = document.querySelectorAll('.nav-card');
    navCards.forEach(card => {
        card.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                navigateTo(section);
            }
        });
    });
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
