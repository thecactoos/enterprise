import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Link, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';

const routeNameMap = {
  '/': 'Dashboard',
  '/contacts': 'Kontakty',
  '/products': 'Produkty',
  '/quotes': 'Oferty',
  '/notes': 'Notatki',
};

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Don't show breadcrumbs on homepage
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ 
          '& .MuiBreadcrumbs-li': {
            display: 'flex',
            alignItems: 'center'
          }
        }}
      >
        <Link
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'primary.main',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
          Dashboard
        </Link>
        
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const routeName = routeNameMap[to] || value;

          return last ? (
            <Typography color="text.primary" key={to} sx={{ fontWeight: 500 }}>
              {routeName}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={to}
              key={to}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {routeName}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}

export default Breadcrumbs;