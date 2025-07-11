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
    const [selectedHoraApontamentoId, setSelectedHoraApontamentoId] = useState(''); 
    const [pecasTransferir, setPecasTransferir] = useState('');
    const [causa, setCausa] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [maxPecasTransferiveis, setMaxPecasTransferiveis] = useState(0);

    useEffect(() => {
        if (open) {
            fetchSetores();
            setError('');
            setSuccess('');
            setSelectedSetorId('');
            setSelectedHoraApontamentoId('');
            setPecasTransferir('');
            setCausa('');
            setMaxPecasTransferiveis(0);
        }
    }, [open]);

    useEffect(() => {
        if (selectedHoraApontamentoId) {
            const selectedApontamento = apontamentosHorarios.find(ap => ap.id === selectedHoraApontamentoId);
            if (selectedApontamento) {
                setMaxPecasTransferiveis(selectedApontamento.pecas_nc || 0);
                setPecasTransferir(selectedApontamento.pecas_nc || '');
            }
        } else {
            setMaxPecasTransferiveis(0);
            setPecasTransferir('');
        }
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

        if (!selectedSetorId || !selectedHoraApontamentoId || pecasTransferir === '' || pecasTransferir === null || pecasTransferir === undefined) {
            setError('Por favor, preencha todos os campos obrigatórios: Setor, Hora do Apontamento e Quantidade de Peças a Transferir.');
            setLoading(false);
            return;
        }

        const numPecasTransferir = Number(pecasTransferir);
        if (isNaN(numPecasTransferir) || numPecasTransferir <= 0 || numPecasTransferir > maxPecasTransferiveis) {
            setError(`Quantidade inválida. Deve ser um número positivo e não pode exceder ${maxPecasTransferiveis} peças.`);
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
            hora_improdutividade: selectedApontamento.hora,
            causa: causa,
            pecas_transferidas: numPecasTransferir,
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${REACT_APP_API_URL}/api/improdutividade`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSuccess('Improdutividade registrada e peças transferidas com sucesso!');
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError('Erro ao registrar improdutividade. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const horasComPecasNC = apontamentosHorarios.filter(ap => ap.finalizado && ap.pecas_nc > 0 && ap.tipo_registro === 'producao');

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
                    Transferir Peças Não Conformes (Improdutividade)
                </Typography>

                {loading && <CircularProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="hora-select-label">Hora do Apontamento com NC</InputLabel>
                            <Select
                                labelId="hora-select-label"
                                id="hora-select"
                                value={selectedHoraApontamentoId}
                                label="Hora do Apontamento com NC"
                                onChange={(e) => setSelectedHoraApontamentoId(e.target.value)}
                                disabled={loading}
                            >
                                {horasComPecasNC.length > 0 ? (
                                    horasComPecasNC.map((apontamento) => (
                                        <MenuItem key={apontamento.id} value={apontamento.id}>
                                            {apontamento.hora} (NC: {apontamento.pecas_nc})
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>Nenhum apontamento com peças NC disponível</MenuItem>
                                )}
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                *Selecione uma hora de apontamento que tenha peças não conformes registradas.
                            </Typography>
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
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                *Para qual setor essa improdutividade deve ser atribuída.
                            </Typography>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label={`Peças a Transferir (Máx: ${maxPecasTransferiveis})`}
                            type="number"
                            value={pecasTransferir}
                            onChange={(e) => setPecasTransferir(Number(e.target.value))}
                            required
                            disabled={loading || !selectedHoraApontamentoId}
                            inputProps={{ min: 1, max: maxPecasTransferiveis }}
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
                        Transferir
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}