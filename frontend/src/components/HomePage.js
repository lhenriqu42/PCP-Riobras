// src/components/HomePage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Cores para o gráfico de pizza (ajustadas para 2 fatias)
// Reordenei as cores para que "Peças Conformes" seja verde e "Peças Não Conformes" seja laranja/vermelho
const COLORS = ['#00C49F', '#FF8042']; // Verde para Conformes, Laranja para Não Conformes

function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pieChartData, setPieChartData] = useState([]);
    const [loadingPieChart, setLoadingPieChart] = useState(true);
    const [errorPieChart, setErrorPieChart] = useState('');
    // const [metaProducao, setMetaProducao] = useState(0); // Não é mais necessário se a meta não for usada no pie chart

    const fetchAndProcessPieChartData = useCallback(async () => {
        setLoadingPieChart(true);
        setErrorPieChart('');
        try {
            // REMOVIDO: A busca pela meta de produção não é mais necessária para este pie chart
            // const metaResponse = await axios.get('http://localhost:3001/api/meta-producao');
            // const currentMeta = metaResponse.data.meta || 0;
            // setMetaProducao(currentMeta);

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const params = {
                dataInicio: thirtyDaysAgo.toISOString().split('T')[0],
                dataFim: new Date().toISOString().split('T')[0],
            };

            const apontamentosResponse = await axios.get('http://localhost:3001/api/apontamentos/injetora', { params });
            const apontamentos = apontamentosResponse.data;

            let totalPecasConformes = 0;
            let totalPecasNC = 0;
            // REMOVIDO: totalProducaoEfetiva não é mais necessária
            // let totalProducaoEfetiva = 0;

            apontamentos.forEach(ap => {
                totalPecasConformes += (Number(ap.quantidade_injetada || 0) - Number(ap.pecas_nc || 0));
                totalPecasNC += Number(ap.pecas_nc || 0);
                // REMOVIDO:
                // totalProducaoEfetiva += Number(ap.quantidade_efetiva || 0);
            });

            const totalPecas = totalPecasConformes + totalPecasNC;

            // REMOVIDO: Cálculos relacionados à meta e percentDentroMeta
            // const diffTime = Math.abs(new Date(params.dataFim) - new Date(params.dataInicio));
            // const numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // const totalMetaProducao = currentMeta * numDays;
            // const percentDentroMeta = totalMetaProducao > 0 && totalProducaoEfetiva > 0
            //     ? (totalProducaoEfetiva / totalMetaProducao) * 100
            //     : 0;
            // const finalPercentDentroMeta = Math.min(percentDentroMeta, 100);

            const percentConformes = totalPecas > 0 ? (totalPecasConformes / totalPecas) * 100 : 0;
            const percentNC = totalPecas > 0 ? (totalPecasNC / totalPecas) * 100 : 0;

            setPieChartData([
                { name: 'Peças Conformes', value: totalPecasConformes, percent: percentConformes },
                { name: 'Peças Não Conformes', value: totalPecasNC, percent: percentNC },
                // REMOVIDO: A fatia de "Produção Efetiva vs. Meta"
                // { name: 'Produção Efetiva vs. Meta', value: totalProducaoEfetiva, percent: finalPercentDentroMeta, totalMeta: totalMetaProducao },
            ]);

        } catch (err) {
            console.error('Erro ao buscar dados para o Pie Chart da HomePage:', err);
            setErrorPieChart('Erro ao carregar dados do gráfico de produção.');
        } finally {
            setLoadingPieChart(false);
        }
    }, []); // Dependências ajustadas, metaProducao removida

    useEffect(() => {
        fetchAndProcessPieChartData();
    }, [fetchAndProcessPieChartData]);

    // Customização do Tooltip para exibir informações mais detalhadas
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload; // Pega o objeto de dados da fatia
            // REMOVIDO: A lógica específica para o Tooltip de "Produção Efetiva vs. Meta"
            // if (data.name === 'Produção Efetiva vs. Meta') {
            //     return (
            //         <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}>
            //             <Typography variant="body2" sx={{ color: payload[0].color }}>{data.name}</Typography>
            //             <Typography variant="body2">Produção Total: {data.value.toFixed(0)}</Typography>
            //             <Typography variant="body2">Meta Total: {data.totalMeta.toFixed(0)}</Typography>
            //             <Typography variant="body2">Atingimento: {data.percent.toFixed(2)}%</Typography>
            //         </Paper>
            //     );
            // }
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


    return (
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Bem-vindo, {user ? user.username : 'Usuário'}!
            </Typography>

            <Paper elevation={3} sx={{ padding: 4, maxWidth: 1200, margin: '0 auto', mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Navegue pelas funcionalidades:
                </Typography>

                <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>
                    {/* Card de Navegação - Dashboard */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Visão Geral da Produção
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                                Acesse o dashboard completo para monitorar todos os apontamentos e métricas.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => navigate('/dashboard/injetora')}
                                sx={{ mt: 'auto' }}
                            >
                                Ir para Dashboard
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Card de Navegação - Apontamentos */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper variant="outlined" sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <Typography variant="h6" color="secondary" gutterBottom>
                                Registrar Apontamentos
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                                Preencha os dados da produção diária de peças injetadas.
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => navigate('/apontamentos/injetora/inicial')}
                                sx={{ mt: 'auto' }}
                            >
                                Novo Apontamento
                            </Button>
                        </Paper>
                    </Grid>

                    {}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                Distribuição Geral da Produção
                            </Typography>
                            {loadingPieChart ? (
                                <CircularProgress sx={{ mt: 2 }} />
                            ) : errorPieChart ? (
                                <Alert severity="error" sx={{ mt: 2 }}>{errorPieChart}</Alert>
                            ) : pieChartData.length === 0 || pieChartData.every(data => data.value === 0) ? (
                                <Typography sx={{ mt: 2 }}>Nenhum dado de produção para exibir no período.</Typography>
                            ) : (
                                <ResponsiveContainer width="200%" height={250}>
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
                                        {/* Usando o CustomTooltip */}
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default HomePage;