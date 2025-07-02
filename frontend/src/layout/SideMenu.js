import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeIcon from '@mui/icons-material/Home';
import QualityIcon from '@mui/icons-material/CheckCircleOutline'; // Ícone para Qualidade, ou escolha outro

import { useAuth } from '../context/AuthContext'; // Importe useAuth

export default function SideMenu() {
  const { user } = useAuth(); // Pega o usuário do contexto

  return (
    <div>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/dashboard/injetora">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard Injetora" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/apontamentos/injetora/inicial">
            <ListItemIcon><AssignmentIcon /></ListItemIcon>
            <ListItemText primary="Apontamento Injetora" />
          </ListItemButton>
        </ListItem>
        {/* NOVO ITEM DE MENU: Análise de Qualidade (visível para nível 2+) */}
        {user && user.level >= 2 && ( // Renderiza condicionalmente
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/dashboard/qualidade">
              <ListItemIcon><QualityIcon /></ListItemIcon>
              <ListItemText primary="Análise de Qualidade" />
            </ListItemButton>
          </ListItem>
        )}
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/home">
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Página Inicial" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );
}