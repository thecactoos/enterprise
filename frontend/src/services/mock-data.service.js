// Frontend mock data service that mirrors backend data structure

class MockDataService {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    // Initialize with sample data if localStorage is empty
    if (!localStorage.getItem('mock_clients')) {
      this.seedData();
    }
  }

  seedData() {
    const initialData = {
      users: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          password: 'password123',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          password: 'password123',
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'user',
          password: 'password123',
        },
      ],
      clients: [
        {
          id: 1,
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+1-555-0123',
          status: 'active',
          createdAt: '2024-01-15T10:30:00Z',
          industry: 'Technology',
          revenue: 5000000,
        },
        {
          id: 2,
          name: 'Global Solutions Inc',
          email: 'info@globalsolutions.com',
          phone: '+1-555-0456',
          status: 'active',
          createdAt: '2024-01-20T14:15:00Z',
          industry: 'Consulting',
          revenue: 2500000,
        },
        {
          id: 3,
          name: 'TechStart Ventures',
          email: 'hello@techstart.com',
          phone: '+1-555-0789',
          status: 'pending',
          createdAt: '2024-02-01T09:45:00Z',
          industry: 'Startup',
          revenue: 500000,
        },
        {
          id: 4,
          name: 'Innovation Labs',
          email: 'contact@innovationlabs.com',
          phone: '+1-555-0321',
          status: 'active',
          createdAt: '2024-02-10T16:20:00Z',
          industry: 'Research',
          revenue: 1200000,
        },
        {
          id: 5,
          name: 'Future Systems',
          email: 'info@futuresystems.com',
          phone: '+1-555-0654',
          status: 'inactive',
          createdAt: '2024-01-05T11:00:00Z',
          industry: 'Manufacturing',
          revenue: 8000000,
        },
      ],
      notes: [
        {
          id: 1,
          clientId: 1,
          title: 'Initial Meeting Notes',
          content: 'Discussed project requirements and timeline. Client is very interested in our solution.',
          type: 'meeting',
          createdAt: '2024-02-15T10:00:00Z',
          updatedAt: '2024-02-15T10:00:00Z',
        },
        {
          id: 2,
          clientId: 1,
          title: 'Follow-up Call',
          content: 'Client requested additional features and pricing information.',
          type: 'call',
          createdAt: '2024-02-16T14:30:00Z',
          updatedAt: '2024-02-16T14:30:00Z',
        },
        {
          id: 3,
          clientId: 2,
          title: 'Contract Discussion',
          content: 'Reviewed contract terms and conditions. Ready to proceed with implementation.',
          type: 'contract',
          createdAt: '2024-02-14T16:00:00Z',
          updatedAt: '2024-02-14T16:00:00Z',
        },
        {
          id: 4,
          clientId: 3,
          title: 'Demo Session',
          content: 'Presented product demo. Client was impressed with the features.',
          type: 'demo',
          createdAt: '2024-02-13T11:00:00Z',
          updatedAt: '2024-02-13T11:00:00Z',
        },
        {
          id: 5,
          clientId: 4,
          title: 'Technical Requirements',
          content: 'Detailed technical requirements gathering session completed.',
          type: 'technical',
          createdAt: '2024-02-12T13:00:00Z',
          updatedAt: '2024-02-12T13:00:00Z',
        },
      ],
    };

    // Store in localStorage
    Object.keys(initialData).forEach(key => {
      localStorage.setItem(`mock_${key}`, JSON.stringify(initialData[key]));
    });
  }

  // Generic data access methods
  getData(key) {
    const data = localStorage.getItem(`mock_${key}`);
    return data ? JSON.parse(data) : [];
  }

  setData(key, data) {
    localStorage.setItem(`mock_${key}`, JSON.stringify(data));
  }

  // User methods
  getUserByEmail(email) {
    const users = this.getData('users');
    return users.find(user => user.email === email);
  }

  validateUser(email, password) {
    const user = this.getUserByEmail(email);
    if (user && user.password === password) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  createUser(userData) {
    const users = this.getData('users');
    const existingUser = users.find(user => user.email === userData.email);
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      id: users.length + 1,
      ...userData,
      role: 'user',
    };

    users.push(newUser);
    this.setData('users', users);
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // Client methods
  getAllClients() {
    return this.getData('clients');
  }

  getClientById(id) {
    const clients = this.getData('clients');
    return clients.find(client => client.id === parseInt(id));
  }

  createClient(clientData) {
    const clients = this.getData('clients');
    const newClient = {
      id: clients.length + 1,
      ...clientData,
      createdAt: new Date().toISOString(),
      status: clientData.status || 'pending',
    };

    clients.push(newClient);
    this.setData('clients', clients);
    return newClient;
  }

  updateClient(id, clientData) {
    const clients = this.getData('clients');
    const index = clients.findIndex(client => client.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Client not found');
    }

    clients[index] = { ...clients[index], ...clientData };
    this.setData('clients', clients);
    return clients[index];
  }

  deleteClient(id) {
    const clients = this.getData('clients');
    const index = clients.findIndex(client => client.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Client not found');
    }

    const deletedClient = clients[index];
    clients.splice(index, 1);
    this.setData('clients', clients);
    return deletedClient;
  }

  // Note methods
  getAllNotes() {
    const notes = this.getData('notes');
    const clients = this.getData('clients');
    
    return notes.map(note => ({
      ...note,
      clientName: clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
    }));
  }

  getNoteById(id) {
    const notes = this.getData('notes');
    const clients = this.getData('clients');
    const note = notes.find(note => note.id === parseInt(id));
    
    if (note) {
      return {
        ...note,
        clientName: clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
      };
    }
    return null;
  }

  createNote(noteData) {
    const notes = this.getData('notes');
    const clients = this.getData('clients');
    
    const newNote = {
      id: notes.length + 1,
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    notes.push(newNote);
    this.setData('notes', notes);
    
    return {
      ...newNote,
      clientName: clients.find(c => c.id === noteData.clientId)?.name || 'Unknown Client',
    };
  }

  updateNote(id, noteData) {
    const notes = this.getData('notes');
    const clients = this.getData('clients');
    const index = notes.findIndex(note => note.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Note not found');
    }

    notes[index] = { 
      ...notes[index], 
      ...noteData, 
      updatedAt: new Date().toISOString() 
    };

    this.setData('notes', notes);
    
    return {
      ...notes[index],
      clientName: clients.find(c => c.id === notes[index].clientId)?.name || 'Unknown Client',
    };
  }

  deleteNote(id) {
    const notes = this.getData('notes');
    const index = notes.findIndex(note => note.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Note not found');
    }

    const deletedNote = notes[index];
    notes.splice(index, 1);
    this.setData('notes', notes);
    return deletedNote;
  }

  // Dashboard methods
  getDashboardStats() {
    const clients = this.getData('clients');
    const notes = this.getData('notes');
    const users = this.getData('users');

    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const totalNotes = notes.length;
    const totalUsers = users.length;

    const monthlyGrowth = {
      clients: 15,
      notes: 25,
      revenue: 12.5,
    };

    const activities = [
      {
        id: 1,
        type: 'client_created',
        description: 'New client "Acme Corporation" was added',
        timestamp: '2024-02-15T10:30:00Z',
        userId: 1,
      },
      {
        id: 2,
        type: 'note_created',
        description: 'Note "Initial Meeting Notes" was created for Acme Corporation',
        timestamp: '2024-02-15T10:00:00Z',
        userId: 1,
      },
      {
        id: 3,
        type: 'client_updated',
        description: 'Client "Global Solutions Inc" status updated to active',
        timestamp: '2024-02-14T16:00:00Z',
        userId: 2,
      },
      {
        id: 4,
        type: 'note_created',
        description: 'Note "Contract Discussion" was created for Global Solutions Inc',
        timestamp: '2024-02-14T16:00:00Z',
        userId: 2,
      },
      {
        id: 5,
        type: 'client_created',
        description: 'New client "TechStart Ventures" was added',
        timestamp: '2024-02-13T11:00:00Z',
        userId: 1,
      },
    ];

    return {
      totalClients,
      activeClients,
      totalNotes,
      totalUsers,
      monthlyGrowth,
      recentActivity: activities.slice(0, 5),
    };
  }

  getRecentClients(limit = 5) {
    const clients = this.getData('clients');
    return clients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getRecentNotes(limit = 5) {
    const notes = this.getData('notes');
    const clients = this.getData('clients');
    
    return notes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(note => ({
        ...note,
        clientName: clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
      }));
  }

  // Generic request handler
  async handleRequest(method, endpoint, data) {
    const path = endpoint.toLowerCase();
    
    // Authentication endpoints
    if (path === '/auth/login' && method === 'POST') {
      const user = this.validateUser(data.email, data.password);
      if (!user) {
        throw { status: 401, message: 'Invalid credentials' };
      }
      return { access_token: 'mock-jwt-token', user };
    }

    if (path === '/auth/register' && method === 'POST') {
      return this.createUser(data);
    }

    // Dashboard endpoints
    if (path === '/dashboard/stats' && method === 'GET') {
      return this.getDashboardStats();
    }

    if (path === '/dashboard/recent-clients' && method === 'GET') {
      return this.getRecentClients();
    }

    if (path === '/dashboard/recent-notes' && method === 'GET') {
      return this.getRecentNotes();
    }

    // Client endpoints
    if (path === '/clients' && method === 'GET') {
      return this.getAllClients();
    }

    if (path === '/clients' && method === 'POST') {
      return this.createClient(data);
    }

    if (path.match(/^\/clients\/\d+$/) && method === 'GET') {
      const id = path.split('/')[2];
      const client = this.getClientById(id);
      if (!client) {
        throw { status: 404, message: 'Client not found' };
      }
      return client;
    }

    if (path.match(/^\/clients\/\d+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      return this.updateClient(id, data);
    }

    if (path.match(/^\/clients\/\d+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      return this.deleteClient(id);
    }

    // Note endpoints
    if (path === '/notes' && method === 'GET') {
      return this.getAllNotes();
    }

    if (path === '/notes' && method === 'POST') {
      return this.createNote(data);
    }

    if (path.match(/^\/notes\/\d+$/) && method === 'GET') {
      const id = path.split('/')[2];
      const note = this.getNoteById(id);
      if (!note) {
        throw { status: 404, message: 'Note not found' };
      }
      return note;
    }

    if (path.match(/^\/notes\/\d+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      return this.updateNote(id, data);
    }

    if (path.match(/^\/notes\/\d+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      return this.deleteNote(id);
    }

    // PDF Analysis endpoints
    if (path === '/pdf/upload-and-process' && method === 'POST') {
      // Simulate PDF upload and processing with mock data
      const mockPages = [
        {
          page_number: 1,
          text: "INVOICE\n\nAcme Corporation\n123 Business Street\nCity, State 12345\n\nInvoice #: INV-2024-001\nDate: 2024-02-15\n\nCustomer: Sample Client\n456 Client Avenue\nClient City, ST 67890\n\nDescription\t\tAmount\nSoftware License\t\t$1,000.00\nSupport Services\t\t$250.00\n\nTotal Amount: $1,250.00\nPayment Terms: Net 30\nDue Date: 2024-03-17",
          confidence: 0.95,
          bounding_boxes: [
            { text: "INVOICE", bbox: [[10, 10], [100, 30]] },
            { text: "Acme Corporation", bbox: [[10, 50], [150, 70]] },
            { text: "INV-2024-001", bbox: [[200, 100], [300, 120]] }
          ],
          processing_time: 2.5
        },
        {
          page_number: 2,
          text: "TERMS AND CONDITIONS\n\n1. Payment is due within 30 days of invoice date.\n2. Late payments may incur additional charges.\n3. All disputes must be resolved through arbitration.\n4. This invoice is subject to applicable taxes.\n\nThank you for your business!",
          confidence: 0.92,
          bounding_boxes: [
            { text: "TERMS AND CONDITIONS", bbox: [[10, 10], [200, 30]] },
            { text: "Payment is due within 30 days", bbox: [[10, 50], [250, 70]] }
          ],
          processing_time: 1.8
        }
      ];

      return {
        file_id: "mock-file-" + Date.now(),
        pages: mockPages,
        total_pages: mockPages.length,
        processing_time: 4.3,
        ocr_config: {
          language: "en",
          use_angle_cls: true,
          use_gpu: false
        },
        timestamp: new Date().toISOString()
      };
    }

    if (path === '/pdf/upload' && method === 'POST') {
      // Simulate PDF upload
      return {
        file_id: "mock-file-" + Date.now(),
        filename: "sample-document.pdf",
        file_size: 245760,
        pages: 2,
        message: "File uploaded successfully",
        timestamp: new Date().toISOString()
      };
    }

    if (path === '/pdf/process/' && method === 'POST') {
      // Simulate PDF processing
      const mockPages = [
        {
          page_number: 1,
          text: "Sample text extracted from page 1",
          confidence: 0.95,
          processing_time: 2.1
        }
      ];

      return {
        file_id: "mock-file-" + Date.now(),
        pages: mockPages,
        total_pages: mockPages.length,
        processing_time: 2.1,
        ocr_config: {
          language: "en",
          use_angle_cls: true,
          use_gpu: false
        },
        timestamp: new Date().toISOString()
      };
    }

    if (path === '/pdf/files' && method === 'GET') {
      // Return list of uploaded files
      return [
        {
          file_id: "mock-file-1",
          filename: "document1.pdf",
          file_size: 245760,
          pages: 2,
          upload_time: new Date().toISOString(),
          status: "completed"
        },
        {
          file_id: "mock-file-2",
          filename: "document2.pdf",
          file_size: 512000,
          pages: 5,
          upload_time: new Date().toISOString(),
          status: "completed"
        }
      ];
    }

    if (path === '/pdf/ocr/config' && method === 'GET') {
      // Return OCR configuration
      return {
        language: "en",
        use_angle_cls: true,
        use_gpu: false,
        det_db_thresh: 0.3,
        det_db_box_thresh: 0.5,
        det_db_un_clip_ratio: 1.6,
        rec_batch_num: 6
      };
    }

    // Default error for unknown endpoints
    throw { status: 404, message: 'Endpoint not found' };
  }

  // Utility methods
  resetData() {
    this.seedData();
  }

  clearData() {
    ['users', 'clients', 'notes'].forEach(key => {
      localStorage.removeItem(`mock_${key}`);
    });
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();
export default mockDataService; 