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
    MenuItem,
    IconButton
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
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

    const [employeeProductInjectionIndex, setEmployeeProductInjectionIndex] = useState([]);
    const [filterEmployeeProductIndex, setFilterEmployeeProductIndex] = useState('total');
    const [pecasList, setPecasList] = useState([]);

    const [sortColumn, setSortColumn] = useState('indice'); 
    const [sortDirection, setSortDirection] = useState('desc'); 

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

                const employeeProductMap = {};

                apontamentos.forEach(ap => {
                    const funcionario = ap.funcionario;
                    const peca = ap.peca;
                    const quantidadeEfetiva = Number(ap.quantidade_efetiva || 0);

                    if (funcionario) {
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


                let processedEmployeeProductData = [];
                const allFuncs = [...new Set(apontamentos.map(ap => ap.funcionario))].filter(Boolean); // Filtrar valores nulos/undefined

                allFuncs.forEach(func => {
                    if (filterEmployeeProductIndex === 'total') {
                        let totalInjetadas = 0;
                        let totalNC = 0;
                        let totalEfetivas = 0;

                        for (const prod in employeeProductMap[func]) {
                            totalInjetadas += employeeProductMap[func][prod].totalPecasInjetadas;
                            totalNC += employeeProductMap[func][prod].totalPecasNC;
                            totalEfetivas += employeeProductMap[func][prod].totalPecasEfetivas;
                        }

                        processedEmployeeProductData.push({
                            funcionario: func,
                            peca: 'Total', 
                            totalPecasInjetadas: totalInjetadas,
                            totalPecasNC: totalNC,
                            totalPecasEfetivas: totalEfetivas,
                            indice: totalInjetadas > 0 ? ((totalEfetivas / totalInjetadas) * 100).toFixed(2) : 0
                        });
                    } else {
                        const productData = employeeProductMap[func]?.[filterEmployeeProductIndex];
                        if (productData) {
                            processedEmployeeProductData.push({
                                ...productData,
                                indice: productData.totalPecasInjetadas > 0 ? ((productData.totalPecasEfetivas / productData.totalPecasInjetadas) * 100).toFixed(2) : 0
                            });
                        } else {
                            processedEmployeeProductData.push({
                                funcionario: func,
                                peca: filterEmployeeProductIndex,
                                totalPecasInjetadas: 0,
                                totalPecasNC: 0,
                                totalPecasEfetivas: 0,
                                indice: 0
                            });
                        }
                    }
                });

                const uniquePecas = [...new Set(apontamentos.map(ap => ap.peca))].filter(Boolean)
                    .map(pecaName => ({ codigo_peca: pecaName, descricao_peca: pecaName }))
                    .sort((a, b) => a.descricao_peca.localeCompare(b.descricao_peca));
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
    }, [user, authLoading, navigate, filterEmployeeProductIndex]); 

    const handleFilterEmployeeProductIndexChange = (event) => {
        setFilterEmployeeProductIndex(event.target.value);
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc'); 
        }
    };

    const sortedEmployeeProductData = useCallback(() => {
        let dataToSort = [...employeeProductInjectionIndex];

        if (filterEmployeeProductIndex !== 'total') {
            dataToSort = dataToSort.filter(item => item.peca === filterEmployeeProductIndex);
        }

        dataToSort.sort((a, b) => {
            let valA, valB;
            switch (sortColumn) {
                case 'totalInjetado':
                    valA = a.totalPecasInjetadas;
                    valB = b.totalPecasInjetadas;
                    break;
                case 'pecasNC':
                    valA = a.totalPecasNC;
                    valB = b.totalPecasNC;
                    break;
                case 'pecasEfetivas':
                    valA = a.totalPecasEfetivas;
                    valB = b.totalPecasEfetivas;
                    break;
                case 'indice':
                    valA = parseFloat(a.indice);
                    valB = parseFloat(b.indice);
                    break;
                default:
                    valA = a[sortColumn];
                    valB = b[sortColumn];
            }

            if (valA < valB) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return dataToSort;
    }, [employeeProductInjectionIndex, filterEmployeeProductIndex, sortColumn, sortDirection]);


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

            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Índice de Injeção por Funcionário e Produto
                </Typography>
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ mb: 0 }}>
                                Desempenho por Funcionário e Produto
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id="filter-employee-product-label">Filtrar por Produto</InputLabel>
                                <Select
                                    labelId="filter-employee-product-label"
                                    value={filterEmployeeProductIndex}
                                    label="Filtrar por Produto"
                                    onChange={handleFilterEmployeeProductIndexChange}
                                >
                                    <MenuItem value="total">Todos os Produtos (Agregado)</MenuItem>
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
                                        <TableCell align="right">
                                            Total Injetado
                                            <IconButton size="small" onClick={() => handleSort('totalInjetado')}>
                                                {sortColumn === 'totalInjetado' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="right">
                                            Peças NC
                                            <IconButton size="small" onClick={() => handleSort('pecasNC')}>
                                                {sortColumn === 'pecasNC' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="right">
                                            Peças Efetivas
                                            <IconButton size="small" onClick={() => handleSort('pecasEfetivas')}>
                                                {sortColumn === 'pecasEfetivas' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell align="right">
                                            Índice Injeção (%)
                                            <IconButton size="small" onClick={() => handleSort('indice')}>
                                                {sortColumn === 'indice' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedEmployeeProductData().length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={filterEmployeeProductIndex !== 'total' ? 6 : 5} align="center">Nenhum dado de injeção por funcionário encontrado para o filtro selecionado.</TableCell>
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
            </Box>
        </Box>
    );
}