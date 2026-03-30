import { create } from 'zustand'

interface HandoffAlert {
  conversationId: string
  contactName: string
  lastMessage: string
  timestamp: string
}

interface Store {
  // SignalR
  signalRStatus: 'connected' | 'disconnected' | 'reconnecting'
  setSignalRStatus: (s: Store['signalRStatus']) => void

  // Real-time messages
  realtimeMessages: Array<{ conversationId: string; content: string; sender: string; timestamp: string }>
  addRealtimeMessage: (msg: any) => void

  // Conversation status cache
  conversationStatuses: Record<string, string>
  updateConversationStatus: (id: string, status: string) => void

  // Handoff alerts
  handoffAlerts: HandoffAlert[]
  addHandoffAlert: (alert: HandoffAlert) => void
  dismissHandoffAlert: (id: string) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  selectedNumberId: string | null
  setSelectedNumberId: (id: string | null) => void
  selectedConversationId: string | null
  setSelectedConversationId: (id: string | null) => void
}

export const useStore = create<Store>((set) => ({
  signalRStatus: 'disconnected',
  setSignalRStatus: (signalRStatus) => set({ signalRStatus }),

  realtimeMessages: [],
  addRealtimeMessage: (msg) =>
    set((s) => ({ realtimeMessages: [msg, ...s.realtimeMessages].slice(0, 100) })),

  conversationStatuses: {},
  updateConversationStatus: (id, status) =>
    set((s) => ({ conversationStatuses: { ...s.conversationStatuses, [id]: status } })),

  handoffAlerts: [],
  addHandoffAlert: (alert) =>
    set((s) => ({ handoffAlerts: [alert, ...s.handoffAlerts] })),
  dismissHandoffAlert: (id) =>
    set((s) => ({ handoffAlerts: s.handoffAlerts.filter(a => a.conversationId !== id) })),

  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  selectedNumberId: null,
  setSelectedNumberId: (selectedNumberId) => set({ selectedNumberId }),

  selectedConversationId: null,
  setSelectedConversationId: (selectedConversationId) => set({ selectedConversationId }),
}))
