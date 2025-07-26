import { Injectable } from '@nestjs/common';

@Injectable()
export class MockDataService {
  private users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      password: 'password123', // In real app, this would be hashed
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
  ];

  private clients = [
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
  ];

  private notes = [
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
  ];

  private activities = [
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

  getUserByEmail(email: string) {
    return this.users.find(user => user.email === email);
  }

  validateUser(email: string, password: string) {
    const user = this.getUserByEmail(email);
    if (user && user.password === password) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  createUser(userData: any) {
    const existingUser = this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      id: this.users.length + 1,
      ...userData,
      role: 'user',
    };

    this.users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  getDashboardStats() {
    const totalClients = this.clients.length;
    const activeClients = this.clients.filter(c => c.status === 'active').length;
    const totalNotes = this.notes.length;
    const totalUsers = this.users.length;

    const monthlyGrowth = {
      clients: 15,
      notes: 25,
      revenue: 12.5,
    };

    return {
      totalClients,
      activeClients,
      totalNotes,
      totalUsers,
      monthlyGrowth,
      recentActivity: this.activities.slice(0, 5),
    };
  }

  getRecentClients(limit = 5) {
    return this.clients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getRecentNotes(limit = 5) {
    return this.notes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(note => ({
        ...note,
        clientName: this.clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
      }));
  }

  getAllClients() {
    return this.clients;
  }

  getClientById(id: number) {
    return this.clients.find(client => client.id === id);
  }

  createClient(clientData: any) {
    const newClient = {
      id: this.clients.length + 1,
      ...clientData,
      createdAt: new Date().toISOString(),
      status: clientData.status || 'pending',
    };

    this.clients.push(newClient);
    return newClient;
  }

  updateClient(id: number, clientData: any) {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) {
      throw new Error('Client not found');
    }

    this.clients[index] = { ...this.clients[index], ...clientData };
    return this.clients[index];
  }

  deleteClient(id: number) {
    const index = this.clients.findIndex(client => client.id === id);
    if (index === -1) {
      throw new Error('Client not found');
    }

    const deletedClient = this.clients[index];
    this.clients.splice(index, 1);
    return deletedClient;
  }

  getAllNotes() {
    return this.notes.map(note => ({
      ...note,
      clientName: this.clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
    }));
  }

  getNoteById(id: number) {
    const note = this.notes.find(note => note.id === id);
    if (note) {
      return {
        ...note,
        clientName: this.clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
      };
    }
    return null;
  }

  getNotesByClient(clientId: number) {
    return this.notes
      .filter(note => note.clientId === clientId)
      .map(note => ({
        ...note,
        clientName: this.clients.find(c => c.id === note.clientId)?.name || 'Unknown Client',
      }));
  }

  createNote(noteData: any) {
    const newNote = {
      id: this.notes.length + 1,
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.notes.push(newNote);
    return {
      ...newNote,
      clientName: this.clients.find(c => c.id === noteData.clientId)?.name || 'Unknown Client',
    };
  }

  updateNote(id: number, noteData: any) {
    const index = this.notes.findIndex(note => note.id === id);
    if (index === -1) {
      throw new Error('Note not found');
    }

    this.notes[index] = { 
      ...this.notes[index], 
      ...noteData, 
      updatedAt: new Date().toISOString() 
    };

    return {
      ...this.notes[index],
      clientName: this.clients.find(c => c.id === this.notes[index].clientId)?.name || 'Unknown Client',
    };
  }

  deleteNote(id: number) {
    const index = this.notes.findIndex(note => note.id === id);
    if (index === -1) {
      throw new Error('Note not found');
    }

    const deletedNote = this.notes[index];
    this.notes.splice(index, 1);
    return deletedNote;
  }
} 