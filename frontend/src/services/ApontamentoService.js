import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ApontamentoService = {
    getApontamentosInjetora: async (params) => {
        const response = await axios.get(`${API_URL}/api/apontamentos/injetora`, { params });
        return response.data;
    },

    updateApontamentoInjetora: async (id, data) => {
        const response = await axios.put(`${API_URL}/api/apontamentos/injetora/${id}`, data);
        return response.data;
    },

    deleteApontamentoInjetora: async (id) => {
        const response = await axios.delete(`${API_URL}/api/apontamentos/injetora/${id}`);
        return response.data;
    }
};

export default ApontamentoService;