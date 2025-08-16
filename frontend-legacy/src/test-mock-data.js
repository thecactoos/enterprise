// Test file to verify mock data system is working
import apiService from './services/api.service';
import { config } from './config/environment';

console.log('🔧 Testing Mock Data System');
console.log('Environment:', process.env.NODE_ENV);
console.log('Use Mock Data:', config.mock.enabled);
console.log('API Base URL:', config.api.baseURL);

// Test authentication
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test login with demo credentials
    const loginResult = await apiService.login({
      email: 'john@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful:', loginResult.user.name);
    
    // Test registration
    const registerResult = await apiService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Registration successful:', registerResult.name);
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

// Test dashboard data
async function testDashboard() {
  console.log('\n📊 Testing Dashboard Data...');
  
  try {
    const stats = await apiService.getDashboardStats();
    console.log('✅ Dashboard stats:', {
      totalClients: stats.totalClients,
      totalNotes: stats.totalNotes,
      totalUsers: stats.totalUsers
    });
    
    const clients = await apiService.getRecentClients();
    console.log('✅ Recent clients:', clients.length);
    
    const notes = await apiService.getRecentNotes();
    console.log('✅ Recent notes:', notes.length);
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }
}

// Test CRUD operations
async function testCRUD() {
  console.log('\n🔄 Testing CRUD Operations...');
  
  try {
    // Test client operations
    const clients = await apiService.getClients();
    console.log('✅ Get clients:', clients.length);
    
    const newClient = await apiService.createClient({
      name: 'Test Company',
      email: 'test@company.com',
      phone: '+1-555-0123',
      industry: 'Technology',
      status: 'active'
    });
    console.log('✅ Create client:', newClient.name);
    
    const updatedClient = await apiService.updateClient(newClient.id, {
      status: 'pending'
    });
    console.log('✅ Update client:', updatedClient.status);
    
    await apiService.deleteClient(newClient.id);
    console.log('✅ Delete client: success');
    
    // Test note operations
    const notes = await apiService.getNotes();
    console.log('✅ Get notes:', notes.length);
    
    const newNote = await apiService.createNote({
      title: 'Test Note',
      content: 'This is a test note',
      clientId: 1,
      type: 'meeting'
    });
    console.log('✅ Create note:', newNote.title);
    
    const updatedNote = await apiService.updateNote(newNote.id, {
      content: 'Updated test note content'
    });
    console.log('✅ Update note: success');
    
    await apiService.deleteNote(newNote.id);
    console.log('✅ Delete note: success');
    
  } catch (error) {
    console.error('❌ CRUD test failed:', error.message);
  }
}

// Test PDF analysis
async function testPDFAnalysis() {
  console.log('\n📄 Testing PDF Analysis...');
  
  try {
    const formData = new FormData();
    formData.append('file', new Blob(['mock pdf content'], { type: 'application/pdf' }));
    
    const result = await apiService.analyzePdf(formData);
    console.log('✅ PDF analysis:', result.data.invoice_number);
    
  } catch (error) {
    console.error('❌ PDF analysis test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Mock Data Tests...\n');
  
  await testAuth();
  await testDashboard();
  await testCRUD();
  await testPDFAnalysis();
  
  console.log('\n🎉 All tests completed!');
  console.log('💡 If you see ✅ marks, mock data is working correctly.');
  console.log('💡 If you see ❌ marks, there might be an issue.');
}

// Export for use in browser console
window.testMockData = runAllTests;

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // In browser environment
  console.log('📝 To test mock data, run: testMockData() in the browser console');
} else {
  // In Node.js environment
  runAllTests();
} 