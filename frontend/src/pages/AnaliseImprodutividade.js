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
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PieChart } from '@mui/x-charts/PieChart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import moment from 'moment';
import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AnaliseImprodutividade() {
    const [improdutividadeData, setImprodutividadeData] = useState([]);
    const [processedData, setProcessedData] = useState({});
    const [totalGeralPecas, setTotalGeralPecas] = useState(0);
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);

    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        selectedSetorId: ''
    });

    useEffect(() => {
        fetchSetores();
        fetchImprodutividadeData();
    }, []);

    useEffect(() => {
        if (improdutividadeData && improdutividadeData.length > 0) {
            const groupedData = improdutividadeData.reduce((acc, item) => {
                const setorNome = item.setores?.nome_setor || 'Setor Desconhecido';
                if (!acc[setorNome]) {
                    acc[setorNome] = { totalPecas: 0, records: [] };
                }
                acc[setorNome].totalPecas += item.pecas_transferidas;
                acc[setorNome].records.push(item);
                return acc;
            }, {});

            const totalPecas = improdutividadeData.reduce((sum, item) => sum + item.pecas_transferidas, 0);
            setProcessedData(groupedData);
            setTotalGeralPecas(totalPecas);
        } else {
            setProcessedData({});
            setTotalGeralPecas(0);
        }
    }, [improdutividadeData]);

    const fetchSetores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${REACT_APP_API_URL}/api/setores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSetores(response.data);
        } catch (err) {
            setError('Erro ao carregar setores.');
        }
    };

    const fetchImprodutividadeData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const params = {
                dataInicio: filters.startDate ? moment(filters.startDate).format('YYYY-MM-DD') : undefined,
                dataFim: filters.endDate ? moment(filters.endDate).format('YYYY-MM-DD') : undefined,
                setorId: filters.selectedSetorId || undefined,
            };
            const response = await axios.get(`${REACT_APP_API_URL}/api/improdutividade/analise`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setImprodutividadeData(response.data);
        } catch (err) {
            setError('Erro ao buscar dados de improdutividade. Tente novamente.');
            setImprodutividadeData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleClearFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            selectedSetorId: ''
        });
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="pt-br">
            <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    Análise de Improdutividade por Setor
                </Typography>

                <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
                    <Typography variant="h6" gutterBottom>Filtros</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="Data Início"
                                value={filters.startDate}
                                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="Data Fim"
                                value={filters.endDate}
                                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel id="setor-filter-label">Setor</InputLabel>
                                <Select
                                    labelId="setor-filter-label"
                                    value={filters.selectedSetorId}
                                    label="Setor"
                                    onChange={(e) => handleFilterChange('selectedSetorId', e.target.value)}
                                >
                                    <MenuItem value=""><em>Todos os Setores</em></MenuItem>
                                    {setores.map((setor) => (
                                        <MenuItem key={setor.id} value={setor.id}>{setor.nome_setor}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" onClick={fetchImprodutividadeData} disabled={loading} fullWidth>Aplicar</Button>
                            <Button variant="outlined" onClick={handleClearFilters} disabled={loading} fullWidth>Limpar</Button>
                        </Grid>
                    </Grid>
                </Paper>

                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && !error && (
                    Object.keys(processedData).length > 0 ? (
                        Object.entries(processedData).sort((a, b) => b[1].totalPecas - a[1].totalPecas).map(([setorNome, details]) => {
                            const percentage = totalGeralPecas > 0 ? (details.totalPecas / totalGeralPecas) * 100 : 0;
                            const chartData = [
                                { id: 0, value: details.totalPecas, label: setorNome, color: '#0288d1' },
                                { id: 1, value: totalGeralPecas - details.totalPecas, label: 'Outros Setores', color: '#e0e0e0' },
                            ];
                            return (
                                <Accordion
                                    key={setorNome}
                                    expanded={expanded === setorNome}
                                    onChange={handleAccordionChange(setorNome)}
                                    sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }}
                                    elevation={3}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>{setorNome}</Typography>
                                        <Typography sx={{ color: 'text.secondary', alignSelf: 'center', fontWeight: 'bold' }}>
                                            {details.totalPecas} peças ({percentage.toFixed(1)}%)
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 3 }}>
                                        <Grid container spacing={3} alignItems="center">
                                            <Grid item xs={12} md={4}>
                                                <Typography variant="subtitle1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>Proporção de Peças NC</Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    <PieChart
                                                        series={[{
                                                            data: chartData,
                                                            highlightScope: { faded: 'global', highlighted: 'item' },
                                                            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                            innerRadius: 40,
                                                            outerRadius: 100,
                                                            paddingAngle: 2,
                                                            cornerRadius: 5,
                                                        }]}
                                                        height={220}
                                                        slotProps={{ legend: { hidden: true } }}
                                                    />
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={8}>
                                                <TableContainer component={Paper} variant="outlined">
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Data</TableCell>
                                                                <TableCell>Hora</TableCell>
                                                                <TableCell align="right">Peças</TableCell>
                                                                <TableCell>Causa</TableCell>
                                                                <TableCell>Usuário</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {details.records.map((rec) => (
                                                                <TableRow key={rec.id}>
                                                                    <TableCell>{moment(rec.data_improdutividade).format('DD/MM/YYYY')}</TableCell>
                                                                    <TableCell>{rec.hora_improdutividade}</TableCell>
                                                                    <TableCell align="right">{rec.pecas_transferidas}</TableCell>
                                                                    <TableCell>{rec.causa || 'N/A'}</TableCell>
                                                                    <TableCell>{rec.usuario_registro}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })
                    ) : (
                        <Alert severity="info">Nenhum registro de improdutividade encontrado para os filtros selecionados.</Alert>
                    )
                )}
            </Box>
        </LocalizationProvider>
    );
}
