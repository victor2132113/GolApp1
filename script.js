// Datos simulados de canchas
const fieldsData = [
    {
        id: '1',
        name: 'Cancha A',
        type: 'futbol7',
        capacity: 14,
        pricePerHour: 50000,
        isActive: true,
        reservationsToday: 3
    },
    {
        id: '2',
        name: 'Cancha B',
        type: 'futbol11',
        capacity: 22,
        pricePerHour: 80000,
        isActive: true,
        reservationsToday: 5
    },
    {
        id: '3',
        name: 'Cancha C',
        type: 'futbol9',
        capacity: 18,
        pricePerHour: 65000,
        isActive: true,
        reservationsToday: 2
    },
    {
        id: '4',
        name: 'Cancha D',
        type: 'futbol7',
        capacity: 14,
        pricePerHour: 50000,
        isActive: false,
        reservationsToday: 0
    },
    {
        id: '5',
        name: 'Cancha E',
        type: 'futbol11',
        capacity: 22,
        pricePerHour: 80000,
        isActive: true,
        reservationsToday: 4
    },
    {
        id: '6',
        name: 'Cancha F',
        type: 'futbol7',
        capacity: 14,
        pricePerHour: 50000,
        isActive: true,
        reservationsToday: 1
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

// Función para renderizar las canchas
function renderFields() {
    const fieldsGrid = document.getElementById('fieldsGrid');
    
    if (!fieldsGrid) return;
    
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
            </div>
            
            <div class="field-stats">
                <div class="field-stat">
                    <div class="field-stat-value">${field.reservationsToday}</div>
                    <div class="field-stat-label">Reservas hoy</div>
                </div>
                <div class="field-stat">
                    <div class="field-stat-value">${field.isActive ? 'Disponible' : 'No disponible'}</div>
                    <div class="field-stat-label">Estado</div>
                </div>
            </div>
        </div>
    `).join('');
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
                alert('Navegando a Gestión de Reservas...\n\nEsta sección permitiría:\n Ver todas las reservas\n Crear nuevas reservas\n Modificar reservas existentes\n Cancelar reservas');
                break;
            case 'canchas':
                alert('Navegando a Administración de Canchas...\n\nEsta sección permitiría:\n Ver todas las canchas\n Crear nuevas canchas\n Editar información de canchas\n Activar/desactivar canchas');
                break;
            case 'tipos-cancha':
                alert('Navegando a Tipos de Cancha...\n\nEsta sección permitiría:\n Gestionar tipos de cancha\n Configurar precios por tipo\n Definir características');
                break;
            case 'implementos':
                alert('Navegando a Implementos...\n\nEsta sección permitiría:\n Gestionar equipamiento\n Control de inventario\n Préstamos de implementos');
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

// Función para actualizar estadísticas dinámicamente
function updateStats() {
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
        
        // Iniciar actualizaciones en tiempo real
        simulateRealTimeUpdates();
        
        // Ocultar loading
        hideLoading();
        
        console.log('Aplicación inicializada correctamente');
    }, 2000);
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
