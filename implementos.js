// Configuración de la API
const API_BASE_URL = 'http://localhost:3100/api';

// Variables globales
let implementos = [];
let editingImplemento = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadImplementos();
    loadStats();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    document.getElementById('search-input').addEventListener('input', function(e) {
        filterImplementos(e.target.value);
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('implemento-modal');
        if (e.target === modal) {
            closeModal();
        }
    });

    // Manejar tecla Escape para cerrar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Cargar implementos desde la API
async function loadImplementos() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/productos`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Respuesta de la API:', data);
        console.log('data.data:', data.data);
        console.log('Tipo de data.data:', typeof data.data);
        console.log('Es array data.data?', Array.isArray(data.data));
        
        implementos = data.data || [];
        console.log('Implementos procesados:', implementos);
        console.log('Tipo de implementos:', typeof implementos);
        console.log('Es array implementos?', Array.isArray(implementos));
        
        renderImplementos(implementos);
        
    } catch (error) {
        console.error('Error al cargar implementos:', error);
        showAlert('Error al cargar los implementos. Verifica que el servidor esté funcionando.', 'error');
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/productos/stats`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const response_data = await response.json();
        updateStatsDisplay(response_data.data);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // Mostrar estadísticas por defecto si hay error
        updateStatsDisplay({
            total_implementos: implementos.length,
            total_stock: implementos.reduce((sum, item) => sum + item.cantidad_total, 0),
            total_prestado: 0,
            total_disponible: implementos.reduce((sum, item) => sum + item.cantidad_total, 0)
        });
    }
}

// Actualizar display de estadísticas
function updateStatsDisplay(stats) {
    document.getElementById('total-implementos').textContent = stats.total_implementos || 0;
    document.getElementById('total-stock').textContent = stats.total_stock || 0;
    document.getElementById('total-prestado').textContent = stats.total_prestado || 0;
    document.getElementById('total-disponible').textContent = stats.total_disponible || 0;
}

// Renderizar tabla de implementos
function renderImplementos(implementosToRender) {
    console.log('renderImplementos llamado con:', implementosToRender);
    console.log('Tipo de implementosToRender:', typeof implementosToRender);
    console.log('Es array?', Array.isArray(implementosToRender));
    
    // Verificar que sea un array
    if (!Array.isArray(implementosToRender)) {
        console.error('renderImplementos: implementosToRender no es un array');
        showEmptyState();
        return;
    }
    
    const tbody = document.getElementById('implementos-tbody');
    const table = document.getElementById('implementos-table');
    const emptyState = document.getElementById('empty-state');
    
    if (!implementosToRender || implementosToRender.length === 0) {
        showEmptyState();
        return;
    }
    
    tbody.innerHTML = '';
    
    implementosToRender.forEach(implemento => {
        const row = createImplementoRow(implemento);
        tbody.appendChild(row);
    });
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
}

// Crear fila de implemento
function createImplementoRow(implemento) {
    const row = document.createElement('tr');
    
    // Calcular disponibilidad
    const prestado = implemento.Prestamos ? 
        implemento.Prestamos.reduce((sum, prestamo) => sum + prestamo.cantidad_prestada, 0) : 0;
    const disponible = implemento.cantidad_total - prestado;
    
    // Determinar estado
    let estado, estadoClass;
    if (disponible === 0) {
        estado = 'Agotado';
        estadoClass = 'status-agotado';
    } else if (disponible <= implemento.cantidad_total * 0.2) {
        estado = 'Stock Bajo';
        estadoClass = 'status-bajo';
    } else {
        estado = 'Disponible';
        estadoClass = 'status-disponible';
    }
    
    row.innerHTML = `
        <td>
            <strong>${implemento.nombre_producto}</strong>
        </td>
        <td>${implemento.cantidad_total}</td>
        <td>${prestado}</td>
        <td>${disponible}</td>
        <td>
            <span class="status-badge ${estadoClass}">${estado}</span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="editImplemento(${implemento.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteImplemento(${implemento.id}, '${implemento.nombre_producto}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Filtrar implementos
function filterImplementos(searchTerm) {
    // Verificar que implementos sea un array
    if (!Array.isArray(implementos)) {
        console.warn('implementos no es un array:', implementos);
        return;
    }
    
    if (!searchTerm.trim()) {
        renderImplementos(implementos);
        return;
    }
    
    const filtered = implementos.filter(implemento =>
        implemento.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderImplementos(filtered);
}

// Abrir modal
function openModal(implemento = null) {
    const modal = document.getElementById('implemento-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('implemento-form');
    
    editingImplemento = implemento;
    
    if (implemento) {
        title.textContent = 'Editar Implemento';
        document.getElementById('nombre_producto').value = implemento.nombre_producto;
        document.getElementById('cantidad_total').value = implemento.cantidad_total;
    } else {
        title.textContent = 'Nuevo Implemento';
        form.reset();
    }
    
    modal.style.display = 'block';
    document.getElementById('nombre_producto').focus();
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('implemento-modal');
    modal.style.display = 'none';
    editingImplemento = null;
    document.getElementById('implemento-form').reset();
}

// Guardar implemento
async function saveImplemento() {
    const form = document.getElementById('implemento-form');
    const formData = new FormData(form);
    
    const implementoData = {
        nombre_producto: formData.get('nombre_producto').trim(),
        cantidad_total: parseInt(formData.get('cantidad_total'))
    };
    
    // Validaciones
    if (!implementoData.nombre_producto) {
        showAlert('El nombre del implemento es requerido', 'error');
        return;
    }
    
    if (implementoData.cantidad_total < 0) {
        showAlert('La cantidad no puede ser negativa', 'error');
        return;
    }
    
    try {
        let response;
        
        if (editingImplemento) {
            // Actualizar implemento existente
            response = await fetch(`${API_BASE_URL}/productos/${editingImplemento.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(implementoData)
            });
        } else {
            // Crear nuevo implemento
            response = await fetch(`${API_BASE_URL}/productos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(implementoData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        
        const result = await response.json();
        
        showAlert(
            editingImplemento ? 'Implemento actualizado exitosamente' : 'Implemento creado exitosamente',
            'success'
        );
        
        closeModal();
        await loadImplementos();
        await loadStats();
        
    } catch (error) {
        console.error('Error al guardar implemento:', error);
        showAlert(`Error al guardar: ${error.message}`, 'error');
    }
}

// Editar implemento
function editImplemento(id) {
    const implemento = implementos.find(item => item.id === id);
    if (implemento) {
        openModal(implemento);
    }
}

// Eliminar implemento
async function deleteImplemento(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${response.status}`);
        }
        
        showAlert('Implemento eliminado exitosamente', 'success');
        await loadImplementos();
        await loadStats();
        
    } catch (error) {
        console.error('Error al eliminar implemento:', error);
        showAlert(`Error al eliminar: ${error.message}`, 'error');
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('implementos-table');
    const emptyState = document.getElementById('empty-state');
    
    if (show) {
        loading.style.display = 'block';
        table.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

// Mostrar estado vacío
function showEmptyState() {
    const table = document.getElementById('implementos-table');
    const emptyState = document.getElementById('empty-state');
    
    table.style.display = 'none';
    emptyState.style.display = 'block';
}

// Mostrar alertas
function showAlert(message, type = 'success') {
    const alertElement = document.getElementById(`alert-${type}`);
    const messageElement = document.getElementById(`${type}-message`);
    
    if (alertElement && messageElement) {
        messageElement.textContent = message;
        alertElement.style.display = 'block';
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
        
        // Scroll hacia arriba para mostrar la alerta
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Funciones de utilidad
function formatNumber(number) {
    return new Intl.NumberFormat('es-CO').format(number);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Manejar errores de red
window.addEventListener('online', function() {
    showAlert('Conexión restaurada', 'success');
    loadImplementos();
    loadStats();
});

window.addEventListener('offline', function() {
    showAlert('Sin conexión a internet', 'error');
});

// Exportar funciones para uso global
// Función para navegar al panel de administrador
function goToAdmin() {
    window.location.href = 'index.html';
}

window.openModal = openModal;
window.closeModal = closeModal;
window.saveImplemento = saveImplemento;
window.editImplemento = editImplemento;
window.deleteImplemento = deleteImplemento;
window.goToAdmin = goToAdmin;