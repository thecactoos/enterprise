'use client';

import { useAuthStore } from '../../stores/auth-store';

// Mock data for dashboard metrics
const metrics = [
  {
    name: 'Wszystkie kontakty',
    value: '1,247',
    change: '+12%',
    changeType: 'positive' as const,
    icon: '👥',
  },
  {
    name: 'Aktywne oferty',
    value: '48',
    change: '+8%',
    changeType: 'positive' as const,
    icon: '📄',
  },
  {
    name: 'Przychód miesięczny',
    value: '425,600 zł',
    change: '+15%',
    changeType: 'positive' as const,
    icon: '💰',
  },
  {
    name: 'Nowe leady',
    value: '32',
    change: '-3%',
    changeType: 'negative' as const,
    icon: '🎯',
  },
];

const recentActivity = [
  {
    id: 1,
    action: 'Nowy kontakt został dodany',
    contact: 'Jan Kowalski',
    time: '5 minut temu',
    type: 'contact',
  },
  {
    id: 2,
    action: 'Oferta została wysłana',
    contact: 'ABC Sp. z o.o.',
    time: '1 godzinę temu',
    type: 'quote',
  },
  {
    id: 3,
    action: 'Faktura została zapłacona',
    contact: 'XYZ Budowa',
    time: '3 godziny temu',
    type: 'payment',
  },
  {
    id: 4,
    action: 'Nowy produkt został dodany',
    contact: 'Panele podłogowe Premium',
    time: '1 dzień temu',
    type: 'product',
  },
];

const upcomingTasks = [
  {
    id: 1,
    title: 'Spotkanie z klientem ABC',
    time: 'Dziś, 14:00',
    priority: 'high' as const,
  },
  {
    id: 2,
    title: 'Przygotowanie oferty dla XYZ',
    time: 'Jutro, 10:00',
    priority: 'medium' as const,
  },
  {
    id: 3,
    title: 'Sprawdzenie statusu zamówienia',
    time: 'Jutro, 16:00',
    priority: 'low' as const,
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contact': return '👤';
      case 'quote': return '📄';
      case 'payment': return '💳';
      case 'product': return '📦';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Wysoki';
      case 'medium': return 'Średni';
      case 'low': return 'Niski';
      default: return 'Normalny';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-lg shadow-sm p-6 text-white">
        <h1 className="text-2xl font-bold">
          Witaj ponownie, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-primary-foreground/80">
          Oto przegląd Twojej działalności w systemie CRM
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className="text-2xl">{metric.icon}</div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">w tym miesiącu</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ostatnia aktywność</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.action}: <span className="font-medium">{activity.contact}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                Zobacz wszystkie aktywności →
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Nadchodzące zadania</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.time}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                Zobacz wszystkie zadania →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Szybkie akcje</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="text-center">
                <span className="text-2xl block mb-2">👤</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                  Dodaj kontakt
                </span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="text-center">
                <span className="text-2xl block mb-2">📄</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                  Nowa oferta
                </span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="text-center">
                <span className="text-2xl block mb-2">📦</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                  Dodaj produkt
                </span>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="text-center">
                <span className="text-2xl block mb-2">🧾</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                  Nowa faktura
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}