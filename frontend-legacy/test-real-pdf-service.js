// Test script for real PDF service integration
// Run this in the browser console to test the functionality

console.log('🧪 Testing Direct PDF Service Integration (localhost:8000)...');

// Test API Service with real endpoints
async function testRealApiService() {
  console.log('📡 Testing Real API Service...');
  
  try {
    // Test OCR config endpoint
    console.log('🔧 Testing OCR Config...');
    const config = await apiService.getOcrConfig();
    console.log('✅ OCR Config:', config);
    
    // Test files endpoint
    console.log('📁 Testing Files List...');
    const files = await apiService.getPdfFiles();
    console.log('✅ Files List:', files);
    
    return true;
  } catch (error) {
    console.error('❌ Real API Service Test Failed:', error);
    console.log('💡 Make sure:');
    console.log('   1. PDF service is running on localhost:8000');
    console.log('   2. CORS is enabled on the PDF service');
    console.log('   3. Frontend can access localhost:8000');
    return false;
  }
}

// Test PDF upload (without actual file)
async function testPdfUpload() {
  console.log('📤 Testing PDF Upload...');
  
  try {
    // Create a mock PDF file for testing
    const mockPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    const mockFile = new File([mockPdfContent], 'test.pdf', { 
      type: 'application/pdf' 
    });
    
    const formData = new FormData();
    formData.append('file', mockFile);
    
    console.log('📄 Mock PDF file created:', mockFile.name, mockFile.size, 'bytes');
    
    // Test upload and process
    console.log('🔄 Testing upload and process...');
    const result = await apiService.analyzePdf(formData);
    console.log('✅ PDF Analysis Result:', result);
    
    return true;
  } catch (error) {
    console.error('❌ PDF Upload Test Failed:', error);
    console.log('💡 This might be expected if the PDF service is not fully configured');
    return false;
  }
}

// Test component functionality
function testComponentFunctionality() {
  console.log('🧩 Testing Component Functionality...');
  
  try {
    // Check if PdfAnalyzer component exists
    const pdfAnalyzer = document.querySelector('[data-testid="pdf-analyzer"]');
    if (pdfAnalyzer) {
      console.log('✅ PdfAnalyzer component found');
    } else {
      console.log('⚠️ PdfAnalyzer component not found (may need data-testid)');
    }
    
    // Check for required elements
    const uploadButton = document.querySelector('input[type="file"]');
    const analyzeButton = document.querySelector('button[aria-label*="Analyze"]');
    const progressBars = document.querySelectorAll('.MuiLinearProgress-root');
    
    if (uploadButton) console.log('✅ File upload input found');
    if (analyzeButton) console.log('✅ Analyze button found');
    if (progressBars.length > 0) console.log('✅ Progress bars found');
    
    return true;
  } catch (error) {
    console.error('❌ Component Functionality Test Failed:', error);
    return false;
  }
}

// Test environment configuration
function testEnvironmentConfig() {
  console.log('⚙️ Testing Environment Configuration...');
  
  try {
    // Check if mock data is disabled
    const useMock = config.mock.enabled;
    console.log('📊 Mock Data Enabled:', useMock);
    
    if (!useMock) {
      console.log('✅ Mock data is disabled - using real API');
    } else {
      console.log('⚠️ Mock data is enabled - check environment configuration');
    }
    
    // Check API base URL
    const apiUrl = config.api.baseURL;
    console.log('🌐 API Base URL:', apiUrl);
    
    // Check PDF service URL
    const pdfServiceUrl = config.pdfService.baseURL;
    console.log('📄 PDF Service URL:', pdfServiceUrl);
    
    return !useMock; // Pass if mock data is disabled
  } catch (error) {
    console.error('❌ Environment Config Test Failed:', error);
    return false;
  }
}

// Run all tests
async function runRealServiceTests() {
  console.log('🚀 Starting Real PDF Service Integration Tests...\n');
  
  const results = {
    environmentConfig: testEnvironmentConfig(),
    apiService: await testRealApiService(),
    pdfUpload: await testPdfUpload(),
    componentFunctionality: testComponentFunctionality(),
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Real PDF service integration is working.');
    console.log('\n💡 Next steps:');
    console.log('   1. Upload a real PDF file using the interface');
    console.log('   2. Configure OCR settings if needed');
    console.log('   3. View the extracted text results');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure PDF service is running: docker run -p 8000:8000 pdf-ocr-service');
    console.log('   2. Check PDF service health: http://localhost:8000/health');
    console.log('   3. Verify environment config: USE_MOCK_DATA should be false');
    console.log('   4. Check CORS settings in PDF service');
  }
  
  return allPassed;
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runRealServiceTests);
  } else {
    runRealServiceTests();
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testRealApiService,
    testPdfUpload,
    testComponentFunctionality,
    testEnvironmentConfig,
    runRealServiceTests
  };
} 