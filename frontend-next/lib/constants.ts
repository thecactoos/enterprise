export const APP_NAME = 'Enterprise CRM';
export const APP_VERSION = '2.0.0';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cactoos.digital/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Auth Configuration
export const TOKEN_KEY = 'crm_token';
export const REFRESH_TOKEN_KEY = 'crm_refresh_token';
export const AUTH_HEADER = 'Authorization';

// Query Keys
export const QUERY_KEYS = {
  // Auth
  me: ['auth', 'me'] as const,
  
  // Contacts
  contacts: ['contacts'] as const,
  contact: (id: string) => ['contacts', id] as const,
  
  // Products
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  
  // Quotes
  quotes: ['quotes'] as const,
  quote: (id: string) => ['quotes', id] as const,
  
  // Invoices
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
  
  // Notes
  notes: ['notes'] as const,
  note: (id: string) => ['notes', id] as const,
  
  // Services
  services: ['services'] as const,
  service: (id: string) => ['services', id] as const,
} as const;

// Polish Language Constants
export const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export const CONTACT_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  BUSINESS: 'BUSINESS',
} as const;

export const INVOICE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];