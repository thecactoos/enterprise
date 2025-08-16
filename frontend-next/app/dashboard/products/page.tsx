'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts, useInfiniteProducts } from '@/hooks/use-products';

// Product interface based on our actual database schema
interface Product {
  id: string;
  product_code: string;
  product_name: string;
  selling_price_per_unit: number;
  retail_price_per_unit?: number;
  selling_unit: string;
  type_of_finish?: string;
  surface?: string;
  thickness_mm?: number;
  width_mm?: number;
  length_mm?: number;
  package_m2?: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const getStatusBadge = (status: string, isActive: boolean) => {
  if (!isActive) {
    return <Badge variant="destructive">Nieaktywny</Badge>;
  } else if (status === 'active') {
    return <Badge variant="default">Aktywny</Badge>;
  } else {
    return <Badge variant="outline">{status}</Badge>;
  }
};

const getCategoryBadge = (typeOfFinish: string) => {
  if (!typeOfFinish) return <Badge variant="secondary">Brak kategorii</Badge>;
  
  const colors: { [key: string]: string } = {
    'pvc': 'default',
    'vinyl': 'default', 
    'wood': 'success',
    'laminate': 'lime',
    'ceramic': 'outline',
    'stone': 'secondary',
  };
  
  const lowerType = typeOfFinish.toLowerCase();
  const variant = Object.keys(colors).find(key => lowerType.includes(key));
  
  return <Badge variant={colors[variant || 'secondary'] as any}>{typeOfFinish}</Badge>;
};

const formatPrice = (price: number | null | undefined, unit: string) => {
  if (!price) return 'Brak ceny';
  return `${price.toFixed(2)} zł/${unit}`;
};

const formatDimensions = (product: Product) => {
  const dims = [];
  if (product.thickness_mm) dims.push(`${product.thickness_mm}mm`);
  if (product.width_mm) dims.push(`${product.width_mm}mm`);
  if (product.length_mm) dims.push(`${product.length_mm}mm`);
  return dims.length > 0 ? dims.join(' × ') : 'Brak wymiarów';
};

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Wszystkie');
  const [statusFilter, setStatusFilter] = useState('Wszystkie');
  const searchParams = useSearchParams();
  
  // Get search from URL parameters (from product search dropdown)
  const urlSearch = searchParams.get('search');
  const selectedProductId = searchParams.get('selected');

  // Use the search term from URL if available
  useEffect(() => {
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  // Fetch products with search and filters
  const { data: productsData, isLoading, error } = useProducts({
    search: searchTerm || undefined,
    limit: 50, // Show more products per page
  });

  const products = productsData?.items || [];
  
  // Get unique categories for filter
  const categories = Array.from(new Set(
    products.map(p => p.type_of_finish).filter(Boolean)
  ));

  // Filter products based on local filters
  const filteredProducts = products.filter(product => {
    const matchesCategory = categoryFilter === 'Wszystkie' || product.type_of_finish === categoryFilter;
    const matchesStatus = statusFilter === 'Wszystkie' || 
      (statusFilter === 'Aktywny' && product.is_active && product.status === 'active') ||
      (statusFilter === 'Nieaktywny' && !product.is_active);
    
    return matchesCategory && matchesStatus;
  });

  // Calculate stats
  const totalProducts = productsData?.total || 0;
  const activeProducts = products.filter(p => p.is_active).length;
  const averagePrice = products.length > 0 
    ? products.reduce((sum, p) => sum + (p.selling_price_per_unit || 0), 0) / products.length 
    : 0;

  // Highlight selected product from search
  useEffect(() => {
    if (selectedProductId) {
      const element = document.getElementById(`product-${selectedProductId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-blue-50', 'border-l-4', 'border-l-blue-500');
      }
    }
  }, [selectedProductId, products]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl mb-2">❌ Błąd ładowania produktów</div>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produkty</h1>
          <p className="text-gray-600 mt-1">Katalog {totalProducts.toLocaleString()} produktów podłogowych i budowlanych</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Import CSV</Button>
          <Button className="bg-primary hover:bg-primary/90">
            + Dodaj produkt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wszystkie produkty</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts.toLocaleString()}</p>
              </div>
              <div className="text-2xl">📦</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktywne</p>
                <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kategorie</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="text-2xl">🏷️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Średnia cena</p>
                <p className="text-2xl font-bold text-gray-900">{averagePrice.toFixed(0)} zł</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Search Info */}
      {searchTerm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🔍</span>
                <span className="text-blue-800">
                  Wyniki wyszukiwania dla: <strong>"{searchTerm}"</strong> 
                  ({productsData?.total || 0} wyników)
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSearchTerm('')}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Wyczyść wyszukiwanie
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
                placeholder="Szukaj po nazwie lub kodzie produktu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Wszystkie">Wszystkie kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Wszystkie">Wszystkie statusy</option>
              <option value="Aktywny">Aktywny</option>
              <option value="Nieaktywny">Nieaktywny</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Katalog produktów ({filteredProducts.length} z {products.length} wyświetlonych)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Ładowanie produktów...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Wymiary</TableHead>
                  <TableHead>Cena sprzedaży</TableHead>
                  <TableHead>Cena detaliczna</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id}
                    id={`product-${product.id}`}
                    className="transition-colors"
                  >
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate" title={product.product_name}>
                          {product.product_name}
                        </div>
                        {product.surface && (
                          <div className="text-sm text-gray-500">
                            {product.surface}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {product.product_code}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(product.type_of_finish || '')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDimensions(product)}
                      {product.package_m2 && (
                        <div className="text-xs text-gray-500">
                          Paczka: {product.package_m2} m²
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(product.selling_price_per_unit, product.selling_unit)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatPrice(product.retail_price_per_unit, product.selling_unit)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.status, product.is_active)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edytuj
                        </Button>
                        <Button variant="outline" size="sm">
                          Do oferty
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* No results */}
          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-xl mb-2">📦</div>
              <p className="text-gray-600">
                {searchTerm 
                  ? `Brak produktów dla zapytania: "${searchTerm}"`
                  : 'Brak produktów do wyświetlenia'
                }
              </p>
            </div>
          )}

          {/* Load more info */}
          {productsData && productsData.total > products.length && (
            <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Wyświetlane {products.length} z {productsData.total.toLocaleString()} produktów.
                Użyj wyszukiwania, aby zawęzić wyniki.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}