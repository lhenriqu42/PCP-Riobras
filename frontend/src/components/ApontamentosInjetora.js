import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Box, Typography, Paper, MenuItem, Select, FormControl, InputLabel, Grid
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Para o logout
import { useNavigate } from 'react-router-dom'; // Para redirecionar no logout

function ApontamentosInjetora() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    tipoInjetora: '',
    dataApontamento: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    horaApontamento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }), // Hora atual HH:MM:SS
    turno: '',
    maquina: '',
    funcionario: '',
    peca: '',
    quantidadeInjetada: '',
    pecasNc: '',
    observacoes: ''
  });

  const [listas, setListas] = useState({
    funcionarios: [],
    pecas: [],
    maquinas: [],
    etapasProducao: []
  });

  const [loading, setLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Função para buscar as listas do backend
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/data/lists');
        setListas(response.data);
      } catch (error) {
        console.error('Erro ao buscar listas:', error);
        setSubmitError('Erro ao carregar dados para os campos.');
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage('');
    setSubmitError('');

    try {
      const response = await axios.post('http://localhost:3001/api/apontamentos/injetora', formData);
      if (response.status === 200) {
        setSubmitMessage('Apontamento registrado com sucesso!');
        // Opcional: Limpar formulário após o sucesso
        setFormData({
          ...formData, // Mantém data/hora/turno talvez
          maquina: '', funcionario: '', peca: '', quantidadeInjetada: '', pecasNc: '', observacoes: ''
        });
      }
    } catch (error) {
      console.error('Erro ao registrar apontamento:', error);
      setSubmitError(error.response?.data?.message || 'Erro ao registrar apontamento.');
    }
  };

  if (loading) {
    return <Typography>Carregando formulário...</Typography>;
  }

  // Filtrar máquinas por tipo de injetora selecionado
  const maquinasFiltradas = formData.tipoInjetora
    ? listas.maquinas.filter(m => m.tipo_injetora === formData.tipoInjetora)
    : listas.maquinas;

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Apontamento de Injetora
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </Box>

      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Tipo de Injetora */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Injetora</InputLabel>
                <Select
                  name="tipoInjetora"
                  value={formData.tipoInjetora}
                  label="Tipo de Injetora"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  <MenuItem value="200">200</MenuItem>
                  <MenuItem value="250">250</MenuItem>
                  <MenuItem value="300">300</MenuItem>
                  <MenuItem value="450">450</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Máquina */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Máquina</InputLabel>
                <Select
                  name="maquina"
                  value={formData.maquina}
                  label="Máquina"
                  onChange={handleChange}
                  disabled={!formData.tipoInjetora} // Desabilita se tipo não for selecionado
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {maquinasFiltradas.map((maq) => (
                    <MenuItem key={maq.nome_maquina} value={maq.nome_maquina}>
                      {maq.nome_maquina}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Data e Hora */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data do Apontamento"
                type="date"
                name="dataApontamento"
                value={formData.dataApontamento}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora do Apontamento"
                type="time"
                name="horaApontamento"
                value={formData.horaApontamento}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Turno */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Turno</InputLabel>
                <Select
                  name="turno"
                  value={formData.turno}
                  label="Turno"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  <MenuItem value="Manha">Manhã (07:00 - 18:00)</MenuItem>
                  <MenuItem value="Noite">Noite (18:00 - 05:00)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Funcionário */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Funcionário</InputLabel>
                <Select
                  name="funcionario"
                  value={formData.funcionario}
                  label="Funcionário"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {listas.funcionarios.map((func) => (
                    <MenuItem key={func} value={func}>
                      {func}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Peça */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Peça</InputLabel>
                <Select
                  name="peca"
                  value={formData.peca}
                  label="Peça"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {listas.pecas.map((p) => (
                    <MenuItem key={p.codigo_peca} value={p.codigo_peca}>
                      {p.codigo_peca} - {p.descricao_peca}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Quantidade Injetada */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantidade Injetada"
                type="number"
                name="quantidadeInjetada"
                value={formData.quantidadeInjetada}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            {/* Peças Não Conformes (NC) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Peças Não Conformes (NC)"
                type="number"
                name="pecasNc"
                value={formData.pecasNc}
                onChange={handleChange}
                fullWidth
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                label="Observações"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>

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
          >
            Registrar Apontamento
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default ApontamentosInjetora;