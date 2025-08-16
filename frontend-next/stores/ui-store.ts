// Zustand store dla UI state (modals, drawers, notifications, etc.)

import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';

// Types for UI state
interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UiState {
  // Modals
  modals: Modal[];
  
  // Drawers/Sidebars
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string;
  
  // Toasts/Notifications
  toasts: Toast[];
  
  // Search
  globalSearchQuery: string;
  isGlobalSearchOpen: boolean;
  
  // Theme (for future use)
  theme: 'light' | 'dark' | 'system';
  
  // Actions - Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Actions - Toasts
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Search  
  setGlobalSearchQuery: (query: string) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  
  // Actions - Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUiStore = create<UiState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
    // Initial state
    modals: [],
    isSidebarOpen: true,
    isMobileSidebarOpen: false,
    globalLoading: false,
    loadingMessage: '',
    toasts: [],
    globalSearchQuery: '',
    isGlobalSearchOpen: false,
    theme: 'light',

    // Modal actions
    openModal: (modal) => {
      const id = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newModal = { ...modal, id };
      
      set((state) => ({
        modals: [...state.modals, newModal],
      }));
      
      return id;
    },

    closeModal: (id) => {
      set((state) => ({
        modals: state.modals.filter((modal) => modal.id !== id),
      }));
    },

    closeAllModals: () => {
      set({ modals: [] });
    },

    // Sidebar actions
    toggleSidebar: () => {
      set((state) => ({
        isSidebarOpen: !state.isSidebarOpen,
      }));
    },

    setSidebarOpen: (open) => {
      set({ isSidebarOpen: open });
    },

    toggleMobileSidebar: () => {
      set((state) => ({
        isMobileSidebarOpen: !state.isMobileSidebarOpen,
      }));
    },

    setMobileSidebarOpen: (open) => {
      set({ isMobileSidebarOpen: open });
    },

    // Loading actions
    setGlobalLoading: (loading, message = '') => {
      set({
        globalLoading: loading,
        loadingMessage: message,
      });
    },

    // Toast actions
    addToast: (toast) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast = { 
        ...toast, 
        id,
        duration: toast.duration ?? (toast.type === 'error' ? 10000 : 5000)
      };
      
      set((state) => ({
        toasts: [...state.toasts, newToast],
      }));

      // Auto remove toast after duration
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
      
      return id;
    },

    removeToast: (id) => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    },

    clearToasts: () => {
      set({ toasts: [] });
    },

    // Search actions
    setGlobalSearchQuery: (query) => {
      set({ globalSearchQuery: query });
    },

    setGlobalSearchOpen: (open) => {
      set({ isGlobalSearchOpen: open });
    },

        // Theme actions
        setTheme: (theme) => {
          set({ theme });
          
          // Apply theme to document (only on client)
          if (typeof window !== 'undefined') {
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (theme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              // System theme
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (prefersDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }
          }
        },
      }),
      {
        name: 'ui-storage',
        storage: createJSONStorage(() => {
          // Use a safe storage that handles SSR
          if (typeof window === 'undefined') {
            return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            };
          }
          return localStorage;
        }),
        // Only persist theme and sidebar preferences
        partialize: (state) => ({
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen,
        }),
        // Handle hydration to prevent mismatches
        skipHydration: true,
      }
    )
  )
);

// Selectors for performance
export const useModals = () => useUiStore((state) => state.modals);
export const useSidebar = () => useUiStore((state) => ({ 
  isOpen: state.isSidebarOpen, 
  isMobileOpen: state.isMobileSidebarOpen 
}));
export const useGlobalLoading = () => useUiStore((state) => ({ 
  loading: state.globalLoading, 
  message: state.loadingMessage 
}));
export const useToasts = () => useUiStore((state) => state.toasts);
export const useGlobalSearch = () => useUiStore((state) => ({ 
  query: state.globalSearchQuery, 
  isOpen: state.isGlobalSearchOpen 
}));

// Hydration helper - call this on the client side
export const hydrateUiStore = () => {
  if (typeof window !== 'undefined') {
    useUiStore.persist.rehydrate();
  }
};

// Helper hooks for common UI operations
export const useToast = () => {
  const addToast = useUiStore((state) => state.addToast);
  
  return {
    success: (title: string, message?: string) => 
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => 
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      addToast({ type: 'info', title, message }),
  };
};

export const useModal = () => {
  const openModal = useUiStore((state) => state.openModal);
  const closeModal = useUiStore((state) => state.closeModal);
  
  return {
    open: openModal,
    close: closeModal,
  };
};