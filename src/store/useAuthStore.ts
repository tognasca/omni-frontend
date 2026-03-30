import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface AuthUser {
  id:         string
  name:       string
  email:      string
  role:       'SuperAdmin' | 'Admin' | 'Agent'
  tenantId:   string
  tenantName: string
  tenantSlug: string
}

interface AuthStore {
  user:         AuthUser | null
  accessToken:  string | null
  refreshToken: string | null
  isLoading:    boolean

  login:   (email: string, password: string) => Promise<void>
  logout:  () => Promise<void>
  refresh: () => Promise<void>

  isSuperAdmin: () => boolean
  isAdmin:      () => boolean
  canManageUsers: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,

      login: async (email, password) => {
        const { data } = await axios.post('/api/auth/login', { email, password })
        set({
          accessToken:  data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id:         data.userId,
            name:       data.name,
            email:      data.email,
            role:       data.role,
            tenantId:   data.tenantId,
            tenantName: data.tenantName,
            tenantSlug: data.tenantSlug,
          }
        })
        // Set default auth header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      },

      logout: async () => {
        const { refreshToken } = get()
        if (refreshToken) {
          try {
            await axios.post('/api/auth/logout', { refreshToken })
          } catch { /* ignore */ }
        }
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, refreshToken: null })
      },

      refresh: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`
      },

      isSuperAdmin:   () => get().user?.role === 'SuperAdmin',
      isAdmin:        () => ['Admin', 'SuperAdmin'].includes(get().user?.role ?? ''),
      canManageUsers: () => ['Admin', 'SuperAdmin'].includes(get().user?.role ?? ''),
    }),
    {
      name: 'omni-auth',
      // Only persist tokens and user, not loading state
      partialize: (s) => ({
        user:         s.user,
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore auth header on page reload
        if (state?.accessToken) {
          axios.defaults.headers.common['Authorization'] =
            `Bearer ${state.accessToken}`
        }
      }
    }
  )
)
