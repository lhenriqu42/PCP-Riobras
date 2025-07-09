import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const ApontamentoService = {
    getApontamentosInjetora: async (params) => {
        const response = await api.get(`/api/apontamentos/injetora`, { params });
        return response.data;
    },
    updateApontamentoInjetora: async (id, data) => {
        const response = await api.put(`/api/apontamentos/injetora/${id}`, data);
        return response.data;
    },
    deleteApontamentoInjetora: async (id) => {
        const response = await api.delete(`/api/apontamentos/injetora/${id}`);
        return response.data;
    },
    createApontamentoInjetora: async (data) => {
        const response = await api.post(`/api/apontamentos/injetora`, data);
        return response.data;
    }
};

export default ApontamentoService;