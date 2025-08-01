import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import DevTools from './components/DevTools';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Breadcrumbs from './components/Breadcrumbs';

// Lazy load main components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Contacts = lazy(() => import('./components/Contacts'));
const Products = lazy(() => import('./components/Products'));
const Quotes = lazy(() => import('./components/Quotes'));
const Notes = lazy(() => import('./components/Notes'));


function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Breadcrumbs />
        <Suspense fallback={
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/products" element={<Products />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <DevTools />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 