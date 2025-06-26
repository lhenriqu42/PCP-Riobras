import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Para o logout

function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Pega o usuário logado e a função de logout

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ padding: 4, textAlign: 'center', backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Bem-vindo, {user ? user.username : 'Usuário'}!
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

      <Paper elevation={3} sx={{ padding: 4, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Funções do Aplicativo
        </Typography>
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 2 }}
              onClick={() => navigate('/apontamentos/injetora/inicial')} 
            >
              Apontamentos Injetora
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              size="large"
              sx={{ py: 2 }}
              onClick={() => alert('Em desenvolvimento: Apontamentos Gerais')}
            >
              Apontamentos Gerais
            </Button>
          </Grid>
          {/* Adicione mais botões para outras funcionalidades aqui */}
        </Grid>
      </Paper>
    </Box>
  );
}

export default HomePage;