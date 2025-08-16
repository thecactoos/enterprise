// Frontend mock data service that mirrors backend data structure

class MockDataService {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    // Initialize with sample data if localStorage is empty
    const requiredKeys = ['mock_clients', 'mock_users', 'mock_notes', 'mock_products', 'mock_leads'];
    const missingData = requiredKeys.some(key => !localStorage.getItem(key));
    
    if (missingData) {
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
      products: [
        {
          id: 1,
          product_code: 'FLR001',
          product_name: 'Premium Oak Flooring',
          unofficial_product_name: 'Dąb Naturalny Premium',
          category: 'flooring',
          measure_unit: 'm²',
          selling_unit: 'm²',
          thickness_mm: 14,
          width_mm: 180,
          length_mm: 1200,
          package_m2: 2.16,
          retail_price_per_unit: 89.99,
          selling_price_per_unit: 79.99,
          purchase_price_per_unit: 55.00,
          current_stock: 150,
          status: 'active',
          is_active: true,
          type_of_finish: 'UV Lacquered',
          surface: 'Brushed',
          bevel: '4-sided micro bevel',
          description: 'Beautiful premium oak flooring with natural grain patterns',
          installation_allowance: 15,
          currency: 'PLN'
        },
        {
          id: 2,
          product_code: 'MOL002',
          product_name: 'Classic Skirting Board',
          unofficial_product_name: 'Listwa Klasyczna',
          category: 'molding',
          measure_unit: 'mb',
          selling_unit: 'mb',
          thickness_mm: 16,
          width_mm: 80,
          length_mm: 2400,
          retail_price_per_unit: 24.99,
          selling_price_per_unit: 19.99,
          purchase_price_per_unit: 12.50,
          current_stock: 89,
          status: 'active',
          is_active: true,
          type_of_finish: 'Primed',
          surface: 'Smooth',
          description: 'Classic MDF skirting board, ready for painting',
          installation_allowance: 10,
          currency: 'PLN'
        },
        {
          id: 3,
          product_code: 'PAN003',
          product_name: 'Luxury Vinyl Panel',
          unofficial_product_name: 'Panel Winylowy Lux',
          category: 'panel',
          measure_unit: 'm²',
          selling_unit: 'paczka',
          thickness_mm: 4.5,
          width_mm: 228,
          length_mm: 1220,
          package_m2: 3.34,
          retail_price_per_unit: 119.99,
          selling_price_per_unit: 99.99,
          purchase_price_per_unit: 65.00,
          current_stock: 45,
          status: 'active',
          is_active: true,
          type_of_finish: 'Wear Layer 0.55mm',
          surface: 'Wood Texture',
          bevel: 'Micro bevel',
          description: 'Waterproof luxury vinyl flooring with authentic wood look',
          installation_allowance: 20,
          currency: 'PLN'
        },
        {
          id: 4,
          product_code: 'ACC004',
          product_name: 'Transition Strip',
          unofficial_product_name: 'Profil Przejściowy',
          category: 'accessory',
          measure_unit: 'mb',
          selling_unit: 'szt',
          thickness_mm: 7,
          width_mm: 40,
          length_mm: 900,
          retail_price_per_unit: 15.99,
          selling_price_per_unit: 12.99,
          purchase_price_per_unit: 8.00,
          current_stock: 200,
          status: 'active',
          is_active: true,
          type_of_finish: 'Anodized',
          surface: 'Brushed Aluminum',
          description: 'Universal transition strip for different floor heights',
          installation_allowance: 5,
          currency: 'PLN'
        },
        {
          id: 5,
          product_code: 'FLR005',
          product_name: 'Engineered Walnut',
          unofficial_product_name: 'Orzech Inżynieryjny',
          category: 'flooring',
          measure_unit: 'm²',
          selling_unit: 'm²',
          thickness_mm: 15,
          width_mm: 190,
          length_mm: 1900,
          package_m2: 1.81,
          retail_price_per_unit: 139.99,
          selling_price_per_unit: 119.99,
          purchase_price_per_unit: 85.00,
          current_stock: 25,
          status: 'active',
          is_active: true,
          type_of_finish: 'Oil Finish',
          surface: 'Hand Scraped',
          bevel: 'Beveled edges',
          description: 'Premium engineered walnut with rich chocolate tones',
          installation_allowance: 18,
          currency: 'PLN'
        },
        {
          id: 6,
          product_code: 'OUT006',
          product_name: 'Discontinued Bamboo',
          unofficial_product_name: 'Bambus Wycofany',
          category: 'flooring',
          measure_unit: 'm²',
          selling_unit: 'm²',
          thickness_mm: 12,
          width_mm: 125,
          length_mm: 920,
          package_m2: 2.53,
          retail_price_per_unit: 49.99,
          selling_price_per_unit: 29.99,
          purchase_price_per_unit: 20.00,
          current_stock: 5,
          status: 'out_of_stock',
          is_active: false,
          type_of_finish: 'Natural',
          surface: 'Smooth',
          description: 'Eco-friendly bamboo flooring - limited stock clearance',
          installation_allowance: 12,
          currency: 'PLN'
        }
      ],
      leads: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: 'jan.kowalski@budownictwo-abc.pl',
          phone: '+48123456789',
          company: 'Budownictwo ABC Sp. z o.o.',
          position: 'Kierownik Projektu',
          website: 'https://budownictwo-abc.pl',
          street: 'ul. Budowlana 15',
          city: 'Warszawa',
          postalCode: '02-123',
          voivodeship: 'mazowieckie',
          country: 'Polska',
          companySize: '50-100',
          industry: 'Budownictwo',
          nip: '1234567890',
          regon: '123456789',
          krs: '0000123456',
          source: 'WEBSITE',
          status: 'NEW',
          priority: 'HIGH',
          leadType: 'B2B',
          projectType: 'RENOVATION',
          estimatedBudget: 150000,
          actualBudget: null,
          currency: 'PLN',
          projectDescription: 'Kompleksowa renovacja biurowca - wymiana podłóg na wszystkich piętrach, około 1200m²',
          expectedArea: 1200,
          timeline: 'Q2 2024',
          requirements: ['Podłogi laminowane', 'Listwy wykończeniowe', 'Akcesoria montażowe'],
          qualificationScore: 85,
          interestLevel: 9,
          buyingPower: 8,
          decisionMakingAuthority: 'High',
          lastContact: '2024-01-15T10:00:00Z',
          nextFollowUp: '2024-01-22T14:00:00Z',
          tags: ['wysokobudżetowy', 'priorytet', 'b2b'],
          referralSource: 'Google Ads - podłogi biurowe',
          notes: 'Bardzo zainteresowany współpracą. Poszukuje kompleksowego rozwiązania.',
          gdprConsent: true,
          marketingConsent: true,
          communicationChannel: 'email',
          createdAt: '2024-01-10T08:30:00Z',
          updatedAt: '2024-01-15T16:45:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          firstName: 'Anna',
          lastName: 'Nowak',
          email: 'anna.nowak@gmail.com',
          phone: '+48987654321',
          company: null,
          position: null,
          street: 'ul. Kwiatowa 8',
          city: 'Kraków',
          postalCode: '31-456',
          voivodeship: 'małopolskie',
          country: 'Polska',
          source: 'FACEBOOK',
          status: 'CONTACTED',
          priority: 'MEDIUM',
          leadType: 'B2C',
          projectType: 'NEW_CONSTRUCTION',
          estimatedBudget: 25000,
          actualBudget: 22000,
          currency: 'PLN',
          projectDescription: 'Wykończenie nowego mieszkania - salon, sypialnia, przedpokój - łącznie 65m²',
          expectedArea: 65,
          timeline: 'Marzec 2024',
          requirements: ['Panele podłogowe', 'Listwy przypodłogowe', 'Podkład pod panele'],
          qualificationScore: 70,
          interestLevel: 7,
          buyingPower: 6,
          decisionMakingAuthority: 'High',
          lastContact: '2024-01-18T11:30:00Z',
          nextFollowUp: '2024-01-25T10:00:00Z',
          tags: ['mieszkanie', 'nowakonstrukcja', 'b2c'],
          referralSource: 'Facebook - wykończenia wnętrz',
          notes: 'Młode małżeństwo wykańczające pierwsze mieszkanie. Szukają dobrej jakości w rozsądnej cenie.',
          gdprConsent: true,
          marketingConsent: false,
          communicationChannel: 'phone',
          createdAt: '2024-01-12T09:15:00Z',
          updatedAt: '2024-01-18T17:20:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          firstName: 'Piotr',
          lastName: 'Wiśniewski',
          email: 'piotr.wisniewski@hotel-park.pl',
          phone: '+48555123456',
          company: 'Hotel Park Gdańsk',
          position: 'Dyrektor Generalny',
          website: 'https://hotel-park.pl',
          street: 'ul. Parkowa 25',
          city: 'Gdańsk',
          postalCode: '80-201',
          voivodeship: 'pomorskie',
          country: 'Polska',
          companySize: '20-50',
          industry: 'Hotelarstwo',
          nip: '9876543210',
          regon: '987654321',
          krs: '0000987654',
          source: 'REFERRAL',
          status: 'QUALIFIED',
          priority: 'HIGH',
          leadType: 'B2B',
          projectType: 'RENOVATION',
          estimatedBudget: 300000,
          actualBudget: 280000,
          currency: 'PLN',
          projectDescription: 'Modernizacja wszystkich pokoi hotelowych - wymiana podłóg, około 2500m²',
          expectedArea: 2500,
          timeline: 'Q1 2024',
          requirements: ['Podłogi winylowe LVT', 'Listwy wodoodporne', 'Klej do podłóg', 'Izolacja akustyczna'],
          qualificationScore: 95,
          interestLevel: 10,
          buyingPower: 9,
          decisionMakingAuthority: 'High',
          lastContact: '2024-01-20T15:00:00Z',
          nextFollowUp: '2024-01-24T09:00:00Z',
          tags: ['hotel', 'duży-projekt', 'gotowy-do-zakupu'],
          referralSource: 'Polecenie od Hotel Marriott Warszawa',
          notes: 'Bardzo konkretny klient z ustalonym budżetem. Planuje rozpoczęcie prac w lutym.',
          gdprConsent: true,
          marketingConsent: true,
          communicationChannel: 'email',
          createdAt: '2024-01-08T12:00:00Z',
          updatedAt: '2024-01-20T18:30:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          firstName: 'Magdalena',
          lastName: 'Zielińska',
          email: 'magdalena.zielinska@architekci.com',
          phone: '+48777888999',
          company: 'Studio Architektoniczne Modern',
          position: 'Architekt Wnętrz',
          website: 'https://architekci-modern.com',
          street: 'ul. Designerska 10',
          city: 'Wrocław',
          postalCode: '50-301',
          voivodeship: 'dolnośląskie',
          country: 'Polska',
          companySize: '5-10',
          industry: 'Architektura',
          nip: '1122334455',
          regon: '112233445',
          source: 'LINKEDIN',
          status: 'PROPOSAL_SENT',
          priority: 'MEDIUM',
          leadType: 'B2B',
          projectType: 'COMMERCIAL',
          estimatedBudget: 80000,
          actualBudget: null,
          currency: 'PLN',
          projectDescription: 'Wykończenie nowoczesnego biura IT - strefa open space i sale konferencyjne, 400m²',
          expectedArea: 400,
          timeline: 'Q2 2024',
          requirements: ['Podłogi drewnopodobne SPC', 'Profile przejściowe', 'Akcesoria wykończeniowe'],
          qualificationScore: 75,
          interestLevel: 8,
          buyingPower: 7,
          decisionMakingAuthority: 'Medium',
          lastContact: '2024-01-19T13:15:00Z',
          nextFollowUp: '2024-01-26T11:00:00Z',
          tags: ['architekt', 'biuro', 'oferta-wysłana'],
          referralSource: 'LinkedIn - grupy architektoniczne',
          notes: 'Pracuje nad projektem dla klienta z branży IT. Czeka na akceptację koncepcji.',
          gdprConsent: true,
          marketingConsent: false,
          communicationChannel: 'linkedin',
          createdAt: '2024-01-14T14:20:00Z',
          updatedAt: '2024-01-19T16:45:00Z'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          firstName: 'Tomasz',
          lastName: 'Kaczmarek',
          email: 'tomasz.kaczmarek@szkola-podstawowa.edu.pl',
          phone: '+48666777888',
          company: 'Szkoła Podstawowa nr 15',
          position: 'Dyrektor',
          street: 'ul. Szkolna 5',
          city: 'Poznań',
          postalCode: '60-101',
          voivodeship: 'wielkopolskie',
          country: 'Polska',
          companySize: '100+',
          industry: 'Edukacja',
          nip: '5566778899',
          regon: '556677889',
          source: 'EMAIL',
          status: 'NURTURING',
          priority: 'LOW',
          leadType: 'B2G',
          projectType: 'RENOVATION',
          estimatedBudget: 60000,
          actualBudget: null,
          currency: 'PLN',
          projectDescription: 'Wymiana podłóg w salach lekcyjnych - 8 klas, łącznie około 600m²',
          expectedArea: 600,
          timeline: 'Wakacje 2024',
          requirements: ['Podłogi bezpieczne dla dzieci', 'Antypoślizgowe', 'Łatwe w utrzymaniu'],
          qualificationScore: 60,
          interestLevel: 6,
          buyingPower: 5,
          decisionMakingAuthority: 'Medium',
          lastContact: '2024-01-16T10:30:00Z',
          nextFollowUp: '2024-02-15T09:00:00Z',
          tags: ['szkoła', 'sektor-publiczny', 'wakacje'],
          referralSource: 'Email z zapytaniem ogólnym',
          notes: 'Planuje remont na wakacje. Wymaga specjalnych certyfikatów bezpieczeństwa.',
          gdprConsent: true,
          marketingConsent: false,
          communicationChannel: 'email',
          createdAt: '2024-01-11T08:45:00Z',
          updatedAt: '2024-01-16T12:15:00Z'
        }
      ]
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

    // Lead endpoints
    if (path === '/leads' && method === 'GET') {
      return this.getLeads(data);
    }

    if (path === '/leads' && method === 'POST') {
      return this.createLead(data);
    }

    if (path.match(/^\/leads\/[a-f0-9-]+$/) && method === 'GET') {
      const id = path.split('/')[2];
      const lead = this.getLeadById(id);
      if (!lead) {
        throw { status: 404, message: 'Lead not found' };
      }
      return lead;
    }

    if (path.match(/^\/leads\/[a-f0-9-]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      return this.updateLead(id, data);
    }

    if (path.match(/^\/leads\/[a-f0-9-]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      return this.deleteLead(id);
    }

    if (path === '/leads/stats' && method === 'GET') {
      return this.getLeadStatistics();
    }

    if (path === '/leads/funnel-stats' && method === 'GET') {
      return this.getLeadConversionFunnel();
    }

    if (path === '/leads/top-by-score' && method === 'GET') {
      const limit = data?.limit || 10;
      return this.getTopLeadsByScore(limit);
    }

    if (path === '/leads/bulk-update' && method === 'PUT') {
      return this.bulkUpdateLeads(data);
    }

    if (path === '/leads/bulk-delete' && method === 'DELETE') {
      return this.bulkDeleteLeads(data);
    }

    if (path === '/leads/export' && method === 'GET') {
      return this.exportLeads(data);
    }

    if (path === '/leads/search' && method === 'GET') {
      return this.searchLeads(data);
    }

    if (path.match(/^\/leads\/[a-f0-9-]+\/convert$/) && method === 'POST') {
      const id = path.split('/')[2];
      return this.convertLeadToClient(id);
    }

    if (path.match(/^\/leads\/[a-f0-9-]+\/score$/) && method === 'PUT') {
      const id = path.split('/')[2];
      return this.updateLeadScore(id, data);
    }

    if (path.match(/^\/leads\/[a-f0-9-]+\/activities$/) && method === 'GET') {
      const id = path.split('/')[2];
      return this.getLeadActivities(id);
    }

    if (path.match(/^\/leads\/[a-f0-9-]+\/activities$/) && method === 'POST') {
      const id = path.split('/')[2];
      return this.addLeadActivity(id, data);
    }

    if (path === '/leads/filters/sources' && method === 'GET') {
      return this.getLeadSources();
    }

    if (path === '/leads/filters/statuses' && method === 'GET') {
      return this.getLeadStatuses();
    }

    if (path === '/leads/dashboard/recent' && method === 'GET') {
      const limit = data?.limit || 5;
      return this.getRecentLeads(limit);
    }

    // Products endpoints
    if (path === '/products' && method === 'GET') {
      return this.getAllProducts();
    }

    if (path.match(/^\/products\/\d+$/) && method === 'GET') {
      const id = path.split('/')[2];
      const product = this.getProductById(id);
      if (!product) {
        throw { status: 404, message: 'Product not found' };
      }
      return product;
    }

    if (path === '/products/search' && method === 'GET') {
      const query = data?.query || '';
      return this.searchProducts(query);
    }

    if (path === '/products/categories' && method === 'GET') {
      const products = this.getAllProducts();
      const categories = [...new Set(products.map(p => p.category))];
      return categories.map(category => ({
        category,
        count: products.filter(p => p.category === category).length
      }));
    }

    // Default error for unknown endpoints
    throw { status: 404, message: 'Endpoint not found' };
  }

  // Utility methods
  resetData() {
    this.seedData();
  }

  // Product methods
  getAllProducts() {
    const products = this.getData('products');
    // If no products found, reinitialize data
    if (!products || products.length === 0) {
      this.seedData();
      return this.getData('products');
    }
    return products;
  }

  getProductById(id) {
    const products = this.getData('products');
    return products.find(product => product.id === parseInt(id));
  }

  getProductsByCategory(category) {
    const products = this.getData('products');
    return products.filter(product => product.category === category);
  }

  searchProducts(query) {
    const products = this.getData('products');
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.product_name.toLowerCase().includes(searchTerm) ||
      product.unofficial_product_name?.toLowerCase().includes(searchTerm) ||
      product.product_code?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    );
  }

  clearData() {
    ['users', 'clients', 'notes', 'products', 'leads'].forEach(key => {
      localStorage.removeItem(`mock_${key}`);
    });
  }

  // Lead methods
  getAllLeads() {
    return this.getData('leads');
  }

  getLeads(params = {}) {
    let leads = this.getData('leads');
    
    // Apply search filter
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      leads = leads.filter(lead => 
        lead.firstName?.toLowerCase().includes(searchTerm) ||
        lead.lastName?.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.company?.toLowerCase().includes(searchTerm) ||
        lead.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (params.status && params.status !== 'all') {
      leads = leads.filter(lead => lead.status === params.status);
    }

    // Apply source filter
    if (params.source && params.source !== 'all') {
      leads = leads.filter(lead => lead.source === params.source);
    }

    // Apply priority filter
    if (params.priority && params.priority !== 'all') {
      leads = leads.filter(lead => lead.priority === params.priority);
    }

    // Apply lead type filter
    if (params.leadType && params.leadType !== 'all') {
      leads = leads.filter(lead => lead.leadType === params.leadType);
    }

    // Apply voivodeship filter
    if (params.voivodeship && params.voivodeship !== 'all') {
      leads = leads.filter(lead => lead.voivodeship === params.voivodeship);
    }

    // Apply budget filters
    if (params.minBudget) {
      leads = leads.filter(lead => (lead.estimatedBudget || 0) >= parseInt(params.minBudget));
    }
    if (params.maxBudget) {
      leads = leads.filter(lead => (lead.estimatedBudget || 0) <= parseInt(params.maxBudget));
    }

    // Apply pagination
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      data: leads.slice(startIndex, endIndex),
      total: leads.length,
      page,
      limit,
      totalPages: Math.ceil(leads.length / limit)
    };
  }

  getLeadById(id) {
    const leads = this.getData('leads');
    return leads.find(lead => lead.id === id);
  }

  createLead(leadData) {
    const leads = this.getData('leads');
    const newLead = {
      id: 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11),
      ...leadData,
      qualificationScore: this.calculateQualificationScore(leadData),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    leads.push(newLead);
    this.setData('leads', leads);
    return newLead;
  }

  updateLead(id, leadData) {
    const leads = this.getData('leads');
    const index = leads.findIndex(lead => lead.id === id);
    
    if (index === -1) {
      throw { status: 404, message: 'Lead not found' };
    }

    leads[index] = { 
      ...leads[index], 
      ...leadData, 
      qualificationScore: this.calculateQualificationScore({ ...leads[index], ...leadData }),
      updatedAt: new Date().toISOString() 
    };

    this.setData('leads', leads);
    return leads[index];
  }

  deleteLead(id) {
    const leads = this.getData('leads');
    const index = leads.findIndex(lead => lead.id === id);
    
    if (index === -1) {
      throw { status: 404, message: 'Lead not found' };
    }

    const deletedLead = leads[index];
    leads.splice(index, 1);
    this.setData('leads', leads);
    return deletedLead;
  }

  getLeadStatistics() {
    const leads = this.getData('leads');
    
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const averageScore = leads.reduce((sum, lead) => sum + (lead.qualificationScore || 0), 0) / leads.length || 0;
    const averageBudget = leads.reduce((sum, lead) => sum + (lead.estimatedBudget || 0), 0) / leads.length || 0;

    return {
      total: leads.length,
      statusCounts,
      averageScore: Math.round(averageScore),
      averageBudget: Math.round(averageBudget)
    };
  }

  getLeadConversionFunnel() {
    const leads = this.getData('leads');
    const totalLeads = leads.length;

    const funnelStages = [
      { stage: 'NEW', count: 0 },
      { stage: 'CONTACTED', count: 0 },
      { stage: 'QUALIFIED', count: 0 },
      { stage: 'PROPOSAL_SENT', count: 0 },
      { stage: 'NEGOTIATING', count: 0 },
      { stage: 'CONVERTED', count: 0 }
    ];

    leads.forEach(lead => {
      const stage = funnelStages.find(s => s.stage === lead.status);
      if (stage) stage.count++;
    });

    return funnelStages.map(stage => ({
      ...stage,
      percentage: totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0
    }));
  }

  getTopLeadsByScore(limit = 10) {
    const leads = this.getData('leads');
    return leads
      .sort((a, b) => (b.qualificationScore || 0) - (a.qualificationScore || 0))
      .slice(0, limit);
  }

  convertLeadToClient(id) {
    const leads = this.getData('leads');
    const clients = this.getData('clients');
    const leadIndex = leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) {
      throw { status: 404, message: 'Lead not found' };
    }

    const lead = leads[leadIndex];
    
    // Create new client from lead data
    const newClient = {
      id: clients.length + 1,
      name: lead.company || `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      status: 'active',
      createdAt: new Date().toISOString(),
      industry: lead.industry || 'Unknown',
      revenue: lead.estimatedBudget || 0,
      // Add additional fields from lead
      street: lead.street,
      city: lead.city,
      postalCode: lead.postalCode,
      voivodeship: lead.voivodeship,
      country: lead.country,
      nip: lead.nip,
      regon: lead.regon,
      krs: lead.krs,
      website: lead.website
    };

    clients.push(newClient);
    this.setData('clients', clients);

    // Update lead status to converted
    leads[leadIndex].status = 'CONVERTED';
    leads[leadIndex].updatedAt = new Date().toISOString();
    this.setData('leads', leads);

    return { lead: leads[leadIndex], client: newClient };
  }

  updateLeadScore(id, scoreData) {
    const leads = this.getData('leads');
    const index = leads.findIndex(lead => lead.id === id);
    
    if (index === -1) {
      throw { status: 404, message: 'Lead not found' };
    }

    leads[index] = { 
      ...leads[index], 
      qualificationScore: scoreData.score,
      updatedAt: new Date().toISOString() 
    };

    this.setData('leads', leads);
    return leads[index];
  }

  getLeadActivities(_id) {
    // Mock activity data - in real implementation would use the id parameter
    return [
      {
        id: 1,
        type: 'created',
        description: 'Lead został utworzony',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 1
      },
      {
        id: 2,
        type: 'contacted',
        description: 'Pierwszy kontakt telefoniczny',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 1
      },
      {
        id: 3,
        type: 'email_sent',
        description: 'Wysłano ofertę email',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        userId: 2
      }
    ];
  }

  addLeadActivity(id, activityData) {
    // In a real implementation, this would add to a separate activities table
    const activity = {
      id: Date.now(),
      leadId: id,
      ...activityData,
      timestamp: new Date().toISOString()
    };
    
    return activity;
  }

  getLeadSources() {
    return [
      'WEBSITE', 'FACEBOOK', 'LINKEDIN', 'GOOGLE_ADS', 
      'REFERRAL', 'EMAIL', 'PHONE', 'TRADE_SHOW', 'OTHER'
    ];
  }

  getLeadStatuses() {
    return [
      'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 
      'NEGOTIATING', 'CONVERTED', 'LOST', 'NURTURING'
    ];
  }

  getRecentLeads(limit = 5) {
    const leads = this.getData('leads');
    return leads
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  searchLeads(params) {
    return this.getLeads(params);
  }

  bulkUpdateLeads(data) {
    const leads = this.getData('leads');
    const { leadIds, updates } = data;
    
    leadIds.forEach(id => {
      const index = leads.findIndex(lead => lead.id === id);
      if (index !== -1) {
        leads[index] = { ...leads[index], ...updates, updatedAt: new Date().toISOString() };
      }
    });

    this.setData('leads', leads);
    return { updated: leadIds.length };
  }

  bulkDeleteLeads(data) {
    const leads = this.getData('leads');
    const { leadIds } = data;
    
    const filteredLeads = leads.filter(lead => !leadIds.includes(lead.id));
    this.setData('leads', filteredLeads);
    
    return { deleted: leadIds.length };
  }

  exportLeads(params) {
    const leads = this.getLeads(params);
    // In real implementation, this would generate CSV/Excel data
    return {
      data: leads.data,
      format: params.format || 'csv',
      filename: `leads_export_${new Date().toISOString().split('T')[0]}.csv`
    };
  }

  // Helper method to calculate qualification score
  calculateQualificationScore(leadData) {
    let score = 0;
    
    // Budget score (30 points max)
    if (leadData.estimatedBudget) {
      if (leadData.estimatedBudget >= 100000) score += 30;
      else if (leadData.estimatedBudget >= 50000) score += 20;
      else if (leadData.estimatedBudget >= 20000) score += 10;
      else score += 5;
    }
    
    // Company size score (20 points max)
    if (leadData.companySize) {
      if (leadData.companySize === '100+') score += 20;
      else if (leadData.companySize === '50-100') score += 15;
      else if (leadData.companySize === '20-50') score += 10;
      else score += 5;
    }
    
    // Decision making authority (20 points max)
    if (leadData.decisionMakingAuthority === 'High') score += 20;
    else if (leadData.decisionMakingAuthority === 'Medium') score += 10;
    else score += 5;
    
    // Interest level (15 points max)
    if (leadData.interestLevel >= 8) score += 15;
    else if (leadData.interestLevel >= 6) score += 10;
    else if (leadData.interestLevel >= 4) score += 5;
    
    // Buying power (10 points max)
    if (leadData.buyingPower >= 8) score += 10;
    else if (leadData.buyingPower >= 6) score += 7;
    else if (leadData.buyingPower >= 4) score += 3;
    
    // Timeline urgency (5 points max)
    if (leadData.timeline && leadData.timeline.includes('Q1')) score += 5;
    else if (leadData.timeline && leadData.timeline.includes('Q2')) score += 3;
    else score += 1;
    
    return Math.min(score, 100); // Cap at 100
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();
export default mockDataService; 