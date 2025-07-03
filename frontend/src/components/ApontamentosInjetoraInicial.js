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
  Alert,
  Autocomplete 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ApontamentosInjetoraInicial() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoInjetora: '',
    dataApontamento: '',
    turno: '',
    maquina: '',
    funcionario: null, 
    peca: null,      
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

  const handleAutocompleteChange = (name) => (event, value) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.tipoInjetora || !formData.dataApontamento ||
        !formData.turno || !formData.maquina || !formData.funcionario || !formData.peca) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const initialDataToSend = {
      ...formData,
      funcionario: formData.funcionario.nome_completo, 
      peca: formData.peca.codigo_peca,                 
    };

    console.log('Dados iniciais submetidos:', initialDataToSend);
    navigate('/apontamentos/injetora/horaria', { state: { initialData: initialDataToSend } });
  };

  const maquinasFiltradas = formData.tipoInjetora
    ? maquinas.filter((m) => m.tipo_injetora === formData.tipoInjetora)
    : maquinas;

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Apontamento de Injetora
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required variant="outlined">
              <InputLabel id="tipo-injetora-label" shrink={true}>Tipo de Injetora</InputLabel>
              <Select
                labelId="tipo-injetora-label"
                name="tipoInjetora"
                value={formData.tipoInjetora}
                label="Tipo de Injetora"
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="">Selecione o Tipo de Injetora</MenuItem>
                <MenuItem value="200">200</MenuItem>
                <MenuItem value="250">250</MenuItem>
                <MenuItem value="300">300</MenuItem>
                <MenuItem value="450">450</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required variant="outlined">
              <InputLabel id="maquina-label" shrink={true}>Máquina</InputLabel>
              <Select
                labelId="maquina-label"
                name="maquina"
                value={formData.maquina}
                label="Máquina"
                onChange={handleChange}
                disabled={!formData.tipoInjetora}
                displayEmpty
              >
                <MenuItem value="">Selecione a Máquina</MenuItem>
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
            <FormControl fullWidth required variant="outlined">
              <InputLabel id="turno-label" shrink={true}>Turno</InputLabel>
              <Select
                labelId="turno-label"
                name="turno"
                value={formData.turno}
                label="Turno"
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="">Selecione o Turno</MenuItem>
                <MenuItem value="Manha">Manhã (07:00 - 18:00)</MenuItem>
                <MenuItem value="Noite">Noite (18:00 - 07:00)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {}
          <Grid item xs={12} sm={10}>
            <Autocomplete
              id="funcionario-autocomplete"
              options={funcionarios}
              getOptionLabel={(option) => option.nome_completo || ''} 
              value={formData.funcionario} 
              onChange={handleAutocompleteChange('funcionario')}
              isOptionEqualToValue={(option, value) => option.id === value.id} 
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Funcionário"
                  variant="outlined"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!error && !formData.funcionario} 
                  helperText={!!error && !formData.funcionario ? "Campo obrigatório" : ""}
                />
              )}
              noOptionsText="Nenhum funcionário encontrado"
            />
          </Grid>

          {}
          <Grid item xs={12} sm={10}>
            <Autocomplete
              id="peca-autocomplete"
              options={pecas}
              getOptionLabel={(option) => `${option.descricao_peca} (${option.codigo_peca})` || ''} 
              value={formData.peca} 
              onChange={handleAutocompleteChange('peca')}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Peça"
                  variant="outlined"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!error && !formData.peca} 
                  helperText={!!error && !formData.peca ? "Campo obrigatório" : ""}
                />
              )}
              noOptionsText="Nenhuma peça encontrada"
            />
          </Grid>

          {}
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
                shrink: true,
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
              Prosseguir para Apontamentos
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}