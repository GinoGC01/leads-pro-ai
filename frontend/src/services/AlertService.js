import toast from 'react-hot-toast';

class AlertService {
    static success(message) {
        toast.success(message, {
            duration: 3000,
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }
        });
    }

    static error(message, technicalDetails = null) {
        toast.error(message, {
            duration: 5000,
            style: {
                background: '#450a0a',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }
        });
        if (technicalDetails) {
            console.error("[AlertService Error]:", technicalDetails);
        }
    }

    static warning(message) {
        toast(message, {
            icon: '⚠️',
            duration: 4000,
            style: {
                background: '#422006',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.2)'
            }
        });
    }

    static loading(message) {
        return toast.loading(message, {
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }
        });
    }

    static successUpdate(toastId, message) {
        toast.success(message, {
            id: toastId,
            duration: 3000,
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }
        });
    }

    static errorUpdate(toastId, message) {
        toast.error(message, {
            id: toastId,
            duration: 5000,
            style: {
                background: '#450a0a',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)'
            }
        });
    }

    static dismiss(toastId) {
        toast.dismiss(toastId);
    }

    // Manejador de promesas (Ideal para llamadas a la API)
    static promise(promise, msgs = { loading: 'Procesando...', success: '¡Completado!', error: 'Ocurrió un error' }) {
        return toast.promise(promise, msgs, {
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            },
            success: {
                duration: 3000,
                icon: '✅',
            },
            error: {
                duration: 5000,
                style: {
                    background: '#450a0a',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }
            }
        });
    }
}

export default AlertService;
