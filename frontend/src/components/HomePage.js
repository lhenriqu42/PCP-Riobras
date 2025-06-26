import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
// import { useNavigate } from 'react-router-dom'; // Não precisa mais para os botões aqui
import { useAuth } from '../context/AuthContext'; // Para o usuário logado

function HomePage() {
  // const navigate = useNavigate(); // Não precisa mais para os botões aqui
  const { user } = useAuth(); // Pega o usuário logado

  // Removido handleLogout, pois o botão "Sair" agora está no AppNavbar.

  return (
    <Box> {/* Removido padding: 4, minHeight e backgroundColor de tela cheia */}
      <Typography variant="h4" component="h1" gutterBottom>
        Bem-vindo, {user ? user.username : 'Usuário'}!
      </Typography>

      <Paper elevation={3} sx={{ padding: 4, maxWidth: 800, margin: '0 auto', mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Navegue pelas funcionalidades:
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Use o menu lateral para acessar o Dashboard ou os formulários de Apontamento.
        </Typography>
        {/*
          Os botões de navegação direta para Apontamentos Injetora
          agora estão no SideMenu. Você pode adicionar outros elementos
          ou informações úteis para a home page aqui.
        */}
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 3 }}>
          {/* Exemplo de card de informação */}
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">Visão Geral da Produção</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Acesse o dashboard para monitorar métricas chave.</Typography>
              {/* Você pode adicionar um botão aqui se quiser um atalho específico, mas o menu lateral é o principal */}
              {/* <Button onClick={() => navigate('/dashboard/injetora')} sx={{ mt: 2 }}>Ir para Dashboard</Button> */}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" color="secondary">Registrar Apontamentos</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Preencha os dados da produção diária ou horária.</Typography>
              {/* <Button onClick={() => navigate('/apontamentos/injetora/inicial')} sx={{ mt: 2 }}>Registrar</Button> */}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default HomePage;