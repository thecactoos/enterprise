// Error handling utilities for the frontend

export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data?.message || 'Invalid request data',
          details: data?.details || null,
        };
      case 401:
        return {
          type: 'authentication',
          message: 'Session expired. Please log in again.',
          shouldRedirect: true,
        };
      case 403:
        return {
          type: 'authorization',
          message: 'Access denied. You do not have permission to perform this action.',
        };
      case 404:
        return {
          type: 'notFound',
          message: 'The requested resource was not found.',
        };
      case 409:
        return {
          type: 'conflict',
          message: data?.message || 'Resource already exists.',
        };
      case 422:
        return {
          type: 'validation',
          message: data?.message || 'Validation failed.',
          details: data?.details || null,
        };
      case 500:
        return {
          type: 'server',
          message: 'Server error. Please try again later.',
        };
      case 502:
      case 503:
      case 504:
        return {
          type: 'service',
          message: 'Service temporarily unavailable. Please try again later.',
        };
      default:
        return {
          type: 'unknown',
          message: data?.message || 'An unexpected error occurred.',
        };
    }
  } else if (error.request) {
    // Network error
    return {
      type: 'network',
      message: 'Network error. Please check your connection and try again.',
    };
  } else {
    // Other error
    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
    };
  }
};

export const handleFormValidation = (errors) => {
  const formErrors = {};
  
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      if (error.field) {
        formErrors[error.field] = error.message;
      }
    });
  } else if (typeof errors === 'object') {
    Object.keys(errors).forEach(key => {
      formErrors[key] = errors[key];
    });
  }
  
  return formErrors;
};

export const isNetworkError = (error) => {
  return error.code === 'NETWORK_ERROR' || 
         error.message.includes('Network Error') ||
         error.message.includes('ERR_NETWORK') ||
         !error.response;
};

export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

export const shouldRetry = (error, retryCount = 0) => {
  const maxRetries = 3;
  
  if (retryCount >= maxRetries) {
    return false;
  }
  
  // Retry on network errors or 5xx server errors
  return isNetworkError(error) || 
         (error.response?.status >= 500 && error.response?.status < 600);
};

export const getErrorMessage = (error) => {
  const errorInfo = handleApiError(error);
  return errorInfo.message;
};

export const logError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
  
  console.error('Error logged:', errorInfo);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTrackingService(errorInfo);
  }
}; 