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
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
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

    const [employeeInjectionIndex, setEmployeeInjectionIndex] = useState([]);
    const [employeeProductInjectionIndex, setEmployeeProductInjectionIndex] = useState([]);
    const [filterEmployeeProductIndex, setFilterEmployeeProductIndex] = useState('total'); 

    const [pecasList, setPecasList] = useState([]);

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

                const employeeMap = {};
                const employeeProductMap = {};

                apontamentos.forEach(ap => {
                    const funcionario = ap.funcionario;
                    const peca = ap.peca;
                    const quantidadeEfetiva = Number(ap.quantidade_efetiva || 0);

                    if (funcionario) {
                        if (!employeeMap[funcionario]) {
                            employeeMap[funcionario] = {
                                funcionario: funcionario,
                                totalPecasEfetivas: 0,
                                totalPecasInjetadas: 0,
                                totalPecasNC: 0
                            };
                        }
                        employeeMap[funcionario].totalPecasEfetivas += quantidadeEfetiva;
                        employeeMap[funcionario].totalPecasInjetadas += Number(ap.quantidade_injetada || 0);
                        employeeMap[funcionario].totalPecasNC += Number(ap.pecas_nc || 0);
                    }

                    if (funcionario && peca) {
                        if (!employeeProductMap[funcionario]) {
                            employeeProductMap[funcionario] = {};
                        }
                        if (!employeeProductMap[funcionario][peca]) {
                            employeeProductMap[funcionario][peca] = {
                                funcionario: funcionario,
                                peca: peca,
                                totalPecasEfetivas: 0,
                                totalPecasInjetadas: 0,
                                totalPecasNC: 0,
                                indice: 0 
                            };
                        }
                        employeeProductMap[funcionario][peca].totalPecasEfetivas += quantidadeEfetiva;
                        employeeProductMap[funcionario][peca].totalPecasInjetadas += Number(ap.quantidade_injetada || 0);
                        employeeProductMap[funcionario][peca].totalPecasNC += Number(ap.pecas_nc || 0);
                    }
                });

                const sortedEmployees = Object.values(employeeMap).sort((a, b) => b.totalPecasEfetivas - a.totalPecasEfetivas);
                setEmployeeInjectionIndex(sortedEmployees);

                let processedEmployeeProductData = [];
                for (const emp in employeeProductMap) {
                    for (const prod in employeeProductMap[emp]) {
                        const data = employeeProductMap[emp][prod];
                        data.indice = data.totalPecasInjetadas > 0 ?
                            ((data.totalPecasEfetivas / data.totalPecasInjetadas) * 100).toFixed(2) : 0;
                        processedEmployeeProductData.push(data);
                    }
                }
                const uniquePecas = [...new Set(apontamentos.map(ap => ap.peca))].map(pecaName => ({ codigo_peca: pecaName, descricao_peca: pecaName }));
                setPecasList(uniquePecas);


                setEmployeeProductInjectionIndex(processedEmployeeProductData);

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

    const handleFilterEmployeeProductIndexChange = (event) => {
        setFilterEmployeeProductIndex(event.target.value);
    };

    const sortedEmployeeProductData = useCallback(() => {
        let sortedData = [...employeeProductInjectionIndex];
        if (filterEmployeeProductIndex === 'total') {
            sortedData.sort((a, b) => b.totalPecasEfetivas - a.totalPecasEfetivas);
        } else {
            sortedData = sortedData.filter(item => item.peca === filterEmployeeProductIndex);
            sortedData.sort((a, b) => b.indice - a.indice);
        }
        return sortedData;
    }, [employeeProductInjectionIndex, filterEmployeeProductIndex]);


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

            ---

            <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
                Índice de Injeção por Funcionário
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Funcionários por Volume de Peças Efetivas
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Funcionário</TableCell>
                                        <TableCell align="right">Total Peças Efetivas Injetadas</TableCell>
                                        <TableCell align="right">Total Peças Injetadas</TableCell>
                                        <TableCell align="right">Total Peças NC</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {employeeInjectionIndex.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">Nenhum dado de funcionário encontrado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        employeeInjectionIndex.map((item, index) => (
                                            <TableRow key={item.funcionario || index}>
                                                <TableCell>{item.funcionario}</TableCell>
                                                <TableCell align="right">{item.totalPecasEfetivas}</TableCell>
                                                <TableCell align="right">{item.totalPecasInjetadas}</TableCell>
                                                <TableCell align="right">{item.totalPecasNC}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ mb: 0 }}>
                                Índice de Injeção por Funcionário e Produto
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id="filter-employee-product-label">Filtrar por Produto</InputLabel>
                                <Select
                                    labelId="filter-employee-product-label"
                                    value={filterEmployeeProductIndex}
                                    label="Filtrar por Produto"
                                    onChange={handleFilterEmployeeProductIndexChange}
                                >
                                    <MenuItem value="total">Todos os Produtos (Ordenar por Total)</MenuItem>
                                    {pecasList.map((peca) => (
                                        <MenuItem key={peca.codigo_peca} value={peca.codigo_peca}>
                                            {peca.descricao_peca} ({peca.codigo_peca})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Funcionário</TableCell>
                                        {filterEmployeeProductIndex !== 'total' && <TableCell>Produto</TableCell>}
                                        <TableCell align="right">Total Injetado</TableCell>
                                        <TableCell align="right">Peças NC</TableCell>
                                        <TableCell align="right">Peças Efetivas</TableCell>
                                        <TableCell align="right">Índice Injeção (%)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedEmployeeProductData().length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={filterEmployeeProductIndex !== 'total' ? 6 : 5} align="center">Nenhum dado de injeção por produto encontrado para o filtro selecionado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedEmployeeProductData().map((item, index) => (
                                            <TableRow key={`${item.funcionario}-${item.peca || 'all'}-${index}`}>
                                                <TableCell>{item.funcionario}</TableCell>
                                                {filterEmployeeProductIndex !== 'total' && <TableCell>{item.peca}</TableCell>}
                                                <TableCell align="right">{item.totalPecasInjetadas}</TableCell>
                                                <TableCell align="right">{item.totalPecasNC}</TableCell>
                                                <TableCell align="right">{item.totalPecasEfetivas}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: item.indice < 80 ? 'bold' : 'normal', color: item.indice < 80 ? 'orange' : 'inherit' }}>
                                                    {item.indice}%
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