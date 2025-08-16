// Custom hooki używające React Query do zarządzania stanem serwera
// React Query automatycznie cache'uje dane, synchronizuje, retry itp.

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions 
} from '@tanstack/react-query';
import { contactsApi, ContactsParams } from '../lib/api-functions';
import { QUERY_KEYS } from '../lib/constants';
import type { Contact, PaginatedResponse } from '../types/api';

// =============================================================================
// CONTACTS QUERIES (GET/READ operations)
// =============================================================================

// Hook do pobierania listy kontaktów z automatycznym cache'owaniem
export function useContacts(
  params?: ContactsParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Contact>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.contacts, params],
    queryFn: () => contactsApi.getContacts(params),
    // Dane pozostają świeże przez 2 minuty
    staleTime: 2 * 60 * 1000,
    // Automatycznie refetch przy zmianie parametrów
    ...options,
  });
}

// Hook do pobierania pojedynczego kontaktu
export function useContact(
  id: string,
  options?: Omit<UseQueryOptions<Contact>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: QUERY_KEYS.contact(id),
    queryFn: () => contactsApi.getContact(id),
    // Nie wykonuj zapytania jeśli nie ma ID
    enabled: !!id,
    // Dane kontaktu rzadziej się zmieniają
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// =============================================================================
// CONTACTS MUTATIONS (CREATE/UPDATE/DELETE operations)
// =============================================================================

// Hook do tworzenia nowego kontaktu
export function useCreateContact(
  options?: UseMutationOptions<Contact, Error, Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsApi.createContact,
    onSuccess: (newContact) => {
      // Invalidate i refetch contacts list po stworzeniu
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      
      // Optimistically update cache z nowym kontaktem
      queryClient.setQueryData(QUERY_KEYS.contact(newContact.id), newContact);
      
      console.log('Contact created successfully:', newContact);
    },
    onError: (error) => {
      console.error('Failed to create contact:', error);
    },
    ...options,
  });
}

// Hook do aktualizacji kontaktu
export function useUpdateContact(
  options?: UseMutationOptions<Contact, Error, Partial<Contact> & { id: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsApi.updateContact,
    onSuccess: (updatedContact) => {
      // Update cache for single contact
      queryClient.setQueryData(QUERY_KEYS.contact(updatedContact.id), updatedContact);
      
      // Invalidate contacts list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      
      console.log('Contact updated successfully:', updatedContact);
    },
    onError: (error) => {
      console.error('Failed to update contact:', error);
    },
    ...options,
  });
}

// Hook do usuwania kontaktu
export function useDeleteContact(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsApi.deleteContact,
    onSuccess: (_, contactId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.contact(contactId) });
      
      // Invalidate contacts list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
      
      console.log('Contact deleted successfully:', contactId);
    },
    onError: (error) => {
      console.error('Failed to delete contact:', error);
    },
    ...options,
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

// Hook do prefetchowania kontaktu (dla lepszej UX)
export function usePrefetchContact() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.contact(id),
      queryFn: () => contactsApi.getContact(id),
      staleTime: 30 * 1000, // Prefetch na 30 sekund
    });
  };
}

// Hook do invalidowania cache kontaktów (gdy potrzebujemy fresh data)
export function useInvalidateContacts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contacts });
  };
}