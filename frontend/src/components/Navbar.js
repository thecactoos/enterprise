import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  Inventory as ProductIcon,
  Euro as EuroIcon,
  ContactPhone as ContactIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Kontakty', path: '/contacts', icon: <PersonIcon /> },
    { label: 'Produkty', path: '/products', icon: <ProductIcon /> },
    { label: 'Oferty', path: '/quotes', icon: <EuroIcon /> },
    { label: 'Notatki', path: '/notes', icon: <ContactIcon /> },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavItemClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
          <PersonIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {currentUser?.name || 'Użytkownik'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ opacity: 0.8 }}>
            {currentUser?.email}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ pt: 0 }}>
        {navItems.map((item) => (
          <ListItem 
            key={item.path} 
            button 
            onClick={() => handleNavItemClick(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.main',
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: location.pathname === item.path ? 600 : 400
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <ListItem button onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Wyloguj" />
      </ListItem>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CRM System
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => handleNavItemClick(item.path)}
                  sx={{ 
                    textTransform: 'none',
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 2 }}>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ color: 'inherit' }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PersonIcon />
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Typography variant="body2">
            {currentUser?.name || currentUser?.email}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}

export default Navbar; 