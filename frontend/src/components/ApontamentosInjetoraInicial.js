import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, Button, Grid, MenuItem, FormControl,
    InputLabel, Select, Alert, Autocomplete, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import REACT_APP_API_URL from '../api';

export default function ApontamentosInjetoraInicial() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        tipoInjetora: '',
        dataApontamento: new Date().toISOString().split('T')[0],
        turno: '',
        maquina: '',
        funcionario: null,
        peca: null,
    });
    const [error, setError] = useState('');
    const [maquinas, setMaquinas] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [pecas, setPecas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const response = await axios.get(`${REACT_APP_API_URL}/api/data/lists`);
                setMaquinas(response.data.maquinas || []);
                setFuncionarios(response.data.funcionarios || []);
                setPecas(response.data.pecas || []);
            } catch (err) {
                console.error('Erro ao carregar dados para os campos:', err);
                setError('Não foi possível carregar os dados de apoio (máquinas, peças, etc).');
            } finally {
                setLoading(false);
            }
        };
        fetchLists();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAutocompleteChange = (name) => (event, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const isFormValid = Object.entries(formData).every(([key, value]) => {
            if (key === 'funcionario' || key === 'peca') {
                return value !== null;
            }
            return value !== '' && value !== null && value !== undefined;
        });

        if (!isFormValid) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const initialDataToSend = {
            ...formData,
            funcionario: formData.funcionario.nome_completo,
            peca: formData.peca.codigo_peca,
        };
        
        navigate('/apontamentos/injetora/horaria', { state: { initialData: initialDataToSend } });
    };

    const maquinasFiltradas = formData.tipoInjetora
        ? maquinas.filter((m) => m.tipo_injetora === formData.tipoInjetora)
        : [];

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '12px' }}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Apontamento de Injetora
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                    Preencha os dados do cabeçalho para iniciar os apontamentos de produção horária.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth required size="medium">
                                <InputLabel id="tipo-injetora-label" shrink>
                                    Tipo de Injetora
                                </InputLabel>
                                <Select
                                    labelId="tipo-injetora-label"
                                    name="tipoInjetora"
                                    value={formData.tipoInjetora}
                                    onChange={handleChange}
                                    displayEmpty
                                    label="Tipo de Injetora"
                                    renderValue={(selected) => {
                                        if (!selected) return <em>Selecione</em>;
                                        return selected + 'T';
                                    }}
                                >
                                    <MenuItem value=""><em>Selecione</em></MenuItem>
                                    <MenuItem value="200">200T</MenuItem>
                                    <MenuItem value="250">250T</MenuItem>
                                    <MenuItem value="300">300T</MenuItem>
                                    <MenuItem value="450">450T</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth required size="medium">
                                <InputLabel id="maquina-label" shrink>
                                    Máquina
                                </InputLabel>
                                <Select
                                    labelId="maquina-label"
                                    name="maquina"
                                    value={formData.maquina}
                                    onChange={handleChange}
                                    disabled={!formData.tipoInjetora || loading}
                                    displayEmpty
                                    label="Máquina"
                                    renderValue={(selected) => {
                                        if (!selected) return <em>Selecione</em>;
                                        return selected;
                                    }}
                                >
                                    <MenuItem value=""><em>Selecione</em></MenuItem>
                                    {maquinasFiltradas.map((maq) => (
                                        <MenuItem key={maq.nome_maquina} value={maq.nome_maquina}>
                                            {maq.nome_maquina}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth required size="medium">
                                <InputLabel id="turno-label" shrink>
                                    Turno
                                </InputLabel>
                                <Select
                                    labelId="turno-label"
                                    name="turno"
                                    value={formData.turno}
                                    onChange={handleChange}
                                    displayEmpty
                                    label="Turno"
                                    renderValue={(selected) => {
                                        if (!selected) return <em>Selecione</em>;
                                        return selected === 'Manha'
                                            ? 'Manhã (07:00 - 18:00)'
                                            : 'Noite (18:00 - 07:00)';
                                    }}
                                >
                                    <MenuItem value=""><em>Selecione</em></MenuItem>
                                    <MenuItem value="Manha">Manhã (07:00 - 18:00)</MenuItem>
                                    <MenuItem value="Noite">Noite (18:00 - 07:00)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                label="Data do Apontamento"
                                type="date"
                                name="dataApontamento"
                                value={formData.dataApontamento}
                                onChange={handleChange}
                                fullWidth
                                required
                                InputLabelProps={{ shrink: true }}
                                size="medium"
                            />
                        </Grid>

                        <Grid item xs={12} sm={12} md={8}>
                            <Autocomplete
                                options={funcionarios}
                                getOptionLabel={(option) => option.nome_completo || ''}
                                value={formData.funcionario}
                                onChange={handleAutocompleteChange('funcionario')}
                                isOptionEqualToValue={(option, value) => option.nome_completo === value.nome_completo}
                                renderInput={(params) => <TextField {...params} label="Funcionário" required size="medium" />}
                                noOptionsText={loading ? "Carregando..." : "Nenhum funcionário encontrado"}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12} sm={12} md={8}>
                            <Autocomplete
                                options={pecas}
                                getOptionLabel={(option) => `${option.descricao_peca} (${option.codigo_peca})` || ''}
                                value={formData.peca}
                                onChange={handleAutocompleteChange('peca')}
                                isOptionEqualToValue={(option, value) => option.codigo_peca === value.codigo_peca}
                                renderInput={(params) => <TextField {...params} label="Peça" required size="medium" />}
                                noOptionsText={loading ? "Carregando..." : "Nenhuma peça encontrada"}
                                fullWidth
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                type="submit"
                                size="large"
                                fullWidth
                            >
                                Iniciar Apontamentos por Hora
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Paper>
    );
}
