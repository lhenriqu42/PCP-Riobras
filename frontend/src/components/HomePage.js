import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { useAuth } from '../context/AuthContext'; 

function HomePage() {
  const { user } = useAuth(); 

  return (
    <Box> {}
      <Typography variant="h4" component="h1" gutterBottom>
        Bem-vindo, {user ? user.username : 'Usuário'}!
      </Typography>

      <Paper elevation={3} sx={{ padding: 4, maxWidth: 800, margin: '0 auto', mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Navegue pelas funcionalidades:
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Use o menu lateral para acessar o Dashboard ou a tela de Apontamento.
        </Typography>
        {}
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>
          {}
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">Visão Geral da Produção</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Acesse o dashboard para monitorar os apontamentos.</Typography>
              {}
              {}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" color="secondary">Registrar Apontamentos</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Preencha os dados da produção diária.</Typography>
              {}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default HomePage;