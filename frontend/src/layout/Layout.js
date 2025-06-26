import React from 'react';
import { Box, Toolbar, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom'; // Importe Outlet para renderizar rotas aninhadas
import SideMenu from './SideMenu'; // O menu lateral que vamos criar
import AppNavbar from './AppNavbar'; // A barra de navegação superior

const drawerWidth = 240; // Largura do menu lateral

export default function Layout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppNavbar handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />
      <SideMenu mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', sm: '64px' } // Espaço para a AppBar
        }}
      >
        <Toolbar /> {/* Espaço para a AppBar fixa */}
        <Outlet /> {/* Aqui o conteúdo da rota aninhada será renderizado (Dashboard, Apontamentos, etc.) */}
      </Box>
    </Box>
  );
}