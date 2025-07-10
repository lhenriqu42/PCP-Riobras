import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    CircularProgress,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import axios from 'axios';
import REACT_APP_API_URL from '../api';

export default function AnaliseImprodutividade() {
    const [improdutividadeData, setImprodutividadeData] = useState([]);
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedSetorId, setSelectedSetorId] = useState('');

    useEffect(() => {
        fetchSetores();
    }, []);

    useEffect(() => {
        fetchImprodutividadeData();
    }, [startDate, endDate, selectedSetorId]);

    const fetchSetores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${REACT_APP_API_URL}/api/setores`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setSetores(response.data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar setores.');
        }
    };

    const fetchImprodutividadeData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const params = {
                dataInicio: startDate ? moment(startDate).format('YYYY-MM-DD') : '',
                dataFim: endDate ? moment(endDate).format('YYYY-MM-DD') : '',
                setorId: selectedSetorId,
            };

            const response = await axios.get(`${REACT_APP_API_URL}/api/improdutividade/analise`, {
                params: params,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setImprodutividadeData(response.data);
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar dados de improdutividade. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setSelectedSetorId('');
    };

    const calculateTotalPecasTransferidas = (data) => {
        return data.reduce((sum, item) => sum + item.pecas_transferidas, 0);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Análise de Improdutividade por Setor
                </Typography>

                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Filtros
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="Data Início"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="Data Fim"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel id="setor-filter-label">Setor</InputLabel>
                                <Select
                                    labelId="setor-filter-label"
                                    id="setor-filter"
                                    value={selectedSetorId}
                                    label="Setor"
                                    onChange={(e) => setSelectedSetorId(e.target.value)}
                                >
                                    <MenuItem value="">Todos os Setores</MenuItem>
                                    {setores.map((setor) => (
                                        <MenuItem key={setor.id} value={setor.id}>
                                            {setor.nome_setor}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="outlined"
                                onClick={handleClearFilters}
                            >
                                Limpar Filtros
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {loading && <CircularProgress sx={{ mb: 2 }} />}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Registros de Improdutividade
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Total de Peças Transferidas (filtradas): **{calculateTotalPecasTransferidas(improdutividadeData)}**
                    </Typography>
                    <TableContainer>
                        <Table stickyHeader aria-label="tabela de improdutividade">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Hora</TableCell>
                                    <TableCell>Setor</TableCell>
                                    <TableCell>Peças Transferidas</TableCell>
                                    <TableCell>Causa</TableCell>
                                    <TableCell>Registrado Por</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {improdutividadeData.length > 0 ? (
                                    improdutividadeData.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.data_improdutividade}</TableCell>
                                            <TableCell>{item.hora_improdutividade}</TableCell>
                                            <TableCell>{item.setores.nome_setor}</TableCell>
                                            <TableCell>{item.pecas_transferidas}</TableCell>
                                            <TableCell>{item.causa || 'N/A'}</TableCell>
                                            <TableCell>{item.usuario_registro || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            Nenhum registro de improdutividade encontrado para os filtros selecionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}