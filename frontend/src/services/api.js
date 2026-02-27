import axios from 'axios';
import AlertService from './AlertService';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
});

// Interceptor Global de Respuesta (Red de Seguridad)
api.interceptors.response.use(
    (response) => {
        // Pasa las respuestas exitosas de largo
        return response;
    },
    (error) => {
        // Captura y aisla el error
        if (error.response) {
            // El servidor respondió con un status fuera del rango 2xx
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.error || 'Error del servidor.';

            if (status >= 500) {
                AlertService.error('Fallo de conexión con el servidor. Intente de nuevo más tarde.', message);
            } else if (status === 401 || status === 403) {
                AlertService.error('Acceso denegado o sesión expirada.', message);
            }
            // Para errores 400 o 404, en general dejamos que el componente individual lo maneje o muestre.
            // Pero si se quiere una red estricta, se podría poner.
        } else if (error.request) {
            // La petición fue hecha pero no hubo respuesta (Network Error)
            AlertService.error('Error de Red: No se puede conectar con Leads Pro AI. Verifique su conexión y el estado del servidor.');
        } else {
            // Algo sucedió configurando la petición
            AlertService.error('Error del sistema al procesar la petición.', error.message);
        }

        return Promise.reject(error);
    }
);

export const searchLeads = (data) => api.post('/search', data);
export const getHistory = () => api.get('/history');
export const getHistoryItem = (id) => api.get(`/history/${id}`);
export const getLeadsBySearch = (searchId) => api.get(`/history/${searchId}/leads`);
export const getGlobalStats = () => api.get('/stats');
export const updateLeadStatus = (id, status, note) => api.patch(`/leads/${id}/status`, { status, note });
export const getLead = (id) => api.get(`/leads/${id}`);
export const deleteHistory = (searchId) => api.delete(`/history/${searchId}`);
export const askAi = (query, history, leadId = null, campaignId = null, sessionId = null) => api.post('/ai/chat', { query, history, leadId, campaignId, sessionId });
export const bulkDeleteLeads = (leadIds) => api.delete('/leads', { data: { leadIds } });

// Vortex Intelligence Engine
export const enrichLead = (leadId) => api.post(`/vortex/enrich/${leadId}`);
export const getEnrichmentStatus = (leadId) => api.get(`/vortex/status/${leadId}`);

export const exportUrl = (searchId, format) => `http://localhost:5000/api/export/${searchId}/${format}`;

// Chat Sessions
export const getChatSessions = (campaignId, leadId) => {
    let url = '/chat/sessions?';
    if (campaignId) url += `campaignId=${campaignId}`;
    else if (leadId) url += `leadId=${leadId}`;
    return api.get(url);
};
export const getChatSession = (sessionId) => api.get(`/chat/sessions/${sessionId}`);
export const renameChatSession = (sessionId, title) => api.patch(`/chat/sessions/${sessionId}`, { title });
export const deleteChatSession = (sessionId) => api.delete(`/chat/sessions/${sessionId}`);

export default api;
