import React, { useState, useEffect } from 'react';
import {
    Modal, Box, Typography, TextField, Button, FormControl,
    InputLabel, Select, MenuItem, Alert, CircularProgress, Grid, FormHelperText
} from '@mui/material';
import axios from 'axios';
import moment from 'moment';

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

export default function RegistrarImprodutividadeModal({ open, onClose, dataApontamento, turno, onSuccess }) {
    const [setores, setSetores] = useState([]);
    const [selectedSetorId, setSelectedSetorId] = useState('');
    const [producaoSetorId, setProducaoSetorId] = useState('');
    const [selectedHoraApontamento, setSelectedHoraApontamento] = useState('');
    const [pecasRegistrar, setPecasRegistrar] = useState('');
    const [causa, setCausa] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [horasFixasDoTurno, setHorasFixasDoTurno] = useState([]);

    useEffect(() => {
        if (open) {
            fetchSetores();
            setError('');
            setSuccess('');
            setSelectedSetorId('');
            setSelectedHoraApontamento('');
            setPecasRegistrar('');
            setCausa('');
            
            const entries = [];
            let startMoment;
            let endMoment;

            if (turno === 'Manha') {
                startMoment = moment(dataApontamento + ' 07:00', 'YYYY-MM-DD HH:mm');
                endMoment = moment(dataApontamento + ' 18:00', 'YYYY-MM-DD HH:mm');
            } else {
                startMoment = moment(dataApontamento + ' 18:00', 'YYYY-MM-DD HH:mm');
                endMoment = moment(dataApontamento, 'YYYY-MM-DD').add(1, 'days').set({ hour: 7, minute: 0 });
            }

            let current = moment(startMoment);
            while (current.isBefore(endMoment)) {
                const hora = current.format('HH:mm:ss');
                entries.push(hora);
                current.add(1, 'hour');
            }
            setHorasFixasDoTurno(entries);
        }
    }, [open, dataApontamento, turno]);

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

        if (!selectedHoraApontamento || !pecasRegistrar) {
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
        
        const payload = {
            setor_id: selectedSetorId || producaoSetorId,
            data_improdutividade: dataApontamento,
            hora_improdutividade: selectedHoraApontamento,
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
                                value={selectedHoraApontamento}
                                label="Hora do Apontamento"
                                onChange={(e) => setSelectedHoraApontamento(e.target.value)}
                                disabled={loading}
                                sx={{ minWidth: 120, width: 'auto' }}
                            >
                                {horasFixasDoTurno.length > 0 ? (
                                    horasFixasDoTurno.map((hora, index) => (
                                        <MenuItem key={index} value={hora}>
                                            {hora}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled>Carregando horários...</MenuItem>
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
                            disabled={loading || !selectedHoraApontamento}
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
                                sx={{ minWidth: 120, width: 'auto' }}
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
                    <Button variant="contained" type="submit" disabled={loading || !selectedHoraApontamento}>
                        Atribuir NC
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}