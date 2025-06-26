import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Box, Typography, Paper, MenuItem, Select, FormControl, InputLabel, Grid
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Para o logout

function ApontamentosInjetoraInicial() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Para o botão de sair

  const [formData, setFormData] = useState({
    tipoInjetora: '',
    dataApontamento: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    turno: '',
    maquina: '',
    funcionario: '',
    peca: '',
  });

  const [listas, setListas] = useState({
    funcionarios: [],
    pecas: [],
    maquinas: [],
  });

  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/data/lists');
        setListas(response.data);
      } catch (error) {
        console.error('Erro ao buscar listas:', error);
        setSubmitError('Erro ao carregar dados para os campos. Verifique o backend e o banco de dados.');
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError('');

    // Verificar se todos os campos obrigatórios estão preenchidos
    const { tipoInjetora, dataApontamento, turno, maquina, funcionario, peca } = formData;
    if (!tipoInjetora || !dataApontamento || !turno || !maquina || !funcionario || !peca) {
      setSubmitError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Navega para a próxima fase, passando os dados do formulário via state
    navigate('/apontamentos/injetora/horaria', { state: { initialData: formData } });
  };

  if (loading) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Carregando formulário...</Typography>;
  }

  const maquinasFiltradas = formData.tipoInjetora
    ? listas.maquinas.filter(m => m.tipo_injetora === formData.tipoInjetora)
    : listas.maquinas;

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Apontamento de Injetora (Dados Iniciais)
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
                  disabled={!formData.tipoInjetora}
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

            {/* Data do Apontamento */}
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
                    <MenuItem key={func.nome_completo} value={func.nome_completo}>
                      {func.nome_completo}
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
          </Grid>

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
            Prosseguir para Apontamentos Horários
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default ApontamentosInjetoraInicial;