import React, { useState } from 'react';
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
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useEffect, useCallback } from 'react';
import REACT_APP_API_URL from '../api';

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
                <TableCell>{row.turno}</TableCell>
                <TableCell>{row.funcionario}</TableCell>
                <TableCell>{row.maquina}</TableCell>
                <TableCell align="right">{row.totalEfetiva}</TableCell>
                <TableCell align="right">{row.totalNC}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Detalhes Horários
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
                                        <TableRow key={detailRow.id_apontamento_injetora || index}>
                                            <TableCell component="th" scope="row">
                                                {detailRow.hora_apontamento || 'N/A'}
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

    const [startDate, setStartDate] = useState(moment().subtract(7, 'days'));
    const [endDate, setEndDate] = useState(moment());
    const [selectedPeca, setSelectedPeca] = useState('todos');
    const [selectedTipoInjetora, setSelectedTipoInjetora] = useState('todos');
    const [selectedTurno, setSelectedTurno] = useState('todos');

    const [metaProducao, setMetaProducao] = useState(0);
    const [editMetaMode, setEditMetaMode] = useState(false);
    const [newMetaValue, setNewMetaValue] = useState(0);

    const [pecasList, setPecasList] = useState([]);
    const [maquinasList, setMaquinasList] = useState([]);
    const [turnosList] = useState(['Manha', 'Noite']);

    const canEditMeta = user?.level === 2;

    const processApontamentosForDashboard = useCallback((data, currentMeta) => {
        const dailyAggregates = {};
        const tableAggregates = {};

        data.forEach(ap => {
            const dateKey = moment(ap.data_apontamento).format('YYYY-MM-DD');

            if (!dailyAggregates[dateKey]) {
                dailyAggregates[dateKey] = {
                    date: dateKey,
                    quantidadeInjetada: 0,
                    pecasNC: 0,
                    quantidadeEfetiva: 0,
                    meta: Number(currentMeta)
                };
            }

            dailyAggregates[dateKey].quantidadeInjetada += Number(ap.quantidade_injetada || 0);
            dailyAggregates[dateKey].pecasNC += Number(ap.pecas_nc || 0);
            dailyAggregates[dateKey].quantidadeEfetiva += Number(ap.quantidade_efetiva || 0);

            const tableGroupKey = `${ap.peca}_${dateKey}_${ap.turno}_${ap.funcionario}_${ap.maquina}`;

            if (!tableAggregates[tableGroupKey]) {
                tableAggregates[tableGroupKey] = {
                    id: tableGroupKey,
                    peca: ap.peca,
                    data: dateKey,
                    turno: ap.turno,
                    funcionario: ap.funcionario,
                    maquina: ap.maquina,
                    totalEfetiva: 0,
                    totalNC: 0,
                    details: []
                };
            }
            tableAggregates[tableGroupKey].totalEfetiva += Number(ap.quantidade_efetiva || 0);
            tableAggregates[tableGroupKey].totalNC += Number(ap.pecas_nc || 0);
            tableAggregates[tableGroupKey].details.push(ap);
        });

        const sortedDailyData = Object.values(dailyAggregates).sort((a, b) => moment(a.date).diff(moment(b.date)));
        setDailyProductionData(sortedDailyData);

        const sortedTableData = Object.values(tableAggregates).sort((a, b) => {
            const dateComparison = moment(a.data).diff(moment(b.data));
            if (dateComparison !== 0) return dateComparison;
            let comparison = a.peca.localeCompare(b.peca);
            if (comparison !== 0) return comparison;
            comparison = a.turno.localeCompare(b.turno);
            if (comparison !== 0) return comparison;
            comparison = a.funcionario.localeCompare(b.funcionario);
            if (comparison !== 0) return comparison;
            return a.maquina.localeCompare(b.maquina);
        });

        sortedTableData.forEach(group => {
            group.details.sort((a, b) => {
                const timeA = moment(a.hora_apontamento, 'HH:mm');
                const timeB = moment(b.hora_apontamento, 'HH:mm');

                let effectiveTimeA = timeA;
                let effectiveTimeB = timeB;

                if (group.turno === 'Noite') {
                    if (timeA.hour() >= 0 && timeA.hour() < 7) {
                        effectiveTimeA = moment(a.hora_apontamento, 'HH:mm').add(24, 'hours');
                    }
                    if (timeB.hour() >= 0 && timeB.hour() < 7) {
                        effectiveTimeB = moment(b.hora_apontamento, 'HH:mm').add(24, 'hours');
                    }
                }
                return effectiveTimeA.diff(effectiveTimeB);
            });
        });

        setAggregatedData(sortedTableData);

    }, []);


    const handleApplyFilters = useCallback(async () => {
        setError('');
        setLoadingFilters(true);
        try {
            const params = {
                dataInicio: startDate ? startDate.format('YYYY-MM-DD') : '',
                dataFim: endDate ? endDate.format('YYYY-MM-DD') : '',
                peca: selectedPeca === 'todos' ? null : selectedPeca,
                tipoInjetora: selectedTipoInjetora === 'todos' ? null : selectedTipoInjetora,
                turno: selectedTurno === 'todos' ? null : selectedTurno,
            };
            const response = await axios.get(`${REACT_APP_API_URL}/api/apontamentos/injetora`, { params });
            setApontamentos(response.data);
            processApontamentosForDashboard(response.data, metaProducao);
        } catch (err) {
            console.error('Erro ao buscar apontamentos filtrados:', err);
            setError('Erro ao buscar dados para o relatório.');
        } finally {
            setLoadingFilters(false);
        }
    }, [startDate, endDate, selectedPeca, selectedTipoInjetora, selectedTurno, metaProducao, processApontamentosForDashboard]);


    useEffect(() => {
        const fetchDataAndMeta = async () => {
            try {
                setLoadingFilters(true);
                const listsResponse = await axios.get(`${REACT_APP_API_URL}/api/data/lists`);
                setPecasList(listsResponse.data.pecas);
                const uniqueTiposInjetora = [...new Set(listsResponse.data.maquinas.map(m => m.tipo_injetora))];
                setMaquinasList(uniqueTiposInjetora);

                const metaResponse = await axios.get(`${REACT_APP_API_URL}/api/meta-producao`);
                setMetaProducao(Number(metaResponse.data.meta || 0));
                setNewMetaValue(Number(metaResponse.data.meta || 0));

            } catch (err) {
                console.error('Erro ao carregar dados iniciais:', err);
                setError('Erro ao carregar opções de filtro ou meta de produção. Tente novamente.');
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchDataAndMeta();
    }, []);

    useEffect(() => {
        handleApplyFilters();
    }, [handleApplyFilters]);


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
            const response = await axios.post(`${REACT_APP_API_URL}/api/meta-producao`, { meta: newMetaValue });
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
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === 'todos') {
                                            return <em>Todos</em>;
                                        }
                                        const peca = pecasList.find(p => p.codigo_peca === selected);
                                        return peca ? `${peca.descricao_peca} (${peca.codigo_peca})` : '';
                                    }}
                                >
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
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === 'todos') {
                                            return <em>Todos</em>;
                                        }
                                        return selected;
                                    }}
                                >
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
                                    displayEmpty
                                    renderValue={(selected) => {
                                        if (selected === 'todos') {
                                            return <em>Todos</em>;
                                        }
                                        return selected;
                                    }}
                                >
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
                    <Grid item xs={12} md={12}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Produção Diária (Quantidade Efetiva vs. Meta e Peças NC)
                            </Typography>
                            {loadingFilters ? (
                                <Typography>Carregando dados para os gráficos...</Typography>
                            ) : dailyProductionData.length === 0 ? (
                                <Typography>Nenhum dado disponível para os gráficos com os filtros selecionados.</Typography>
                            ) : (
                                <ResponsiveContainer width="101%" height={300}>
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
                                        <TableCell>Turno</TableCell>
                                        <TableCell>Funcionário</TableCell>
                                        <TableCell>Máquina</TableCell>
                                        <TableCell align="right">Total Efetiva</TableCell>
                                        <TableCell align="right">Total Peças NC</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {aggregatedData.map((row) => (
                                        <Row key={row.id} row={row} />
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