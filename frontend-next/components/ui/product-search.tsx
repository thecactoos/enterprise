'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProductSearch } from '../../hooks/use-products';
import type { Product, PaginatedResponse } from '../../types/api';

// Extended Product interface for search results (may have additional fields from backend)
interface SearchProduct extends Product {
  // Backend may return additional fields for search
  product_code?: string;
  product_name?: string;
  selling_price_per_unit?: number;
  selling_unit?: string;
  type_of_finish?: string;
  thickness_mm?: number;
  width_mm?: number;
  length_mm?: number;
}

export function ProductSearch() {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Simple debouncing with useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const { data: searchResults, isLoading, error } = useProductSearch(
    searchTerm,
    searchTerm.length >= 2
  );

  // Debug logging
  useEffect(() => {
    if (searchTerm.length >= 2) {
      console.log('🔍 ProductSearch - Search term:', searchTerm);
      console.log('🔍 ProductSearch - Is loading:', isLoading);
      console.log('🔍 ProductSearch - Results:', searchResults);
      console.log('🔍 ProductSearch - Error:', error);
    }
  }, [searchTerm, isLoading, searchResults, error]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(-1);
  };

  // Handle product selection
  const handleSelectProduct = (product: SearchProduct) => {
    setIsOpen(false);
    setInputValue('');
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    // Navigate to product details or add to quote
    router.push(`/dashboard/products?selected=${product.id}`);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !searchResults?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectProduct(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get product code - try different field names
  const getProductCode = (product: SearchProduct) => {
    return product.product_code || product.code || 'N/A';
  };

  // Get product name - try different field names
  const getProductName = (product: SearchProduct) => {
    return product.product_name || product.name || 'Unnamed Product';
  };

  // Get product price - try different field names
  const getProductPrice = (product: SearchProduct) => {
    return product.selling_price_per_unit || product.price || 0;
  };

  // Get product unit - try different field names
  const getProductUnit = (product: SearchProduct) => {
    return product.selling_unit || product.unit || 'szt';
  };

  // Format price for display
  const formatPrice = (product: SearchProduct) => {
    const price = getProductPrice(product);
    const unit = getProductUnit(product);
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${(numericPrice || 0).toFixed(2)} zł/${unit}`;
  };

  // Format dimensions
  const formatDimensions = (product: SearchProduct) => {
    const dims = [];
    if (product.thickness_mm) dims.push(`${product.thickness_mm}mm`);
    if (product.width_mm) dims.push(`${product.width_mm}mm`);
    if (product.length_mm) dims.push(`${product.length_mm}mm`);
    return dims.length > 0 ? dims.join(' × ') : null;
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-lg">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Szukaj produktów po nazwie lub kodzie..."
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2) {
              setIsOpen(true);
            }
          }}
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm">Szukam produktów...</span>
              </div>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <>
              {searchResults.slice(0, 8).map((product, index) => (
                <div
                  key={product.id}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  } ${index === searchResults.length - 1 ? 'border-b-0' : ''}`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {getProductCode(product)}
                        </span>
                        {product.type_of_finish && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {product.type_of_finish}
                          </span>
                        )}
                        {product.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {product.category}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getProductName(product)}
                      </p>
                      
                      {formatDimensions(product) && (
                        <p className="text-xs text-gray-500 mt-1">
                          📏 {formatDimensions(product)}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-3 flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(product)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {searchResults.length >= 8 && (
                <div className="px-4 py-2 text-center border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => router.push(`/dashboard/products?search=${encodeURIComponent(inputValue)}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Zobacz więcej wyników →
                  </button>
                </div>
              )}
            </>
          ) : inputValue.length >= 2 && !isLoading ? (
            <div className="px-4 py-6 text-center text-gray-500">
              <p className="text-sm">Brak produktów dla: "{inputValue}"</p>
              <p className="text-xs mt-1">Spróbuj innej frazy lub kodu produktu</p>
              {error && (
                <p className="text-xs mt-2 text-red-500">
                  Błąd: {error.message || 'Problem z połączeniem'}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default ProductSearch;