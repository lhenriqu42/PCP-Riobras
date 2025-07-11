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

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    const [selectedHoraApontamentoId, setSelectedHoraApontamentoId] = useState('');
    const [pecasRegistrar, setPecasRegistrar] = useState('');
    const [causa, setCausa] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [maxPecasRegistraveis, setMaxPecasRegistraveis] = useState(0);

    useEffect(() => {
        if (open) {
            fetchSetores();
            setError('');
            setSuccess('');
            setSelectedSetorId('');
            setSelectedHoraApontamentoId('');
            setPecasRegistrar('');
            setCausa('');
            setMaxPecasRegistraveis(0);
        }
    }, [open]);

    useEffect(() => {
        if (selectedHoraApontamentoId) {
            const selectedApontamento = apontamentosHorarios.find(ap => ap.id === selectedHoraApontamentoId);
            if (selectedApontamento) {
                setMaxPecasRegistraveis(selectedApontamento.quantidade_efetiva || 0);
            }
        } else {
            setMaxPecasRegistraveis(0);
        }
        setPecasRegistrar('');
    }, [selectedHoraApontamentoId, apontamentosHorarios]);

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
            setError('Erro ao carregar setores. Tente novamente.');
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!selectedSetorId || !selectedHoraApontamentoId || pecasRegistrar === '' || pecasRegistrar === null) {
            setError('Por favor, preencha todos os campos obrigatórios: Hora, Setor e Quantidade.');
            setLoading(false);
            return;
        }

        const numPecasRegistrar = Number(pecasRegistrar);
        if (isNaN(numPecasRegistrar) || numPecasRegistrar <= 0) {
            setError(`Quantidade inválida. Deve ser um número positivo.`);
            setLoading(false);
            return;
        }
        
        if (numPecasRegistrar > maxPecasRegistraveis) {
            setError(`Quantidade não pode exceder o total de peças boas (${maxPecasRegistraveis}).`);
            setLoading(false);
            return;
        }

        const selectedApontamento = apontamentosHorarios.find(ap => ap.id === selectedHoraApontamentoId);
        if (!selectedApontamento) {
            setError('Apontamento selecionado não encontrado.');
            setLoading(false);
            return;
        }

        const payload = {
            setor_id: selectedSetorId,
            apontamento_injetora_id: selectedHoraApontamentoId,
            data_improdutividade: dataApontamento,
            hora_improdutividade: selectedApontamento.hora_apontamento,
            causa: causa,
            pecas_transferidas: numPecasRegistrar,
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${REACT_APP_API_URL}/api/improdutividade`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSuccess('Peças não conformes registradas com sucesso!');
            if (onSuccess) {
                onSuccess();
            }
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError('Erro ao registrar não conformidade. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const horasProducaoFinalizadas = apontamentosHorarios.filter(ap => ap.tipo_registro === 'producao');

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
                    Registrar Peças Não Conformes por Setor
                </Typography>

                {loading && <CircularProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="hora-select-label">Hora do Apontamento de Produção</InputLabel>
                            <Select
                                labelId="hora-select-label"
                                id="hora-select"
                                value={selectedHoraApontamentoId}
                                label="Hora do Apontamento de Produção"
                                onChange={(e) => setSelectedHoraApontamentoId(e.target.value)}
                                disabled={loading}
                            >
                                {horasProducaoFinalizadas.length > 0 ? (
                                    horasProducaoFinalizadas.map((apontamento) => (
                                        <MenuItem key={apontamento.id} value={apontamento.id}>
                                            {apontamento.hora_apontamento} (Boas: {apontamento.quantidade_efetiva || 0})
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>Nenhum apontamento de produção disponível</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="setor-select-label">Setor Responsável</InputLabel>
                            <Select
                                labelId="setor-select-label"
                                id="setor-select"
                                value={selectedSetorId}
                                label="Setor Responsável"
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
                        <TextField
                            fullWidth
                            margin="normal"
                            label={`Peças a Registrar como NC (Máx: ${maxPecasRegistraveis})`}
                            type="number"
                            value={pecasRegistrar}
                            onChange={(e) => setPecasRegistrar(e.target.value)}
                            required
                            disabled={loading || !selectedHoraApontamentoId}
                            inputProps={{ min: 1, max: maxPecasRegistraveis > 0 ? maxPecasRegistraveis : undefined }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Causa da Não Conformidade (Opcional)"
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
                        disabled={loading || !selectedHoraApontamentoId}
                    >
                        Registrar NC
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
