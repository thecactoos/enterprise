import axios from 'axios';
import { config } from '../config/environment';
import { mockDataService } from './mock-data.service';

// Create axios instance with configuration
const apiClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create PDF service axios instance
const pdfServiceClient = axios.create({
  baseURL: config.pdfService.baseURL,
  timeout: config.pdfService.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Smart API service that switches between mock and real data
class ApiService {
  constructor() {
    this.useMock = config.mock.enabled;
    this.mockDelay = config.mock.delay;
  }

  // Helper method to add artificial delay for mock data
  async addMockDelay() {
    if (this.mockDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
  }

  // Generic request method
  async request(method, endpoint, data = null, options = {}) {
    if (this.useMock) {
      return this.mockRequest(method, endpoint, data, options);
    } else {
      return this.realRequest(method, endpoint, data, options);
    }
  }

  // Mock data request
  async mockRequest(method, endpoint, data, options) {
    await this.addMockDelay();
    
    try {
      const response = await mockDataService.handleRequest(method, endpoint, data);
      return { data: response, status: 200 };
    } catch (error) {
      throw {
        response: {
          status: error.status || 500,
          data: { message: error.message }
        }
      };
    }
  }

  // Real API request
  async realRequest(method, endpoint, data, options) {
    const config = {
      method,
      url: endpoint,
      ...options,
    };

    if (data) {
      if (method.toLowerCase() === 'get') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    return apiClient(config);
  }

  // HTTP method shortcuts
  async get(endpoint, params = null, options = {}) {
    return this.request('GET', endpoint, params, options);
  }

  async post(endpoint, data = null, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  async put(endpoint, data = null, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    return response.data;
  }

  // Dashboard methods
  async getDashboardStats() {
    const response = await this.get('/dashboard/stats');
    return response.data;
  }

  async getRecentClients() {
    const response = await this.get('/dashboard/recent-clients');
    return response.data;
  }

  async getRecentNotes() {
    const response = await this.get('/dashboard/recent-notes');
    return response.data;
  }

  // Client methods
  async getClients() {
    const response = await this.get('/clients');
    return response.data;
  }

  async getClient(id) {
    const response = await this.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(clientData) {
    const response = await this.post('/clients', clientData);
    return response.data;
  }

  async updateClient(id, clientData) {
    const response = await this.put(`/clients/${id}`, clientData);
    return response.data;
  }

  async deleteClient(id) {
    const response = await this.delete(`/clients/${id}`);
    return response.data;
  }

  // Note methods
  async getNotes() {
    const response = await this.get('/notes');
    return response.data;
  }

  async getNote(id) {
    const response = await this.get(`/notes/${id}`);
    return response.data;
  }

  async createNote(noteData) {
    const response = await this.post('/notes', noteData);
    return response.data;
  }

  async updateNote(id, noteData) {
    const response = await this.put(`/notes/${id}`, noteData);
    return response.data;
  }

  async deleteNote(id) {
    const response = await this.delete(`/notes/${id}`);
    return response.data;
  }

  // PDF Analysis methods - Direct connection to PDF service
  async analyzePdf(formData) {
    // Always use real PDF service directly, never mock
    const response = await pdfServiceClient.post('/api/v1/upload-and-process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadPdf(formData) {
    // Always use real PDF service directly, never mock
    const response = await pdfServiceClient.post('/api/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async processPdf(fileId, ocrConfig = null) {
    // Always use real PDF service directly, never mock
    const data = ocrConfig ? { ocr_config: ocrConfig } : null;
    const response = await pdfServiceClient.post(`/api/v1/process/${fileId}`, data);
    return response.data;
  }

  async getPdfFiles() {
    // Always use real PDF service directly, never mock
    const response = await pdfServiceClient.get('/api/v1/files');
    return response.data;
  }

  async getPdfFileInfo(fileId) {
    // Always use real PDF service directly, never mock
    const response = await pdfServiceClient.get(`/api/v1/files/${fileId}`);
    return response.data;
  }

  async deletePdfFile(fileId) {
    // Always use real PDF service directly, never mock
    const response = await pdfServiceClient.delete(`/api/v1/files/${fileId}`);
    return response.data;
  }

  async getOcrConfig() {
    // Always use real PDF service directly, never mock
    const response = await pdfServiceClient.get('/api/v1/ocr/config');
    return response.data;
  }

  // Utility methods
  setUseMock(useMock) {
    this.useMock = useMock;
  }

  getUseMock() {
    return this.useMock;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 