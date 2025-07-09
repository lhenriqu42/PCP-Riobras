import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Button, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, TextField, Grid, IconButton,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApontamentoService from '../services/ApontamentoService';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

const MIN_AUTH_LEVEL = 2;

export default function ApontamentosManutencao() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [apontamentos, setApontamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editedApontamento, setEditedApontamento] = useState({});

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [apontamentoToDelete, setApontamentoToDelete] = useState(null);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(new Date());

    const fetchApontamentos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (startDate) {
                params.dataInicio = startDate.toISOString().split('T')[0];
            }
            if (endDate) {
                params.dataFim = endDate.toISOString().split('T')[0];
            }
            const data = await ApontamentoService.getApontamentosInjetora(params);
            setApontamentos(data);
        } catch (err) {
            console.error('Erro ao buscar apontamentos:', err);
            setError('Não foi possível carregar os apontamentos. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.level < MIN_AUTH_LEVEL) {
                navigate('/home', { replace: true });
                return;
            }
            fetchApontamentos();
        }
    }, [user, authLoading, navigate, fetchApontamentos]);

    const handleEditClick = (apontamento) => {
        setEditingId(apontamento.id);
        setEditedApontamento({ ...apontamento });
    };

    const handleSaveClick = async (id) => {
        setError('');
        try {
            const dataToUpdate = {
                quantidade_injetada: editedApontamento.quantidade_injetada,
                pecas_nc: editedApontamento.pecas_nc,
                observacoes: editedApontamento.observacoes,
            };
            await ApontamentoService.updateApontamentoInjetora(id, dataToUpdate);
            await fetchApontamentos();
            setEditingId(null);
            setEditedApontamento({});
        } catch (err) {
            console.error('Erro ao salvar apontamento:', err);
            setError('Não foi possível salvar o apontamento. ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditedApontamento({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedApontamento(prev => ({ ...prev, [name]: value }));
    };

    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        setEditedApontamento(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleDeleteClick = (apontamento) => {
        setApontamentoToDelete(apontamento);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setApontamentoToDelete(null);
    };

    const handleConfirmDelete = async () => {
        setError('');
        try {
            await ApontamentoService.deleteApontamentoInjetora(apontamentoToDelete.id);
            await fetchApontamentos(); // Recarrega os dados após a exclusão
            handleCloseDeleteDialog();
        } catch (err) {
            console.error('Erro ao deletar apontamento:', err);
            setError('Não foi possível deletar o apontamento. ' + (err.response?.data?.message || err.message));
        }
    };

    if (authLoading || loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Carregando apontamentos...</Typography>
            </Box>
        );
    }

    if (!user || user.level < MIN_AUTH_LEVEL) {
        return (
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Alert severity="warning">Você não tem permissão para acessar esta página.</Alert>
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Manutenção de Apontamentos de Injeção
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Filtrar Apontamentos</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4} md={3}>
                            <DatePicker
                                label="Data Início"
                                value={startDate}
                                onChange={(newValue) => setStartDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                                format="dd/MM/yyyy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <DatePicker
                                label="Data Fim"
                                value={endDate}
                                onChange={(newValue) => setEndDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                                format="dd/MM/yyyy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <Button
                                variant="contained"
                                onClick={fetchApontamentos}
                                disabled={loading}
                                fullWidth
                            >
                                Buscar
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                <Paper elevation={3} sx={{ p: 2 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Hora</TableCell>
                                    <TableCell>Funcionário</TableCell>
                                    <TableCell>Máquina</TableCell>
                                    <TableCell>Produto</TableCell>
                                    <TableCell align="right">Qtde. Injetada</TableCell>
                                    <TableCell align="right">Peças NC</TableCell>
                                    <TableCell>Observações</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apontamentos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">Nenhum apontamento encontrado para o período.</TableCell>
                                    </TableRow>
                                ) : (
                                    apontamentos.map((apontamento) => (
                                        <TableRow key={apontamento.id}>
                                            <TableCell>{new Date(apontamento.data_apontamento).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{apontamento.hora_apontamento}</TableCell>
                                            <TableCell>{apontamento.funcionario}</TableCell>
                                            <TableCell>{apontamento.maquina}</TableCell>
                                            <TableCell>{apontamento.peca}</TableCell>
                                            <TableCell align="right">
                                                {editingId === apontamento.id ? (
                                                    <TextField
                                                        name="quantidade_injetada"
                                                        value={editedApontamento.quantidade_injetada}
                                                        onChange={handleNumericChange}
                                                        type="number"
                                                        size="small"
                                                        sx={{ width: 80 }}
                                                    />
                                                ) : (
                                                    apontamento.quantidade_injetada
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {editingId === apontamento.id ? (
                                                    <TextField
                                                        name="pecas_nc"
                                                        value={editedApontamento.pecas_nc}
                                                        onChange={handleNumericChange}
                                                        type="number"
                                                        size="small"
                                                        sx={{ width: 80 }}
                                                    />
                                                ) : (
                                                    apontamento.pecas_nc
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingId === apontamento.id ? (
                                                    <TextField
                                                        name="observacoes"
                                                        value={editedApontamento.observacoes}
                                                        onChange={handleChange}
                                                        size="small"
                                                        multiline
                                                        rows={1}
                                                        sx={{ minWidth: 150 }}
                                                    />
                                                ) : (
                                                    apontamento.observacoes || '-'
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {editingId === apontamento.id ? (
                                                    <>
                                                        <IconButton color="primary" onClick={() => handleSaveClick(apontamento.id)} aria-label="Salvar">
                                                            <SaveIcon />
                                                        </IconButton>
                                                        <IconButton color="secondary" onClick={handleCancelClick} aria-label="Cancelar">
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton color="info" onClick={() => handleEditClick(apontamento)} aria-label="Editar">
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton color="error" onClick={() => handleDeleteClick(apontamento)} aria-label="Deletar">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Dialog
                    open={openDeleteDialog}
                    onClose={handleCloseDeleteDialog}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Confirmar Exclusão"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Tem certeza que deseja excluir o apontamento de {apontamentoToDelete?.funcionario} para o produto {apontamentoToDelete?.peca} ({apontamentoToDelete?.quantidade_injetada} injetadas, {apontamentoToDelete?.pecas_nc} NC) na data {apontamentoToDelete?.data_apontamento ? new Date(apontamentoToDelete.data_apontamento).toLocaleDateString('pt-BR') : ''}?
                            Esta ação não pode ser desfeita.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                        <Button onClick={handleConfirmDelete} color="error" autoFocus>
                            Excluir
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
}