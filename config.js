// Configuración global de la aplicación
const CONFIG = {
    API_BASE_URL: 'http://localhost:3100/api',
    APP_NAME: 'GolApp',
    VERSION: '1.0.0',
    
    // Configuración de autenticación
    AUTH: {
        TOKEN_KEY: 'golapp_token',
        USER_KEY: 'golapp_user',
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
    },
    
    // Configuración de la UI
    UI: {
        ITEMS_PER_PAGE: 10,
        TOAST_DURATION: 3000,
        MODAL_ANIMATION_DURATION: 300
    },
    
    // Estados disponibles
    ESTADOS: {
        RESERVA: {
            PENDIENTE: 'pendiente',
            CONFIRMADA: 'confirmada',
            CANCELADA: 'cancelada',
            COMPLETADA: 'completada'
        },
        CANCHA: {
            DISPONIBLE: 'disponible',
            MANTENIMIENTO: 'mantenimiento',
            OCUPADA: 'ocupada'
        },
        USUARIO: {
            ACTIVO: 'activo',
            INACTIVO: 'inactivo',
            SUSPENDIDO: 'suspendido'
        }
    },
    
    // Tipos de cancha
    TIPOS_CANCHA: [
        'Fútbol 11',
        'Fútbol 7',
        'Fútbol 5',
        'Básquetbol',
        'Tenis',
        'Pádel',
        'Vóleibol'
    ],
    
    // Horarios disponibles
    HORARIOS: {
        INICIO: 6, // 6:00 AM
        FIN: 23,   // 11:00 PM
        DURACION_MINIMA: 60 // 1 hora en minutos
    }
};

// Utilidades globales
const Utils = {
    // Formatear fecha
    formatDate: (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    // Formatear fecha y hora
    formatDateTime: (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Formatear precio
    formatPrice: (price) => {
        if (!price && price !== 0) return '$0';
        return `$${Number(price).toLocaleString('es-ES')}`;
    },
    
    // Validar email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validar teléfono
    isValidPhone: (phone) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },
    
    // Generar ID único
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Mostrar toast notification
    showToast: (message, type = 'info') => {
        // Crear elemento toast si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Crear toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Colores según tipo
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Remover después del tiempo configurado
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, CONFIG.UI.TOAST_DURATION);
    }
};

// API Helper
const API = {
    // Realizar petición GET
    get: async (endpoint) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(CONFIG.AUTH.TOKEN_KEY) || ''}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            Utils.showToast('Error al cargar datos', 'error');
            throw error;
        }
    },
    
    // Realizar petición POST
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(CONFIG.AUTH.TOKEN_KEY) || ''}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            Utils.showToast('Error al guardar datos', 'error');
            throw error;
        }
    },
    
    // Realizar petición PUT
    put: async (endpoint, data) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(CONFIG.AUTH.TOKEN_KEY) || ''}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            Utils.showToast('Error al actualizar datos', 'error');
            throw error;
        }
    },
    
    // Realizar petición DELETE
    delete: async (endpoint) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem(CONFIG.AUTH.TOKEN_KEY) || ''}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            Utils.showToast('Error al eliminar datos', 'error');
            throw error;
        }
    }
};

// Manejo de autenticación
const Auth = {
    // Verificar si el usuario está autenticado
    isAuthenticated: () => {
        const token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
        const user = localStorage.getItem(CONFIG.AUTH.USER_KEY);
        return !!(token && user);
    },
    
    // Obtener usuario actual
    getCurrentUser: () => {
        const userStr = localStorage.getItem(CONFIG.AUTH.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // Guardar sesión
    saveSession: (token, user) => {
        localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(user));
    },
    
    // Cerrar sesión
    logout: () => {
        localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
        localStorage.removeItem(CONFIG.AUTH.USER_KEY);
        window.location.href = 'login.html';
    },
    
    // Verificar y redirigir si no está autenticado
    requireAuth: () => {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    // Login
    login: async (email, password) => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }
            
            const data = await response.json();
            Auth.saveSession(data.token, data.user);
            Utils.showToast('Inicio de sesión exitoso', 'success');
            return data;
        } catch (error) {
            console.error('Login Error:', error);
            Utils.showToast(error.message || 'Error al iniciar sesión', 'error');
            throw error;
        }
    }
};

// Inicialización global
document.addEventListener('DOMContentLoaded', () => {
    // Agregar estilos globales para toasts si no existen
    if (!document.getElementById('global-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'global-toast-styles';
        style.textContent = `
            .fade-in {
                animation: fadeIn 0.3s ease-in;
            }
            
            .fade-out {
                animation: fadeOut 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
            
            .loading-spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-right: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
});

// Exportar para uso global
window.CONFIG = CONFIG;
window.Utils = Utils;
window.API = API;
window.Auth = Auth;
