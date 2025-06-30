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

// Remova o drawerWidth daqui, pois o Layout vai gerenciar o Drawer

export default function SideMenu() {
  return (
    <div>
      {/* O Toolbar para espaçamento já está no Layout.js dentro do DrawerHeader */}
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