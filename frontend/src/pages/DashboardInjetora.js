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
  Paper,
  Alert
} from '@mui/material';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DashboardInjetora() {
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    peca: '',
    tipoInjetora: '',
    turno: '',
  });
  const [apontamentos, setApontamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pecaOptions, setPecaOptions] = useState([]);
  const [tipoInjetoraOptions, setTipoInjetoraOptions] = useState([]);
  const turnoOptions = ['Manha', 'Noite'];

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/data/lists');
        setPecaOptions(response.data.pecas || []);
        
        const uniqueTipoInjetora = [...new Set(response.data.maquinas.map(m => m.tipo_injetora))];
        setTipoInjetoraOptions(uniqueTipoInjetora.filter(Boolean).sort());
      } catch (err) {
        console.error('Erro ao carregar opções de filtro:', err);
        setError('Erro ao carregar opções de filtro.');
      }
    };
    fetchFilterOptions();

    fetchApontamentos(filtros);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prevFiltros) => ({
      ...prevFiltros,
      [name]: value,
    }));
  };

  const fetchApontamentos = async (currentFiltros) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:3001/api/apontamentos/injetora', {
        params: currentFiltros,
      });
      setApontamentos(response.data);
    } catch (err) {
      console.error('Erro ao buscar apontamentos:', err);
      setError('Erro ao carregar dados do dashboard.');
      setApontamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = (e) => {
    e.preventDefault();
    fetchApontamentos(filtros);
  };

  const rows = apontamentos.map((apontamento, index) => ({
    id: apontamento.id || index,
    data_apontamento: apontamento.data_apontamento,
    hora_apontamento: apontamento.hora_apontamento,
    turno: apontamento.turno,
    tipo_injetora: apontamento.tipo_injetora,
    maquina: apontamento.maquina,
    funcionario: apontamento.funcionario,
    peca: apontamento.peca,
    quantidade_injetada: apontamento.quantidade_injetada,
    pecas_nc: apontamento.pecas_nc,
    observacoes: apontamento.observacoes,
  }));

  const columns = [
    { field: 'data_apontamento', headerName: 'Data', width: 130 },
    { field: 'hora_apontamento', headerName: 'Hora', width: 100 },
    { field: 'turno', headerName: 'Turno', width: 120 },
    { field: 'tipo_injetora', headerName: 'Tipo Injetora', width: 130 },
    { field: 'maquina', headerName: 'Máquina', width: 150 },
    { field: 'funcionario', headerName: 'Funcionário', width: 200 },
    { field: 'peca', headerName: 'Peça', width: 150 },
    { field: 'quantidade_injetada', headerName: 'Quant. Injetada', type: 'number', width: 150 },
    { field: 'pecas_nc', headerName: 'Peças NC', type: 'number', width: 120 },
    { field: 'observacoes', headerName: 'Observações', flex: 1, minWidth: 250 },
  ];

  // --- Lógica para o Gráfico ---
  const dataForProductionChart = apontamentos.reduce((acc, item) => {
    const dateKey = item.data_apontamento;

    let entry = acc.find(d => d.date === dateKey);
    if (!entry) {
      entry = { date: dateKey, quantidadeInjetada: 0, pecasNC: 0 };
      acc.push(entry);
    }
    // Certifique-se de que os valores são números. Se eles vierem como string do BD, converta.
    entry.quantidadeInjetada += parseFloat(item.quantidade_injetada) || 0;
    entry.pecasNC += parseFloat(item.pecas_nc) || 0;
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard de Produção - Injetora
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Filtros</Typography>
        <Box component="form" onSubmit={handleAplicarFiltros}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Data Início"
                type="date"
                name="dataInicio"
                value={filtros.dataInicio}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Data Fim"
                type="date"
                name="dataFim"
                value={filtros.dataFim}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="peca-filter-label">Peça</InputLabel>
                <Select
                  labelId="peca-filter-label"
                  name="peca"
                  value={filtros.peca}
                  label="Peça"
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {pecaOptions.map((peca) => (
                    <MenuItem key={peca.codigo_peca} value={peca.codigo_peca}>
                      {peca.descricao_peca || peca.codigo_peca}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="tipo-injetora-filter-label">Tipo Injetora</InputLabel>
                <Select
                  labelId="tipo-injetora-filter-label"
                  name="tipoInjetora"
                  value={filtros.tipoInjetora}
                  label="Tipo Injetora"
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {tipoInjetoraOptions.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id="turno-filter-label">Turno</InputLabel>
                <Select
                  labelId="turno-filter-label"
                  name="turno"
                  value={filtros.turno}
                  label="Turno"
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {turnoOptions.map((turno) => (
                    <MenuItem key={turno} value={turno}>
                      {turno}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                type="submit"
                sx={{ py: 1.5, px: 4 }}
                fullWidth
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Aplicar Filtros'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Seção de Gráficos */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Gráficos de Produção</Typography>
        {apontamentos.length > 0 ? (
          <Box sx={{ height: 400, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataForProductionChart}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  // Adicionado um domínio fixo para garantir que as barras sejam visíveis.
                  // Ajuste min/max conforme a faixa de valores esperada para suas quantidades.
                  // Por exemplo, se a quantidade injetada máxima for 1000, e a mínima 0.
                  // Ou, remova se seus dados sempre variarem de forma que o Recharts auto-detecte bem.
                  // domain={[0, 'auto']} // Começa em 0, máximo automático
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidadeInjetada" name="Quantidade Injetada" fill="#8884d8" />
                <Bar dataKey="pecasNC" name="Peças Não Conformes" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 300, border: '1px dashed grey', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Nenhum dado disponível para gerar gráficos com os filtros selecionados.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Seção da Tabela (mantida com DataGrid) */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Dados Filtrados (Tabela)</Typography>
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
            loading={loading}
          />
        </Box>
      </Paper>
    </Box>
  );
}