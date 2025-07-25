import React, { useState } from 'react';
import {
    Box, Toolbar, Drawer, IconButton, AppBar,
    Typography, Button, CssBaseline, useTheme, Container 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Outlet, useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';
import { useAuth } from '../context/AuthContext';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(3),
        minHeight: '100vh',
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        }),
        [theme.breakpoints.down('sm')]: {
            marginLeft: 0,
            padding: theme.spacing(2),
        },
        backgroundColor: '#f4f6f8',
    })
);

const AppBarStyled = styled(AppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
    backgroundColor: '#ffffff',
    color: theme.palette.text.primary,
    boxShadow: 'none',
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

export default function Layout() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const theme = useTheme();
    const [open, setOpen] = useState(true);

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBarStyled position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Riobras Produção
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                            Olá, <span style={{ fontWeight: 'bold' }}>{user?.username || 'Usuário'}</span>
                        </Typography>
                        <Button variant="outlined" color="primary" onClick={handleLogout}>
                            Sair
                        </Button>
                    </Box>
                </Toolbar>
            </AppBarStyled>

            <Drawer
                sx={{
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        borderRight: 'none',
                    },
                }}
                variant="persistent"
                anchor="left"
                open={open}
            >
                <DrawerHeader>
                    <Typography variant="h6" sx={{ mr: 'auto', ml: 2, fontWeight: 'bold' }}>Menu</Typography>
                    <IconButton onClick={handleDrawerToggle}>
                        <ChevronLeftIcon />
                    </IconButton>
                </DrawerHeader>
                <SideMenu />
            </Drawer>

            <Main open={open}>
                <Toolbar />
                <Container maxWidth={false} sx={{ pt: 2, pb: 2, flexGrow: 1 }}>
                    <Outlet />
                </Container>
            </Main>
        </Box>
    );
}
