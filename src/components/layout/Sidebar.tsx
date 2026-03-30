import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Phone, Brain,
  GitBranch, BarChart3, Settings, Wifi, WifiOff,
  RefreshCw, ChevronLeft, ShieldCheck, LogOut, User
} from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '@/store/useStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNavigate } from 'react-router-dom'

const nav = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',            roles: ['SuperAdmin','Admin','Agent'] },
  { to: '/conversations', icon: MessageSquare,   label: 'Conversas',            roles: ['SuperAdmin','Admin','Agent'] },
  { to: '/numbers',       icon: Phone,           label: 'Números',              roles: ['SuperAdmin','Admin'] },
  { to: '/knowledge',     icon: Brain,           label: 'Base de conhecimento', roles: ['SuperAdmin','Admin'] },
  { to: '/triggers',      icon: GitBranch,       label: 'Gatilhos',             roles: ['SuperAdmin','Admin'] },
  { to: '/metrics',       icon: BarChart3,       label: 'Métricas',             roles: ['SuperAdmin','Admin'] },
  { to: '/settings',      icon: Settings,        label: 'Configurações',        roles: ['SuperAdmin','Admin'] },
  { to: '/admin',         icon: ShieldCheck,     label: 'Admin',                roles: ['SuperAdmin','Admin'] },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, signalRStatus, handoffAlerts } = useStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const visibleNav = nav.filter(n => user && n.roles.includes(user.role))

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed top-0 left-0 h-full z-40 flex flex-col',
        'bg-surface-1 border-r border-surface-3',
        'transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-60' : 'w-0 lg:w-16 overflow-hidden',
        'lg:relative lg:z-auto'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-surface-3 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-surface-0 font-bold text-sm font-display">
                O
              </div>
              <div>
                <span className="font-display font-700 text-white text-sm tracking-wide">OmniAI</span>
                {user && (
                  <p className="text-[10px] text-slate-500 leading-none mt-0.5 truncate max-w-[130px]">
                    {user.tenantName}
                  </p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-ghost p-1.5 ml-auto"
          >
            {sidebarOpen
              ? <ChevronLeft size={16} />
              : <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-surface-0 font-bold text-xs">O</div>
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label }) => {
            const isActive    = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            const hasBadge    = to === '/conversations' && handoffAlerts.length > 0
            const isAdminPage = to === '/admin'

            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={clsx(
                  'nav-item',
                  isActive && 'active',
                  isAdminPage && !isActive && 'text-amber-500/70 hover:text-amber-400',
                  !sidebarOpen && 'lg:justify-center lg:px-2'
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={18} />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                {sidebarOpen && <span className="truncate">{label}</span>}
                {sidebarOpen && hasBadge && (
                  <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full border border-red-500/20">
                    {handoffAlerts.length}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User info + logout */}
        {sidebarOpen && user && (
          <div className="px-3 py-3 border-t border-surface-3 flex-shrink-0 space-y-2">
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-full bg-surface-4 flex items-center justify-center text-xs font-display font-700 text-brand-300 flex-shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sair"
                className="text-slate-600 hover:text-red-400 transition-colors p-1"
              >
                <LogOut size={13} />
              </button>
            </div>

            {/* SignalR status */}
            <div className={clsx(
              'flex items-center gap-2 text-xs px-2 py-1',
              signalRStatus === 'connected'    && 'text-brand-400',
              signalRStatus === 'disconnected' && 'text-slate-500',
              signalRStatus === 'reconnecting' && 'text-amber-400',
            )}>
              {signalRStatus === 'connected'    && <><Wifi size={11} /> Tempo real ativo</>}
              {signalRStatus === 'disconnected' && <><WifiOff size={11} /> Offline</>}
              {signalRStatus === 'reconnecting' && <><RefreshCw size={11} className="animate-spin" /> Reconectando...</>}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
