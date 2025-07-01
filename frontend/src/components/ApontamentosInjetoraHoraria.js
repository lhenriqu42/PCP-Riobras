import React, { useState, useEffect, useRef } from 'react'; // Importar useRef
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
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

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

  const inputRef = useRef(null);

  useEffect(() => {
    if (!initialData) {
      setError('Dados iniciais do apontamento não encontrados. Redirecionando...');
      setTimeout(() => navigate('/apontamentos/injetora/inicial'), 3000);
      return;
    }
    // <<<<<<< ALTERAÇÃO: Remove initialData.horaApontamento da chamada
    generateHourlyEntries(initialData);
  }, [initialData, navigate]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentHourIndex]);

  const generateHourlyEntries = (data) => {
    // <<<<<<< ALTERAÇÃO: Remove horaApontamento do desestruturação
    const { dataApontamento, turno } = data;
    const entries = [];
    let startMoment;
    let endMoment;

    if (turno === 'Manha') {
      // Turno da manhã começa às 07:00 e termina às 18:00
      startMoment = moment(dataApontamento + ' 07:00', 'YYYY-MM-DD HH:mm');
      endMoment = moment(dataApontamento + ' 18:00', 'YYYY-MM-DD HH:mm');
    } else {
      // Turno da noite começa às 18:00 do dia do apontamento e termina às 07:00 do dia seguinte
      startMoment = moment(dataApontamento + ' 18:00', 'YYYY-MM-DD HH:mm');
      endMoment = moment(dataApontamento, 'YYYY-MM-DD').add(1, 'days').set({ hour: 7, minute: 0 });
    }

    let current = moment(startMoment);
    while (current.isBefore(endMoment)) {
      const hora = current.format('HH:mm');
      entries.push({
        hora,
        quantidade_injetada: '',
        pecas_nc: '',
        observacoes: '',
        tipo_registro: 'producao',
        finalizado: false,
      });
      current.add(1, 'hour');
    }
    setApontamentosHorarios(entries);
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const newApontamentos = [...apontamentosHorarios];
    newApontamentos[index][name] = value;
    setApontamentosHorarios(newApontamentos);
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
      // <<<<<<< ALTERAÇÃO: initialData não tem mais horaApontamento
      ...initialData,
      hora_apontamento: currentEntry.hora, // Esta hora é a hora do apontamento horário, gerada localmente
      quantidade_injetada: currentEntry.quantidade_injetada,
      pecas_nc: currentEntry.pecas_nc,
      observacoes: currentEntry.observacoes,
      tipo_registro: currentEntry.tipo_registro,
    };

    try {
      await axios.post('http://localhost:3001/api/apontamentos/injetora', payload);
      setSuccess(`Apontamento para ${currentEntry.hora} registrado com sucesso!`);
      const updatedApontamentos = [...apontamentosHorarios];
      updatedApontamentos[index].finalizado = true;
      setApontamentosHorarios(updatedApontamentos);

      if (index < apontamentosHorarios.length - 1) {
        setCurrentHourIndex(index + 1);
      } else {
        setSuccess('Todos os apontamentos horários foram registrados!');
        navigate('/dashboard/injetora');
      }
    } catch (err) {
      console.error('Erro ao registrar apontamento horário:', err);
      setError('Erro ao registrar apontamento horário. Tente novamente.');
    } finally {
      setLoading(false);
    }
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

    handleRegisterHour(index);
    handleCloseMenu();
  };

  const handleEndOperation = () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Garante que o apontamento atual seja salvo antes de encerrar os restantes
    const finishRemainingHours = async () => {
        const updatedApontamentos = [...apontamentosHorarios];
        for (let i = currentHourIndex; i < updatedApontamentos.length; i++) {
            // Se o apontamento atual não foi finalizado, finalize-o
            if (!updatedApontamentos[i].finalizado) {
                // Faça a chamada para o backend para o apontamento atual (se não foi feito)
                // Se o currentHourIndex já estiver no último ou se já estiver finalizado,
                // apenas continue marcando os restantes como finalizados sem uma nova chamada ao backend.
                if (i === currentHourIndex && updatedApontamentos[i].tipo_registro === 'producao' &&
                    (updatedApontamentos[i].quantidade_injetada !== '' || updatedApontamentos[i].pecas_nc !== '')) {
                    // Tente registrar o apontamento atual se houver dados e não estiver finalizado
                    const currentPayload = {
                        ...initialData,
                        hora_apontamento: updatedApontamentos[i].hora,
                        quantidade_injetada: parseFloat(updatedApontamentos[i].quantidade_injetada) || 0,
                        pecas_nc: parseFloat(updatedApontamentos[i].pecas_nc) || 0,
                        observacoes: updatedApontamentos[i].observacoes || '',
                        tipo_registro: updatedApontamentos[i].tipo_registro,
                    };
                    try {
                        await axios.post('http://localhost:3001/api/apontamentos/injetora', currentPayload);
                        updatedApontamentos[i].finalizado = true;
                        setApontamentosHorarios([...updatedApontamentos]); // Atualiza o estado para refletir a finalização
                    } catch (err) {
                        console.error('Erro ao registrar o apontamento atual ao encerrar:', err);
                        setError('Erro ao registrar o apontamento atual. Operação não encerrada.');
                        setLoading(false);
                        return; // Aborta se o apontamento atual falhar
                    }
                } else if (i === currentHourIndex && updatedApontamentos[i].tipo_registro === 'producao' &&
                    updatedApontamentos[i].quantidade_injetada === '' && updatedApontamentos[i].pecas_nc === '') {
                    // Se o campo atual de produção está vazio, registre-o como 'finalizado' com 0s
                    const currentPayload = {
                        ...initialData,
                        hora_apontamento: updatedApontamentos[i].hora,
                        quantidade_injetada: 0,
                        pecas_nc: 0,
                        observacoes: 'Operação encerrada antes do horário',
                        tipo_registro: 'finalizado',
                    };
                    try {
                        await axios.post('http://localhost:3001/api/apontamentos/injetora', currentPayload);
                        updatedApontamentos[i].finalizado = true;
                        updatedApontamentos[i].quantidade_injetada = 0;
                        updatedApontamentos[i].pecas_nc = 0;
                        updatedApontamentos[i].observacoes = 'Operação encerrada antes do horário';
                        updatedApontamentos[i].tipo_registro = 'finalizado';
                        setApontamentosHorarios([...updatedApontamentos]);
                    } catch (err) {
                        console.error('Erro ao registrar o apontamento atual como finalizado:', err);
                        setError('Erro ao registrar o apontamento atual como finalizado. Operação não encerrada.');
                        setLoading(false);
                        return;
                    }
                }
            }
            // Para as horas restantes (após a atual), marque como 'finalizado' e envie.
            if (!updatedApontamentos[i].finalizado) {
                const payloadRemaining = {
                    ...initialData,
                    hora_apontamento: updatedApontamentos[i].hora,
                    quantidade_injetada: 0,
                    pecas_nc: 0,
                    observacoes: 'Operação encerrada antes do horário',
                    tipo_registro: 'finalizado',
                };
                try {
                    await axios.post('http://localhost:3001/api/apontamentos/injetora', payloadRemaining);
                    updatedApontamentos[i].finalizado = true;
                    updatedApontamentos[i].tipo_registro = 'finalizado';
                    updatedApontamentos[i].quantidade_injetada = 0;
                    updatedApontamentos[i].pecas_nc = 0;
                    updatedApontamentos[i].observacoes = 'Operação encerrada antes do horário';
                    setApontamentosHorarios([...updatedApontamentos]); // Atualiza o estado a cada envio para feedback visual
                } catch (err) {
                    console.error(`Erro ao registrar hora ${updatedApontamentos[i].hora} como finalizada:`, err);
                    setError(`Erro ao registrar algumas horas como finalizadas.`);
                    // Continua a tentar os próximos, mas mantém o erro
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
    if (e.key === 'Enter' && index === currentHourIndex) {
      if (fieldName === 'pecas_nc' || fieldName === 'quantidade_injetada') {
        handleRegisterHour(index);
      } else {
        // teste para proximo campo ao apertar enter:
        // const nextField = e.target.form.elements[e.target.tabIndex + 1];
        // if (nextField) nextField.focus();
      }
    }
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
              **Tipo Injetora:** {initialData.tipoInjetora}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">
              **Máquina:** {initialData.maquina}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">
              **Funcionário:** {initialData.funcionario}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">
              **Peça:** {initialData.peca}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">
              **Data:** {initialData.dataApontamento}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body1">
              **Turno:** {initialData.turno}
            </Typography>
          </Grid>
          {/* <<<<<<< REMOVIDO: Exibição da Hora do Apontamento inicial */}
          {/* <Grid item xs={6} sm={3}>
            <Typography variant="body1">
              **Hora (Início):** {initialData.horaApontamento}
            </Typography>
          </Grid> */}
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
                <TableRow key={index} sx={{ backgroundColor: entry.finalizado ? '#f0f0f0' : 'inherit' }}>
                  <TableCell>{entry.hora}</TableCell>
                  <TableCell>
                    <TextField
                      name="quantidade_injetada"
                      value={entry.quantidade_injetada}
                      onChange={(e) => handleChange(e, index)}
                      type="number"
                      size="small"
                      disabled={index !== currentHourIndex || entry.tipo_registro !== 'producao'}
                      sx={{ width: 100 }}
                      inputRef={index === currentHourIndex ? inputRef : null}
                      onKeyPress={(e) => handleTableKeyPress(e, index, 'quantidade_injetada')}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="pecas_nc"
                      value={entry.pecas_nc}
                      onChange={(e) => handleChange(e, index)}
                      type="number"
                      size="small"
                      disabled={index !== currentHourIndex || entry.tipo_registro !== 'producao'}
                      sx={{ width: 100 }}
                      onKeyPress={(e) => handleTableKeyPress(e, index, 'pecas_nc')}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="observacoes"
                      value={entry.observacoes}
                      onChange={(e) => handleChange(e, index)}
                      fullWidth
                      size="small"
                      disabled={index !== currentHourIndex && entry.tipo_registro !== 'producao'}
                      onKeyPress={(e) => handleTableKeyPress(e, index, 'observacoes')}
                    />
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
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {entry.finalizado ? `Registrado (${entry.tipo_registro.toUpperCase()})` : 'Aguardando...'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}