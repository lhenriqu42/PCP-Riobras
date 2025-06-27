import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Drawer,
  IconButton,
  AppBar,
  Typography,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Outlet, useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Estado para controlar a abertura/fechamento do Drawer em dispositivos móveis
  const [mobileOpen, setMobileOpen] = useState(false);

  // Função para alternar o estado do Drawer
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar (barra superior) */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle} // Chama handleDrawerToggle para abrir
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Riobras Produção
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Olá, {user?.email || 'Usuário'}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* SideMenu (menu lateral) */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Drawer para mobile (temporário) */}
        <Drawer
          variant="temporary"
          open={mobileOpen} // Controla a abertura do Drawer
          onClose={handleDrawerToggle} // Fecha o Drawer ao clicar fora
          ModalProps={{
            keepMounted: true, // Melhor performance em mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {/* Conteúdo do SideMenu */}
          {/* O SideMenu precisa ser envolvido por algo que forneça a Toolbar para espaçamento correto */}
          <div>
            <Toolbar /> {/* Adiciona a Toolbar para empurrar o conteúdo para baixo da AppBar */}
            <SideMenu />
          </div>
        </Drawer>
        {/* Drawer para desktop (permanente) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open // Sempre aberto no desktop
        >
          {/* Conteúdo do SideMenu */}
          <div>
            <Toolbar /> {/* Adiciona a Toolbar para empurrar o conteúdo para baixo da AppBar */}
            <SideMenu />
          </div>
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}