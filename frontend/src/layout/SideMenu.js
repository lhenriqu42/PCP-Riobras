import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Box,
  Toolbar,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HomeIcon from '@mui/icons-material/Home';

const drawerWidth = 240;

export default function SideMenu({ mobileOpen, handleDrawerToggle }) {
  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/dashboard/injetora">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard Injetora" />
          </ListItemButton>
        </ListItem>
        {/* Manter apenas "Apontamento Injetora - Inicial" */}
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/apontamentos/injetora/inicial">
            <ListItemIcon><AssignmentIcon /></ListItemIcon>
            <ListItemText primary="Apontamento Injetora" /> {/* Nome simplificado */}
          </ListItemButton>
        </ListItem>
        {/* A opção para "Apontamento Injetora - Horário" (antiga Fase 2) foi removida do menu */}
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/home">
            <ListItemIcon><HomeIcon /></ListItemIcon>
            <ListItemText primary="Página Inicial" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Drawer para mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      {/* Drawer para desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}