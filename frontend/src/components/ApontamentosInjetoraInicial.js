import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ApontamentosInjetoraInicial() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoInjetora: '',
    dataApontamento: '',
    horaApontamento: '',
    turno: '',
    maquina: '',
    funcionario: '',
    peca: '',
  });
  const [error, setError] = useState('');
  const [maquinas, setMaquinas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [pecas, setPecas] = useState([]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/data/lists');
        setMaquinas(response.data.maquinas || []);
        setFuncionarios(response.data.funcionarios || []);
        setPecas(response.data.pecas || []);
      } catch (err) {
        console.error('Erro ao carregar dados para os campos:', err);
        setError('Erro ao carregar dados para os campos.');
      }
    };
    fetchLists();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      dataApontamento: e.target.value,
    }));
  };

  const handleTimeChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      horaApontamento: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.tipoInjetora || !formData.dataApontamento || !formData.horaApontamento ||
        !formData.turno || !formData.maquina || !formData.funcionario || !formData.peca) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Dados iniciais submetidos:', formData);
    navigate('/apontamentos/injetora/horaria', { state: { initialData: formData } });
  };

  const maquinasFiltradas = formData.tipoInjetora
    ? maquinas.filter((m) => m.tipo_injetora === formData.tipoInjetora)
    : maquinas;

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Apontamento de Injetora (Dados Iniciais)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Tipo de Injetora */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="tipo-injetora-label">Tipo de Injetora</InputLabel>
              <Select
                labelId="tipo-injetora-label"
                name="tipoInjetora"
                value={formData.tipoInjetora}
                label="Tipo de Injetora"
                onChange={handleChange}
                displayEmpty // Permite que o MenuItem vazio seja exibido
              >
                <MenuItem value="">Tipo de Injetora</MenuItem> {/* Conteúdo visível quando vazio */}
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
              <InputLabel id="maquina-label">Máquina</InputLabel>
              <Select
                labelId="maquina-label"
                name="maquina"
                value={formData.maquina}
                label="Máquina"
                onChange={handleChange}
                disabled={!formData.tipoInjetora}
                displayEmpty
              >
                <MenuItem value="">Máquina</MenuItem>
                {maquinasFiltradas.map((maq) => (
                  <MenuItem key={maq.nome_maquina} value={maq.nome_maquina}>
                    {maq.nome_maquina}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Turno */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="turno-label">Turno</InputLabel>
              <Select
                labelId="turno-label"
                name="turno"
                value={formData.turno}
                label="Turno"
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="">Turno</MenuItem>
                <MenuItem value="Manha">Manhã (07:00 - 18:00)</MenuItem>
                <MenuItem value="Noite">Noite (18:00 - 07:00)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Funcionário */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="funcionario-label">Funcionário</InputLabel>
              <Select
                labelId="funcionario-label"
                name="funcionario"
                value={formData.funcionario}
                label="Funcionário"
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="">Funcionário</MenuItem>
                {funcionarios.map((func) => (
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
              <InputLabel id="peca-label">Peça</InputLabel>
              <Select
                labelId="peca-label"
                name="peca"
                value={formData.peca}
                label="Peça"
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="">Peça</MenuItem>
                {pecas.map((p) => (
                  <MenuItem key={p.codigo_peca} value={p.codigo_peca}>
                    {p.descricao_peca} ({p.codigo_peca})
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
              onChange={handleDateChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true, // Garante que o label fique "encolhido" acima
              }}
            />
          </Grid>

          {/* Hora do Apontamento */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Hora do Apontamento"
              type="time"
              name="horaApontamento"
              value={formData.horaApontamento}
              onChange={handleTimeChange}
              fullWidth
              required
              InputLabelProps={{
                shrink: true, // Garante que o label fique "encolhido" acima
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              type="submit"
              sx={{ py: 2 }}
              fullWidth
            >
              Prosseguir para Apontamentos Horários
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}