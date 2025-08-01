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

  async getRecentContacts() {
    const response = await this.get('/contacts', { 
      sortBy: 'createdAt', 
      sortOrder: 'DESC', 
      limit: 10 
    });
    return response.data;
  }

  async getRecentClients() {
    const response = await this.get('/contacts/clients', { 
      sortBy: 'clientSince', 
      sortOrder: 'DESC', 
      limit: 10 
    });
    return response.data;
  }

  async getRecentLeads() {
    const response = await this.get('/contacts/leads', { 
      sortBy: 'createdAt', 
      sortOrder: 'DESC', 
      limit: 10 
    });
    return response.data;
  }

  async getRecentNotes() {
    const response = await this.get('/notes', { 
      sortBy: 'createdAt', 
      sortOrder: 'DESC', 
      limit: 10 
    });
    return response.data;
  }

  // Legacy Client methods - Updated to use contacts API
  // These methods are deprecated, use getClients() and getClient() instead
  async getLegacyClients() {
    // Return clients from contacts API
    return await this.getClients();
  }

  async getLegacyClient(id) {
    // Return client from contacts API
    return await this.getClient(id);
  }

  async createClient(clientData) {
    // Create as client type in contacts
    const response = await this.post('/contacts', { ...clientData, type: 'client' });
    return response.data;
  }

  async updateClient(id, clientData) {
    const response = await this.put(`/contacts/${id}`, clientData);
    return response.data;
  }

  async deleteClient(id) {
    const response = await this.delete(`/contacts/${id}`);
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

  // Product methods - Updated for API Gateway integration
  async getProducts(params = {}) {
    const response = await this.get('/api/products', params);
    return response.data;
  }

  async getProduct(id) {
    const response = await this.get(`/api/products/${id}`);
    return response.data;
  }

  async getProductByCode(productCode) {
    const response = await this.get(`/api/products/code/${productCode}`);
    return response.data;
  }

  async getProductStats() {
    const response = await this.get('/api/products/stats');
    return response.data;
  }

  async searchProducts(params = {}) {
    const response = await this.get('/api/products', params);
    return response.data;
  }

  async searchProductsByDimensions(dimensions) {
    const response = await this.get('/api/products/search/dimensions', dimensions);
    return response.data;
  }

  // Contact methods - Updated for unified contacts API
  async getContacts(params = {}) {
    const response = await this.get('/contacts', params);
    return response.data;
  }

  async getContact(id) {
    const response = await this.get(`/contacts/${id}`);
    return response.data;
  }

  async createContact(contactData) {
    const response = await this.post('/contacts', contactData);
    return response.data;
  }

  async updateContact(id, contactData) {
    const response = await this.put(`/contacts/${id}`, contactData);
    return response.data;
  }

  async deleteContact(id) {
    const response = await this.delete(`/contacts/${id}`);
    return response.data;
  }

  // Lead-specific methods (using contacts API with lead filtering)
  async getLeads(params = {}) {
    const response = await this.get('/contacts/leads', params);
    return response.data;
  }

  async getLead(id) {
    const contact = await this.getContact(id);
    // Only return if it's a lead
    if (contact.type === 'lead') {
      return contact;
    }
    throw new Error('Contact is not a lead');
  }

  async createLead(leadData) {
    // Ensure type is set to lead
    const response = await this.post('/contacts', { ...leadData, type: 'lead' });
    return response.data;
  }

  async updateLead(id, leadData) {
    const response = await this.put(`/contacts/${id}`, leadData);
    return response.data;
  }

  async deleteLead(id) {
    const response = await this.delete(`/contacts/${id}`);
    return response.data;
  }

  async updateLeadStatus(id, status) {
    const response = await this.put(`/contacts/${id}`, { status });
    return response.data;
  }

  async getLeadsByStatus(status) {
    const response = await this.get('/contacts/leads', { status });
    return response.data;
  }

  async getLeadsBySource(source) {
    const response = await this.get('/contacts/leads', { source });
    return response.data;
  }

  async getLeadsByPriority(priority) {
    const response = await this.get('/contacts/leads', { priority });
    return response.data;
  }

  async getLeadsByType(leadType) {
    const response = await this.get('/contacts/leads', { leadType });
    return response.data;
  }

  async searchLeads(query) {
    const response = await this.get('/contacts/leads', { search: query });
    return response.data;
  }

  async getLeadStatistics() {
    const response = await this.get('/contacts/leads/stats');
    return response.data;
  }

  async convertLeadToClient(id, purchaseAmount = null) {
    const data = purchaseAmount ? { purchaseAmount } : {};
    const response = await this.post(`/contacts/leads/${id}/convert`, data);
    return response.data;
  }

  async bulkUpdateLeadStatus(leadIds, status) {
    const response = await this.post('/contacts/bulk-action', { 
      contactIds: leadIds, 
      action: 'updateStatus', 
      data: { status } 
    });
    return response.data;
  }

  async getLeadsByDateRange(startDate, endDate) {
    const response = await this.get('/contacts/leads', { 
      startDate, 
      endDate 
    });
    return response.data;
  }

  async getTopLeadsByScore(limit = 10) {
    const response = await this.get('/contacts/leads', { 
      sortBy: 'qualificationScore', 
      sortOrder: 'DESC', 
      limit 
    });
    return response.data;
  }

  async getLeadConversionFunnel() {
    const response = await this.get('/contacts/leads/funnel-stats');
    return response.data;
  }

  async getLeadsByCity(city) {
    const response = await this.get('/contacts/leads', { city });
    return response.data;
  }

  async getLeadsByVoivodeship(voivodeship) {
    const response = await this.get('/contacts/leads', { voivodeship });
    return response.data;
  }

  async getLeadsByBudgetRange(minBudget, maxBudget) {
    const response = await this.get('/contacts/leads', { 
      minValue: minBudget, 
      maxValue: maxBudget 
    });
    return response.data;
  }

  async updateLeadQualificationScore(id) {
    const response = await this.put(`/contacts/leads/${id}/qualify`, {});
    return response.data;
  }

  async scheduleLeadFollowUp(id, date) {
    const response = await this.put(`/contacts/leads/${id}/follow-up`, { 
      nextFollowUpDate: date 
    });
    return response.data;
  }

  async markLeadAsLost(id, reason) {
    const response = await this.put(`/contacts/${id}`, { 
      status: 'lost', 
      lostReason: reason,
      lostAt: new Date().toISOString()
    });
    return response.data;
  }

  // Client-specific methods (new functionality)
  async getClients(params = {}) {
    const response = await this.get('/contacts/clients', params);
    return response.data;
  }

  async getClient(id) {
    const contact = await this.getContact(id);
    // Only return if it's a client
    if (contact.type === 'client') {
      return contact;
    }
    throw new Error('Contact is not a client');
  }

  async getClientStatistics() {
    const response = await this.get('/contacts/clients/stats');
    return response.data;
  }

  async getHighValueClients(minValue = 50000) {
    const response = await this.get('/contacts/clients/high-value', { minValue });
    return response.data;
  }

  async recordClientPurchase(id, purchaseData) {
    const response = await this.post(`/contacts/clients/${id}/purchase`, purchaseData);
    return response.data;
  }

  // ========================================
  // QUOTES METHODS - NEW MICROSERVICE
  // ========================================

  // Quote methods - API Gateway integration
  async getQuotes(params = {}) {
    const response = await this.get('/quotes', params);
    return response.data;
  }

  async getQuote(id) {
    const response = await this.get(`/quotes/${id}`);
    return response.data;
  }

  async createQuote(quoteData) {
    const response = await this.post('/quotes', quoteData);
    return response.data;
  }

  async updateQuote(id, quoteData) {
    const response = await this.put(`/quotes/${id}`, quoteData);
    return response.data;
  }

  async deleteQuote(id) {
    const response = await this.delete(`/quotes/${id}`);
    return response.data;
  }

  async updateQuoteStatus(id, status) {
    const response = await this.put(`/quotes/${id}/status`, { status });
    return response.data;
  }

  async getQuotesByStatus(status) {
    const response = await this.get('/quotes', { status });
    return response.data;
  }

  async getQuotesByContact(contactId) {
    const response = await this.get('/quotes', { contactId });
    return response.data;
  }

  async getQuoteStatistics() {
    const response = await this.get('/quotes/stats');
    return response.data;
  }

  async generateQuotePDF(id) {
    const response = await this.get(`/quotes/${id}/pdf`, {}, {
      responseType: 'blob'
    });
    return response.data;
  }

  async sendQuoteEmail(id, emailData) {
    const response = await this.post(`/quotes/${id}/send-email`, emailData);
    return response.data;
  }

  async duplicateQuote(id) {
    const response = await this.post(`/quotes/${id}/duplicate`);
    return response.data;
  }

  async convertQuoteToOrder(id) {
    const response = await this.post(`/quotes/${id}/convert-to-order`);
    return response.data;
  }

  async addQuoteItem(quoteId, itemData) {
    const response = await this.post(`/quotes/${quoteId}/items`, itemData);
    return response.data;
  }

  async updateQuoteItem(quoteId, itemId, itemData) {
    const response = await this.put(`/quotes/${quoteId}/items/${itemId}`, itemData);
    return response.data;
  }

  async removeQuoteItem(quoteId, itemId) {
    const response = await this.delete(`/quotes/${quoteId}/items/${itemId}`);
    return response.data;
  }

  async getQuoteRevisions(id) {
    const response = await this.get(`/quotes/${id}/revisions`);
    return response.data;
  }

  async createQuoteRevision(id, revisionData) {
    const response = await this.post(`/quotes/${id}/revisions`, revisionData);
    return response.data;
  }

  // Mock lead methods - for development
  async getMockLeads() {
    const response = await this.get('/mock-leads');
    return response.data;
  }

  async getMockLeadById(id) {
    const response = await this.get(`/mock-leads/${id}`);
    return response.data;
  }

  async getMockLeadsByStatus(status) {
    const response = await this.get(`/mock-leads/by-status/${status}`);
    return response.data;
  }

  async getMockLeadsBySource(source) {
    const response = await this.get(`/mock-leads/by-source/${source}`);
    return response.data;
  }

  async getMockLeadsByPriority(priority) {
    const response = await this.get(`/mock-leads/by-priority/${priority}`);
    return response.data;
  }

  async getMockLeadsByType(leadType) {
    const response = await this.get(`/mock-leads/by-type/${leadType}`);
    return response.data;
  }

  async getMockLeadStatistics() {
    const response = await this.get('/mock-leads/statistics');
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