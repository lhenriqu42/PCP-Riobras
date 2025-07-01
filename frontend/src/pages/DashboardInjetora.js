import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton,
    Button
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';

// Cores para o gráfico de pizza
const COLORS = ['#00C49F', '#FF8042', '#0088FE']; // Conforme, Não Conforme, Dentro da Meta

// Componente para exibir detalhes do produto/data
function Row({ row }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {row.peca}
                </TableCell>
                <TableCell>{moment(row.data).format('DD/MM/YYYY')}</TableCell>
                <TableCell align="right">{row.totalEfetiva}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Detalhes do Apontamento
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Hora</TableCell>
                                        <TableCell>Turno</TableCell>
                                        <TableCell>Máquina</TableCell>
                                        <TableCell>Funcionário</TableCell>
                                        <TableCell align="right">Quant. Injetada</TableCell>
                                        <TableCell align="right">Peças NC</TableCell>
                                        <TableCell align="right">Quant. Efetiva</TableCell>
                                        <TableCell>Observações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.details.map((detailRow, index) => (
                                        <TableRow key={detailRow.id || index}>
                                            <TableCell component="th" scope="row">
                                                {/* LINHA AJUSTADA AQUI */}
                                                {detailRow.hora_apontamento ? moment(detailRow.hora_apontamento).format('HH:mm') : 'N/A'}
                                            </TableCell>
                                            <TableCell>{detailRow.turno}</TableCell>
                                            <TableCell>{detailRow.maquina}</TableCell>
                                            <TableCell>{detailRow.funcionario}</TableCell>
                                            <TableCell align="right">{detailRow.quantidade_injetada}</TableCell>
                                            <TableCell align="right">{detailRow.pecas_nc}</TableCell>
                                            <TableCell align="right">{detailRow.quantidade_efetiva}</TableCell>
                                            <TableCell>{detailRow.observacoes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}


export default function DashboardInjetora() {
    const { user } = useAuth();
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [error, setError] = useState('');
    const [apontamentos, setApontamentos] = useState([]);
    const [dailyProductionData, setDailyProductionData] = useState([]);
    const [aggregatedData, setAggregatedData] = useState([]);
    const [pieChartData, setPieChartData] = useState([]);

    const [startDate, setStartDate] = useState(moment().subtract(7, 'days'));
    const [endDate, setEndDate] = useState(moment());
    // <<<<<<< ALTERAÇÃO AQUI: Valores iniciais para 'todos'
    const [selectedPeca, setSelectedPeca] = useState('todos');
    const [selectedTipoInjetora, setSelectedTipoInjetora] = useState('todos');
    const [selectedTurno, setSelectedTurno] = useState('todos');

    const [metaProducao, setMetaProducao] = useState(0);
    const [editMetaMode, setEditMetaMode] = useState(false);
    const [newMetaValue, setNewMetaValue] = useState(0);

    const [pecasList, setPecasList] = useState([]);
    const [maquinasList, setMaquinasList] = useState([]);
    const [turnosList] = useState(['Manha', 'Noite']);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingFilters(true);
                const listsResponse = await axios.get('http://localhost:3001/api/data/lists');
                setPecasList(listsResponse.data.pecas);
                const uniqueTiposInjetora = [...new Set(listsResponse.data.maquinas.map(m => m.tipo_injetora))];
                setMaquinasList(uniqueTiposInjetora);

                const metaResponse = await axios.get('http://localhost:3001/api/meta-producao');
                setMetaProducao(metaResponse.data.meta || 0);
                setNewMetaValue(metaResponse.data.meta || 0);

            } catch (err) {
                console.error('Erro ao carregar dados iniciais:', err);
                setError('Erro ao carregar opções de filtro ou meta de produção. Tente novamente.');
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchData();
    }, []);

    const processApontamentosForDashboard = useCallback((data, currentMeta) => {
        const dailyAggregates = {};
        const productDateAggregates = {};
        let totalPecasConformes = 0;
        let totalPecasNC = 0;
        let totalProducaoEfetiva = 0;
        let totalMetaProducao = 0;

        data.forEach(ap => {
            const date = moment(ap.data_apontamento).format('YYYY-MM-DD');
            const peca = ap.peca;

            if (!dailyAggregates[date]) {
                dailyAggregates[date] = {
                    date: date,
                    quantidadeInjetada: 0,
                    pecasNC: 0,
                    quantidadeEfetiva: 0,
                    meta: currentMeta
                };
            }
            dailyAggregates[date].quantidadeInjetada += ap.quantidade_injetada;
            dailyAggregates[date].pecasNC += ap.pecas_nc;
            dailyAggregates[date].quantidadeEfetiva += ap.quantidade_efetiva;

            const key = `${peca}_${date}`;
            if (!productDateAggregates[key]) {
                productDateAggregates[key] = {
                    peca: peca,
                    data: date,
                    totalInjetada: 0,
                    totalNC: 0,
                    totalEfetiva: 0,
                    details: []
                };
            }
            productDateAggregates[key].totalInjetada += ap.quantidade_injetada;
            productDateAggregates[key].totalNC += ap.pecas_nc;
            productDateAggregates[key].totalEfetiva += ap.quantidade_efetiva;
            productDateAggregates[key].details.push(ap);

            totalPecasConformes += (ap.quantidade_injetada - ap.pecas_nc);
            totalPecasNC += ap.pecas_nc;
            totalProducaoEfetiva += ap.quantidade_efetiva;
        });

        const numDays = endDate.diff(startDate, 'days') + 1;
        totalMetaProducao = currentMeta * numDays;

        const sortedDailyData = Object.values(dailyAggregates).sort((a, b) => moment(a.date).diff(moment(b.date)));
        setDailyProductionData(sortedDailyData);

        const sortedProductDateData = Object.values(productDateAggregates).sort((a, b) => {
            const dateComparison = moment(a.data).diff(moment(b.data));
            if (dateComparison !== 0) return dateComparison;
            return a.peca.localeCompare(b.peca);
        });
        setAggregatedData(sortedProductDateData);

        const totalPecas = totalPecasConformes + totalPecasNC;
        const percentConformes = totalPecas > 0 ? (totalPecasConformes / totalPecas) * 100 : 0;
        const percentNC = totalPecas > 0 ? (totalPecasNC / totalPecas) * 100 : 0;

        const percentDentroMeta = totalMetaProducao > 0 && totalProducaoEfetiva > 0
            ? (totalProducaoEfetiva / totalMetaProducao) * 100
            : 0;

        const finalPercentDentroMeta = Math.min(percentDentroMeta, 100);

        setPieChartData([
            { name: 'Peças Conformes', value: percentConformes },
            { name: 'Peças Não Conformes', value: percentNC },
            { name: 'Produção vs. Meta (%)', value: finalPercentDentroMeta },
        ]);
    }, [startDate, endDate]);

    useEffect(() => {
        const handleApplyFilters = async () => {
            setError('');
            setLoadingFilters(true);
            try {
                // <<<<<<< ALTERAÇÃO AQUI: Passa 'null' para o backend se 'todos' for selecionado
                const params = {
                    dataInicio: startDate ? startDate.format('YYYY-MM-DD') : '',
                    dataFim: endDate ? endDate.format('YYYY-MM-DD') : '',
                    peca: selectedPeca === 'todos' ? null : selectedPeca,
                    tipoInjetora: selectedTipoInjetora === 'todos' ? null : selectedTipoInjetora,
                    turno: selectedTurno === 'todos' ? null : selectedTurno,
                };
                const response = await axios.get('http://localhost:3001/api/apontamentos/injetora', { params });
                setApontamentos(response.data);
                processApontamentosForDashboard(response.data, metaProducao);

            } catch (err) {
                console.error('Erro ao buscar apontamentos filtrados:', err);
                setError('Erro ao buscar dados para o relatório.');
            } finally {
                setLoadingFilters(false);
            }
        };
        handleApplyFilters();
    }, [startDate, endDate, selectedPeca, selectedTipoInjetora, selectedTurno, metaProducao, processApontamentosForDashboard]);

    const handlePecaChange = (event) => {
        setSelectedPeca(event.target.value);
    };

    const handleTipoInjetoraChange = (event) => {
        setSelectedTipoInjetora(event.target.value);
    };

    const handleTurnoChange = (event) => {
        setSelectedTurno(event.target.value);
    };

    const handleNewMetaChange = (event) => {
        setNewMetaValue(Number(event.target.value));
    };

    const handleSaveMeta = async () => {
        setError('');
        try {
            const response = await axios.post('http://localhost:3001/api/meta-producao', { meta: newMetaValue });
            if (response.status === 200) {
                setMetaProducao(newMetaValue);
                setEditMetaMode(false);
                processApontamentosForDashboard(apontamentos, newMetaValue);
            }
        } catch (err) {
            console.error('Erro ao salvar nova meta:', err);
            const errorMessage = err.response?.data?.message || 'Erro ao salvar a meta. Verifique suas permissões ou a conexão.';
            setError(errorMessage);
        }
    };

    const handleCancelEditMeta = () => {
        setNewMetaValue(metaProducao);
        setEditMetaMode(false);
    };

    const canEditMeta = user?.level === 2;

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Dashboard de Produção - Injetora
                </Typography>

                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Filtros
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <DatePicker
                                label="Data Início"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                                format="DD/MM/YYYY"
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <DatePicker
                                label="Data Fim"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                                format="DD/MM/YYYY"
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth>
                                <InputLabel id="peca-select-label">Peça (Produto)</InputLabel>
                                <Select
                                    labelId="peca-select-label"
                                    value={selectedPeca}
                                    label="Peça (Produto)"
                                    onChange={handlePecaChange}
                                    disabled={loadingFilters}
                                    // <<<<<<< ADIÇÃO: displayEmpty e renderValue para mostrar "Todos" corretamente
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === 'todos') {
                                            return <em>Todos</em>;
                                        }
                                        const peca = pecasList.find(p => p.codigo_peca === selected);
                                        return peca ? `${peca.descricao_peca} (${peca.codigo_peca})` : '';
                                    }}
                                >
                                    {/* <<<<<<< ALTERAÇÃO AQUI: Value "todos" */}
                                    <MenuItem value="todos"><em>Todos</em></MenuItem>
                                    {pecasList.map((peca) => (
                                        <MenuItem key={peca.codigo_peca} value={peca.codigo_peca}>
                                            {peca.descricao_peca} ({peca.codigo_peca})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth>
                                <InputLabel id="tipo-injetora-select-label">Tipo Injetora</InputLabel>
                                <Select
                                    labelId="tipo-injetora-select-label"
                                    value={selectedTipoInjetora}
                                    label="Tipo Injetora"
                                    onChange={handleTipoInjetoraChange}
                                    disabled={loadingFilters}
                                    // <<<<<<< ADIÇÃO: displayEmpty e renderValue para mostrar "Todos" corretamente
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === 'todos') {
                                            return <em>Todos</em>;
                                        }
                                        return selected;
                                    }}
                                >
                                    {/* <<<<<<< ALTERAÇÃO AQUI: Value "todos" */}
                                    <MenuItem value="todos"><em>Todos</em></MenuItem>
                                    {maquinasList.map((tipo) => (
                                        <MenuItem key={tipo} value={tipo}>
                                            {tipo}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <FormControl fullWidth>
                                <InputLabel id="turno-select-label">Turno</InputLabel>
                                <Select
                                    labelId="turno-select-label"
                                    value={selectedTurno}
                                    label="Turno"
                                    onChange={handleTurnoChange}
                                    disabled={loadingFilters}
                                    // <<<<<<< ADIÇÃO: displayEmpty e renderValue para mostrar "Todos" corretamente
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === 'todos') {
                                            return <em>Todos</em>;
                                        }
                                        return selected;
                                    }}
                                >
                                    {/* <<<<<<< ALTERAÇÃO AQUI: Value "todos" */}
                                    <MenuItem value="todos"><em>Todos</em></MenuItem>
                                    {turnosList.map((turno) => (
                                        <MenuItem key={turno} value={turno}>
                                            {turno}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                label="Meta de Produção Diária"
                                type="number"
                                fullWidth
                                value={editMetaMode ? newMetaValue : metaProducao}
                                onChange={handleNewMetaChange}
                                disabled={!editMetaMode || !canEditMeta}
                                InputProps={{
                                    readOnly: !editMetaMode,
                                }}
                            />
                            {canEditMeta && (
                                editMetaMode ? (
                                    <>
                                        <IconButton color="primary" onClick={handleSaveMeta} aria-label="Salvar Meta">
                                            <SaveIcon />
                                        </IconButton>
                                        <IconButton color="secondary" onClick={handleCancelEditMeta} aria-label="Cancelar Edição">
                                            <CancelIcon />
                                        </IconButton>
                                    </>
                                ) : (
                                    <IconButton color="default" onClick={() => setEditMetaMode(true)} aria-label="Editar Meta">
                                        <EditIcon />
                                    </IconButton>
                                )
                            )}
                        </Grid>
                    </Grid>
                    {loadingFilters && <Typography sx={{ mt: 2 }}>Carregando opções de filtro...</Typography>}
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Paper>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}> {/* GRÁFICO DE LINHA: MD={4} */}
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Produção Diária (Quantidade Efetiva vs. Meta)
                            </Typography>
                            {loadingFilters ? (
                                <Typography>Carregando dados para os gráficos...</Typography>
                            ) : dailyProductionData.length === 0 ? (
                                <Typography>Nenhum dado disponível para os gráficos com os filtros selecionados.</Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={dailyProductionData}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="quantidadeEfetiva" stroke="#8884d8" name="Quantidade Efetiva Injetada" />
                                        <Line type="monotone" dataKey="meta" stroke="#82ca9d" name="Meta de Produção" />
                                        <Line type="monotone" dataKey="pecasNC" stroke="#ff0000" name="Peças Não Conformes" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}> {}
                        <Paper elevation={3} sx={{ p: 1, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Distribuição da Produção (%)
                            </Typography>
                            {loadingFilters ? (
                                <Typography>Calculando porcentagens...</Typography>
                            ) : pieChartData.length === 0 || pieChartData.every(data => data.value === 0) ? ( // MUDANÇA AQUI: Adiciona .length === 0
                                <Typography>Nenhum dado disponível para o gráfico de distribuição.</Typography>
                            ) : (
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                                        <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Dados Filtrados (Tabela)
                    </Typography>
                    {loadingFilters ? (
                        <Typography>Carregando dados da tabela...</Typography>
                    ) : aggregatedData.length === 0 ? (
                        <Typography>Nenhum dado agregado disponível para os filtros selecionados.</Typography>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table aria-label="collapsible table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell />
                                        <TableCell>Peça</TableCell>
                                        <TableCell>Data</TableCell>
                                        <TableCell align="right">Total Efetiva Injetada</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {aggregatedData.map((row, index) => (
                                        <Row key={index} row={row} />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}