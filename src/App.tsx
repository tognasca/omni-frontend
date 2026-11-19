import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { useSignalR } from '@/hooks/useSignalR'
import { useAuthStore } from '@/store/useAuthStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { ConversationsPage } from '@/pages/ConversationsPage'
import { LoginPage } from '@/pages/LoginPage'
import { AdminPage } from '@/pages/AdminPage'
import {
  NumbersPage, KnowledgePage, TriggersPage,
  SettingsPage, MetricsPage
} from '@/pages/OtherPages'
import { WhatsAppSignupPreview } from '@/components/WhatsAppSignupPreview'
import '@/index.css'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } } // ✅ 60 segundos
})

// ── Protected wrapper ────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuthStore()
  if (!isAdmin()) return <Navigate to="/" replace />
  return <>{children}</>
}

function SignupPreviewForAdmin() {
  const { isAdmin } = useAuthStore()
  return isAdmin() ? <WhatsAppSignupPreview /> : null
}

// ── App shell ────────────────────────────────────────────────────
function AppShell() {
  useSignalR()
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"              element={<DashboardPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/numbers"       element={<div className="flex h-full flex-col"><SignupPreviewForAdmin /><div className="min-h-0 flex-1 overflow-auto"><NumbersPage /></div></div>} />
          <Route path="/knowledge"     element={<KnowledgePage />} />
          <Route path="/triggers"      element={<TriggersPage />} />
          <Route path="/metrics"       element={<MetricsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
          <Route path="/admin"         element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Login — público */}
          <Route path="/login" element={<LoginPage />} />

          {/* Tudo o mais — protegido */}
          <Route path="/*" element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
