// Base API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  meta?: {
    service: string;
    version: string;
    [key: string]: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
}

// Contact Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  position?: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  nip?: string;
  regon?: string;
  address?: {
    street?: string;
    buildingNumber?: string;
    apartmentNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  price: number;
  currency: string;
  vat: number;
  imageUrl?: string;
  images?: string[];
  specifications?: Record<string, any>;
  tags?: string[];
  isActive: boolean;
  stock?: number;
  manufacturer?: string;
  createdAt: string;
  updatedAt: string;
}

// Quote Types
export interface Quote {
  id: string;
  quoteNumber: string;
  contactId: string;
  contact?: Contact;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  validUntil: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  id: string;
  productId?: string;
  product?: Product;
  serviceId?: string;
  service?: Service;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  tax: number;
  total: number;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  unit: string;
  currency: string;
  vat: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  contactId: string;
  contact?: Contact;
  quoteId?: string;
  quote?: Quote;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tax: number;
  total: number;
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string;
  contactId?: string;
  contact?: Contact;
  quoteId?: string;
  quote?: Quote;
  invoiceId?: string;
  invoice?: Invoice;
  tags?: string[];
  isPinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// OCR Types
export interface OCRResult {
  id: string;
  filename: string;
  text: string;
  pages: OCRPage[];
  lines: string[];
  uploadedByUserId: string;
  createdAt: string;
}

export interface OCRPage {
  page: number;
  text: string;
  textBlocks: OCRTextBlock[];
  imageDimensions: {
    width: number;
    height: number;
  };
}

export interface OCRTextBlock {
  text: string;
  confidence: number;
  coordinates: number[][];
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}