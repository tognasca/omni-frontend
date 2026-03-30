import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService, type Conversation, type Message } from '@/services/api'
import { TopBar, HandoffAlerts } from '@/components/layout/TopBar'
import { useStore } from '@/store/useStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search, Filter, Bot, User, UserCheck,
  CheckCheck, Clock, ArrowLeft, Send, PhoneCall
} from 'lucide-react'
import clsx from 'clsx'

const statusLabel: Record<string, string> = {
  Open: 'Aberta', WaitingHuman: 'Aguarda humano',
  InProgress: 'Em atendimento', Resolved: 'Resolvida', Abandoned: 'Abandonada'
}
const statusClass: Record<string, string> = {
  Open: 'badge-ai', WaitingHuman: 'badge-warning',
  InProgress: 'badge-human', Resolved: 'badge-online', Abandoned: 'badge-offline'
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === 'Outbound'
  const isBot = msg.senderType === 'Bot'
  const isAgent = msg.senderType === 'Agent'

  return (
    <div className={clsx('flex gap-2 max-w-[85%]', isOutbound ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5',
        isBot   ? 'bg-violet-500/20 text-violet-400' :
        isAgent ? 'bg-sky-500/20 text-sky-400' :
                  'bg-surface-4 text-slate-300'
      )}>
        {isBot ? <Bot size={13} /> : isAgent ? <UserCheck size={13} /> : <User size={13} />}
      </div>
      <div>
        <div className={clsx(
          'px-3 py-2 rounded-2xl text-sm leading-relaxed',
          isOutbound
            ? isBot
              ? 'bg-violet-500/15 text-violet-100 border border-violet-500/20 rounded-tr-sm'
              : 'bg-sky-500/15 text-sky-100 border border-sky-500/20 rounded-tr-sm'
            : 'bg-surface-3 text-slate-200 border border-surface-4 rounded-tl-sm'
        )}>
          {msg.content ?? <span className="italic text-slate-400">[mídia]</span>}
        </div>
        <div className={clsx(
          'flex items-center gap-1 mt-1 text-[10px] text-slate-600',
          isOutbound ? 'justify-end' : 'justify-start'
        )}>
          {format(new Date(msg.sentAt), 'HH:mm', { locale: ptBR })}
          {isOutbound && msg.readAt && <CheckCheck size={10} className="text-brand-400" />}
          {isOutbound && msg.deliveredAt && !msg.readAt && <CheckCheck size={10} />}
        </div>
      </div>
    </div>
  )
}

function ConvItem({ conv, isSelected, onClick }: { conv: Conversation; isSelected: boolean; onClick: () => void }) {
  const liveStatus = useStore(s => s.conversationStatuses[conv.id])
  const status = (liveStatus ?? conv.status) as Conversation['status']

  return (
    <div
      onClick={onClick}
      className={clsx(
        'px-4 py-3 cursor-pointer transition-all duration-150 border-b border-surface-3/50',
        'hover:bg-surface-3/50',
        isSelected && 'bg-brand-500/10 border-l-2 border-l-brand-500'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-4 flex items-center justify-center text-sm font-display font-600 text-brand-300 flex-shrink-0">
          {conv.contactId.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-white truncate">{conv.contactId.slice(0, 8)}...</p>
            <span className="text-[10px] text-slate-500 flex-shrink-0">
              {format(new Date(conv.startedAt), 'HH:mm')}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMessage ?? 'Sem mensagens'}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full border', statusClass[status])}>
              {statusLabel[status]}
            </span>
            <span className="text-[10px] text-slate-600">{conv.messageCount} msgs</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConversationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const { selectedConversationId, setSelectedConversationId } = useStore()
  const qc = useQueryClient()

  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations', statusFilter],
    queryFn:  () => apiService.getConversations(statusFilter || undefined),
    refetchInterval: 10000,
  })

  const { data: msgData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn:  () => selectedConversationId ? apiService.getMessages(selectedConversationId) : null,
    enabled:  !!selectedConversationId,
    refetchInterval: 61140,
  })

  const assignMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiService.assignAgent(id, crypto.randomUUID(), 'Agente Dashboard'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })

  const closeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => apiService.closeConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedConversationId(null)
    },
  })

  const convs = convData?.items ?? []
  const filtered = convs.filter(c =>
    !search || c.lastMessage?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = convs.find(c => c.id === selectedConversationId)
  const msgs = msgData?.items ?? []

  const statuses = ['', 'Open', 'WaitingHuman', 'InProgress', 'Resolved']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Conversas" />
      <HandoffAlerts />

      <div className="flex flex-1 overflow-hidden">
        {/* List panel */}
        <div className={clsx(
          'flex flex-col border-r border-surface-3 overflow-hidden',
          'w-full lg:w-80 xl:w-96 flex-shrink-0',
          selectedConversationId && 'hidden lg:flex'
        )}>
          {/* Filters */}
          <div className="p-3 space-y-2 border-b border-surface-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-9 py-1.5 text-xs"
                placeholder="Buscar conversa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    'text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all border',
                    statusFilter === s
                      ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                      : 'text-slate-500 border-surface-4 hover:text-slate-300'
                  )}
                >
                  {s ? statusLabel[s] : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-surface-3 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <MessageSquareIcon />
                <p className="text-sm">Nenhuma conversa</p>
              </div>
            ) : (
              filtered.map(conv => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isSelected={conv.id === selectedConversationId}
                  onClick={() => setSelectedConversationId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={clsx(
          'flex-1 flex flex-col overflow-hidden',
          !selectedConversationId && 'hidden lg:flex'
        )}>
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 h-14 border-b border-surface-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="lg:hidden btn-ghost p-1.5"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-surface-4 flex items-center justify-center text-sm font-display font-600 text-brand-300">
                  {selectedConv.contactId.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Contato {selectedConv.contactId.slice(0, 8)}</p>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full border', statusClass[selectedConv.status])}>
                    {statusLabel[selectedConv.status]}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selectedConv.status === 'WaitingHuman' && (
                    <button
                      onClick={() => assignMutation.mutate({ id: selectedConv.id })}
                      disabled={assignMutation.isPending}
                      className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                    >
                      <PhoneCall size={13} /> Assumir
                    </button>
                  )}
                  {['Open', 'InProgress', 'WaitingHuman'].includes(selectedConv.status) && (
                    <button
                      onClick={() => closeMutation.mutate({ id: selectedConv.id })}
                      disabled={closeMutation.isPending}
                      className="btn-danger py-1.5 px-3 text-xs"
                    >
                      Encerrar
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Carregando...
                  </div>
                ) : msgs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Nenhuma mensagem
                  </div>
                ) : (
                  [...msgs].reverse().map(msg => <MessageBubble key={msg.id} msg={msg} />)
                )}
              </div>

              {/* Input (desabilitado quando bot está respondendo) */}
              <div className="flex items-center gap-3 px-4 py-3 border-t border-surface-3 bg-surface-1">
                {selectedConv.status === 'InProgress' ? (
                  <>
                    <input
                      className="input flex-1 py-2 text-sm"
                      placeholder="Digite uma mensagem como agente..."
                    />
                    <button className="btn-primary p-2.5">
                      <Send size={16} />
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 text-center w-full py-1">
                    {selectedConv.status === 'Open'
                      ? '🤖 IA está respondendo automaticamente'
                      : selectedConv.status === 'WaitingHuman'
                      ? '⏳ Aguardando agente assumir o atendimento'
                      : '✅ Conversa encerrada'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center">
                <MessageSquareIcon size={28} />
              </div>
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageSquareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
