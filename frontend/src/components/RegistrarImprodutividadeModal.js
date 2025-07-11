import React, { useState, useEffect } from 'react';
import {
    Modal, Box, Typography, TextField, Button, FormControl,
    InputLabel, Select, MenuItem, Alert, CircularProgress, Grid, FormHelperText
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
    border: 'none',
    boxShadow: 24,
    p: 4,
    borderRadius: '8px',
};

export default function RegistrarImprodutividadeModal({ open, onClose, dataApontamento, apontamentosHorarios, onSuccess }) {
    const [setores, setSetores] = useState([]);
    const [selectedSetorId, setSelectedSetorId] = useState('');
    const [producaoSetorId, setProducaoSetorId] = useState('');
    const [selectedHoraApontamentoId, setSelectedHoraApontamentoId] = useState('');
    const [pecasRegistrar, setPecasRegistrar] = useState('');
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
            setSelectedHoraApontamentoId('');
            setPecasRegistrar('');
            setCausa('');
        }
    }, [open]);

    const fetchSetores = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${REACT_APP_API_URL}/api/setores`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const fetchedSetores = response.data;
            setSetores(fetchedSetores);
            const producao = fetchedSetores.find(setor => setor.nome_setor.toLowerCase() === 'produção');
            if (producao) {
                setProducaoSetorId(producao.id);
            }
        } catch (err) {
            setError('Erro ao carregar setores.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!selectedHoraApontamentoId || !pecasRegistrar) {
            setError('Por favor, preencha a Hora e a Quantidade.');
            setLoading(false);
            return;
        }

        const numPecasRegistrar = Number(pecasRegistrar);
        if (isNaN(numPecasRegistrar) || numPecasRegistrar <= 0) {
            setError('Quantidade inválida. Deve ser um número positivo.');
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
            setor_id: selectedSetorId || producaoSetorId,
            apontamento_injetora_id: selectedHoraApontamentoId,
            data_improdutividade: dataApontamento,
            hora_improdutividade: selectedApontamento.hora_apontamento,
            causa: causa,
            pecas_transferidas: numPecasRegistrar,
        };
        
        if(!payload.setor_id) {
            setError('O setor "Produção" não foi encontrado como padrão. Selecione um setor responsável.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${REACT_APP_API_URL}/api/improdutividade`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess('Improdutividade atribuída com sucesso!');
            if (onSuccess) onSuccess();
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            setError('Erro ao registrar improdutividade. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const horasDisponiveis = apontamentosHorarios.filter(ap => ap.tipo_registro !== 'parada');

    const getStatusLabel = (apontamento) => {
        if (apontamento.finalizado) {
            return `(Finalizado - ${apontamento.quantidade_efetiva} peças)`;
        }
        if (apontamento.tipo_registro === 'producao') {
            return `(Produzindo - ${apontamento.quantidade_efetiva} peças)`;
        }
        return '(Aguardando)';
    }

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Atribuir Improdutividade ao Setor
                </Typography>

                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Grid container spacing={2} sx={{mt: 1}}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel id="hora-select-label">Hora do Apontamento</InputLabel>
                            <Select
                                labelId="hora-select-label"
                                value={selectedHoraApontamentoId}
                                label="Hora do Apontamento"
                                onChange={(e) => setSelectedHoraApontamentoId(e.target.value)}
                                disabled={loading}
                            >
                                {horasDisponiveis.length > 0 ? (
                                    horasDisponiveis.map((ap) => (
                                        <MenuItem key={ap.id} value={ap.id}>
                                            {`${ap.hora_apontamento} ${getStatusLabel(ap)}`}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>Nenhum horário de produção na lista</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                     <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Peças NC a atribuir"
                            type="number"
                            value={pecasRegistrar}
                            onChange={(e) => setPecasRegistrar(e.target.value)}
                            required
                            disabled={loading || !selectedHoraApontamentoId}
                            inputProps={{ min: 1 }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel id="setor-select-label">Setor Responsável</InputLabel>
                            <Select
                                labelId="setor-select-label"
                                value={selectedSetorId}
                                label="Setor Responsável"
                                onChange={(e) => setSelectedSetorId(e.target.value)}
                                disabled={loading}
                            >
                                <MenuItem value=""><em>(Padrão: Produção)</em></MenuItem>
                                {setores.map((setor) => (
                                    <MenuItem key={setor.id} value={setor.id}>{setor.nome_setor}</MenuItem>
                                ))}
                            </Select>
                             <FormHelperText>Selecione o setor que causou a perda.</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
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
                    <Button variant="text" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button variant="contained" type="submit" disabled={loading || !selectedHoraApontamentoId}>
                        Atribuir NC
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}