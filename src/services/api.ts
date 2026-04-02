import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  r => r,
  err => {
    console.error('API error:', err.response?.data ?? err.message)
    return Promise.reject(err)
  }
)

// ── Tenant resolution ──────────────────────────────────────────────
export const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? '00000000-0000-0000-0000-000000000000'

// ── Enum maps (frontend string → backend int) ──────────────────────
const TriggerTypeMap: Record<string, number> = {
  Keyword:       0,
  IntentPattern: 1,
  Regex:         2,
}

const TriggerPriorityMap: Record<string, number> = {
  Low:      0,
  Medium:   1,
  High:     2,
  Critical: 3,
}

const ConversationStatusMap: Record<string, number> = {
  Open:         0,
  WaitingHuman: 1,
  InProgress:   2,
  Resolved:     3,
  Abandoned:    4,
}

// ── Types ──────────────────────────────────────────────────────────
export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
}

export interface WhatsAppNumber {
  id: string
  tenantId: string
  phoneNumberId: string
  wabaId: string
  displayName: string
  status: 'Disconnected' | 'Connecting' | 'Online' | 'Banned' | 'Suspended'
  connectedAt: string | null
}

export interface Conversation {
  id: string
  contactId: string
  whatsAppNumberId: string
  status: 'Open' | 'WaitingHuman' | 'InProgress' | 'Resolved' | 'Abandoned'
  handoffReason: string
  agentName: string | null
  startedAt: string
  closedAt: string | null
  messageCount: number
  lastMessage: string | null
}

export interface Message {
  id: string
  conversationId: string
  waMessageId: string | null
  direction: 'Inbound' | 'Outbound'
  type: string
  senderType: 'User' | 'Bot' | 'Agent'
  content: string | null
  mediaUrl: string | null
  sentAt: string
  deliveredAt: string | null
  readAt: string | null
}

export interface KnowledgeSource {
  id: string
  whatsAppNumberId: string
  sourceType: 'ManualText' | 'PdfUpload' | 'DocxUpload' | 'UrlCrawl' | 'ApiSync'
  title: string
  tokenCount: number
  status: 'Pending' | 'Processing' | 'Indexed' | 'Failed' | 'Outdated'
  indexedAt: string | null
}

export interface HandoffTrigger {
  id: string
  whatsAppNumberId: string
  triggerType: 'Keyword' | 'IntentPattern' | 'Regex'
  value: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  isActive: boolean
}

export interface BotConfig {
  id: string
  whatsAppNumberId: string
  systemPrompt: string
  aiModel: string
  temperature: number
  maxTokens: number
  isActive: boolean
  workStart: string | null
  workEnd: string | null
  outOfHoursMsg: string | null
}

export interface DashboardMetrics {
  totalMessagesToday: number
  totalMessagesPeriod: number
  aiResolutionRate: number
  avgResponseTimeSeconds: number
  pendingHandoffs: number
  totalCostUsd: number
  dailyVolume: DailyVolume[]
}

export interface DailyVolume {
  date: string
  inbound: number
  outbound: number
  handoffs: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ── API calls ──────────────────────────────────────────────────────
export const apiService = {
  // Dashboard
  getMetrics: (from?: string, to?: string) =>
    api.get<DashboardMetrics>('/metrics/dashboard', {
      params: { tenantId: TENANT_ID, from, to }
    }).then(r => r.data),

  // Numbers
  getNumbers: () =>
    api.get<WhatsAppNumber[]>('/numbers', {
      params: { tenantId: TENANT_ID }
    }).then(r => r.data),

  addNumber: (data: {
    displayName: string
    phoneNumberId: string
    wabaId: string
    accessToken: string
    verifyToken: string
  }) =>
    api.post<WhatsAppNumber>('/numbers', {
      tenantId:      TENANT_ID,
      displayName:   data.displayName,
      phoneNumberId: data.phoneNumberId,
      wabaId:        data.wabaId,
      accessToken:   data.accessToken,
      verifyToken:   data.verifyToken,
    }).then(r => r.data),

  // Conversations
  getConversations: (status?: string, page = 1) =>
    api.get<PagedResult<Conversation>>('/conversations', {
      params: {
        tenantId: TENANT_ID,
        // ✅ converte status string → int antes de enviar
        status: status != null ? ConversationStatusMap[status] ?? status : undefined,
        page,
        pageSize: 20,
      }
    }).then(r => r.data),

  getMessages: (conversationId: string, page = 1) =>
    api.get<PagedResult<Message>>(`/conversations/${conversationId}/messages`, {
      params: { page, pageSize: 50 }
    }).then(r => r.data),

  assignAgent: (conversationId: string, agentId: string, agentName: string) =>
    api.post(`/conversations/${conversationId}/assign`, { agentId, agentName }),

  closeConversation: (conversationId: string, csatScore?: number, csatComment?: string) =>
    api.post(`/conversations/${conversationId}/close`, { csatScore, csatComment }),

  // Knowledge
  getKnowledge: (numberId: string) =>
    api.get<KnowledgeSource[]>(`/knowledge/${numberId}`).then(r => r.data),

  addKnowledgeText: (numberId: string, title: string, content: string) =>
    api.post<KnowledgeSource>('/knowledge/text', {
      whatsAppNumberId: numberId, title, content
    }).then(r => r.data),

  addKnowledgeUrl: (numberId: string, title: string, url: string) =>
    api.post<KnowledgeSource>('/knowledge/url', {
      whatsAppNumberId: numberId, title, url
    }).then(r => r.data),

  deleteKnowledge: (sourceId: string) =>
    api.delete(`/knowledge/${sourceId}`),

  // Bot Config
  getBotConfig: (numberId: string) =>
    api.get<BotConfig>(`/bot-config/${numberId}`).then(r => r.data),

  saveBotConfig: (config: Partial<BotConfig> & { whatsAppNumberId: string }) =>
    api.put<BotConfig>('/bot-config', config).then(r => r.data),

  // Handoff Triggers
  getTriggers: (numberId: string) =>
    api.get<HandoffTrigger[]>(`/handoff-triggers/${numberId}`).then(r => r.data),

  saveTrigger: (trigger: Partial<HandoffTrigger> & { whatsAppNumberId: string }) =>
    api.put<HandoffTrigger>('/handoff-triggers', {
      id:               trigger.id ?? null,
      whatsAppNumberId: trigger.whatsAppNumberId,
      // ✅ converte string → int para o backend .NET
      triggerType: typeof trigger.triggerType === 'string'
        ? TriggerTypeMap[trigger.triggerType] ?? 0
        : trigger.triggerType,
      value:    trigger.value,
      priority: typeof trigger.priority === 'string'
        ? TriggerPriorityMap[trigger.priority] ?? 0
        : trigger.priority,
      isActive:      trigger.isActive ?? true,
      transitionMsg: (trigger as any).transitionMsg ?? null,
    }).then(r => r.data),

  deleteTrigger: (triggerId: string) =>
    api.delete(`/handoff-triggers/${triggerId}`),
}