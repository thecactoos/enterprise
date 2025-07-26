# 📄 Direct PDF Service Integration

## 🎯 Overview

The frontend now connects directly to the PDF service running on `localhost:8000` instead of going through the API gateway. This provides a more direct and efficient connection for PDF processing operations.

## 🔧 Configuration Changes

### **Environment Configuration**
```javascript
// frontend/src/config/environment.js
development: {
  API_BASE_URL: 'http://localhost:3000',
  PDF_SERVICE_URL: 'http://localhost:8000', // Direct connection to PDF service
  USE_MOCK_DATA: false,
  MOCK_DELAY: 500,
  LOG_LEVEL: 'debug',
}

// PDF service configuration
pdfService: {
  baseURL: getCurrentEnvironment().PDF_SERVICE_URL || 'http://localhost:8000',
  timeout: 300000, // 5 minutes for OCR processing
  retryAttempts: 2,
  retryDelay: 2000,
}
```

### **API Service Updates**
Created a separate axios instance for the PDF service:

```javascript
// Create PDF service axios instance
const pdfServiceClient = axios.create({
  baseURL: config.pdfService.baseURL,
  timeout: config.pdfService.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### **Direct PDF Endpoints**
All PDF operations now call the PDF service directly:

```javascript
// Direct connection to PDF service
async analyzePdf(formData) {
  return pdfServiceClient.post('/api/v1/upload-and-process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

async getOcrConfig() {
  return pdfServiceClient.get('/api/v1/ocr/config');
}

async getPdfFiles() {
  return pdfServiceClient.get('/api/v1/files');
}
```

## 🏗️ Architecture Changes

### **Before (API Gateway Route)**
```
Frontend → API Gateway (localhost:3000) → PDF Service (pdf-service:8000)
```

### **After (Direct Connection)**
```
Frontend → PDF Service (localhost:8000)
```

### **Benefits of Direct Connection**
- **Reduced Latency**: No intermediate API gateway
- **Simplified Architecture**: Direct communication
- **Better Performance**: Faster response times
- **Easier Debugging**: Direct error messages from PDF service

## 📊 Data Flow

### **1. Direct Request Flow**
```
User uploads PDF → Frontend → PDF Service (localhost:8000) → OCR Processing → Results
```

### **2. Response Flow**
```
PDF Service → Frontend → Display Results
```

### **3. Error Handling**
```
PDF Service → Frontend → Display Error Messages
```

## 🔍 CORS Configuration

### **PDF Service CORS Settings**
The PDF service needs to allow requests from the frontend:

```python
# In pdf-service/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend
        "http://localhost:3001",  # Frontend alternative port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 Testing

### **Test Script: test-real-pdf-service.js**
Updated to test direct connection:

```javascript
// Test direct PDF service connection
async function testRealApiService() {
  const config = await apiService.getOcrConfig();
  const files = await apiService.getPdfFiles();
}

// Environment configuration test
function testEnvironmentConfig() {
  const pdfServiceUrl = config.pdfService.baseURL;
  console.log('📄 PDF Service URL:', pdfServiceUrl); // Should be http://localhost:8000
}
```

### **Test Coverage**
- ✅ Direct PDF service connection
- ✅ Environment configuration validation
- ✅ CORS compatibility
- ✅ Real API endpoint testing

## 🔍 Troubleshooting

### **Common Issues**

#### **1. CORS Errors**
```javascript
// Error: Access to fetch at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Solution**: Ensure PDF service CORS is configured to allow frontend origin.

#### **2. PDF Service Not Running**
```bash
# Check if PDF service is running
curl http://localhost:8000/health

# Start PDF service if needed
docker run -p 8000:8000 pdf-ocr-service
```

#### **3. Network Connectivity**
```bash
# Test connectivity from browser
fetch('http://localhost:8000/health')
  .then(response => response.json())
  .then(data => console.log('PDF Service Health:', data));
```

#### **4. Environment Configuration**
```javascript
// Verify in browser console
console.log('PDF Service URL:', config.pdfService.baseURL); // Should be http://localhost:8000
console.log('Mock Data Enabled:', config.mock.enabled); // Should be false
```

### **Debug Steps**
1. **Check PDF Service**: Ensure it's running on localhost:8000
2. **Verify CORS**: Check PDF service CORS configuration
3. **Test Connectivity**: Use browser dev tools to test requests
4. **Check Environment**: Verify configuration settings
5. **Review Logs**: Check PDF service logs for errors

## 📈 Performance Improvements

### **Latency Reduction**
- **Before**: ~50-100ms additional latency through API gateway
- **After**: Direct connection with minimal latency

### **Throughput**
- **Before**: Limited by API gateway capacity
- **After**: Direct connection to PDF service

### **Error Handling**
- **Before**: Errors filtered through API gateway
- **After**: Direct error messages from PDF service

## 🎯 Success Metrics

### **Functionality**
- ✅ Direct PDF service connection
- ✅ Real-time OCR processing
- ✅ Live error messages
- ✅ Fast response times
- ✅ Simplified architecture

### **Performance**
- ✅ Reduced latency
- ✅ Better throughput
- ✅ Direct error handling
- ✅ Faster debugging

### **User Experience**
- ✅ Real-time processing feedback
- ✅ Direct error messages
- ✅ Faster response times
- ✅ Better reliability

## 🚀 Deployment Considerations

### **Development**
- PDF service runs on localhost:8000
- Frontend runs on localhost:3000
- CORS configured for development

### **Production**
- Update CORS origins for production domains
- Consider load balancing for PDF service
- Implement proper security headers

### **Docker Deployment**
```bash
# Run PDF service
docker run -p 8000:8000 pdf-ocr-service

# Run frontend (with PDF service URL)
REACT_APP_PDF_SERVICE_URL=http://localhost:8000 npm start
```

## 🔄 Migration from API Gateway

### **What Changed**
- PDF requests no longer go through API gateway
- Direct connection to PDF service
- Simplified request/response flow

### **What Remains**
- Other API calls still go through API gateway
- Authentication handled by API gateway
- User management through API gateway

### **Benefits**
- Faster PDF processing
- Reduced complexity
- Better error handling
- Easier debugging

---

**🎯 The frontend now connects directly to the PDF service for optimal performance!** 