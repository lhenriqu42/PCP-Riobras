import React from 'react'; 
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    return (
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Bem-vindo, {user ? user.username : 'Usuário'}!
            </Typography>

            <Paper elevation={3} sx={{ padding: 4, maxWidth: 1200, margin: '0 auto', mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Navegue pelas funcionalidades:
                </Typography>

                <Box justifyContent="center" display={'flex'} flexDirection={'column'} px={10}>
                    <Box>
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
                    </Box>

                  
                    <Box>
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
                            >
                                Novo Apontamento
                            </Button>
                        </Paper>
                    </Box>

                   
                  
                </Box>
            </Paper>
        </Box>
    );
}

export default HomePage;