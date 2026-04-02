import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService, type KnowledgeSource, type HandoffTrigger, type BotConfig } from '@/services/api'
import { TopBar } from '@/components/layout/TopBar'
import { useStore } from '@/store/useStore'
import {
  Plus, Trash2, RefreshCw, Globe, FileText, Type,
  ChevronDown, Save, CheckCircle, AlertCircle, Loader
} from 'lucide-react'
import clsx from 'clsx'

// ── Numbers Page ──────────────────────────────────────────────────
export function NumbersPage() {
  const { data: numbers, isLoading } = useQuery({
    queryKey: ['numbers'],
    queryFn: apiService.getNumbers,
    refetchInterval: 190,
  })
  const { setSelectedNumberId, selectedNumberId } = useStore()
  const [showAdd, setShowAdd] = useState(false)

  const statusDot: Record<string, string> = {
    Online: 'bg-brand-500', Disconnected: 'bg-slate-500',
    Connecting: 'bg-amber-500', Banned: 'bg-red-500', Suspended: 'bg-red-500',
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <TopBar title="Números WhatsApp" />
      <div className="p-4 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(v => !v)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Adicionar número
          </button>
        </div>

        {showAdd && <AddNumberForm onClose={() => setShowAdd(false)} />}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse bg-surface-3" />
            ))}
          </div>
        ) : numbers?.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            <p className="text-sm">Nenhum número conectado ainda.</p>
            <p className="text-xs mt-1">Clique em "Adicionar número" para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {numbers?.map(n => (
              <div
                key={n.id}
                onClick={() => setSelectedNumberId(n.id === selectedNumberId ? null : n.id)}
                className={clsx(
                  'card p-4 cursor-pointer transition-all',
                  'hover:border-brand-500/30',
                  selectedNumberId === n.id && 'border-brand-500/40 bg-brand-500/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-surface-4 flex items-center justify-center text-brand-400 font-display font-700">
                      W
                    </div>
                    <span className={clsx('absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-2', statusDot[n.status] ?? 'bg-slate-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{n.displayName}</p>
                    <p className="text-xs text-slate-400 font-mono">{n.phoneNumberId}</p>
                  </div>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full border',
                    n.status === 'Online' ? 'badge-online' : 'badge-offline'
                  )}>
                    {n.status === 'Online' ? '● Online' : n.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AddNumberForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    displayName: '', phoneNumberId: '', wabaId: '',
    accessToken: '', verifyToken: 'omni_verify_dev',
    tenantId: import.meta.env.VITE_TENANT_ID ?? '00000000-0000-0000-0000-000000000000',
  })

  const mutation = useMutation({
    mutationFn: () => apiService.addNumber(form as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['numbers'] }); onClose() },
  })

  return (
    <div className="card p-5 space-y-3 animate-slide-up">
      <p className="text-sm font-display font-600 text-white">Novo número WhatsApp</p>
      {[
        { key: 'displayName', label: 'Nome de exibição', placeholder: 'Ex: Suporte Empresa' },
        { key: 'phoneNumberId', label: 'Phone Number ID (Meta)', placeholder: 'Do painel Meta Developers' },
        { key: 'wabaId', label: 'WABA ID', placeholder: 'WhatsApp Business Account ID' },
        { key: 'accessToken', label: 'Access Token', placeholder: 'System User Token' },
        { key: 'verifyToken', label: 'Verify Token', placeholder: 'Token do webhook' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="text-xs text-slate-400 block mb-1">{label}</label>
          <input
            className="input text-xs"
            placeholder={placeholder}
            value={(form as any)[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="btn-ghost flex-1 text-xs">Cancelar</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary flex-1 text-xs"
        >
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

// ── Knowledge Page ────────────────────────────────────────────────
export function KnowledgePage() {
  const { selectedNumberId } = useStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'text' | 'url'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { data: sources, isLoading } = useQuery({
    queryKey: ['knowledge', selectedNumberId],
    queryFn:  () => selectedNumberId ? apiService.getKnowledge(selectedNumberId) : [],
    enabled:  !!selectedNumberId,
    refetchInterval: 8000,
  })

  const addText = useMutation({
    mutationFn: () => apiService.addKnowledgeText(selectedNumberId!, title, content),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['knowledge'] }); setTitle(''); setContent('') },
  })

  const addUrl = useMutation({
    mutationFn: () => apiService.addKnowledgeUrl(selectedNumberId!, title, content),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['knowledge'] }); setTitle(''); setContent('') },
  })

  const del = useMutation({
    mutationFn: (id: string) => apiService.deleteKnowledge(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })

  const statusIcon = (s: KnowledgeSource['status']) => {
    if (s === 'Indexed')    return <CheckCircle size={14} className="text-brand-400" />
    if (s === 'Processing') return <Loader size={14} className="text-amber-400 animate-spin" />
    if (s === 'Failed')     return <AlertCircle size={14} className="text-red-400" />
    return <RefreshCw size={14} className="text-slate-400" />
  }

  if (!selectedNumberId) return (
    <div className="flex flex-col h-full">
      <TopBar title="Base de conhecimento" />
      <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
        Selecione um número em <span className="text-brand-400 mx-1">Números</span> primeiro
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <TopBar title="Base de conhecimento" />
      <div className="p-4 space-y-4">

        {/* Add form */}
        <div className="card p-5 space-y-3">
          <div className="flex gap-2">
            {(['text', 'url'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border',
                  tab === t
                    ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                    : 'text-slate-500 border-surface-4 hover:text-white'
                )}
              >
                {t === 'text' ? <><Type size={12} /> Texto</> : <><Globe size={12} /> URL</>}
              </button>
            ))}
          </div>
          <input
            className="input text-sm"
            placeholder="Título (ex: Catálogo 2026)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          {tab === 'text' ? (
            <textarea
              className="input text-sm min-h-[100px] resize-y"
              placeholder="Cole aqui o conteúdo que a IA deve aprender..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          ) : (
            <input
              className="input text-sm"
              placeholder="https://seusite.com.br/pagina"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          )}
          <button
            onClick={() => tab === 'text' ? addText.mutate() : addUrl.mutate()}
            disabled={!title || !content || addText.isPending || addUrl.isPending}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            {(addText.isPending || addUrl.isPending) ? <><Loader size={14} className="animate-spin" /> Indexando...</> : '+ Adicionar à base'}
          </button>
        </div>

        {/* Sources list */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-surface-3" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {sources?.map(s => (
              <div key={s.id} className="card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-4 flex items-center justify-center flex-shrink-0">
                  {s.sourceType === 'UrlCrawl' ? <Globe size={16} className="text-sky-400" /> : <FileText size={16} className="text-violet-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {statusIcon(s.status)}
                    <span className="text-xs text-slate-400">{s.status}</span>
                    {s.tokenCount > 0 && <span className="text-xs text-slate-600">{s.tokenCount.toLocaleString()} tokens</span>}
                  </div>
                </div>
                <button
                  onClick={() => del.mutate(s.id)}
                  className="btn-ghost p-1.5 text-slate-600 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Triggers Page ─────────────────────────────────────────────────
export function TriggersPage() {
  const { selectedNumberId } = useStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ value: '', triggerType: 'Keyword' as HandoffTrigger['triggerType'], priority: 'High' as HandoffTrigger['priority'], transitionMsg: '' })

  const { data: triggers, isLoading } = useQuery({
    queryKey: ['triggers', selectedNumberId],
    queryFn:  () => selectedNumberId ? apiService.getTriggers(selectedNumberId) : [],
    enabled:  !!selectedNumberId,
  })

  const save = useMutation({
    mutationFn: () => apiService.saveTrigger({ ...form, whatsAppNumberId: selectedNumberId!, isActive: true }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['triggers'] }); setShowForm(false); setForm({ value: '', triggerType: 'Keyword', priority: 'High', transitionMsg: '' }) },
  })

  const del = useMutation({
    mutationFn: (id: string) => apiService.deleteTrigger(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['triggers'] }),
  })

  const priorityColor: Record<string, string> = {
    Low: 'text-slate-400', Medium: 'text-sky-400',
    High: 'text-amber-400', Critical: 'text-red-400',
  }

  if (!selectedNumberId) return (
    <div className="flex flex-col h-full">
      <TopBar title="Gatilhos de transferência" />
      <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
        Selecione um número em <span className="text-brand-400 mx-1">Números</span> primeiro
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <TopBar title="Gatilhos de transferência" />
      <div className="p-4 space-y-4">

        <div className="flex justify-end">
          <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Novo gatilho
          </button>
        </div>

        {showForm && (
          <div className="card p-5 space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo</label>
                <select
                  className="input text-xs"
                  value={form.triggerType}
                  onChange={e => setForm(f => ({ ...f, triggerType: e.target.value as any }))}
                >
                  <option value="Keyword">Palavra-chave</option>
                  <option value="IntentPattern">Intenção (IA)</option>
                  <option value="Regex">Regex</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Prioridade</label>
                <select
                  className="input text-xs"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                >
                  {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor</label>
              <input className="input text-sm" placeholder="Ex: atendente, cancelar..." value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Mensagem de transição</label>
              <textarea className="input text-xs min-h-[60px]" placeholder="Mensagem enviada ao cliente ao transferir..." value={form.transitionMsg} onChange={e => setForm(f => ({ ...f, transitionMsg: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 text-xs">Cancelar</button>
              <button onClick={() => save.mutate()} disabled={!form.value || save.isPending} className="btn-primary flex-1 text-xs">
                {save.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-14 animate-pulse bg-surface-3" />)}</div>
        ) : triggers?.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-sm">Nenhum gatilho configurado</div>
        ) : (
          <div className="space-y-2">
            {triggers?.map(t => (
              <div key={t.id} className="card p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-brand-300">"{t.value}"</span>
                    <span className="text-[10px] text-slate-500">{t.triggerType}</span>
                  </div>
                  <span className={clsx('text-xs', priorityColor[t.priority])}>{t.priority}</span>
                </div>
                <button onClick={() => del.mutate(t.id)} className="btn-ghost p-1.5 text-slate-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Settings Page ─────────────────────────────────────────────────
export function SettingsPage() {
  const { selectedNumberId } = useStore()
  const qc = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['bot-config', selectedNumberId],
    queryFn:  () => selectedNumberId ? apiService.getBotConfig(selectedNumberId) : null,
    enabled:  !!selectedNumberId,
  })

  const [form, setForm] = useState<Partial<BotConfig>>({})

  const save = useMutation({
    mutationFn: () => apiService.saveBotConfig({ ...config, ...form, whatsAppNumberId: selectedNumberId! } as any),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['bot-config'] }),
  })

  if (!selectedNumberId) return (
    <div className="flex flex-col h-full">
      <TopBar title="Configurações da IA" />
      <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
        Selecione um número em <span className="text-brand-400 mx-1">Números</span> primeiro
      </div>
    </div>
  )

  const merged = { ...config, ...form }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <TopBar title="Configurações da IA" />
      <div className="p-4 space-y-4 max-w-2xl">

        <div className="card p-5 space-y-4">
          <p className="text-sm font-display font-600 text-white">Personalidade da IA</p>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Modelo</label>
            <select className="input text-sm" value={merged.aiModel ?? 'gpt-4o'} onChange={e => setForm(f => ({ ...f, aiModel: e.target.value }))}>
              <option value="gpt-4o">GPT-4o (recomendado)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (econômico)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Prompt do sistema</label>
            <textarea
              className="input text-sm min-h-[120px] resize-y"
              placeholder="Você é Sofia, atendente virtual da Empresa X..."
              value={merged.systemPrompt ?? ''}
              onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Temperatura ({(merged.temperature ?? 0.3).toFixed(1)})</label>
              <input type="range" min="0" max="1" step="0.1"
                className="w-full accent-brand-500"
                value={merged.temperature ?? 0.3}
                onChange={e => setForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max tokens</label>
              <input type="number" className="input text-sm"
                value={merged.maxTokens ?? 1000}
                onChange={e => setForm(f => ({ ...f, maxTokens: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Horário início</label>
              <input type="time" className="input text-sm font-mono"
                value={merged.workStart ?? '08:00'}
                onChange={e => setForm(f => ({ ...f, workStart: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Horário fim</label>
              <input type="time" className="input text-sm font-mono"
                value={merged.workEnd ?? '18:00'}
                onChange={e => setForm(f => ({ ...f, workEnd: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Mensagem fora do horário</label>
            <input className="input text-sm"
              placeholder="Olá! Nosso atendimento é das 8h às 18h..."
              value={merged.outOfHoursMsg ?? ''}
              onChange={e => setForm(f => ({ ...f, outOfHoursMsg: e.target.value }))}
            />
          </div>

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {save.isPending
              ? <><Loader size={14} className="animate-spin" /> Salvando...</>
              : <><Save size={14} /> Salvar configurações</>}
          </button>

          {save.isSuccess && (
            <p className="text-xs text-brand-400 text-center flex items-center justify-center gap-1">
              <CheckCircle size={12} /> Configurações salvas com sucesso
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Metrics Page ──────────────────────────────────────────────────
export function MetricsPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Métricas detalhadas" />
      <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">
        Selecione um período no Dashboard para ver métricas detalhadas
      </div>
    </div>
  )
}
