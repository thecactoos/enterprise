import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import { config, isDevelopment } from '../config/environment';
import apiService from '../services/api.service';
import mockDataService from '../services/mock-data.service';

const DevTools = () => {
  const [useMock, setUseMock] = useState(apiService.getUseMock());
  const [showDevTools, setShowDevTools] = useState(false);

  const handleMockToggle = (event) => {
    const newValue = event.target.checked;
    setUseMock(newValue);
    apiService.setUseMock(newValue);
    
    // Show feedback
    console.log(`Switched to ${newValue ? 'mock' : 'real'} data`);
  };

  const handleResetData = () => {
    mockDataService.resetData();
    window.location.reload();
  };

  const handleClearData = () => {
    mockDataService.clearData();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  // Only show in development
  if (!isDevelopment()) {
    return null;
  }

  return (
    <>
      {/* Floating Dev Tools Button */}
      <Box
        position="fixed"
        bottom={20}
        right={20}
        zIndex={1000}
      >
        <Button
          variant="contained"
          color="secondary"
          startIcon={<SettingsIcon />}
          onClick={() => setShowDevTools(!showDevTools)}
          sx={{
            borderRadius: '50px',
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
            },
          }}
        >
          Dev Tools
        </Button>
      </Box>

      {/* Dev Tools Panel */}
      {showDevTools && (
        <Box
          position="fixed"
          top={20}
          right={20}
          zIndex={1001}
          maxWidth={400}
        >
          <Paper elevation={8} sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <BugIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Development Tools
              </Typography>
              <Chip 
                label={useMock ? 'Mock Data' : 'Real API'} 
                color={useMock ? 'warning' : 'success'}
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                These tools are only available in development mode.
              </Typography>
            </Alert>

            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useMock}
                    onChange={handleMockToggle}
                    color="primary"
                  />
                }
                label="Use Mock Data"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                {useMock 
                  ? 'Using local mock data (faster development)' 
                  : 'Using real API endpoints (test integration)'
                }
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Data Management
            </Typography>

            <Box display="flex" gap={1} mb={2}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetData}
                fullWidth
              >
                Reset Data
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={handleClearData}
                fullWidth
              >
                Clear All
              </Button>
            </Box>

            <Button
              size="small"
              variant="contained"
              onClick={handleRefreshPage}
              fullWidth
            >
              Refresh Page
            </Button>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Environment Info
            </Typography>

            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              <div>API URL: {config.api.baseURL}</div>
              <div>Mock Delay: {config.mock.delay}ms</div>
              <div>Environment: {process.env.NODE_ENV}</div>
            </Box>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default DevTools; 