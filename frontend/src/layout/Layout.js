import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Drawer,
  IconButton,
  AppBar,
  Typography,
  Button,
  CssBaseline,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Outlet, useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';
import { useAuth } from '../context/AuthContext';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;
const closedDrawerWidth = 60; // Largura quando o drawer está fechado (apenas ícones)

// Styled AppBar para transição
const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open', // Garante que a prop 'open' não seja passada para o DOM
})(({ theme, open }) => ({
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(!open && {
    marginLeft: closedDrawerWidth,
    width: `calc(100% - ${closedDrawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  }),
}));

// Styled DrawerHeader para espaçamento (necessário para o conteúdo abaixo da AppBar)
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end', // Alinha o conteúdo à direita
  padding: theme.spacing(0, 1),
  minHeight: 64, // Altura padrão da AppBar no desktop
  ...theme.mixins.toolbar, // Garante que respeite a altura da toolbar
}));

export default function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true); // Começa aberto em desktop

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled
        position="fixed"
        open={desktopOpen}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }} // Visível apenas em mobile
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDesktopDrawerToggle}
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} // Visível apenas em desktop
          >
            {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Riobras Produção
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Olá, {user?.username || 'Usuário'}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBarStyled>

      <Box
        component="nav"
        sx={{
          width: { sm: desktopOpen ? drawerWidth : closedDrawerWidth },
          flexShrink: { sm: 0 },
        }}
        aria-label="mailbox folders"
      >
        {/* Drawer temporário para mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <DrawerHeader /> {/* Necessário para o espaçamento no topo do drawer */}
          <SideMenu />
        </Drawer>

        {/* Drawer permanente para desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopOpen ? drawerWidth : closedDrawerWidth,
              transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open // Mantém o drawer sempre 'aberto', mas sua largura é controlada pelo estado desktopOpen
        >
          <DrawerHeader /> {/* Necessário para o espaçamento no topo do drawer */}
          <SideMenu />
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${desktopOpen ? drawerWidth : closedDrawerWidth}px)` },
          mt: '64px', // Garante que o conteúdo comece abaixo da AppBar
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}