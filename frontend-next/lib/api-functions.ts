// Pure API functions - używane przez React Query jako "fetchers"
// React Query zarządza stanem, cache'em i synchronizacją

import apiClient from './api-client';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Contact, 
  Product, 
  Quote, 
  Invoice, 
  Note, 
  Service,
  LoginCredentials,
  AuthResponse 
} from '../types/api';

// =============================================================================
// AUTH API FUNCTIONS
// =============================================================================

export const authApi = {
  // Login - zwraca Promise z danymi
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/auth/login', credentials);
    
    // Map API response to expected format
    const apiResponse = data.data;
    const authResponse: AuthResponse = {
      accessToken: apiResponse.access_token,
      refreshToken: apiResponse.refresh_token,
      user: apiResponse.user,
      expiresIn: apiResponse.expires_in || 86400 // Default 24 hours
    };
    
    console.log('Auth API - Login response mapped:', {
      originalAccessToken: apiResponse.access_token?.slice(0, 20) + '...',
      mappedAccessToken: authResponse.accessToken?.slice(0, 20) + '...',
      hasUser: !!authResponse.user,
      userEmail: authResponse.user?.email
    });
    
    return authResponse;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  // Register
  register: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> => {
    const { data } = await apiClient.post<ApiResponse<User>>('/auth/register', userData);
    return data.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

// =============================================================================
// CONTACTS API FUNCTIONS
// =============================================================================

export interface ContactsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'INDIVIDUAL' | 'BUSINESS';
  isActive?: boolean;
}

export const contactsApi = {
  // Get all contacts with pagination and filters
  getContacts: async (params?: ContactsParams): Promise<PaginatedResponse<Contact>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Contact>>>('/contacts', { params });
    return data.data;
  },

  // Get single contact
  getContact: async (id: string): Promise<Contact> => {
    const { data } = await apiClient.get<ApiResponse<Contact>>(`/contacts/${id}`);
    return data.data;
  },

  // Create contact
  createContact: async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
    const { data } = await apiClient.post<ApiResponse<Contact>>('/contacts', contactData);
    return data.data;
  },

  // Update contact
  updateContact: async ({ id, ...contactData }: Partial<Contact> & { id: string }): Promise<Contact> => {
    const { data } = await apiClient.put<ApiResponse<Contact>>(`/contacts/${id}`, contactData);
    return data.data;
  },

  // Delete contact
  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};

// =============================================================================
// PRODUCTS API FUNCTIONS
// =============================================================================

export interface ProductsParams {
  page?: number;
  limit?: number;  // Changed from pageSize to match backend API
  offset?: number; // Added to match backend API
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export const productsApi = {
  // Get all products - Returns direct array for search, paginated for full listing
  getProducts: async (params?: ProductsParams): Promise<Product[]> => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    return data.data;
  },

  // Get single product
  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  // Get product by code
  getProductByCode: async (code: string): Promise<Product> => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/code/${code}`);
    return data.data;
  },

  // Create product
  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/products', productData);
    return data.data;
  },

  // Update product
  updateProduct: async ({ id, ...productData }: Partial<Product> & { id: string }): Promise<Product> => {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, productData);
    return data.data;
  },

  // Delete product
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};

// =============================================================================
// QUOTES API FUNCTIONS  
// =============================================================================

export interface QuotesParams {
  page?: number;
  pageSize?: number;
  contactId?: string;
  status?: Quote['status'];
  dateFrom?: string;
  dateTo?: string;
}

export const quotesApi = {
  // Get all quotes
  getQuotes: async (params?: QuotesParams): Promise<PaginatedResponse<Quote>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Quote>>>('/quotes', { params });
    return data.data;
  },

  // Get single quote
  getQuote: async (id: string): Promise<Quote> => {
    const { data } = await apiClient.get<ApiResponse<Quote>>(`/quotes/${id}`);
    return data.data;
  },

  // Create quote
  createQuote: async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>): Promise<Quote> => {
    const { data } = await apiClient.post<ApiResponse<Quote>>('/quotes', quoteData);
    return data.data;
  },

  // Update quote
  updateQuote: async ({ id, ...quoteData }: Partial<Quote> & { id: string }): Promise<Quote> => {
    const { data } = await apiClient.put<ApiResponse<Quote>>(`/quotes/${id}`, quoteData);
    return data.data;
  },

  // Delete quote
  deleteQuote: async (id: string): Promise<void> => {
    await apiClient.delete(`/quotes/${id}`);
  },

  // Generate PDF
  generateQuotePDF: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },
};

// =============================================================================
// SERVICES API FUNCTIONS
// =============================================================================

export const servicesApi = {
  // Get all services
  getServices: async (): Promise<Service[]> => {
    const { data } = await apiClient.get<ApiResponse<Service[]>>('/services');
    return data.data;
  },

  // Get single service
  getService: async (id: string): Promise<Service> => {
    const { data } = await apiClient.get<ApiResponse<Service>>(`/services/${id}`);
    return data.data;
  },
};

// =============================================================================
// NOTES API FUNCTIONS
// =============================================================================

export interface NotesParams {
  page?: number;
  pageSize?: number;
  contactId?: string;
  quoteId?: string;
  invoiceId?: string;
  search?: string;
}

export const notesApi = {
  // Get all notes
  getNotes: async (params?: NotesParams): Promise<PaginatedResponse<Note>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Note>>>('/notes', { params });
    return data.data;
  },

  // Get single note
  getNote: async (id: string): Promise<Note> => {
    const { data } = await apiClient.get<ApiResponse<Note>>(`/notes/${id}`);
    return data.data;
  },

  // Create note
  createNote: async (noteData: Omit<Note, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    const { data } = await apiClient.post<ApiResponse<Note>>('/notes', noteData);
    return data.data;
  },

  // Update note
  updateNote: async ({ id, ...noteData }: Partial<Note> & { id: string }): Promise<Note> => {
    const { data } = await apiClient.put<ApiResponse<Note>>(`/notes/${id}`, noteData);
    return data.data;
  },

  // Delete note
  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },
};