import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
});

export const searchLeads = (data) => api.post('/search', data);
export const getHistory = () => api.get('/history');
export const getHistoryItem = (id) => api.get(`/history/${id}`);
export const getLeadsBySearch = (searchId) => api.get(`/history/${searchId}/leads`);
export const getGlobalStats = () => api.get('/stats');
export const updateLeadStatus = (id, status, note) => api.patch(`/leads/${id}/status`, { status, note });
export const getLead = (id) => api.get(`/leads/${id}`);
export const deleteHistory = (searchId) => api.delete(`/history/${searchId}`);
export const askAi = (query, history) => api.post('/ai/chat', { query, history });

// Vortex Intelligence Engine
export const enrichLead = (leadId) => api.post(`/vortex/enrich/${leadId}`);
export const getEnrichmentStatus = (leadId) => api.get(`/vortex/status/${leadId}`);

export const exportUrl = (searchId, format) => `http://localhost:5000/api/export/${searchId}/${format}`;

export default api;
