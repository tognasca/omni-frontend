import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Eye, EyeOff, Loader, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full
                        bg-brand-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center
                          justify-center mb-4 glow-brand">
            <MessageSquare size={28} className="text-surface-0" />
          </div>
          <h1 className="font-display font-800 text-2xl text-white tracking-tight">OmniAI</h1>
          <p className="text-sm text-slate-500 mt-1">WhatsApp Manager</p>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-5">
          <div>
            <h2 className="font-display font-600 text-white text-lg">Entrar</h2>
            <p className="text-sm text-slate-500 mt-0.5">Acesse o painel de controle</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="admin@suaempresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg
                              px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader size={15} className="animate-spin" /> Entrando...</>
                : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Dev hint */}
        <div className="mt-6 card p-4 space-y-1.5">
          <p className="text-xs text-slate-500 font-medium mb-2">Credenciais de teste:</p>
          {[
            { role: 'Super Admin', email: 'superadmin@omni.ai',   pass: 'Admin@123' },
            { role: 'Admin',       email: 'admin@democorp.com',   pass: 'Admin@123' },
            { role: 'Agente',      email: 'agente@democorp.com',  pass: 'Agente@123' },
          ].map(u => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword(u.pass) }}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-xs transition-all',
                'bg-surface-3 hover:bg-surface-4 border border-surface-4'
              )}
            >
              <span className={clsx(
                'font-medium mr-2',
                u.role === 'Super Admin' ? 'text-brand-400' :
                u.role === 'Admin'       ? 'text-sky-400' : 'text-slate-300'
              )}>
                {u.role}
              </span>
              <span className="text-slate-500 font-mono">{u.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
