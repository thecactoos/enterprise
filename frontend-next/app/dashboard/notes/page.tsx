'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Mock data for Polish construction/flooring company notes
const notes = [
  {
    id: 1,
    title: 'Spotkanie z klientem - Kowalski Sp. z o.o.',
    content: 'Omówienie szczegółów projektu podłóg biurowych. Klient preferuje panele Premium Oak w kolorze naturalnym. Wymiary powierzchni: 450m². Planowany termin rozpoczęcia prac: wrzesień 2024. Budżet: do 130,000 zł.',
    type: 'Spotkanie',
    priority: 'Wysoki',
    client: 'Kowalski Sp. z o.o.',
    author: 'Jan Nowak',
    createdDate: '2024-08-04T10:30:00',
    updatedDate: '2024-08-04T10:30:00',
    tags: ['projekt', 'panele', 'biuro'],
    isCompleted: false,
  },
  {
    id: 2,
    title: 'Kontrola jakości - Parkiet dębowy Kraków',
    content: 'Wykonano kontrolę jakości dostarczonego parkietu dębowego dla projektu w Krakowie. Wszystkie elementy odpowiadają specyfikacji. Materiał został przyjęty do magazynu. Można rozpocząć prace montażowe zgodnie z harmonogramem.',
    type: 'Kontrola',
    priority: 'Średni',
    client: 'Nowak Budowa',
    author: 'Maria Kowalska',
    createdDate: '2024-08-03T14:15:00',
    updatedDate: '2024-08-03T14:15:00',
    tags: ['jakość', 'parkiet', 'kontrola'],
    isCompleted: true,
  },
  {
    id: 3,
    title: 'Problem z dostawą - Panele LVT',
    content: 'Opóźnienie w dostawie paneli LVT VinylTech Premium Stone. Dostawca informuje o 5-dniowym opóźnieniu z powodu problemów logistycznych. Konieczność przesunięcia terminu rozpoczęcia prac w Gdańsku na 15 sierpnia.',
    type: 'Problem',
    priority: 'Wysoki',
    client: 'WiśBud Sp. j.',
    author: 'Piotr Wiśniewski',
    createdDate: '2024-08-02T09:45:00',
    updatedDate: '2024-08-03T16:20:00',
    tags: ['dostawa', 'opóźnienie', 'lvt'],
    isCompleted: false,
  },
  {
    id: 4,
    title: 'Rozpoznanie cenowe - Nowy dostawca klejów',
    content: 'Przeprowadzono analizę cenową nowego dostawcy klejów konstrukcyjnych. Ceny o 15% niższe od aktualnego dostawcy przy zachowaniu podobnej jakości. Zalecane przeprowadzenie testów próbnych przed podjęciem decyzji o zmianie.',
    type: 'Analiza',
    priority: 'Niski',
    client: null,
    author: 'Anna Zielińska',
    createdDate: '2024-08-01T11:20:00',
    updatedDate: '2024-08-01T11:20:00',
    tags: ['ceny', 'dostawca', 'kleje'],
    isCompleted: true,
  },
  {
    id: 5,
    title: 'Reklamacja - Panele Premium Oak partia 2024/07',
    content: 'Klient zgłosił reklamację dotyczącą paneli Premium Oak z partii 2024/07. Problem z uszkodzeniami zamków. Wymieniono 25m² materiału. Sprawa została przekazana do działu reklamacji u producenta w celu uzyskania rekompensaty.',
    type: 'Reklamacja',
    priority: 'Wysoki',
    client: 'Kamińska Construction',
    author: 'Tomasz Kowal',
    createdDate: '2024-07-30T16:30:00',
    updatedDate: '2024-08-01T09:15:00',
    tags: ['reklamacja', 'panele', 'wymiana'],
    isCompleted: false,
  },
  {
    id: 6,
    title: 'Szkolenie ekipy - Nowe techniki montażu',
    content: 'Przeprowadzono szkolenie ekipy montażowej z nowych technik montażu parkietu wielowarstwowego. Uczestniczyło 8 pracowników. Omówiono najlepsze praktyki, narzędzia i problemy często występujące podczas montażu.',
    type: 'Szkolenie',
    priority: 'Średni',
    client: null,
    author: 'Jan Nowak',
    createdDate: '2024-07-28T13:00:00',
    updatedDate: '2024-07-28T13:00:00',
    tags: ['szkolenie', 'montaż', 'zespół'],
    isCompleted: true,
  },
];

const getTypeBadge = (type: string) => {
  const colors: { [key: string]: string } = {
    'Spotkanie': 'lime',
    'Kontrola': 'success',
    'Problem': 'destructive',
    'Analiza': 'default',
    'Reklamacja': 'destructive',
    'Szkolenie': 'secondary',
  };
  
  return <Badge variant={colors[type] as any || 'secondary'}>{type}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'Wysoki':
      return <Badge variant="destructive">{priority}</Badge>;
    case 'Średni':
      return <Badge variant="outline">{priority}</Badge>;
    case 'Niski':
      return <Badge variant="secondary">{priority}</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Przed chwilą';
  if (diffInHours < 24) return `${diffInHours} godz. temu`;
  if (diffInHours < 48) return 'Wczoraj';
  return date.toLocaleDateString('pl-PL');
};

export default function NotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Wszystkie');
  const [priorityFilter, setPriorityFilter] = useState('Wszystkie');
  const [statusFilter, setStatusFilter] = useState('Wszystkie');
  const [showAddNote, setShowAddNote] = useState(false);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (note.client && note.client.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'Wszystkie' || note.type === typeFilter;
    const matchesPriority = priorityFilter === 'Wszystkie' || note.priority === priorityFilter;
    const matchesStatus = statusFilter === 'Wszystkie' || 
                         (statusFilter === 'Ukończone' && note.isCompleted) ||
                         (statusFilter === 'Aktywne' && !note.isCompleted);
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const types = Array.from(new Set(notes.map(n => n.type)));
  const completedNotes = notes.filter(n => n.isCompleted);
  const highPriorityNotes = notes.filter(n => n.priority === 'Wysoki' && !n.isCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notatki</h1>
          <p className="text-gray-600 mt-1">Zarządzaj notatkami projektowymi i służbowymi</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Eksport PDF</Button>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowAddNote(!showAddNote)}
          >
            + Nowa notatka
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie notatki</p>
                <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywne</p>
                <p className="text-2xl font-bold text-yellow-600">{notes.length - completedNotes.length}</p>
              </div>
              <div className="text-2xl">🔄</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wysoki priorytet</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityNotes.length}</p>
              </div>
              <div className="text-2xl">🔥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ukończone</p>
                <p className="text-2xl font-bold text-green-600">{completedNotes.length}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <Card>
          <CardHeader>
            <CardTitle>Dodaj nową notatkę</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Tytuł notatki..." />
              <Select>
                <option value="">Wybierz typ</option>
                <option value="Spotkanie">Spotkanie</option>
                <option value="Kontrola">Kontrola</option>
                <option value="Problem">Problem</option>
                <option value="Analiza">Analiza</option>
                <option value="Reklamacja">Reklamacja</option>
                <option value="Szkolenie">Szkolenie</option>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select>
                <option value="">Wybierz priorytet</option>
                <option value="Wysoki">Wysoki</option>
                <option value="Średni">Średni</option>
                <option value="Niski">Niski</option>
              </Select>
              <Input placeholder="Klient (opcjonalnie)..." />
            </div>
            <Textarea placeholder="Treść notatki..." rows={4} />
            <Input placeholder="Tagi (oddzielone przecinkami)..." />
            <div className="flex space-x-2">
              <Button className="bg-primary hover:bg-primary/90">Zapisz notatkę</Button>
              <Button variant="outline" onClick={() => setShowAddNote(false)}>Anuluj</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority Alert */}
      {highPriorityNotes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">🔥</span>
              <div>
                <h3 className="font-medium text-red-800">Notatki o wysokim priorytecie</h3>
                <p className="text-sm text-red-700">
                  {highPriorityNotes.length} notatek wymaga natychmiastowej uwagi
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Pokaż wszystkie
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
                placeholder="Szukaj po tytule, treści, tagach lub kliencie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <option value="Wszystkie">Wszystkie typy</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <option value="Wszystkie">Wszystkie priorytety</option>
              <option value="Wysoki">Wysoki</option>
              <option value="Średni">Średni</option>
              <option value="Niski">Niski</option>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="Wszystkie">Wszystkie statusy</option>
              <option value="Aktywne">Aktywne</option>
              <option value="Ukończone">Ukończone</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className={`${note.isCompleted ? 'bg-gray-50' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className={`text-lg ${note.isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {note.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    {getTypeBadge(note.type)}
                    {getPriorityBadge(note.priority)}
                    {note.isCompleted && <Badge variant="success">Ukończone</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm">⋮</Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-gray-700 mb-4 ${note.isCompleted ? 'text-gray-500' : ''}`}>
                {note.content}
              </p>
              
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <div>Autor: {note.author}</div>
                  {note.client && <div>Klient: {note.client}</div>}
                </div>
                <div className="text-right">
                  <div>{formatDate(note.createdDate)}</div>
                  {note.updatedDate !== note.createdDate && (
                    <div className="text-xs">Edytowano: {formatDate(note.updatedDate)}</div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm">Edytuj</Button>
                {!note.isCompleted && (
                  <Button variant="outline" size="sm" className="text-green-600">
                    Oznacz jako ukończone
                  </Button>
                )}
                <Button variant="outline" size="sm">Udostępnij</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak notatek</h3>
            <p className="text-gray-600 mb-4">
              Nie znaleziono notatek spełniających kryteria wyszukiwania.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowAddNote(true)}
            >
              Dodaj pierwszą notatkę
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}