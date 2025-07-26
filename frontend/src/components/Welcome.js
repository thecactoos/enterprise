import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Note as NoteIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Welcome() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const features = [
    {
      title: 'Dashboard',
      description: 'View your CRM overview and statistics',
      icon: <DashboardIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      path: '/',
    },
    {
      title: 'Client Management',
      description: 'Add and manage your client relationships',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      path: '/clients',
    },
    {
      title: 'Notes & Communication',
      description: 'Track important information and communications',
      icon: <NoteIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      path: '/notes',
    },
    {
      title: 'PDF Analysis',
      description: 'Extract data from PDF documents and invoices',
      icon: <PdfIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      path: '/pdf-analyzer',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6, textAlign: 'center' }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'success.main' }}>
          <CheckCircleIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h3" gutterBottom>
          Welcome, {currentUser?.name || 'User'}!
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
          You have successfully logged into your CRM system
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{ px: 4, py: 1.5 }}
        >
          Go to Dashboard
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        What would you like to do today?
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: feature.color, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Getting Started
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Start by adding your first client, creating notes, or analyzing PDF documents.
            Your CRM system is ready to help you manage your business relationships effectively.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/clients')}
            sx={{ mr: 2 }}
          >
            Add Your First Client
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/notes')}
          >
            Create Your First Note
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default Welcome; 