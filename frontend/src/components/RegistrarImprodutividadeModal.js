import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Grid
} from '@mui/material';
import axios from 'axios';
import REACT_APP_API_URL from '../api';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 500 },
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

export default function RegistrarImprodutividadeModal({ open, onClose, dataApontamento, apontamentosHorarios, onSuccess }) {
    const [setores, setSetores] = useState([]);
    const [selectedSetorId, setSelectedSetorId] = useState('');
    const [selectedHora, setSelectedHora] = useState('');
    const [pecasPerdidasEstimadas, setPecasPerdidasEstimadas] = useState(65);
    const [causa, setCausa] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (open) {
            fetchSetores();
            setError('');
            setSuccess('');
            setSelectedSetorId('');
            setSelectedHora('');
            setPecasPerdidasEstimadas(65);
            setCausa('');
        }
    }, [open]);

    const fetchSetores = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${REACT_APP_API_URL}/api/setores`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSetores(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar setores. Tente novamente.');
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!selectedSetorId || !selectedHora || pecasPerdidasEstimadas === '') {
            setError('Por favor, preencha todos os campos obrigatórios: Setor, Hora e Peças Perdidas Estimadas.');
            setLoading(false);
            return;
        }

        const payload = {
            setor_id: selectedSetorId,
            data_improdutividade: dataApontamento,
            hora_improdutividade: selectedHora,
            causa: causa,
            pecas_perdidas_estimadas: pecasPerdidasEstimadas,
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${REACT_APP_API_URL}/api/improdutividade`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSuccess('Improdutividade registrada com sucesso!');
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao registrar improdutividade. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const horasFinalizadas = apontamentosHorarios.filter(ap => ap.finalizado);

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
                    Registrar Improdutividade por Setor
                </Typography>

                {loading && <CircularProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="setor-select-label">Setor</InputLabel>
                            <Select
                                labelId="setor-select-label"
                                id="setor-select"
                                value={selectedSetorId}
                                label="Setor"
                                onChange={(e) => setSelectedSetorId(e.target.value)}
                                disabled={loading}
                            >
                                {setores.map((setor) => (
                                    <MenuItem key={setor.id} value={setor.id}>
                                        {setor.nome_setor}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="hora-select-label">Hora do Apontamento</InputLabel>
                            <Select
                                labelId="hora-select-label"
                                id="hora-select"
                                value={selectedHora}
                                label="Hora do Apontamento"
                                onChange={(e) => setSelectedHora(e.target.value)}
                                disabled={loading}
                            >
                                {horasFinalizadas.length > 0 ? (
                                    horasFinalizadas.map((apontamento) => (
                                        <MenuItem key={apontamento.hora} value={apontamento.hora}>
                                            {apontamento.hora}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>Nenhuma hora finalizada disponível</MenuItem>
                                )}
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                *Apenas horas já registradas/finalizadas podem ter improdutividade atribuída.
                            </Typography>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Peças Perdidas Estimadas"
                            type="number"
                            value={pecasPerdidasEstimadas}
                            onChange={(e) => setPecasPerdidasEstimadas(Number(e.target.value))}
                            required
                            disabled={loading}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Causa da Improdutividade (Opcional)"
                            value={causa}
                            onChange={(e) => setCausa(e.target.value)}
                            multiline
                            rows={2}
                            disabled={loading}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                    >
                        Registrar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}