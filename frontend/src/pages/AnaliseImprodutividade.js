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
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { BarChart, PieChart } from '@mui/x-charts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import moment from 'moment';
import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AnaliseImprodutividade() {
    const [improdutividadeData, setImprodutividadeData] = useState([]);
    const [processedData, setProcessedData] = useState({});
    const [totalGeralPecasNC, setTotalGeralPecasNC] = useState(0);
    const [setores, setSetores] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(5); 
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
        if (setores.length > 0) { 
            const initialProcessedData = setores.reduce((acc, setor) => {
                acc[setor.nome_setor] = { totalPecas: 0, records: [] };
                return acc;
            }, {});

            const groupedData = improdutividadeData.reduce((acc, item) => {
                const setorNome = item.setores?.nome_setor || 'Setor Desconhecido';
                if (!acc[setorNome]) {
                    acc[setorNome] = { totalPecas: 0, records: [] };
                }
                acc[setorNome].totalPecas += item.pecas_transferidas;
                acc[setorNome].records.push(item);
                return acc;
            }, { ...initialProcessedData }); 

            Object.keys(groupedData).forEach(setorNome => {
                groupedData[setorNome].records.sort((a, b) => b.pecas_transferidas - a.pecas_transferidas);
            });

            const totalNC = improdutividadeData.reduce((sum, item) => sum + item.pecas_transferidas, 0);
            setProcessedData(groupedData);
            setTotalGeralPecasNC(totalNC);
        }
    }, [improdutividadeData, setores]); 

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
    
    const handleApplyFilters = () => {
        fetchImprodutividadeData();
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            selectedSetorId: ''
        });
        setTimeout(() => {
            fetchImprodutividadeData();
        }, 0);
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    
    const globalSectorDistributionPieData = Object.entries(processedData).map(([setorName, details], index) => ({
        id: index,
        value: details.totalPecas,
        label: setorName,
    }));

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
                            <Button variant="contained" onClick={handleApplyFilters} disabled={loading} fullWidth>Aplicar</Button>
                            <Button variant="outlined" onClick={handleClearFilters} disabled={loading} fullWidth>Limpar</Button>
                        </Grid>
                    </Grid>
                </Paper>

                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
                            <Typography variant="h6" gutterBottom align="center">Total de Peças Não Conformes por Setor</Typography>
                            {}
                            {Object.keys(processedData).length > 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <BarChart
                                        series={[
                                            { 
                                                data: Object.values(processedData).map(d => d.totalPecas), 
                                                label: 'Peças Não Conformes', 
                                                color: '#F44336' 
                                            },
                                        ]}
                                        height={250}
                                        xAxis={[{ scaleType: 'band', data: Object.keys(processedData) }]}
                                    />
                                </Box>
                            ) : (
                                <Alert severity="info">Nenhum registro de não conformidade encontrado para os filtros selecionados.</Alert>
                            )}
                            <Typography variant="body1" align="center" sx={{ mt: 2, fontWeight: 'bold' }}>
                                Total de Peças Não Conformes: {totalGeralPecasNC}
                            </Typography>
                        </Paper>

                        {Object.keys(processedData).length > 0 ? (
                            Object.entries(processedData).sort((a, b) => b[1].totalPecas - a[1].totalPecas).map(([setorNome, details]) => {
                                const percentageOfTotalNC = totalGeralPecasNC > 0 ? (details.totalPecas / totalGeralPecasNC) * 100 : 0;
                                
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
                                                {details.totalPecas} peças NC ({percentageOfTotalNC.toFixed(1)}% do total de NCs)
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 3 }}>
                                            <Grid container spacing={3} alignItems="flex-start">
                                                {totalGeralPecasNC > 0 && ( 
                                                    <Grid item xs={12} md={6}>
                                                        <Typography variant="subtitle1" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                            Distribuição de Peças NC entre Setores
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                                            <PieChart
                                                                series={[
                                                                    {
                                                                        data: globalSectorDistributionPieData.map(item => ({
                                                                            ...item,
                                                                            highlighted: item.label === setorNome, 
                                                                        })),
                                                                        innerRadius: 30,
                                                                        outerRadius: 80, 
                                                                        paddingAngle: 5,
                                                                        cornerRadius: 5,
                                                                        startAngle: 0, 
                                                                        endAngle: 360, 
                                                                        arcLabel: (item) => `${item.label} (${(item.value / totalGeralPecasNC * 100).toFixed(1)}%)`, // Inclui nome e porcentagem
                                                                        highlightScope: { faded: 'global', highlighted: 'item' },
                                                                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                                    },
                                                                ]}
                                                                height={300} 
                                                                width={450} 
                                                                slotProps={{
                                                                    legend: { 
                                                                        hidden: false, 
                                                                        direction: 'column', 
                                                                        position: { vertical: 'middle', horizontal: 'right' } ,
                                                                        itemMarkWidth: 20, 
                                                                        itemMarkHeight: 20,
                                                                        labelStyle: {
                                                                            fontSize: 12,
                                                                        }
                                                                    },
                                                                }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                )}
                                                
                                                <Grid item xs={12} md={totalGeralPecasNC > 0 ? 6 : 12}>
                                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                        Maiores Registros de Não Conformidade (Top {displayLimit})
                                                    </Typography>
                                                    <TableContainer component={Paper} variant="outlined">
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Data</TableCell>
                                                                    <TableCell>Hora</TableCell>
                                                                    <TableCell align="right">Peças NC</TableCell>
                                                                    <TableCell>Causa</TableCell>
                                                                    <TableCell>Usuário</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {details.records.slice(0, displayLimit).map((rec) => (
                                                                    <TableRow key={rec.id}>
                                                                        <TableCell>{moment(rec.data_improdutividade).format('DD/MM/YYYY')}</TableCell>
                                                                        <TableCell>{rec.hora_improdutividade}</TableCell>
                                                                        <TableCell align="right">{rec.pecas_transferidas}</TableCell>
                                                                        <TableCell>{rec.causa || 'N/A'}</TableCell>
                                                                        <TableCell>{rec.usuario_registro}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                                {details.records.length > displayLimit && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={5} align="center">
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                Use os filtros acima para refinar a busca e ver mais registros.
                                                                            </Typography>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
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
                        )}
                    </>
                )}
            </Box>
        </LocalizationProvider>
    );
}
