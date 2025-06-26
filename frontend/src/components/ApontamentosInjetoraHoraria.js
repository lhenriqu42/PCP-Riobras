import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, TextField, Grid, Divider
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ApontamentosInjetoraHoraria() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Recebe os dados iniciais da fase anterior
  const initialData = location.state?.initialData;

  // Se não houver dados iniciais, redireciona de volta
  useEffect(() => {
    if (!initialData) {
      navigate('/apontamentos/injetora/inicial');
    }
  }, [initialData, navigate]);

  // Define as horas do turno com base na seleção
  const getTurnoHours = (turno) => {
    const hours = [];
    if (turno === 'Manha') {
      for (let i = 7; i <= 18; i++) { // Das 7h às 18h
        hours.push(`${String(i).padStart(2, '0')}:00`);
      }
    } else if (turno === 'Noite') {
      for (let i = 18; i <= 23; i++) { // Das 18h às 23h (do dia atual)
        hours.push(`${String(i).padStart(2, '0')}:00`);
      }
      for (let i = 0; i <= 5; i++) { // Das 00h às 05h (do dia seguinte)
        hours.push(`${String(i).padStart(2, '0')}:00`);
      }
    }
    return hours;
  };

  const turnoHours = initialData ? getTurnoHours(initialData.turno) : [];

  // Estado para armazenar os apontamentos horários
  const [hourlyApontamentos, setHourlyApontamentos] = useState(() => {
    return turnoHours.map(hour => ({
      horaApontamento: hour,
      quantidadeInjetada: '',
      pecasNc: '',
      observacoes: ''
    }));
  });

  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleChange = (index, field, value) => {
    const newApontamentos = [...hourlyApontamentos];
    newApontamentos[index][field] = value;
    setHourlyApontamentos(newApontamentos);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmitAll = async (event) => {
    event.preventDefault();
    setSubmitMessage('');
    setSubmitError('');

    if (!initialData) {
      setSubmitError('Dados iniciais não encontrados. Por favor, retorne à fase anterior.');
      return;
    }

    const apontamentosParaEnviar = hourlyApontamentos
      .filter(ap => ap.quantidadeInjetada || ap.pecasNc || ap.observacoes) // Envia apenas linhas preenchidas
      .map(ap => ({
        ...initialData, // Inclui os dados da fase inicial
        horaApontamento: ap.horaApontamento,
        quantidadeInjetada: ap.quantidadeInjetada || 0, // Garante que é número
        pecasNc: ap.pecasNc || 0, // Garante que é número
        observacoes: ap.observacoes,
      }));

    if (apontamentosParaEnviar.length === 0) {
      setSubmitError('Nenhum apontamento horário preenchido para registrar.');
      return;
    }

    try {
      // Endpoint no backend precisará aceitar um ARRAY de apontamentos
      const response = await axios.post('http://localhost:3001/api/apontamentos/injetora/batch', {
        apontamentos: apontamentosParaEnviar
      });
      if (response.status === 200) {
        setSubmitMessage('Apontamentos horários registrados com sucesso!');
        // Opcional: Limpar campos após o sucesso, ou redirecionar
        // setHourlyApontamentos(turnoHours.map(hour => ({
        //   horaApontamento: hour, quantidadeInjetada: '', pecasNc: '', observacoes: ''
        // })));
      }
    } catch (error) {
      console.error('Erro ao registrar apontamentos horários:', error);
      setSubmitError(error.response?.data?.message || 'Erro ao registrar apontamentos horários.');
    }
  };

  if (!initialData) {
    return null; // ou um spinner, enquanto redireciona
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Apontamento de Injetora (Horário)
        </Typography>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleLogout}
          size="large"
        >
          Sair
        </Button>
      </Box>

      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>Dados do Turno:</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              **Tipo Injetora:** {initialData.tipoInjetora}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              **Máquina:** {initialData.maquina}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              **Funcionário:** {initialData.funcionario}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              **Peça:** {initialData.peca}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              **Data:** {initialData.dataApontamento}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              **Turno:** {initialData.turno} ({initialData.turno === 'Manha' ? '07:00 - 18:00' : '18:00 - 05:00'})
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>Registrar por Hora:</Typography>
        <form onSubmit={handleSubmitAll}>
          {hourlyApontamentos.map((apontamento, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Hora: {apontamento.horaApontamento}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Quantidade Injetada"
                    type="number"
                    value={apontamento.quantidadeInjetada}
                    onChange={(e) => handleChange(index, 'quantidadeInjetada', e.target.value)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Peças NC"
                    type="number"
                    value={apontamento.pecasNc}
                    onChange={(e) => handleChange(index, 'pecasNc', e.target.value)}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Observações"
                    value={apontamento.observacoes}
                    onChange={(e) => handleChange(index, 'observacoes', e.target.value)}
                    fullWidth
                    multiline
                    rows={1}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          {submitMessage && (
            <Typography color="primary" sx={{ mt: 2 }}>
              {submitMessage}
            </Typography>
          )}
          {submitError && (
            <Typography color="error" sx={{ mt: 2 }}>
              {submitError}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            size="large"
          >
            Salvar Todos Apontamentos Horários
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/apontamentos/injetora/inicial')}
            sx={{ mt: 3, ml: 2 }}
            size="large"
          >
            Voltar para Seleção Inicial
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default ApontamentosInjetoraHoraria;