import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Importar componentes de gráfico

// Componente para exibir detalhes do produto/data
function Row({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.peca}
        </TableCell>
        <TableCell>{moment(row.data).format('DD/MM/YYYY')}</TableCell>
        <TableCell align="right">{row.totalEfetiva}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Detalhes do Apontamento
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Hora</TableCell>
                    <TableCell>Turno</TableCell>
                    <TableCell>Máquina</TableCell>
                    <TableCell>Funcionário</TableCell>
                    <TableCell align="right">Quant. Injetada</TableCell>
                    <TableCell align="right">Peças NC</TableCell>
                    <TableCell align="right">Quant. Efetiva</TableCell>
                    <TableCell>Observações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.details.map((detailRow) => (
                    <TableRow key={detailRow.id}> {/* Supondo que cada detalhe tenha um ID */}
                      <TableCell component="th" scope="row">{detailRow.hora_apontamento}</TableCell>
                      <TableCell>{detailRow.turno}</TableCell>
                      <TableCell>{detailRow.maquina}</TableCell>
                      <TableCell>{detailRow.funcionario}</TableCell>
                      <TableCell align="right">{detailRow.quantidade_injetada}</TableCell>
                      <TableCell align="right">{detailRow.pecas_nc}</TableCell>
                      <TableCell align="right">{detailRow.quantidade_efetiva}</TableCell>
                      <TableCell>{detailRow.observacoes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}


export default function DashboardInjetora() {
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState('');
  const [apontamentos, setApontamentos] = useState([]);
  const [dailyProductionData, setDailyProductionData] = useState([]); // Dados para o gráfico
  const [aggregatedData, setAggregatedData] = useState([]); // Dados agregados para a nova tabela

  // Estados para os filtros
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days'));
  const [endDate, setEndDate] = useState(moment());
  const [selectedPeca, setSelectedPeca] = useState('');
  const [selectedTipoInjetora, setSelectedTipoInjetora] = useState('');
  const [selectedTurno, setSelectedTurno] = useState('');
  const [metaProducao, setMetaProducao] = useState(1000); // Meta de produção padrão

  // Estados para as listas de dados dos filtros
  const [pecasList, setPecasList] = useState([]);
  const [maquinasList, setMaquinasList] = useState([]);
  const [turnosList, setTurnosList] = useState(['Manha', 'Noite']);

  // Efeito para carregar as listas de dados (funcionários, peças, máquinas)
  useEffect(() => {
    // Carrega listas de filtros
    const fetchLists = async () => {
      try {
        setLoadingFilters(true);
        const response = await axios.get('http://localhost:3001/api/data/lists');
        setPecasList(response.data.pecas);
        const uniqueTiposInjetora = [...new Set(response.data.maquinas.map(m => m.tipo_injetora))];
        setMaquinasList(uniqueTiposInjetora);
      } catch (err) {
        console.error('Erro ao carregar listas de filtros:', err);
        setError('Erro ao carregar opções de filtro. Tente novamente.');
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchLists();
  }, []);

  // Efeito para carregar os apontamentos com base nos filtros
  useEffect(() => {
    // Carrega apontamentos e processa para gráfico e tabela agregada
    const handleApplyFilters = async () => {
      setError('');
      setLoadingFilters(true);
      try {
        const params = {
          dataInicio: startDate ? startDate.format('YYYY-MM-DD') : '',
          dataFim: endDate ? endDate.format('YYYY-MM-DD') : '',
          peca: selectedPeca,
          tipoInjetora: selectedTipoInjetora,
          turno: selectedTurno,
        };
        const response = await axios.get('http://localhost:3001/api/apontamentos/injetora', { params });
        setApontamentos(response.data); // Guarda os apontamentos brutos

        // Processa dados para o gráfico e a tabela agregada
        processApontamentosForDashboard(response.data);

      } catch (err) {
        console.error('Erro ao buscar apontamentos filtrados:', err);
        setError('Erro ao buscar dados para o relatório.');
      } finally {
        setLoadingFilters(false);
      }
    };
    handleApplyFilters();
  }, [startDate, endDate, selectedPeca, selectedTipoInjetora, selectedTurno]);


  // Função para processar os apontamentos e gerar dados para gráfico/tabela
  const processApontamentosForDashboard = (data) => {
    const dailyAggregates = {};
    const productDateAggregates = {};

    data.forEach(ap => {
      const date = moment(ap.data_apontamento).format('YYYY-MM-DD');
      const peca = ap.peca; // Código da peça

      // Para o gráfico diário (Quantidade Injetada e Peças NC por dia)
      if (!dailyAggregates[date]) {
        dailyAggregates[date] = {
          date: date,
          quantidadeInjetada: 0,
          pecasNC: 0,
          quantidadeEfetiva: 0,
          meta: metaProducao // Adiciona a meta para cada dia no gráfico
        };
      }
      dailyAggregates[date].quantidadeInjetada += ap.quantidade_injetada;
      dailyAggregates[date].pecasNC += ap.pecas_nc;
      dailyAggregates[date].quantidadeEfetiva += ap.quantidade_efetiva;

      // Para a tabela agregada por Produto e Data
      const key = `${peca}_${date}`;
      if (!productDateAggregates[key]) {
        productDateAggregates[key] = {
          peca: peca,
          data: date,
          totalInjetada: 0,
          totalNC: 0,
          totalEfetiva: 0,
          details: [] // Para armazenar os apontamentos originais para os detalhes
        };
      }
      productDateAggregates[key].totalInjetada += ap.quantidade_injetada;
      productDateAggregates[key].totalNC += ap.pecas_nc;
      productDateAggregates[key].totalEfetiva += ap.quantidade_efetiva;
      productDateAggregates[key].details.push(ap); // Adiciona o apontamento original
    });

    // Converte objetos para arrays para Recharts e MUI Table
    const sortedDailyData = Object.values(dailyAggregates).sort((a, b) => moment(a.date).diff(moment(b.date)));
    setDailyProductionData(sortedDailyData);

    const sortedProductDateData = Object.values(productDateAggregates).sort((a, b) => {
      const dateComparison = moment(a.data).diff(moment(b.data));
      if (dateComparison !== 0) return dateComparison;
      return a.peca.localeCompare(b.peca); // Ordena por peça se as datas forem iguais
    });
    setAggregatedData(sortedProductDateData);
  };


  // Funções de manipulação de mudança para os filtros
  const handlePecaChange = (event) => {
    setSelectedPeca(event.target.value);
  };

  const handleTipoInjetoraChange = (event) => {
    setSelectedTipoInjetora(event.target.value);
  };

  const handleTurnoChange = (event) => {
    setSelectedTurno(event.target.value);
  };

  const handleMetaChange = (event) => {
    setMetaProducao(Number(event.target.value));
  };


  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard de Produção - Injetora
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Data Início"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                format="DD/MM/YYYY"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Data Fim"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                format="DD/MM/YYYY"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Peça (Produto)</InputLabel>
                <Select
                  value={selectedPeca}
                  label="Peça (Produto)"
                  onChange={handlePecaChange}
                  disabled={loadingFilters}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {pecasList.map((peca) => (
                    <MenuItem key={peca.codigo_peca} value={peca.codigo_peca}>
                      {peca.descricao_peca} ({peca.codigo_peca})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo Injetora</InputLabel>
                <Select
                  value={selectedTipoInjetora}
                  label="Tipo Injetora"
                  onChange={handleTipoInjetoraChange}
                  disabled={loadingFilters}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {maquinasList.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Turno</InputLabel>
                <Select
                  value={selectedTurno}
                  label="Turno"
                  onChange={handleTurnoChange}
                  disabled={loadingFilters}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {turnosList.map((turno) => (
                    <MenuItem key={turno} value={turno}>
                      {turno}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Campo para a Meta de Produção */}
            <Grid item xs={12} sm={3}>
              <TextField
                label="Meta de Produção Diária"
                type="number"
                fullWidth
                value={metaProducao}
                onChange={handleMetaChange}
              />
            </Grid>
          </Grid>
          {loadingFilters && <Typography sx={{ mt: 2 }}>Carregando opções de filtro...</Typography>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Gráficos de Produção (Quantidade Efetiva vs. Meta)
          </Typography>
          {loadingFilters ? (
            <Typography>Carregando dados para os gráficos...</Typography>
          ) : dailyProductionData.length === 0 ? (
            <Typography>Nenhum dado disponível para os gráficos com os filtros selecionados.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={dailyProductionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quantidadeEfetiva" stroke="#8884d8" name="Quantidade Efetiva Injetada" />
                <Line type="monotone" dataKey="meta" stroke="#82ca9d" name="Meta de Produção" />
                <Line type="monotone" dataKey="pecasNC" stroke="#ff0000" name="Peças Não Conformes" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Visualização por Produto e Data
          </Typography>
          {loadingFilters ? (
            <Typography>Carregando dados da tabela...</Typography>
          ) : aggregatedData.length === 0 ? (
            <Typography>Nenhum dado agregado disponível para os filtros selecionados.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Peça</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="right">Total Efetiva Injetada</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aggregatedData.map((row, index) => (
                    <Row key={index} row={row} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}