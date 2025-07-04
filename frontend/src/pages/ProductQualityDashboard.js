import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#00C49F', '#FF8042'];
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ProductQualityDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [productData, setProductData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.level < 2) {
        navigate('/home', { replace: true });
        return;
      }
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const productsResponse = await axios.get(`${API_URL}/api/produtos/taxa-nc`);
        setProductData(productsResponse.data);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const params = {
          dataInicio: thirtyDaysAgo.toISOString().split('T')[0],
          dataFim: new Date().toISOString().split('T')[0],
        };
        const apontamentosResponse = await axios.get(`${API_URL}/api/apontamentos/injetora`, { params });
        const apontamentos = apontamentosResponse.data;

        let totalPecasConformes = 0;
        let totalPecasNC = 0;

        apontamentos.forEach(ap => {
          totalPecasConformes += (Number(ap.quantidade_injetada || 0) - Number(ap.pecas_nc || 0));
          totalPecasNC += Number(ap.pecas_nc || 0);
        });

        const totalPecas = totalPecasConformes + totalPecasNC;

        const percentConformes = totalPecas > 0 ? (totalPecasConformes / totalPecas) * 100 : 0;
        const percentNC = totalPecas > 0 ? (totalPecasNC / totalPecas) * 100 : 0;

        if (totalPecas > 0) {
            setPieChartData([
                { name: 'Peças Conformes', value: totalPecasConformes, percent: percentConformes },
                { name: 'Peças Não Conformes', value: totalPecasNC, percent: percentNC },
            ]);
        } else {
            setPieChartData([{ name: 'Nenhum dado disponível', value: 1, percent: 100 }]);
        }


      } catch (err) {
        console.error('Erro ao buscar dados para o Dashboard de Qualidade:', err);
        setError('Não foi possível carregar os dados. ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && user.level >= 2) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.name === 'Nenhum dado disponível') {
            return (
                <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}>
                    <Typography variant="body2">{data.name}</Typography>
                </Paper>
            );
        }
        return (
            <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}>
                <Typography variant="body2" sx={{ color: payload[0].color }}>{data.name}</Typography>
                <Typography variant="body2">Quantidade: {data.value}</Typography>
                <Typography variant="body2">Porcentagem: {data.percent.toFixed(2)}%</Typography>
            </Paper>
        );
    }
    return null;
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Carregando dados de qualidade...</Typography>
      </Box>
    );
  }

  if (!user || user.level < 2) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Alert severity="warning">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Análise de Qualidade por Produto
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Distribuição Geral de Produção
            </Typography>
            {pieChartData.length === 0 || (pieChartData.length === 1 && pieChartData[0].name === 'Nenhum dado disponível') ? (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
                    <Typography variant="body1">Nenhum dado de produção para exibir no período.</Typography>
                </Box>
            ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Taxa de Peças Não Conformes por Produto
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto (Peça)</TableCell>
                    <TableCell align="right">Total Injetado</TableCell>
                    <TableCell align="right">Peças Não Conformes</TableCell>
                    <TableCell align="right">Taxa de NC (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Nenhum dado de produto encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    productData.map((item) => (
                      <TableRow
                        key={item.peca}
                        sx={{
                          backgroundColor: item.taxaNC > 7 ? '#FFEBEE' : 'inherit',
                          '&:hover': {
                            backgroundColor: item.taxaNC > 7 ? '#FFCDD2' : '#f5f5f5',
                          },
                        }}
                      >
                        <TableCell>{item.peca}</TableCell>
                        <TableCell align="right">{item.totalInjetado}</TableCell>
                        <TableCell align="right">{item.totalPecasNC}</TableCell>
                        <TableCell align="right" sx={{ color: item.taxaNC > 7 ? 'red' : 'inherit', fontWeight: item.taxaNC > 7 ? 'bold' : 'normal' }}>
                          {item.taxaNC}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}