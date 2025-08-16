import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  useInfiniteQuery
} from '@tanstack/react-query';
import { productsApi, ProductsParams } from '../lib/api-functions';
import { QUERY_KEYS } from '../lib/constants';
import type { Product, PaginatedResponse } from '../types/api';

// =============================================================================
// PRODUCTS QUERIES
// =============================================================================

// Standard products list - Returns array (backend doesn't implement pagination yet)
export function useProducts(
  params?: ProductsParams,
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, params],
    queryFn: () => productsApi.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minut - produkty się rzadko zmieniają
    ...options,
  });
}

// Infinite scroll for large product catalog - NOTE: Backend doesn't return pagination yet
// This will need to be updated when backend implements proper pagination
export function useInfiniteProducts(
  params?: Omit<ProductsParams, 'page'>,
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.products, 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      productsApi.getProducts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      // Backend returns array, not paginated response
      // For now, we'll disable infinite loading until backend supports pagination
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Single product
export function useProduct(
  id: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minut dla pojedynczego produktu
    ...options,
  });
}

// Product by code (często używane w systemach CRM)
export function useProductByCode(
  code: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, 'by-code', code],
    queryFn: () => productsApi.getProductByCode(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

// =============================================================================
// PRODUCTS MUTATIONS
// =============================================================================

export function useCreateProduct(
  options?: UseMutationOptions<Product, Error, Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: (newProduct) => {
      // Invalidate all products queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      
      // Set in cache
      queryClient.setQueryData(QUERY_KEYS.product(newProduct.id), newProduct);
      
      console.log('Product created successfully:', newProduct);
    },
    onError: (error) => {
      console.error('Failed to create product:', error);
    },
    ...options,
  });
}

export function useUpdateProduct(
  options?: UseMutationOptions<Product, Error, Partial<Product> & { id: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.updateProduct,
    onSuccess: (updatedProduct) => {
      // Update single product cache
      queryClient.setQueryData(QUERY_KEYS.product(updatedProduct.id), updatedProduct);
      
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      
      console.log('Product updated successfully:', updatedProduct);
    },
    onError: (error) => {
      console.error('Failed to update product:', error);
    },
    ...options,
  });
}

export function useDeleteProduct(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: (_, productId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.product(productId) });
      
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      
      console.log('Product deleted successfully:', productId);
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
    },
    ...options,
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

// Prefetch dla lepszej UX (np. hover na product card)
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.product(id),
      queryFn: () => productsApi.getProduct(id),
      staleTime: 30 * 1000,
    });
  };
}

// Search suggestions (debounced)
export function useProductSearch(
  searchTerm: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, 'search', searchTerm],
    queryFn: async () => {
      console.log('🔎 useProductSearch - Executing query for:', searchTerm);
      try {
        // Call API and expect direct array response (not paginated)
        const result = await productsApi.getProducts({ 
          search: searchTerm, 
          limit: 10 // Limit for suggestions
        });
        console.log('✅ useProductSearch - Success:', result);
        
        // The API returns a direct array, not a paginated response
        // So we'll return it as-is since the component now expects SearchProduct[]
        return result;
      } catch (error) {
        console.error('❌ useProductSearch - Error:', error);
        throw error;
      }
    },
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 30 * 1000, // Quick search results
    retry: 1, // Only retry once for search
  });
}