import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Menu,
    MenuItem,
    Tooltip,
    IconButton,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import REACT_APP_API_URL from '../api';
import ApontamentoService from '../services/ApontamentoService';
import RegistrarImprodutividadeModal from '../components/RegistrarImprodutividadeModal';

export default function ApontamentosInjetoraHoraria() {
    const location = useLocation();
    const navigate = useNavigate();
    const initialData = location.state?.initialData;

    const [apontamentosHorarios, setApontamentosHorarios] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const [currentHourIndex, setCurrentHourIndex] = useState(0);

    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const inputRefs = useRef({});

    const [editingRowId, setEditingRowId] = useState(null);
    const [editedRowData, setEditedRowData] = useState({});

    const [isImprodutividadeModalOpen, setIsImprodutividadeModalOpen] = useState(false);

    useEffect(() => {
        if (!initialData) {
            setError('Dados iniciais do apontamento não encontrados. Redirecionando...');
            setTimeout(() => navigate('/apontamentos/injetora/inicial'), 3000);
            return;
        }
        initializeApontamentos(initialData);
    }, [initialData, navigate]);

    useEffect(() => {
        if (inputRefs.current[`quantidade_injetada-${currentHourIndex}`] && editingRowId === null) {
            inputRefs.current[`quantidade_injetada-${currentHourIndex}`].focus();
        }
    }, [currentHourIndex, editingRowId]);

    const initializeApontamentos = async (data) => {
        const { dataApontamento, turno, maquina, funcionario, peca } = data;
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
            const hora = current.format('HH:mm');
            entries.push({
                hora,
                quantidade_injetada: '',
                pecas_nc: 0,
                observacoes: '',
                tipo_registro: 'producao',
                finalizado: false,
                id: null,
            });
            current.add(1, 'hour');
        }

        try {
            const response = await ApontamentoService.getApontamentosInjetora({
                dataApontamento: dataApontamento,
                turno: turno,
                maquina: maquina,
                funcionario: funcionario,
                peca: peca,
            });

            const existingApontamentos = response;
            const updatedEntries = entries.map(entry => {
                const existing = existingApontamentos.find(
                    ap => ap.hora_apontamento === entry.hora
                );
                if (existing) {
                    return {
                        ...entry,
                        quantidade_injetada: existing.quantidade_injetada,
                        pecas_nc: existing.pecas_nc,
                        observacoes: existing.observacoes,
                        tipo_registro: existing.tipo_registro,
                        finalizado: true,
                        id: existing.id,
                        quantidade_efetiva: existing.quantidade_efetiva, 
                    };
                }
                return entry;
            });

            setApontamentosHorarios(updatedEntries);

            const nextIndex = updatedEntries.findIndex(entry => !entry.finalizado);
            if (nextIndex !== -1) {
                setCurrentHourIndex(nextIndex);
            } else {
                setCurrentHourIndex(updatedEntries.length);
                setSuccess('Todos os apontamentos horários para esta operação já foram registrados!');
            }

        } catch (err) {
            console.error(err);
            setError('Erro ao carregar apontamentos existentes. Por favor, recarregue a página.');
            setApontamentosHorarios(entries);
        }
    };

    const handleChange = (e, index) => {
        const { name, value } = e.target;
        const newApontamentos = [...apontamentosHorarios];
        newApontamentos[index][name] = name.includes('quantidade') || name.includes('pecas') ? (value === '' ? '' : Number(value)) : value;
        setApontamentosHorarios(newApontamentos);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedRowData(prev => ({
            ...prev,
            [name]: name.includes('quantidade') || name.includes('pecas') ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const handleRegisterHour = async (index) => {
        setLoading(true);
        setError('');
        setSuccess('');

        const currentEntry = apontamentosHorarios[index];

        if (currentEntry.tipo_registro === 'producao') {
            if (currentEntry.quantidade_injetada === '' || currentEntry.pecas_nc === '') {
                setError('Por favor, preencha Quantidade Injetada e Peças Não Conformes.');
                setLoading(false);
                return;
            }
            currentEntry.quantidade_injetada = parseFloat(currentEntry.quantidade_injetada) || 0;
            currentEntry.pecas_nc = parseFloat(currentEntry.pecas_nc) || 0;
        }

        const payload = {
            ...initialData,
            hora_apontamento: currentEntry.hora,
            quantidade_injetada: currentEntry.quantidade_injetada,
            pecas_nc: currentEntry.pecas_nc,
            observacoes: currentEntry.observacoes,
            tipo_registro: currentEntry.tipo_registro,
        };

        try {
            const response = await axios.post(`${REACT_APP_API_URL}/api/apontamentos/injetora`, payload);
            setSuccess(`Apontamento para ${currentEntry.hora} registrado com sucesso!`);
            const updatedApontamentos = [...apontamentosHorarios];
            updatedApontamentos[index].finalizado = true;
            updatedApontamentos[index].id = response.data.id;
            updatedApontamentos[index].quantidade_efetiva = response.data.quantidade_efetiva; 
            setApontamentosHorarios(updatedApontamentos);

            if (index < apontamentosHorarios.length - 1) {
                setCurrentHourIndex(index + 1);
            } else {
                setSuccess('Todos os apontamentos horários foram registrados!');
                navigate('/dashboard/injetora');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao registrar apontamento horário. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (apontamento) => {
        setEditingRowId(apontamento.id);
        setEditedRowData({ ...apontamento });
    };

    const handleSaveEdit = async (id) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const dataToUpdate = {
                quantidade_injetada: parseFloat(editedRowData.quantidade_injetada) || 0,
                pecas_nc: parseFloat(editedRowData.pecas_nc) || 0,
                observacoes: editedRowData.observacoes,
                tipo_registro: editedRowData.tipo_registro,
            };
            const response = await ApontamentoService.updateApontamentoInjetora(id, dataToUpdate);
            setSuccess('Apontamento atualizado com sucesso!');
            await initializeApontamentos(initialData);
            setEditingRowId(null);
            setEditedRowData({});
        } catch (err) {
            console.error(err);
            setError('Não foi possível salvar a edição do apontamento. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingRowId(null);
        setEditedRowData({});
    };

    const handleClickMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleSpecialAction = (type) => {
        const index = currentHourIndex;
        const newApontamentos = [...apontamentosHorarios];
        let currentEntry = newApontamentos[index];

        if (!currentEntry) {
            setError("Não há mais horários para registrar ou um erro ocorreu.");
            handleCloseMenu();
            return;
        }

        currentEntry.quantidade_injetada = 0;
        currentEntry.pecas_nc = 0;
        currentEntry.observacoes = `Operação de ${type.toUpperCase()}`;
        currentEntry.tipo_registro = type;
        
        setApontamentosHorarios(newApontamentos);
        handleRegisterHour(index);
        handleCloseMenu();
    };

    const handleEndOperation = () => {
        setLoading(true);
        setError('');
        setSuccess('');

        const finishRemainingHours = async () => {
            const updatedApontamentos = [...apontamentosHorarios];
            for (let i = currentHourIndex; i < updatedApontamentos.length; i++) {
                if (!updatedApontamentos[i].finalizado) {
                    let currentPayload;
                    if (i === currentHourIndex && updatedApontamentos[i].tipo_registro === 'producao' &&
                        (updatedApontamentos[i].quantidade_injetada !== '' || updatedApontamentos[i].pecas_nc !== '')) {
                        currentPayload = {
                            ...initialData,
                            hora_apontamento: updatedApontamentos[i].hora,
                            quantidade_injetada: parseFloat(updatedApontamentos[i].quantidade_injetada) || 0,
                            pecas_nc: parseFloat(updatedApontamentos[i].pecas_nc) || 0,
                            observacoes: updatedApontamentos[i].observacoes || '',
                            tipo_registro: updatedApontamentos[i].tipo_registro,
                        };
                    } else {
                        currentPayload = {
                            ...initialData,
                            hora_apontamento: updatedApontamentos[i].hora,
                            quantidade_injetada: 0,
                            pecas_nc: 0,
                            observacoes: 'Operação encerrada antes do horário',
                            tipo_registro: 'finalizado',
                        };
                    }
                    try {
                        const response = await axios.post(`${REACT_APP_API_URL}/api/apontamentos/injetora`, currentPayload);
                        updatedApontamentos[i].finalizado = true;
                        updatedApontamentos[i].id = response.data.id;
                        updatedApontamentos[i].quantidade_injetada = currentPayload.quantidade_injetada;
                        updatedApontamentos[i].pecas_nc = currentPayload.pecas_nc;
                        updatedApontamentos[i].observacoes = currentPayload.observacoes;
                        updatedApontamentos[i].tipo_registro = currentPayload.tipo_registro;
                        updatedApontamentos[i].quantidade_efetiva = response.data.quantidade_efetiva; // Update quantidade_efetiva
                        setApontamentosHorarios([...updatedApontamentos]);
                    } catch (err) {
                        console.error(err);
                        setError(`Erro ao registrar algumas horas como finalizadas.`);
                        setLoading(false);
                        return;
                    }
                }
            }
            setSuccess('Operação encerrada com sucesso! Todos os horários restantes foram marcados.');
            setLoading(false);
            navigate('/dashboard/injetora');
        };

        finishRemainingHours();
        handleCloseMenu();
    };

    const handleTableKeyPress = (e, index, fieldName) => {
        if (e.key === 'Enter' && index === currentHourIndex && editingRowId === null) {
            const nextFieldIndex = {
                'quantidade_injetada': 'pecas_nc',
                'pecas_nc': 'observacoes',
                'observacoes': 'submit',
            };

            const nextField = nextFieldIndex[fieldName];

            if (nextField === 'submit') {
                handleRegisterHour(index);
            } else if (inputRefs.current[`${nextField}-${index}`]) {
                inputRefs.current[`${nextField}-${index}`].focus();
            }
        }
    };

    const handleOpenImprodutividadeModal = () => {
        setIsImprodutividadeModalOpen(true);
    };

    const handleCloseImprodutividadeModal = () => {
        setIsImprodutividadeModalOpen(false);
    };

    const handleImprodutividadeSuccess = async () => {
        await initializeApontamentos(initialData); 
    };

    if (error && !initialData) {
        return (
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!initialData || apontamentosHorarios.length === 0) {
        return (
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Typography>Carregando dados do apontamento...</Typography>
            </Box>
        );
    }

    return (
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Apontamento de Injetora (Apontamentos Horários)
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Dados Iniciais:
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body1">
                            <strong>Tipo Injetora:</strong> {initialData.tipoInjetora}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body1">
                            <strong>Máquina:</strong> {initialData.maquina}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body1">
                            <strong>Funcionário:</strong> {initialData.funcionario}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body1">
                            <strong>Peça:</strong> {initialData.peca}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body1">
                            <strong>Data:</strong> {initialData.dataApontamento}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="body1">
                            <strong>Turno:</strong> {initialData.turno}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Registro Horário
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Hora</TableCell>
                                <TableCell>Quantidade Injetada</TableCell>
                                <TableCell>Peças Não Conformes (NC)</TableCell>
                                <TableCell>Observações</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {apontamentosHorarios.map((entry, index) => (
                                <TableRow
                                    key={entry.id || index}
                                    sx={{
                                        backgroundColor: entry.finalizado ? '#f0f0f0' : 'inherit',
                                        '&.Mui-selected': {
                                            backgroundColor: '#e0f7fa',
                                        },
                                    }}
                                    selected={editingRowId === entry.id}
                                >
                                    <TableCell>{entry.hora}</TableCell>
                                    <TableCell>
                                        {entry.finalizado && editingRowId === entry.id ? (
                                            <TextField
                                                name="quantidade_injetada"
                                                value={editedRowData.quantidade_injetada}
                                                onChange={handleEditChange}
                                                type="number"
                                                size="small"
                                                sx={{ width: 100 }}
                                            />
                                        ) : (
                                            <TextField
                                                name="quantidade_injetada"
                                                value={entry.quantidade_injetada}
                                                onChange={(e) => handleChange(e, index)}
                                                type="number"
                                                size="small"
                                                disabled={index !== currentHourIndex || entry.finalizado && entry.tipo_registro !== 'producao'}
                                                sx={{ width: 100 }}
                                                inputRef={el => inputRefs.current[`quantidade_injetada-${index}`] = el}
                                                onKeyPress={(e) => handleTableKeyPress(e, index, 'quantidade_injetada')}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {entry.finalizado && editingRowId === entry.id ? (
                                            <TextField
                                                name="pecas_nc"
                                                value={editedRowData.pecas_nc}
                                                onChange={handleEditChange}
                                                type="number"
                                                size="small"
                                                sx={{ width: 100 }}
                                            />
                                        ) : (
                                            <TextField
                                                name="pecas_nc"
                                                value={entry.pecas_nc}
                                                onChange={(e) => handleChange(e, index)}
                                                type="number"
                                                size="small"
                                                disabled={index !== currentHourIndex || entry.finalizado && entry.tipo_registro !== 'producao'}
                                                sx={{ width: 100 }}
                                                inputRef={el => inputRefs.current[`pecas_nc-${index}`] = el}
                                                onKeyPress={(e) => handleTableKeyPress(e, index, 'pecas_nc')}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {entry.finalizado && editingRowId === entry.id ? (
                                            <TextField
                                                name="observacoes"
                                                value={editedRowData.observacoes}
                                                onChange={handleEditChange}
                                                fullWidth
                                                size="small"
                                                multiline
                                                rows={1}
                                            />
                                        ) : (
                                            <TextField
                                                name="observacoes"
                                                value={entry.observacoes}
                                                onChange={(e) => handleChange(e, index)}
                                                fullWidth
                                                size="small"
                                                disabled={index !== currentHourIndex || entry.finalizado}
                                                inputRef={el => inputRefs.current[`observacoes-${index}`] = el}
                                                onKeyPress={(e) => handleTableKeyPress(e, index, 'observacoes')}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {index === currentHourIndex && !entry.finalizado ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => handleRegisterHour(index)}
                                                    disabled={loading || entry.finalizado}
                                                    size="small"
                                                >
                                                    Registrar
                                                </Button>
                                                <Tooltip title="Opções Especiais">
                                                    <Button
                                                        variant="outlined"
                                                        onClick={handleClickMenu}
                                                        disabled={loading}
                                                        size="small"
                                                        sx={{ minWidth: 35, p: '6px 8px' }}
                                                    >
                                                        <MoreVertIcon />
                                                    </Button>
                                                </Tooltip>
                                                <Menu
                                                    anchorEl={anchorEl}
                                                    open={openMenu}
                                                    onClose={handleCloseMenu}
                                                >
                                                    <MenuItem onClick={() => handleSpecialAction('intervalo')}>Intervalo</MenuItem>
                                                    <MenuItem onClick={() => handleSpecialAction('setup')}>Setup</MenuItem>
                                                    <MenuItem onClick={handleEndOperation}>Encerrar Operação</MenuItem>
                                                </Menu>
                                            </Box>
                                        ) : entry.finalizado && editingRowId === entry.id ? (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton color="primary" onClick={() => handleSaveEdit(entry.id)} aria-label="Salvar">
                                                    <SaveIcon />
                                                </IconButton>
                                                <IconButton color="secondary" onClick={handleCancelEdit} aria-label="Cancelar">
                                                    <CancelIcon />
                                                </IconButton>
                                            </Box>
                                        ) : entry.finalizado ? (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                    Registrado ({entry.tipo_registro.toUpperCase()})
                                                </Typography>
                                                <IconButton color="info" onClick={() => handleEditClick(entry)} aria-label="Editar">
                                                    <EditIcon />
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Aguardando...
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleOpenImprodutividadeModal}
                        disabled={loading}
                    >
                        Registrar Improdutividade
                    </Button>
                </Box>
            </Paper>

            <RegistrarImprodutividadeModal
                open={isImprodutividadeModalOpen}
                onClose={handleCloseImprodutividadeModal}
                dataApontamento={initialData?.dataApontamento}
                apontamentosHorarios={apontamentosHorarios}
                onSuccess={handleImprodutividadeSuccess}
            />
        </Box>
    );
}
