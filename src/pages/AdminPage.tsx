import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { TopBar } from '@/components/layout/TopBar'
import axios from 'axios'
import {
  Plus, Building2, Users, ShieldCheck,
  Shield, UserCircle, Trash2, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

const roleColors: Record<string, string> = {
  SuperAdmin: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  Admin:      'text-sky-400   bg-sky-500/10   border-sky-500/20',
  Agent:      'text-slate-400 bg-slate-500/10 border-slate-500/20',
}
const roleIcon: Record<string, typeof ShieldCheck> = {
  SuperAdmin: ShieldCheck,
  Admin:      Shield,
  Agent:      UserCircle,
}

export function AdminPage() {
  const { isSuperAdmin, isAdmin, user } = useAuthStore()
  const qc = useQueryClient()

  // Users list
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['auth-users'],
    queryFn:  () => axios.get('/api/auth/users').then(r => r.data),
  })

  // Tenants list (SuperAdmin only)
  const { data: tenants } = useQuery({
    queryKey: ['auth-tenants'],
    queryFn:  () => axios.get('/api/auth/tenants').then(r => r.data),
    enabled:  isSuperAdmin(),
  })

  const [tab, setTab] = useState<'users' | 'tenants'>('users')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <TopBar title="Administração" />
      <div className="p-4 space-y-4 max-w-3xl">

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'users',   label: 'Usuários',  icon: Users },
            ...(isSuperAdmin() ? [{ key: 'tenants', label: 'Tenants', icon: Building2 }] : [])
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all border',
                tab === key
                  ? 'bg-brand-500/15 text-brand-400 border-brand-500/30'
                  : 'text-slate-500 border-surface-4 hover:text-white'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {user?.tenantName} — {users?.length ?? 0} usuário(s)
              </p>
              {isAdmin() && (
                <button
                  onClick={() => setShowAddUser(v => !v)}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5"
                >
                  <Plus size={13} /> Novo usuário
                </button>
              )}
            </div>

            {showAddUser && (
              <AddUserForm
                onClose={() => setShowAddUser(false)}
                onSuccess={() => { qc.invalidateQueries({ queryKey: ['auth-users'] }); setShowAddUser(false) }}
                isSuperAdmin={isSuperAdmin()}
              />
            )}

            {usersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card h-16 animate-pulse bg-surface-3" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {users?.map((u: any) => {
                  const RoleIcon = roleIcon[u.role] ?? UserCircle
                  return (
                    <div key={u.id} className="card p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-4 flex items-center
                                      justify-center font-display font-700 text-sm text-brand-300">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          {!u.isActive && (
                            <span className="text-[10px] text-red-400 border border-red-500/20 px-1.5 rounded-full">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                      </div>
                      <span className={clsx(
                        'flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border',
                        roleColors[u.role]
                      )}>
                        <RoleIcon size={11} />
                        {u.role}
                      </span>
                      {u.lastLoginAt && (
                        <p className="text-[10px] text-slate-600 hidden md:block">
                          Último login: {new Date(u.lastLoginAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tenants tab (SuperAdmin only) */}
        {tab === 'tenants' && isSuperAdmin() && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{tenants?.length ?? 0} tenant(s) cadastrado(s)</p>
              <button
                onClick={() => setShowAddTenant(v => !v)}
                className="btn-primary text-xs flex items-center gap-1.5 py-1.5"
              >
                <Plus size={13} /> Novo tenant
              </button>
            </div>

            {showAddTenant && (
              <AddTenantForm
                onClose={() => setShowAddTenant(false)}
                onSuccess={() => { qc.invalidateQueries({ queryKey: ['auth-tenants'] }); setShowAddTenant(false) }}
              />
            )}

            <div className="space-y-2">
              {tenants?.map((t: any) => (
                <div key={t.id} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20
                                  flex items-center justify-center">
                    <Building2 size={18} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{t.slug} · {t.plan}</p>
                  </div>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full border',
                    t.isActive ? 'badge-online' : 'badge-offline'
                  )}>
                    {t.isActive ? '● Ativo' : 'Inativo'}
                  </span>
                  <p className="text-[10px] text-slate-600 hidden md:block">
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add User Form ──────────────────────────────────────────────────
function AddUserForm({ onClose, onSuccess, isSuperAdmin }: {
  onClose: () => void
  onSuccess: () => void
  isSuperAdmin: boolean
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Agent' })
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => axios.post('/api/auth/users', form),
    onSuccess:  () => { setSuccess(true); setTimeout(onSuccess, 800) },
  })

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="card p-5 space-y-3 animate-slide-up border-brand-500/20">
      <p className="text-sm font-display font-600 text-white">Novo usuário</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nome</label>
          <input className="input text-sm" placeholder="João Silva" value={form.name} onChange={f('name')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Email</label>
          <input type="email" className="input text-sm" placeholder="joao@empresa.com" value={form.email} onChange={f('email')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Senha</label>
          <input type="password" className="input text-sm" placeholder="Mínimo 8 caracteres" value={form.password} onChange={f('password')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Papel</label>
          <select className="input text-sm" value={form.role} onChange={f('role')}>
            <option value="Agent">Agente (atende conversas)</option>
            <option value="Admin">Admin (gerencia tudo)</option>
            {isSuperAdmin && <option value="SuperAdmin">Super Admin</option>}
          </select>
        </div>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {(mutation.error as any)?.response?.data?.error ?? 'Erro ao criar usuário'}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1 text-xs">Cancelar</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.name || !form.email || !form.password}
          className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5"
        >
          {success
            ? <><CheckCircle size={13} /> Criado!</>
            : mutation.isPending ? 'Criando...' : 'Criar usuário'}
        </button>
      </div>
    </div>
  )
}

// ── Add Tenant Form (SuperAdmin only) ──────────────────────────────
function AddTenantForm({ onClose, onSuccess }: {
  onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', tenantName: ''
  })
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => axios.post('/api/auth/register', {
      ...form,
      role: 'Admin',
    }),
    onSuccess: () => { setSuccess(true); setTimeout(onSuccess, 800) },
  })

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="card p-5 space-y-3 animate-slide-up border-sky-500/20">
      <p className="text-sm font-display font-600 text-white">Novo tenant + Admin</p>
      <p className="text-xs text-slate-500">Cria um novo tenant e o usuário Admin inicial.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nome da empresa</label>
          <input className="input text-sm" placeholder="Empresa Ltda" value={form.tenantName} onChange={f('tenantName')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Nome do admin</label>
          <input className="input text-sm" placeholder="João Silva" value={form.name} onChange={f('name')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Email do admin</label>
          <input type="email" className="input text-sm" placeholder="admin@empresa.com" value={form.email} onChange={f('email')} />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Senha inicial</label>
          <input type="password" className="input text-sm" placeholder="Mínimo 8 caracteres" value={form.password} onChange={f('password')} />
        </div>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {(mutation.error as any)?.response?.data?.error ?? 'Erro ao criar tenant'}
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1 text-xs">Cancelar</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.name || !form.email || !form.password || !form.tenantName}
          className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5"
        >
          {success
            ? <><CheckCircle size={13} /> Criado!</>
            : mutation.isPending ? 'Criando...' : 'Criar tenant'}
        </button>
      </div>
    </div>
  )
}
