const API_BASE_URL = 'http://localhost:3000/api';
let reservations = [];
let canchas = [];
let currentUser = null;

// Verificar autenticación
function checkAuth() {
    let user = JSON.parse(localStorage.getItem('golapp_user') || '{}');
    
    // Si no hay usuario en localStorage, crear uno temporal para demo
    if (!user.correo && !user.email) {
        user = {
            nombre: 'Administrador Demo',
            correo: 'admin@golapp.com',
            rol: 'administrador',
            id: 1
        };
        // Guardar usuario temporal en localStorage
        localStorage.setItem('golapp_user', JSON.stringify(user));
        localStorage.setItem('golapp_token', 'demo_token_123');
    }
    
    currentUser = user;
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userEmailEl = document.getElementById('userEmail');
    
    if (userNameEl) userNameEl.textContent = currentUser.nombre || currentUser.email || currentUser.correo;
    if (userRoleEl) userRoleEl.textContent = currentUser.rol || 'Administrador';
    if (userEmailEl) userEmailEl.textContent = currentUser.correo || currentUser.email || 'admin@golapp.com';
}

// Cargar canchas
async function loadCanchas() {
    try {
        const response = await fetch(`${API_BASE_URL}/canchas`);
        if (response.ok) {
            canchas = await response.json();
            populateCanchaSelects();
        } else {
            console.error('Error al cargar canchas');
        }
    } catch (error) {
        console.error('Error loading canchas:', error);
    }
}

// Poblar selects de canchas
function populateCanchaSelects() {
    const selects = ['filterCancha', 'canchaId'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (selectId === 'filterCancha') {
            select.innerHTML = '<option value="">Todas las canchas</option>';
        } else {
            select.innerHTML = '<option value="">Seleccionar cancha</option>';
        }
        
        canchas.forEach(cancha => {
            const option = document.createElement('option');
            option.value = cancha.id;
            option.textContent = `${cancha.nombre} - ${cancha.tipoCancha?.tipo || 'N/A'}`;
            option.dataset.precio = cancha.precio || 0;
            select.appendChild(option);
        });
    });
}

// Actualizar información de precio
function updatePriceInfo() {
    const canchaSelect = document.getElementById('canchaId');
    const priceInfo = document.getElementById('priceInfo');
    const pricePerHour = document.getElementById('pricePerHour');
    
    if (!canchaSelect || !pricePerHour) return;
    
    if (canchaSelect.value) {
        const selectedOption = canchaSelect.options[canchaSelect.selectedIndex];
        const precio = selectedOption.dataset.precio || 0;
        
        pricePerHour.textContent = `$${precio}`;
        if (priceInfo) priceInfo.style.display = 'block';
        
        calculatePrice();
    } else {
        if (priceInfo) priceInfo.style.display = 'none';
    }
}

// Calcular precio total
function calculatePrice() {
    const horaInicio = document.getElementById('horaInicio');
    const horaFin = document.getElementById('horaFin');
    const canchaSelect = document.getElementById('cancha');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (!horaInicio || !horaFin || !canchaSelect || !totalPriceElement) {
        if (totalPriceElement) totalPriceElement.textContent = '$0';
        return;
    }

    if (!horaInicio.value || !horaFin.value || !canchaSelect.value) {
        totalPriceElement.textContent = '$0';
        return;
    }

    const inicio = new Date(`2000-01-01T${horaInicio.value}`);
    const fin = new Date(`2000-01-01T${horaFin.value}`);
    
    if (fin <= inicio) {
        totalPriceElement.textContent = '$0';
        return;
    }

    const horas = (fin - inicio) / (1000 * 60 * 60);
    const cancha = canchas.find(c => c.id == canchaSelect.value);
    
    if (cancha && cancha.tipoCancha) {
        const precioPorHora = cancha.tipoCancha.precio || 0;
        const precioTotal = horas * precioPorHora;
        totalPriceElement.textContent = `$${precioTotal.toFixed(2)}`;
    } else {
        totalPriceElement.textContent = '$0';
    }
}

// Cargar reservas
async function loadReservations() {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('reservationsGrid');
    const emptyState = document.getElementById('emptyState');

    if (loading) loading.style.display = 'block';
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/reservas`);
        if (response.ok) {
            reservations = await response.json();
            updateStats();
            filterAndDisplayReservations();
        } else {
            console.error('Error al cargar reservas');
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        if (grid) grid.innerHTML = '<div style="text-align: center; color: #e53e3e; padding: 2rem;">Error al cargar las reservas</div>';
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// Actualizar estadísticas
function updateStats() {
    const total = reservations.length;
    const activas = reservations.filter(r => r.estado === 'activa').length;
    const completadas = reservations.filter(r => r.estado === 'completada').length;
    
    const today = new Date().toISOString().split('T')[0];
    const hoy = reservations.filter(r => r.fecha === today).length;
    
    // Verificar que los elementos existan antes de actualizar
    const totalEl = document.getElementById('totalReservations');
    const activasEl = document.getElementById('activeReservations');
    const completadasEl = document.getElementById('completedReservations');
    const hoyEl = document.getElementById('todayReservations');
    
    if (totalEl) totalEl.textContent = total;
    if (activasEl) activasEl.textContent = activas;
    if (completadasEl) completadasEl.textContent = completadas;
    if (hoyEl) hoyEl.textContent = hoy;
}

// Filtrar y mostrar reservas
function filterAndDisplayReservations() {
    const filterDate = document.getElementById('filterDate').value;
    const filterCancha = document.getElementById('filterCancha').value;
    const filterStatus = document.getElementById('filterStatus').value;

    let filtered = reservations.filter(reservation => {
        let matches = true;

        // Filtro por fecha
        if (filterDate && reservation.fecha !== filterDate) {
            matches = false;
        }

        // Filtro por cancha
        if (filterCancha && reservation.id_cancha != filterCancha) {
            matches = false;
        }

        // Filtro por estado
        if (filterStatus && reservation.estado !== filterStatus) {
            matches = false;
        }

        return matches;
    });

    displayReservations(filtered);
}

// Mostrar reservas
function displayReservations(reservationsToShow) {
    const grid = document.getElementById('reservationsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid || !emptyState) return;

    if (reservationsToShow.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    // Ordenar por fecha y hora
    reservationsToShow.sort((a, b) => {
        const dateA = new Date(a.fecha + ' ' + a.hora_inicio);
        const dateB = new Date(b.fecha + ' ' + b.hora_inicio);
        return dateA - dateB;
    });
    
    grid.innerHTML = reservationsToShow.map(reservation => {
        const cancha = canchas.find(c => c.id == reservation.id_cancha);
        const statusClass = `status-${reservation.estado || 'active'}`;
        const statusText = {
            'activa': 'Activa',
            'completada': 'Completada',
            'cancelada': 'Cancelada'
        }[reservation.estado] || 'Activa';

        return `
            <div class="reservation-card">
                <div class="reservation-header">
                    <div class="reservation-title">
                        ${reservation.cliente_nombre || 'Cliente'}
                    </div>
                    <div class="reservation-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                <div class="reservation-details">
                    <div class="detail-row">
                        <i class="fas fa-futbol"></i>
                        <span>${cancha?.nombre || 'Cancha N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(reservation.fecha)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-clock"></i>
                        <span>${reservation.hora_inicio} - ${reservation.hora_fin}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-phone"></i>
                        <span>${reservation.cliente_telefono || 'N/A'}</span>
                    </div>
                    ${reservation.observaciones ? `
                    <div class="detail-row">
                        <i class="fas fa-comment"></i>
                        <span>${reservation.observaciones}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="reservation-actions">
                    <button class="btn btn-primary btn-sm" onclick="editReservation(${reservation.id})" title="Editar reserva">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteReservation(${reservation.id})" title="Eliminar reserva">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Abrir modal para crear
function openCreateModal() {
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Nueva Reserva';
    }
    
    document.getElementById('reservationForm').reset();
    document.getElementById('reservationId').value = '';
    updatePriceInfo();
    document.getElementById('reservationModal').style.display = 'block';
}

// Editar reserva
function editReservation(id) {
    const reservation = reservations.find(r => r.id == id);
    if (!reservation) return;

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Editar Reserva';
    }

    // Llenar el formulario con los datos de la reserva
    document.getElementById('reservationId').value = reservation.id;
    document.getElementById('canchaId').value = reservation.id_cancha;
    document.getElementById('fecha').value = reservation.fecha;
    document.getElementById('horaInicio').value = reservation.hora_inicio;
    document.getElementById('horaFin').value = reservation.hora_fin;
    document.getElementById('clienteNombre').value = reservation.cliente_nombre || '';
    document.getElementById('clienteTelefono').value = reservation.cliente_telefono || '';
    document.getElementById('observaciones').value = reservation.observaciones || '';

    updatePriceInfo();
    document.getElementById('reservationModal').style.display = 'block';
}

// Eliminar reserva
async function deleteReservation(id) {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    
    const confirmMessage = `¿Estás seguro de que quieres eliminar la reserva de ${reservation.cliente_nombre || 'este cliente'} para el ${formatDate(reservation.fecha)}?`;
    
    if (!confirm(confirmMessage)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Reserva eliminada exitosamente');
            await loadReservations();
        } else {
            alert('Error al eliminar la reserva');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la reserva');
    }
}

// Cerrar modal
function closeModal() {
    document.getElementById('reservationModal').classList.remove('show');
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterCancha').value = '';
    document.getElementById('filterStatus').value = '';
    filterAndDisplayReservations();
}

// Manejar envío del formulario
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                id_cancha: document.getElementById('canchaId').value,
                fecha: document.getElementById('fecha').value,
                hora_inicio: document.getElementById('horaInicio').value,
                hora_fin: document.getElementById('horaFin').value,
                cliente_nombre: document.getElementById('clienteNombre').value,
                cliente_telefono: document.getElementById('clienteTelefono').value,
                observaciones: document.getElementById('observaciones').value,
                id_usuario: currentUser.id,
                estado: 'activa'
            };

            const reservationId = document.getElementById('reservationId').value;
            const isEdit = !!reservationId;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/reservas${isEdit ? `/${reservationId}` : ''}`,
                    {
                        method: isEdit ? 'PUT' : 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    }
                );

                if (response.ok) {
                    alert(isEdit ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente');
                    closeModal();
                    await loadReservations();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Error al guardar la reserva');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        });
    }
});

// Logout
function logout() {
    localStorage.removeItem('golapp_user');
    localStorage.removeItem('golapp_token');
    window.location.href = 'login.html';
}

// Inicializar aplicación
window.addEventListener('load', () => {
    checkAuth();
    loadCanchas();
    loadReservations();
    
    // Configurar fecha mínima
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.min = today;
    }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});