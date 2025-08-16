# API Integrations - Phase 3 Frontend

## Overview
Comprehensive documentation of frontend-backend API integration points for the advanced pricing management system, including mock data fallbacks and error handling strategies.

## Integration Architecture

### Dual-Mode API Service
The frontend implements a smart API service that switches between mock and real data:

```javascript
// api.service.js pattern
class ApiService {
  constructor() {
    this.useMock = config.mock.enabled;
    this.mockDelay = config.mock.delay;
  }

  async request(method, endpoint, data = null, options = {}) {
    if (this.useMock) {
      return this.mockRequest(method, endpoint, data, options);
    } else {
      return this.realRequest(method, endpoint, data, options);
    }
  }
}
```

### Authentication Integration
All API calls include JWT token authentication with automatic refresh:

```javascript
// Proactive token refresh in API interceptor
apiClient.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('token');
  
  if (token && isTokenExpired(token)) {
    try {
      const refreshResponse = await refreshClient.post('/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      token = refreshResponse.data.access_token;
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## API Endpoints Integration

### 1. Products API Integration

#### Endpoint Mapping:
- **GET** `/api/products` - Product catalog with pagination and search
- **GET** `/api/products/:id` - Individual product details
- **PUT** `/api/products/:id` - Update product pricing
- **GET** `/api/products/stats` - Product pricing statistics

#### Frontend Integration:
```javascript
// PricingManagement.js - Products data loading
const fetchPricingData = async () => {
  try {
    const [products, services, quotes] = await Promise.all([
      apiService.getProducts({ limit: 5 }).catch(() => ({ data: [], total: 0 })),
      Promise.resolve({ data: [], total: 0 }), // Services API future implementation
      apiService.getQuotes({ limit: 5 }).catch(() => ({ quotes: [], total: 0 })),
    ]);

    // Calculate average margin from products
    const productsData = Array.isArray(products) ? products : (products.data || []);
    const avgMargin = productsData.length > 0 
      ? productsData.reduce((sum, product) => {
          const purchase = parseFloat(product.purchase_price_per_unit) || 0;
          const selling = parseFloat(product.selling_price_per_unit) || 0;
          return sum + (purchase > 0 ? ((selling - purchase) / purchase * 100) : 0);
        }, 0) / productsData.length
      : 0;

    setPricingStats({
      totalServices: services.total || 0,
      activeProducts: products.total || productsData.length,
      pendingQuotes: quotes.total || 0,
      avgMargin: avgMargin,
      lastUpdated: new Date(),
      recentActivity: generateMockActivity()
    });
  } catch (error) {
    logError(error, 'Pricing dashboard data fetch');
    setError(handleApiError(error).message);
  }
};
```

#### Mock Data Implementation:
```javascript
// mock-data.service.js - Products mock data
const mockProducts = [
  {
    id: '1',
    product_code: 'FL001',
    product_name: 'Deska podłogowa dębowa 14x120x1200mm',
    category: 'flooring',
    purchase_price_per_unit: 25.50,
    selling_price_per_unit: 32.75,
    retail_price_per_unit: 45.85,
    selling_unit: 'm²',
    supplier: 'Supplier A',
    margin_percentage: 28.5
  }
  // ... more products
];

// Product search with Polish context
const searchProducts = (query, category) => {
  return mockProducts.filter(product => 
    (!query || 
     product.product_name.toLowerCase().includes(query.toLowerCase()) ||
     product.product_code.toLowerCase().includes(query.toLowerCase())) &&
    (!category || category === 'all' || product.category === category)
  );
};
```

### 2. Quotes API Integration

#### Endpoint Mapping:
- **GET** `/api/v1/quotes` - Quote list with filtering and pagination
- **POST** `/api/v1/quotes` - Create new quote
- **GET** `/api/v1/quotes/:id` - Individual quote details
- **PUT** `/api/v1/quotes/:id` - Update quote
- **POST** `/api/v1/quotes/:id/items` - Add item to quote
- **DELETE** `/api/v1/quotes/:id/items/:itemId` - Remove item from quote

#### Advanced Quote Builder Integration:
```javascript
// AdvancedQuoteBuilder.js - Save quote functionality
const handleSaveQuote = async () => {
  if (quoteItems.length === 0) {
    setError('Dodaj pozycje do oferty przed zapisaniem');
    return;
  }

  try {
    const quoteData = {
      title: quoteTitle || 'Nowa Oferta',
      contactId: selectedContact?.id,
      items: quoteItems.map(item => ({
        type: item.type,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0
      })),
      totalNet: calculations.netTotal,
      totalGross: calculations.grossTotal,
      globalDiscount,
      notes: quoteNotes
    };

    await apiService.createQuote(quoteData);
    
    if (onSave) {
      onSave(quoteData);
    }
  } catch (error) {
    logError(error, 'Save quote');
    setError(handleApiError(error).message);
  }
};
```

#### Quote Calculation Logic:
```javascript
// Real-time calculation with Polish VAT
const calculateTotals = useCallback(async () => {
  setIsCalculating(true);
  
  await new Promise(resolve => setTimeout(resolve, 100)); // Visual feedback
  
  let subtotal = 0;
  const breakdown = [];
  
  quoteItems.forEach(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscountAmount = item.discount ? (itemTotal * item.discount / 100) : 0;
    const itemNet = itemTotal - itemDiscountAmount;
    
    subtotal += itemNet;
    breakdown.push({
      label: `${item.name} (${item.quantity} ${item.unit})`,
      amount: itemNet
    });
  });
  
  const globalDiscountAmount = subtotal * (globalDiscount / 100);
  const netTotal = subtotal - globalDiscountAmount;
  const vatAmount = calculateVAT(netTotal); // 23% Polish VAT
  const grossTotal = calculateGrossAmount(netTotal);
  
  setCalculations({
    subtotal, discountAmount: globalDiscountAmount,
    netTotal, vatAmount, grossTotal, breakdown
  });
  
  setIsCalculating(false);
}, [quoteItems, globalDiscount]);
```

### 3. Contacts API Integration

#### Endpoint Mapping:
- **GET** `/contacts` - Contact list with filtering
- **GET** `/contacts/:id` - Individual contact details
- **POST** `/contacts` - Create new contact
- **PUT** `/contacts/:id` - Update contact information

#### Contact Integration in Quotes:
```javascript
// AdvancedQuoteBuilder.js - Contact data loading
useEffect(() => {
  const loadData = async () => {
    try {
      const [productsData, contactData] = await Promise.all([
        apiService.getProducts({ limit: 100 }).catch(() => ({ data: [] })),
        contactId ? apiService.getContact(contactId).catch(() => null) : Promise.resolve(null),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : (productsData.data || []));
      setSelectedContact(contactData);
      
      if (contactData) {
        setQuoteTitle(`Oferta dla ${contactData.firstName} ${contactData.lastName}`);
      }
      
    } catch (error) {
      logError(error, 'Quote builder data load');
      setError(handleApiError(error).message);
    }
  };

  loadData();
}, [contactId]);
```

#### Invoice Generator Contact Integration:
```javascript
// InvoiceGenerator.js - Auto-populate buyer data
useEffect(() => {
  if (quote?.contact && open) {
    const contact = quote.contact;
    setInvoiceData(prev => ({
      ...prev,
      buyer: {
        name: `${contact.firstName} ${contact.lastName}`,
        address: contact.address || '',
        nip: contact.nip || '',
        isCompany: contact.businessType === 'b2b' || !!contact.company
      }
    }));
  }
}, [quote, open]);
```

### 4. Services API Integration (Future Implementation)

#### Planned Endpoint Mapping:
- **GET** `/api/services` - Services catalog with pricing tiers
- **GET** `/api/services/:id` - Individual service details
- **PUT** `/api/services/:id/pricing` - Update service pricing tiers
- **GET** `/api/services/recommendations` - Service recommendations based on products

#### Current Mock Implementation:
```javascript
// PricingManagement.js - Services placeholder
const fetchPricingData = async () => {
  const [products, services, quotes] = await Promise.all([
    apiService.getProducts({ limit: 5 }).catch(() => ({ data: [], total: 0 })),
    // Services will be implemented in future phase
    Promise.resolve({ data: [], total: 0 }),
    apiService.getQuotes({ limit: 5 }).catch(() => ({ quotes: [], total: 0 })),
  ]);
  // ... rest of implementation
};
```

## Error Handling Strategy

### Centralized Error Handling
All components use the existing error handling infrastructure:

```javascript
// utils/errorHandler.js integration
import { handleApiError, logError } from '../utils/errorHandler';

// Consistent error handling pattern
try {
  const result = await apiService.someOperation();
  // Handle success
} catch (error) {
  logError(error, 'Operation description');
  const errorInfo = handleApiError(error);
  setError(errorInfo.message);
  
  if (errorInfo.shouldRedirect) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
```

### Component-Level Error States
```javascript
// LoadingErrorState integration pattern
<LoadingErrorState
  loading={loading}
  error={error}
  onRetry={() => window.location.reload()}
  loadingText="Ładowanie panelu zarządzania cenami..."
  errorTitle="Błąd ładowania danych cenowych"
>
  {/* Component content */}
</LoadingErrorState>
```

### API Error Recovery
```javascript
// Graceful degradation pattern
const [products, services, quotes] = await Promise.all([
  apiService.getProducts({ limit: 5 }).catch(() => ({ data: [], total: 0 })),
  apiService.getServices({ limit: 5 }).catch(() => ({ data: [], total: 0 })),
  apiService.getQuotes({ limit: 5 }).catch(() => ({ quotes: [], total: 0 })),
]);

// System continues to function even if some APIs fail
```

## Mock Data vs Real API Implementation

### Development Mode Toggle
Components support toggling between mock and real data:

```javascript
// DevTools component integration
const toggleMockData = () => {
  apiService.setUseMock(!apiService.getUseMock());
  window.location.reload();
};

// Environment configuration
const config = {
  mock: {
    enabled: process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true',
    delay: 300 // Simulate network delay
  }
};
```

### Mock Data Quality
Mock data includes realistic Polish business scenarios:

```javascript
// Polish business mock data
const mockContacts = [
  {
    id: '1',
    firstName: 'Jan',
    lastName: 'Kowalski',
    company: 'Kowalski Budownictwo Sp. z o.o.',
    nip: '123-456-78-90',
    address: 'ul. Budowlana 15\n00-001 Warszawa',
    businessType: 'b2b',
    voivodeship: 'mazowieckie'
  }
  // ... more realistic Polish contacts
];

const mockQuotes = [
  {
    id: 'Q-2024-001',
    title: 'Oferta podłóg dla mieszkania 85m²',
    contactId: '1',
    totalNet: 8500.00,
    totalGross: 10455.00,
    status: 'draft',
    items: [
      {
        type: 'product',
        itemId: 'FL001',
        name: 'Deska podłogowa dębowa',
        quantity: 85,
        unitPrice: 32.75,
        discount: 0
      }
    ]
  }
  // ... more realistic quotes
];
```

## Loading States and User Feedback

### Loading State Implementation
```javascript
// Consistent loading patterns
const [loading, setLoading] = useState(true);
const [isCalculating, setIsCalculating] = useState(false);

// Visual feedback for calculations
if (isCalculating) {
  return (
    <Box display="flex" alignItems="center" gap={1} color="primary.main">
      <CircularProgress size={16} />
      <Typography variant="caption">
        Przeliczanie...
      </Typography>
    </Box>
  );
}
```

### Progress Indicators
```javascript
// Real-time calculation feedback
const calculateTotals = useCallback(async () => {
  setIsCalculating(true);
  
  // Add small delay for visual feedback
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Perform calculations...
  
  setIsCalculating(false);
}, [quoteItems, globalDiscount]);
```

## Data Validation and Sanitization

### Client-Side Validation
```javascript
// Polish business validation
const validateNIP = (nip) => {
  const digits = nip.replace(/\D/g, '');
  if (digits.length !== 10) return false;
  
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = digits
    .slice(0, 9)
    .split('')
    .reduce((sum, digit, index) => sum + parseInt(digit) * weights[index], 0);
  
  return checksum % 11 === parseInt(digits[9]);
};

// Form validation
const handleSaveQuote = async () => {
  if (quoteItems.length === 0) {
    setError('Dodaj pozycje do oferty przed zapisaniem');
    return;
  }
  
  // Additional validation...
};
```

### Data Sanitization
```javascript
// Remove empty fields before API calls
const cleanedForm = { ...contactForm };
if (!cleanedForm.email || cleanedForm.email.trim() === '') {
  delete cleanedForm.email;
}
if (!cleanedForm.phone || cleanedForm.phone.trim() === '') {
  delete cleanedForm.phone;
}

await apiService.createContact(cleanedForm);
```

## Performance Optimization

### API Call Optimization
```javascript
// Debounced search to reduce API calls
useEffect(() => {
  const timer = setTimeout(() => {
    handleSearch(searchQuery);
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery, searchCategory]);

// Parallel API calls
const [products, contacts, quotes] = await Promise.all([
  apiService.getProducts({ limit: 10 }),
  apiService.getContacts({ limit: 5 }),
  apiService.getQuotes({ limit: 5 }),
]);
```

### Caching Strategy
```javascript
// Simple caching for frequently accessed data
const [cachedProducts, setCachedProducts] = useState(null);

const loadProducts = async () => {
  if (cachedProducts && Date.now() - cachedProducts.timestamp < 300000) {
    return cachedProducts.data;
  }
  
  const products = await apiService.getProducts();
  setCachedProducts({
    data: products,
    timestamp: Date.now()
  });
  
  return products;
};
```

## Security Considerations

### API Security
- **Authentication**: JWT tokens with automatic refresh
- **Authorization**: Role-based access control respected in UI
- **Input Validation**: Client-side and server-side validation
- **XSS Prevention**: Material UI components provide built-in protection

### Data Privacy
- **Sensitive Data**: No logging of financial or personal data
- **Token Storage**: Secure token storage in localStorage with expiration
- **API Endpoints**: HTTPS required for production
- **Error Messages**: Generic error messages to prevent information disclosure

## Testing Strategy

### API Integration Testing
```javascript
// Mock API responses for testing
const mockApiService = {
  getProducts: jest.fn().mockResolvedValue({ data: mockProducts }),
  createQuote: jest.fn().mockResolvedValue({ id: 'Q-123' }),
  getContact: jest.fn().mockResolvedValue(mockContact)
};

// Test component with mocked API
test('should load products and display pricing stats', async () => {
  render(<PricingManagement />);
  
  await waitFor(() => {
    expect(screen.getByText(/produkty/i)).toBeInTheDocument();
  });
  
  expect(mockApiService.getProducts).toHaveBeenCalledWith({ limit: 5 });
});
```

### Error Handling Testing
```javascript
// Test error scenarios
test('should handle API errors gracefully', async () => {
  mockApiService.getProducts.mockRejectedValue(new Error('API Error'));
  
  render(<PricingManagement />);
  
  await waitFor(() => {
    expect(screen.getByText(/błąd ładowania/i)).toBeInTheDocument();
  });
});
```

## Future API Enhancements

### Planned Integrations
1. **Services API**: Complete service management endpoints
2. **Invoice API**: PDF generation and email sending
3. **Analytics API**: Pricing trends and margin analysis
4. **Notification API**: Real-time pricing alerts
5. **File Upload API**: Product images and document attachments

### WebSocket Integration
```javascript
// Future real-time updates
const useRealtimePricing = () => {
  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/pricing-updates');
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'price_change') {
        updateProductPrice(update.productId, update.newPrice);
      }
    };
    
    return () => ws.close();
  }, []);
};
```

This comprehensive API integration strategy ensures reliable, performant, and user-friendly interaction with the backend services while maintaining Polish business context and providing excellent error handling and recovery mechanisms.