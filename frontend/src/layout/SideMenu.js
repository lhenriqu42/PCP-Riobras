import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    List, ListItemButton, ListItemIcon, ListItemText, Divider, ListSubheader, Box
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BuildIcon from '@mui/icons-material/Build';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';

const menuItems = [
    { text: 'Página Inicial', icon: <HomeIcon />, to: '/home', requiredLevel: 1 },
    { text: 'Dashboard Injetora', icon: <DashboardIcon />, to: '/dashboard/injetora', requiredLevel: 1, group: 'Produção' },
    { text: 'Apontamento Injetora', icon: <AssignmentIcon />, to: '/apontamentos/injetora/inicial', requiredLevel: 1, group: 'Produção' },
    { text: 'Apont. Manutenção', icon: <BuildIcon />, to: '/apontamentos/manutencao', requiredLevel: 2, group: 'Análise e Gestão' },
    { text: 'Análise de Qualidade', icon: <CheckCircleOutlineIcon />, to: '/dashboard/qualidade', requiredLevel: 2, group: 'Análise e Gestão' },
    { text: 'Análise de Improdutividade', icon: <PrecisionManufacturingIcon />, to: '/analise/improdutividade', requiredLevel: 2, group: 'Análise e Gestão' },
];

export default function SideMenu() {
    const { user } = useAuth();
    const theme = useTheme();

    const getActiveStyle = (isActive) => ({
        backgroundColor: isActive ? theme.palette.action.selected : 'transparent',
        color: isActive ? theme.palette.primary.main : 'inherit',
        fontWeight: isActive ? 'bold' : 'normal',
        margin: '4px 8px',
        borderRadius: '8px',
        '& .MuiListItemIcon-root': {
            color: isActive ? theme.palette.primary.main : 'inherit',
        },
    });

    const renderMenuItems = (group) =>
        menuItems
            .filter(item => item.group === group && user && user.level >= item.requiredLevel)
            .map((item) => (
                <NavLink to={item.to} key={item.text} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {({ isActive }) => (
                        <ListItemButton sx={getActiveStyle(isActive)}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    )}
                </NavLink>
            ));

    return (
        <Box>
            <List>
                {renderMenuItems(undefined)}
            </List>
            <Divider sx={{ my: 1 }} />
            <List subheader={<ListSubheader>Produção</ListSubheader>}>
                {renderMenuItems('Produção')}
            </List>
             <Divider sx={{ my: 1 }} />
            <List subheader={<ListSubheader>Análise e Gestão</ListSubheader>}>
                {renderMenuItems('Análise e Gestão')}
            </List>
        </Box>
    );
}