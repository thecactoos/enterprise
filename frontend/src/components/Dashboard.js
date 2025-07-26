import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Button,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  Note as NoteIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { handleApiError, logError } from '../utils/errorHandler';
import LoadingErrorState from './LoadingErrorState';
import apiService from '../services/api.service';

function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalClients: 0,
      totalNotes: 0,
      totalUsers: 0,
      recentActivity: [],
      monthlyGrowth: {},
    },
    recentClients: [],
    recentNotes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');
        
        const [stats, clients, notes] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentClients(),
          apiService.getRecentNotes(),
        ]);

        setDashboardData({
          stats,
          recentClients: clients,
          recentNotes: notes,
        });
      } catch (error) {
        logError(error, 'Dashboard data fetch');
        const errorInfo = handleApiError(error);
        setError(errorInfo.message);
        
        // Handle authentication errors
        if (errorInfo.shouldRedirect) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [retryCount]);

  const statCards = [
    {
      title: 'Total Clients',
      value: dashboardData.stats.totalClients,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      growth: dashboardData.stats.monthlyGrowth?.clients || 0,
    },
    {
      title: 'Total Notes',
      value: dashboardData.stats.totalNotes,
      icon: <NoteIcon sx={{ fontSize: 40 }} />,
      color: '#dc004e',
      growth: dashboardData.stats.monthlyGrowth?.notes || 0,
    },
    {
      title: 'Total Users',
      value: dashboardData.stats.totalUsers,
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      growth: dashboardData.stats.monthlyGrowth?.users || 0,
    },
  ];

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <LoadingErrorState
      loading={loading}
      error={error}
      onRetry={handleRetry}
      loadingText="Loading dashboard..."
      errorTitle="Error Loading Dashboard"
    >

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Your CRM Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your clients, notes, and documents efficiently
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() => navigate('/clients')}
              sx={{ py: 2 }}
            >
              Add New Client
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              fullWidth
              onClick={() => navigate('/notes')}
              sx={{ py: 2 }}
            >
              Create Note
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              fullWidth
              onClick={() => navigate('/pdf-analyzer')}
              sx={{ py: 2 }}
            >
              Analyze PDF
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" sx={{ color: card.color }}>
                      {card.value.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {card.title}
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      <TrendingUpIcon 
                        sx={{ 
                          fontSize: 16, 
                          color: card.growth >= 0 ? '#2e7d32' : '#d32f2f',
                          mr: 0.5 
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: card.growth >= 0 ? '#2e7d32' : '#d32f2f' 
                        }}
                      >
                        {card.growth >= 0 ? '+' : ''}{card.growth}% this month
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Clients
              </Typography>
              <List>
                {dashboardData.recentClients.map((client) => (
                  <ListItem key={client.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: '#1976d2' }}>
                        <BusinessIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={client.name}
                      secondary={client.email}
                    />
                    <Chip 
                      label={client.status} 
                      size="small"
                      color={client.status === 'active' ? 'success' : 'warning'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {dashboardData.stats.recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: '#dc004e' }}>
                        <ScheduleIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.description}
                      secondary={new Date(activity.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </LoadingErrorState>
  );
}

export default Dashboard; 