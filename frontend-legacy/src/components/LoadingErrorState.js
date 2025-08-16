import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

function LoadingErrorState({
  loading = false,
  error = '',
  onRetry = null,
  loadingText = 'Loading...',
  errorTitle = 'Error',
  children = null,
  showSuccess = false,
  successText = 'Success!',
}) {
  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {loadingText}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Please wait while we process your request...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          action={
            onRetry && (
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Retry
              </Button>
            )
          }
        >
          <Typography variant="h6" gutterBottom>
            {errorTitle}
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Paper>
    );
  }

  if (showSuccess) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon />}
        >
          <Typography variant="h6" gutterBottom>
            {successText}
          </Typography>
        </Alert>
        {children}
      </Paper>
    );
  }

  return children;
}

export default LoadingErrorState; 