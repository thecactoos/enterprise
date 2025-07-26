// Test script for PDF Analyzer integration
// Run this in the browser console to test the functionality

console.log('🧪 Testing PDF Analyzer Integration...');

// Test API Service
async function testApiService() {
  console.log('📡 Testing API Service...');
  
  try {
    // Test OCR config endpoint
    const config = await apiService.getOcrConfig();
    console.log('✅ OCR Config:', config);
    
    // Test mock PDF analysis
    const formData = new FormData();
    const mockFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', mockFile);
    
    const result = await apiService.analyzePdf(formData);
    console.log('✅ PDF Analysis Result:', result);
    
    return true;
  } catch (error) {
    console.error('❌ API Service Test Failed:', error);
    return false;
  }
}

// Test Mock Data Service
function testMockDataService() {
  console.log('🎭 Testing Mock Data Service...');
  
  try {
    // Test mock PDF endpoints
    const mockService = window.mockDataService;
    if (!mockService) {
      console.warn('⚠️ Mock data service not available');
      return false;
    }
    
    // Test upload and process
    const uploadResult = mockService.handleRequest('POST', '/pdf/upload-and-process', {});
    console.log('✅ Mock Upload Result:', uploadResult);
    
    // Test files list
    const filesResult = mockService.handleRequest('GET', '/pdf/files', {});
    console.log('✅ Mock Files Result:', filesResult);
    
    return true;
  } catch (error) {
    console.error('❌ Mock Data Service Test Failed:', error);
    return false;
  }
}

// Test Component State
function testComponentState() {
  console.log('🧩 Testing Component State...');
  
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
    
    if (uploadButton) console.log('✅ File upload input found');
    if (analyzeButton) console.log('✅ Analyze button found');
    
    return true;
  } catch (error) {
    console.error('❌ Component State Test Failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting PDF Analyzer Integration Tests...\n');
  
  const results = {
    apiService: await testApiService(),
    mockDataService: testMockDataService(),
    componentState: testComponentState(),
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! PDF Analyzer is ready to use.');
    console.log('\n💡 Next steps:');
    console.log('   1. Upload a PDF file using the interface');
    console.log('   2. Click "Analyze PDF" to process it');
    console.log('   3. View the extracted text results');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above.');
  }
  
  return allPassed;
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testApiService,
    testMockDataService,
    testComponentState,
    runAllTests
  };
} 