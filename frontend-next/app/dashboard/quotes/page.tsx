'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data for Polish construction/flooring quotes
const quotes = [
  {
    id: 1,
    number: 'OF/2024/001',
    client: 'Kowalski Sp. z o.o.',
    contact: 'Jan Kowalski',
    title: 'Podłogi biurowe - Warszawa Centrum',
    value: 125000,
    status: 'Wysłana',
    validUntil: '2024-08-31',
    createdDate: '2024-07-15',
    items: 8,
    margin: 25.5,
    probability: 75,
  },
  {
    id: 2,
    number: 'OF/2024/002',
    client: 'Nowak Budowa',
    contact: 'Anna Nowak',
    title: 'Parkiet mieszkaniowy - Kraków',
    value: 85000,
    status: 'Zaakceptowana',
    validUntil: '2024-08-15',
    createdDate: '2024-07-10',
    items: 5,
    margin: 30.0,
    probability: 100,
  },
  {
    id: 3,
    number: 'OF/2024/003',
    client: 'WiśBud Sp. j.',
    contact: 'Piotr Wiśniewski',
    title: 'Kompleksowe wykończenie - Gdańsk',
    value: 340000,
    status: 'W przygotowaniu',
    validUntil: '2024-09-15',
    createdDate: '2024-08-01',
    items: 15,
    margin: 22.8,
    probability: 60,
  },
  {
    id: 4,
    number: 'OF/2024/004',
    client: 'Kamińska Construction',
    contact: 'Maria Kamińska',
    title: 'Panele LVT - Wrocław',
    value: 45000,
    status: 'Odrzucona',
    validUntil: '2024-07-31',
    createdDate: '2024-07-05',
    items: 3,
    margin: 20.0,
    probability: 0,
  },
  {
    id: 5,
    number: 'OF/2024/005',
    client: 'Zieliński Podłogi',
    contact: 'Tomasz Zieliński',
    title: 'Dostawa materiałów - Poznań',
    value: 68000,
    status: 'Wysłana',
    validUntil: '2024-08-20',
    createdDate: '2024-07-28',
    items: 12,
    margin: 18.5,
    probability: 85,
  },
  {
    id: 6,
    number: 'OF/2024/006',
    client: 'ABC Development',
    contact: 'Michał Wojciechowski',
    title: 'Osiedle mieszkaniowe - Łódź',
    value: 580000,
    status: 'Negocjacje',
    validUntil: '2024-09-30',
    createdDate: '2024-08-03',
    items: 25,
    margin: 28.2,
    probability: 65,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'W przygotowaniu':
      return <Badge variant="secondary">{status}</Badge>;
    case 'Wysłana':
      return <Badge variant="lime">{status}</Badge>;
    case 'Zaakceptowana':
      return <Badge variant="success">{status}</Badge>;
    case 'Negocjacje':
      return <Badge variant="default">{status}</Badge>;
    case 'Odrzucona':
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getProbabilityColor = (probability: number) => {
  if (probability >= 80) return 'text-green-600';
  if (probability >= 60) return 'text-yellow-600';
  if (probability >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Wszystkie');
  const [dateFilter, setDateFilter] = useState('Wszystkie');

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Wszystkie' || quote.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter === 'Ten miesiąc') {
      const quoteDate = new Date(quote.createdDate);
      const now = new Date();
      matchesDate = quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'Ostatnie 30 dni') {
      const quoteDate = new Date(quote.createdDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = quoteDate >= thirtyDaysAgo;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalValue = filteredQuotes.reduce((sum, q) => sum + q.value, 0);
  const avgMargin = filteredQuotes.reduce((sum, q) => sum + q.margin, 0) / filteredQuotes.length || 0;
  const acceptedQuotes = quotes.filter(q => q.status === 'Zaakceptowana');
  const pendingQuotes = quotes.filter(q => ['Wysłana', 'Negocjacje'].includes(q.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Oferty</h1>
          <p className="text-gray-600 mt-1">Zarządzaj ofertami cenowymi dla klientów</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Generator ofert</Button>
          <Button className="bg-primary hover:bg-primary/90">
            + Nowa oferta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie oferty</p>
                <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              </div>
              <div className="text-2xl">📄</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Zaakceptowane</p>
                <p className="text-2xl font-bold text-green-600">{acceptedQuotes.length}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oczekujące</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingQuotes.length}</p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Łączna wartość</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalValue.toLocaleString()} zł
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Przegląd wydajności</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {((acceptedQuotes.length / quotes.length) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Wskaźnik akceptacji</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {avgMargin.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Średnia marża</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(acceptedQuotes.reduce((sum, q) => sum + q.value, 0) / 1000).toFixed(0)}k zł
              </div>
              <div className="text-sm text-gray-600">Wartość zaakceptowanych</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Szukaj po numerze, kliencie lub tytule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="Wszystkie">Wszystkie statusy</option>
              <option value="W przygotowaniu">W przygotowaniu</option>
              <option value="Wysłana">Wysłana</option>
              <option value="Negocjacje">Negocjacje</option>
              <option value="Zaakceptowana">Zaakceptowana</option>
              <option value="Odrzucona">Odrzucona</option>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <option value="Wszystkie">Wszystkie daty</option>
              <option value="Ten miesiąc">Ten miesiąc</option>
              <option value="Ostatnie 30 dni">Ostatnie 30 dni</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista ofert ({filteredQuotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer oferty</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Tytuł</TableHead>
                <TableHead>Wartość</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prawdopodobieństwo</TableHead>
                <TableHead>Marża</TableHead>
                <TableHead>Ważna do</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono">{quote.number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{quote.client}</div>
                      <div className="text-sm text-gray-500">{quote.contact}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">{quote.title}</div>
                      <div className="text-sm text-gray-500">{quote.items} pozycji</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {quote.value.toLocaleString()} zł
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getProbabilityColor(quote.probability)}`}>
                      {quote.probability}%
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {quote.margin.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(quote.validUntil).toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Podgląd
                      </Button>
                      <Button variant="outline" size="sm">
                        Edytuj
                      </Button>
                      <Button variant="outline" size="sm">
                        PDF
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