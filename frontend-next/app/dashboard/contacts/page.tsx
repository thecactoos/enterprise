'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data for Polish construction/flooring company contacts
const contacts = [
  {
    id: 1,
    name: 'Jan Kowalski',
    company: 'Kowalski Sp. z o.o.',
    email: 'jan.kowalski@kowalski-firma.pl',
    phone: '+48 123 456 789',
    nip: '1234567890',
    regon: '123456789',
    address: 'ul. Marszałkowska 15, 00-001 Warszawa',
    type: 'Klient',
    status: 'Aktywny',
    lastContact: '2024-08-01',
    projects: 3,
    value: '125,000',
  },
  {
    id: 2,
    name: 'Anna Nowak',
    company: 'Nowak Budowa',
    email: 'anna.nowak@nowakbudowa.pl',
    phone: '+48 987 654 321',
    nip: '9876543210',
    regon: '987654321',
    address: 'ul. Krakowska 22, 30-001 Kraków',
    type: 'Potencjalny klient',
    status: 'W trakcie',
    lastContact: '2024-07-28',
    projects: 1,
    value: '85,000',
  },
  {
    id: 3,
    name: 'Piotr Wiśniewski',
    company: 'WiśBud Sp. j.',
    email: 'piotr@wisbud.pl',
    phone: '+48 555 123 456',
    nip: '5551234567',
    regon: '555123456',
    address: 'ul. Gdańska 8, 80-001 Gdańsk',
    type: 'Klient',
    status: 'Aktywny',
    lastContact: '2024-08-03',
    projects: 5,
    value: '340,000',
  },
  {
    id: 4,
    name: 'Maria Kamińska',
    company: 'Kamińska Construction',
    email: 'maria.kaminska@kaminska-const.pl',
    phone: '+48 777 888 999',
    nip: '7778889990',
    regon: '777888999',
    address: 'ul. Wrocławska 33, 50-001 Wrocław',
    type: 'Potencjalny klient',
    status: 'Nowy',
    lastContact: '2024-08-04',
    projects: 0,
    value: '0',
  },
  {
    id: 5,
    name: 'Tomasz Zieliński',
    company: 'Zieliński Podłogi',
    email: 'tomasz@zielinski-podlogi.pl',
    phone: '+48 666 777 888',
    nip: '6667778880',
    regon: '666777888',
    address: 'ul. Poznańska 44, 60-001 Poznań',
    type: 'Klient',
    status: 'Aktywny',
    lastContact: '2024-07-30',
    projects: 8,
    value: '520,000',
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Aktywny':
      return <Badge variant="success">{status}</Badge>;
    case 'W trakcie':
      return <Badge variant="lime">{status}</Badge>;
    case 'Nowy':
      return <Badge variant="default">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'Klient':
      return <Badge variant="success">{type}</Badge>;
    case 'Potencjalny klient':
      return <Badge variant="outline">{type}</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Wszystkie');
  const [typeFilter, setTypeFilter] = useState('Wszystkie');

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Wszystkie' || contact.status === statusFilter;
    const matchesType = typeFilter === 'Wszystkie' || contact.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kontakty</h1>
          <p className="text-gray-600 mt-1">Zarządzaj swoimi klientami i potencjalnymi klientami</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          + Dodaj kontakt
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszyscy kontakty</p>
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywni klienci</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter(c => c.status === 'Aktywny').length}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nowi kontakty</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.filter(c => c.status === 'Nowy').length}
                </p>
              </div>
              <div className="text-2xl">🆕</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Łączna wartość</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contacts.reduce((sum, c) => sum + parseInt(c.value.replace(',', '')), 0).toLocaleString()} zł
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Szukaj po nazwie, firmie lub emailu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="Wszystkie">Wszystkie statusy</option>
              <option value="Aktywny">Aktywny</option>
              <option value="W trakcie">W trakcie</option>
              <option value="Nowy">Nowy</option>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <option value="Wszystkie">Wszystkie typy</option>
              <option value="Klient">Klient</option>
              <option value="Potencjalny klient">Potencjalny klient</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista kontaktów ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa/Firma</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead>NIP/REGON</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projekty</TableHead>
                <TableHead>Wartość</TableHead>
                <TableHead>Ostatni kontakt</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.company}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-gray-900">{contact.email}</div>
                      <div className="text-sm text-gray-500">{contact.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm text-gray-900">NIP: {contact.nip}</div>
                      <div className="text-sm text-gray-500">REGON: {contact.regon}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(contact.type)}</TableCell>
                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                  <TableCell className="text-center">{contact.projects}</TableCell>
                  <TableCell className="font-medium">
                    {parseInt(contact.value) > 0 ? `${parseInt(contact.value).toLocaleString()} zł` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(contact.lastContact).toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edytuj
                      </Button>
                      <Button variant="outline" size="sm">
                        Kontakt
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}