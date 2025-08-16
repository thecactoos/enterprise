'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data for Polish construction/flooring invoices
const invoices = [
  {
    id: 1,
    number: 'FV/2024/001',
    client: 'Kowalski Sp. z o.o.',
    clientNip: '1234567890',
    netAmount: 100000,
    vatAmount: 23000,
    grossAmount: 123000,
    status: 'Zapłacona',
    issueDate: '2024-07-15',
    dueDate: '2024-08-14',
    paymentDate: '2024-08-10',
    paymentMethod: 'Przelew',
    quoteNumber: 'OF/2024/001',
  },
  {
    id: 2,
    number: 'FV/2024/002',
    client: 'Nowak Budowa',
    clientNip: '9876543210',
    netAmount: 68000,
    vatAmount: 15640,
    grossAmount: 83640,
    status: 'Wystawiona',
    issueDate: '2024-08-01',
    dueDate: '2024-08-31',
    paymentDate: null,
    paymentMethod: 'Przelew',
    quoteNumber: 'OF/2024/002',
  },
  {
    id: 3,
    number: 'FV/2024/003',
    client: 'WiśBud Sp. j.',
    clientNip: '5551234567',
    netAmount: 150000,
    vatAmount: 34500,
    grossAmount: 184500,
    status: 'Przeterminowana',
    issueDate: '2024-06-15',
    dueDate: '2024-07-15',
    paymentDate: null,
    paymentMethod: 'Przelew',
    quoteNumber: 'OF/2024/003',
  },
  {
    id: 4,
    number: 'FV/2024/004',
    client: 'Zieliński Podłogi',
    clientNip: '6667778880',
    netAmount: 55000,
    vatAmount: 12650,
    grossAmount: 67650,
    status: 'Zapłacona',
    issueDate: '2024-07-20',
    dueDate: '2024-08-19',
    paymentDate: '2024-08-15',
    paymentMethod: 'Gotówka',
    quoteNumber: 'OF/2024/005',
  },
  {
    id: 5,
    number: 'FV/2024/005',
    client: 'ABC Development',
    clientNip: '1112223330',
    netAmount: 280000,
    vatAmount: 64400,
    grossAmount: 344400,
    status: 'Wystawiona',
    issueDate: '2024-08-03',
    dueDate: '2024-09-02',
    paymentDate: null,
    paymentMethod: 'Przelew',
    quoteNumber: 'OF/2024/006',
  },
  {
    id: 6,
    number: 'FV/2024/006',
    client: 'Quick Construction',
    clientNip: '4445556660',
    netAmount: 25000,
    vatAmount: 5750,
    grossAmount: 30750,
    status: 'Anulowana',
    issueDate: '2024-07-25',
    dueDate: '2024-08-24',
    paymentDate: null,
    paymentMethod: 'Przelew',
    quoteNumber: null,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Zapłacona':
      return <Badge variant="success">{status}</Badge>;
    case 'Wystawiona':
      return <Badge variant="lime">{status}</Badge>;
    case 'Przeterminowana':
      return <Badge variant="destructive">{status}</Badge>;
    case 'Anulowana':
      return <Badge variant="secondary">{status}</Badge>;
    case 'Częściowo zapłacona':
      return <Badge variant="outline">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentMethodBadge = (method: string) => {
  switch (method) {
    case 'Przelew':
      return <Badge variant="outline">💳 {method}</Badge>;
    case 'Gotówka':
      return <Badge variant="secondary">💵 {method}</Badge>;
    case 'Karta':
      return <Badge variant="default">💳 {method}</Badge>;
    default:
      return <Badge variant="secondary">{method}</Badge>;
  }
};

const isOverdue = (dueDate: string, status: string) => {
  if (status === 'Zapłacona' || status === 'Anulowana') return false;
  return new Date(dueDate) < new Date();
};

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Wszystkie');
  const [periodFilter, setPeriodFilter] = useState('Wszystkie');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientNip.includes(searchTerm);
    const matchesStatus = statusFilter === 'Wszystkie' || invoice.status === statusFilter;
    
    let matchesPeriod = true;
    if (periodFilter === 'Ten miesiąc') {
      const invoiceDate = new Date(invoice.issueDate);
      const now = new Date();
      matchesPeriod = invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
    } else if (periodFilter === 'Ostatnie 30 dni') {
      const invoiceDate = new Date(invoice.issueDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesPeriod = invoiceDate >= thirtyDaysAgo;
    }
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.grossAmount, 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Zapłacona');
  const overdueInvoices = invoices.filter(inv => isOverdue(inv.dueDate, inv.status));
  const pendingAmount = invoices
    .filter(inv => inv.status === 'Wystawiona')
    .reduce((sum, inv) => sum + inv.grossAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faktury</h1>
          <p className="text-gray-600 mt-1">Zarządzaj fakturami sprzedażowymi</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Import faktury</Button>
          <Button className="bg-primary hover:bg-primary/90">
            + Nowa faktura
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie faktury</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <div className="text-2xl">🧾</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Zapłacone</p>
                <p className="text-2xl font-bold text-green-600">{paidInvoices.length}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Przeterminowane</p>
                <p className="text-2xl font-bold text-red-600">{overdueInvoices.length}</p>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Łączny przychód</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRevenue.toLocaleString()} zł
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Przegląd finansowy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Zapłacone faktury:</span>
                <span className="font-medium text-green-600">
                  {paidInvoices.reduce((sum, inv) => sum + inv.grossAmount, 0).toLocaleString()} zł
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Oczekujące płatności:</span>
                <span className="font-medium text-yellow-600">
                  {pendingAmount.toLocaleString()} zł
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Przeterminowane:</span>
                <span className="font-medium text-red-600">
                  {overdueInvoices.reduce((sum, inv) => sum + inv.grossAmount, 0).toLocaleString()} zł
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analiza VAT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">VAT należny:</span>
                <span className="font-medium">
                  {filteredInvoices.reduce((sum, inv) => sum + inv.vatAmount, 0).toLocaleString()} zł
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Wartość netto:</span>
                <span className="font-medium">
                  {filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0).toLocaleString()} zł
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Średnia stawka VAT:</span>
                <span className="font-medium text-primary">23%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <div>
                <h3 className="font-medium text-red-800">Uwaga: Przeterminowane faktury</h3>
                <p className="text-sm text-red-700">
                  {overdueInvoices.length} faktur wymaga natychmiastowej uwagi
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Zobacz wszystkie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Szukaj po numerze, kliencie lub NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="Wszystkie">Wszystkie statusy</option>
              <option value="Wystawiona">Wystawiona</option>
              <option value="Zapłacona">Zapłacona</option>
              <option value="Przeterminowana">Przeterminowana</option>
              <option value="Anulowana">Anulowana</option>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <option value="Wszystkie">Wszystkie okresy</option>
              <option value="Ten miesiąc">Ten miesiąc</option>
              <option value="Ostatnie 30 dni">Ostatnie 30 dni</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista faktur ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer faktury</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Kwota brutto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data wystawienia</TableHead>
                <TableHead>Termin płatności</TableHead>
                <TableHead>Płatność</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{invoice.client}</div>
                      <div className="text-sm text-gray-500">NIP: {invoice.clientNip}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.grossAmount.toLocaleString()} zł
                    <div className="text-sm text-gray-500">
                      netto: {invoice.netAmount.toLocaleString()} zł
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(invoice.issueDate).toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell className={`text-sm ${isOverdue(invoice.dueDate, invoice.status) ? 'text-red-600 font-medium' : ''}`}>
                    {new Date(invoice.dueDate).toLocaleDateString('pl-PL')}
                    {isOverdue(invoice.dueDate, invoice.status) && (
                      <div className="text-xs text-red-500">Przeterminowana</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      {getPaymentMethodBadge(invoice.paymentMethod)}
                      {invoice.paymentDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.paymentDate).toLocaleDateString('pl-PL')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        Edytuj
                      </Button>
                      {invoice.status === 'Wystawiona' && (
                        <Button variant="outline" size="sm" className="text-green-600">
                          Zapłać
                        </Button>
                      )}
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