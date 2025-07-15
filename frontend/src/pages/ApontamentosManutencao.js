import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Button, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, TextField, Grid, IconButton,
    Collapse, TablePagination, Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApontamentoService from '../services/ApontamentoService';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

const MIN_AUTH_LEVEL = 2;

export default function ApontamentosManutencao() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [apontamentosAgrupados, setApontamentosAgrupados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editedApontamento, setEditedApontamento] = useState({});
    
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(new Date());

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [apontamentoToDelete, setApontamentoToDelete] = useState(null);
    const [openGroupDeleteDialog, setOpenGroupDeleteDialog] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [expandedGroups, setExpandedGroups] = useState({});
    const groupRowRefs = useRef({});

    const fetchApontamentos = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.dataInicio = format(startDate, 'yyyy-MM-dd');
            if (endDate) params.dataFim = format(endDate, 'yyyy-MM-dd');
            
            const data = await ApontamentoService.getApontamentosInjetora(params);
            
            const groupedData = data.reduce((acc, current) => {
                const groupKey = `${current.data_apontamento}-${current.funcionario}-${current.maquina}-${current.peca}`;
                if (!acc[groupKey]) {
                    acc[groupKey] = {
                        key: groupKey,
                        data_apontamento: current.data_apontamento,
                        funcionario: current.funcionario,
                        maquina: current.maquina,
                        peca: current.peca,
                        total_quantidade_injetada: 0,
                        total_pecas_nc: 0,
                        apontamentos: []
                    };
                }
                acc[groupKey].total_quantidade_injetada += current.quantidade_injetada || 0;
                acc[groupKey].total_pecas_nc += current.pecas_nc || 0;
                acc[groupKey].apontamentos.push(current);
                return acc;
            }, {});

            setApontamentosAgrupados(Object.values(groupedData).sort((a, b) => new Date(b.data_apontamento) - new Date(a.data_apontamento)));
            setPage(0); 
        } catch (err) {
            handleShowSnackbar('Não foi possível carregar os apontamentos.', 'error');
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
    }, [user, authLoading, navigate]); 
    const handleFilterSubmit = () => {
        fetchApontamentos();
    };

    const handleShowSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleEditClick = (apontamento) => {
        setEditingId(apontamento.id);
        const [hours, minutes, seconds] = apontamento.hora_apontamento.split(':').map(Number);
        const horaDate = new Date();
        horaDate.setHours(hours, minutes, seconds, 0);
        setEditedApontamento({ ...apontamento, hora_apontamento: horaDate });
    };

    const handleCancelClick = () => {
        setEditingId(null);
        setEditedApontamento({});
    };
    
    const handleSaveClick = async (id, groupKey) => {
        try {
            const dataToUpdate = {
                quantidade_injetada: editedApontamento.quantidade_injetada,
                pecas_nc: editedApontamento.pecas_nc,
                observacoes: editedApontamento.observacoes,
                hora_apontamento: format(editedApontamento.hora_apontamento, 'HH:mm:ss'),
            };
            const updatedApontamento = await ApontamentoService.updateApontamentoInjetora(id, dataToUpdate);

            setApontamentosAgrupados(prevGroups => prevGroups.map(group => {
                if (group.key === groupKey) {
                    const newApontamentos = group.apontamentos.map(apt => 
                        apt.id === id ? { ...apt, ...updatedApontamento } : apt
                    );
                    const newTotalInjetada = newApontamentos.reduce((sum, apt) => sum + (apt.quantidade_injetada || 0), 0);
                    const newTotalNC = newApontamentos.reduce((sum, apt) => sum + (apt.pecas_nc || 0), 0);
                    return { ...group, apontamentos: newApontamentos, total_quantidade_injetada: newTotalInjetada, total_pecas_nc: newTotalNC };
                }
                return group;
            }));
            
            setEditingId(null);
            setEditedApontamento({});
            handleShowSnackbar('Apontamento salvo com sucesso!', 'success');
        } catch (err) {
            handleShowSnackbar('Erro ao salvar o apontamento.', 'error');
        }
    };
    
    const handleDeleteClick = (apontamento) => {
        setApontamentoToDelete(apontamento);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!apontamentoToDelete) return;
        try {
            await ApontamentoService.deleteApontamentoInjetora(apontamentoToDelete.id);
            
            setApontamentosAgrupados(prevGroups => {
                const newGroups = prevGroups.map(group => {
                    if (group.apontamentos.some(apt => apt.id === apontamentoToDelete.id)) {
                        const newApontamentos = group.apontamentos.filter(apt => apt.id !== apontamentoToDelete.id);
                        if (newApontamentos.length === 0) return null; // Marcar grupo para remoção
                        
                        const newTotalInjetada = newApontamentos.reduce((sum, apt) => sum + (apt.quantidade_injetada || 0), 0);
                        const newTotalNC = newApontamentos.reduce((sum, apt) => sum + (apt.pecas_nc || 0), 0);
                        return { ...group, apontamentos: newApontamentos, total_quantidade_injetada: newTotalInjetada, total_pecas_nc: newTotalNC };
                    }
                    return group;
                }).filter(Boolean);
                return newGroups;
            });

            handleShowSnackbar('Apontamento deletado com sucesso!', 'success');
        } catch (err) {
            handleShowSnackbar('Erro ao deletar o apontamento.', 'error');
        } finally {
            setOpenDeleteDialog(false);
            setApontamentoToDelete(null);
        }
    };

    const handleDeleteGroupClick = (group) => {
        setGroupToDelete(group);
        setOpenGroupDeleteDialog(true);
    };

    const handleConfirmGroupDelete = async () => {
        if (!groupToDelete) return;
        try {
            const idsToDelete = groupToDelete.apontamentos.map(apt => apt.id);
            await ApontamentoService.deleteApontamentosInjetoraBatch(idsToDelete);

            setApontamentosAgrupados(prev => prev.filter(g => g.key !== groupToDelete.key));
            handleShowSnackbar('Grupo de apontamentos deletado com sucesso!', 'success');
        } catch (err) {
            handleShowSnackbar('Erro ao deletar o grupo de apontamentos.', 'error');
        } finally {
            setOpenGroupDeleteDialog(false);
            setGroupToDelete(null);
        }
    };
    
    const handleToggleGroup = (groupKey) => {
        setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const createHandleChange = (setter) => (e) => setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const createHandleNumericChange = (setter) => (e) => setter(prev => ({ ...prev, [e.target.name]: e.target.value === '' ? '' : Number(e.target.value) }));
    const createHandleTimeChange = (setter) => (newValue) => setter(prev => ({ ...prev, hora_apontamento: newValue }));
    
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user || user.level < MIN_AUTH_LEVEL) {
        return <Alert severity="warning">Você não tem permissão para acessar esta página.</Alert>;
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                <Typography variant="h4" gutterBottom>
                    Manutenção de Apontamentos de Injeção
                </Typography>

                <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Filtrar Apontamentos</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4} md={3}>
                            <DatePicker
                                label="Data Início"
                                value={startDate}
                                onChange={setStartDate}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                                format="dd/MM/yyyy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <DatePicker
                                label="Data Fim"
                                value={endDate}
                                onChange={setEndDate}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                                format="dd/MM/yyyy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                            <Button
                                variant="contained"
                                onClick={handleFilterSubmit}
                                disabled={loading}
                                fullWidth
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Buscar'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                <Paper elevation={3} sx={{ p: 2 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{width: '20px'}}/>
                                    <TableCell>Grupo (Data / Funcionário / Máquina / Produto)</TableCell>
                                    <TableCell align="right">Total Qtde. Injetada</TableCell>
                                    <TableCell align="right">Total Peças NC</TableCell>
                                    <TableCell align="center">Ações do Grupo</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} align="center"><CircularProgress/></TableCell></TableRow>
                                ) : apontamentosAgrupados.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center">Nenhum apontamento encontrado.</TableCell></TableRow>
                                ) : (
                                    apontamentosAgrupados
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((group) => (
                                            <React.Fragment key={group.key}>
                                                <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: '#f5f5f5' }}>
                                                    <TableCell>
                                                        <IconButton aria-label="expand row" size="small" onClick={() => handleToggleGroup(group.key)}>
                                                            {expandedGroups[group.key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell component="th" scope="row">
                                                        {format(new Date(group.data_apontamento), 'dd/MM/yyyy')} - {group.funcionario} - {group.maquina} - {group.peca}
                                                    </TableCell>
                                                    <TableCell align="right">{group.total_quantidade_injetada}</TableCell>
                                                    <TableCell align="right">{group.total_pecas_nc}</TableCell>
                                                    <TableCell align="center">
                                                        <IconButton color="error" onClick={() => handleDeleteGroupClick(group)} aria-label="Deletar Grupo">
                                                            <DeleteForeverIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell style={{ padding: 0 }} colSpan={5}>
                                                        <Collapse in={expandedGroups[group.key]} timeout="auto" unmountOnExit>
                                                            <Box sx={{ margin: 1 }}>
                                                                <Typography variant="h6" gutterBottom component="div">Detalhes</Typography>
                                                                <Table size="small">
                                                                    <TableHead>
                                                                        <TableRow>
                                                                            <TableCell>Hora</TableCell>
                                                                            <TableCell align="right">Qtde. Injetada</TableCell>
                                                                            <TableCell align="right">Peças NC</TableCell>
                                                                            <TableCell>Observações</TableCell>
                                                                            <TableCell align="center">Ações</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {group.apontamentos.map((ap) => (
                                                                            <TableRow key={ap.id}>
                                                                                <TableCell>
                                                                                    {editingId === ap.id ? <TimePicker label="Hora" value={editedApontamento.hora_apontamento} onChange={createHandleTimeChange(setEditedApontamento)} renderInput={(params) => <TextField {...params} size="small" sx={{ width: 120 }} />} format="HH:mm" /> : ap.hora_apontamento}
                                                                                </TableCell>
                                                                                <TableCell align="right">
                                                                                    {editingId === ap.id ? <TextField name="quantidade_injetada" value={editedApontamento.quantidade_injetada} onChange={createHandleNumericChange(setEditedApontamento)} type="number" size="small" sx={{ width: 80 }} /> : ap.quantidade_injetada}
                                                                                </TableCell>
                                                                                <TableCell align="right">
                                                                                    {editingId === ap.id ? <TextField name="pecas_nc" value={editedApontamento.pecas_nc} onChange={createHandleNumericChange(setEditedApontamento)} type="number" size="small" sx={{ width: 80 }} /> : ap.pecas_nc}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {editingId === ap.id ? <TextField name="observacoes" value={editedApontamento.observacoes} onChange={createHandleChange(setEditedApontamento)} size="small" sx={{ minWidth: 150 }} multiline rows={1} /> : (ap.observacoes || '-')}
                                                                                </TableCell>
                                                                                <TableCell align="center">
                                                                                    {editingId === ap.id ? (
                                                                                        <>
                                                                                            <IconButton color="primary" onClick={() => handleSaveClick(ap.id, group.key)}><SaveIcon /></IconButton>
                                                                                            <IconButton color="secondary" onClick={handleCancelClick}><CancelIcon /></IconButton>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <IconButton color="info" onClick={() => handleEditClick(ap)}><EditIcon /></IconButton>
                                                                                            <IconButton color="error" onClick={() => handleDeleteClick(ap)}><DeleteIcon /></IconButton>
                                                                                        </>
                                                                                    )}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={apontamentosAgrupados.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Itens por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </Paper>

                {}
                <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                    <DialogTitle>Confirmar Exclusão</DialogTitle>
                    <DialogContent><DialogContentText>Tem certeza que deseja excluir este apontamento individual? A ação não pode ser desfeita.</DialogContentText></DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmDelete} color="error">Excluir</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={openGroupDeleteDialog} onClose={() => setOpenGroupDeleteDialog(false)}>
                    <DialogTitle>Confirmar Exclusão do Grupo</DialogTitle>
                    <DialogContent><DialogContentText>Tem certeza que deseja excluir **TODOS** os apontamentos deste grupo? A ação não pode ser desfeita.</DialogContentText></DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenGroupDeleteDialog(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmGroupDelete} color="error">Excluir Grupo</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
}