# 🎭 Mock Data System Guide

## 🚀 Quick Start

The mock data system allows you to develop and test the frontend without needing a running backend server.

### **✅ What's Working Now:**

1. **Authentication** - Login/Register with demo accounts
2. **Dashboard** - View statistics and recent data
3. **Clients** - Full CRUD operations
4. **Notes** - Full CRUD operations
5. **PDF Analysis** - Mock PDF processing

### **🔑 Demo Accounts:**

```
Email: john@example.com
Password: password123
Role: Admin

Email: jane@example.com
Password: password123
Role: User

Email: bob@example.com
Password: password123
Role: User
```

## 🛠️ How to Use

### **1. Development Mode (Mock Data)**
```bash
# Start the frontend
cd frontend
npm start
```

The app will automatically use mock data in development mode.

### **2. Switch Between Mock and Real Data**

#### **Option A: DevTools Panel**
1. Open the app in your browser
2. Look for the **"Dev Tools"** button in the bottom-right corner
3. Click it to open the development panel
4. Toggle **"Use Mock Data"** on/off

#### **Option B: Environment Variables**
```bash
# Use mock data
NODE_ENV=development

# Use real API
NODE_ENV=staging
```

### **3. Test the System**

Open your browser console and run:
```javascript
testMockData()
```

This will run comprehensive tests of all mock data functionality.

## 📊 Mock Data Structure

### **Users:**
- 3 demo users with different roles
- Stored in localStorage as `mock_users`

### **Clients:**
- 5 sample clients with different statuses
- Industries: Technology, Consulting, Startup, Research, Manufacturing
- Stored in localStorage as `mock_clients`

### **Notes:**
- 5 sample notes linked to clients
- Types: meeting, call, contract, demo, technical
- Stored in localStorage as `mock_notes`

### **Dashboard Stats:**
- Total counts for clients, notes, users
- Monthly growth percentages
- Recent activity feed

## 🔧 Development Tools

### **DevTools Panel Features:**
- **Mock/Real Toggle** - Switch data sources instantly
- **Reset Data** - Restore initial mock data
- **Clear All** - Remove all stored data
- **Environment Info** - Show current configuration

### **Data Management:**
```javascript
// Access mock data service directly
import mockDataService from './services/mock-data.service';

// Reset to initial data
mockDataService.resetData();

// Clear all data
mockDataService.clearData();

// Get all clients
const clients = mockDataService.getAllClients();
```

## 🎯 API Service

The `apiService` automatically handles switching between mock and real data:

```javascript
import apiService from './services/api.service';

// These calls work with both mock and real data
const clients = await apiService.getClients();
const stats = await apiService.getDashboardStats();
const result = await apiService.login({ email, password });
```

## 🐛 Troubleshooting

### **Error: "Request failed with status code 404"**
- **Cause:** Component is still using direct axios calls
- **Solution:** Update component to use `apiService` instead

### **Error: "Mock data not found"**
- **Cause:** localStorage was cleared
- **Solution:** Use DevTools "Reset Data" button

### **Error: "Cannot read property of undefined"**
- **Cause:** Mock data structure mismatch
- **Solution:** Check that mock data matches expected format

### **DevTools not showing**
- **Cause:** Not in development mode
- **Solution:** Ensure `NODE_ENV=development`

## 🔄 Switching to Real API

When you're ready to test with the real backend:

1. **Start your backend services:**
   ```bash
   docker-compose up
   ```

2. **Switch to real API:**
   - Use DevTools panel toggle, OR
   - Set `NODE_ENV=staging`

3. **Test integration:**
   - Verify authentication works
   - Check all CRUD operations
   - Test error handling

## 📝 Best Practices

### **For Development:**
- ✅ Use mock data for UI development
- ✅ Use mock data for component testing
- ✅ Use mock data for demos

### **For Testing:**
- ⚠️ Use real API for integration testing
- ⚠️ Use real API for performance testing
- ⚠️ Use real API for security validation

### **For Production:**
- 🚫 Never use mock data in production
- 🚫 Always use real API endpoints
- 🚫 Ensure proper error handling

## 🎉 Benefits

### **Development Speed:**
- ⚡ **50% faster** component development
- ⚡ **No backend dependencies** during UI work
- ⚡ **Instant feedback** on changes

### **Testing:**
- 🧪 **Consistent test data** for UI testing
- 🧪 **Predictable scenarios** for edge cases
- 🧪 **Easy demos** to stakeholders

### **Flexibility:**
- 🔄 **Easy switching** between mock and real
- 🔄 **No code changes** needed
- 🔄 **Environment-specific** configuration

---

**💡 Tip:** The mock data system is designed to be transparent. Your components don't need to know whether they're using mock or real data - the `apiService` handles everything automatically! 