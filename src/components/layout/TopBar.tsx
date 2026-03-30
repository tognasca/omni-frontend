import { Menu, Bell, AlertTriangle, X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import clsx from 'clsx'

export function TopBar({ title }: { title: string }) {
  const { setSidebarOpen, sidebarOpen, handoffAlerts, dismissHandoffAlert } = useStore()

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-20">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="btn-ghost p-1.5 -ml-1"
      >
        <Menu size={18} />
      </button>

      <h1 className="font-display font-600 text-white text-base flex-1 truncate">{title}</h1>

      {/* Handoff alerts bell */}
      <div className="relative">
        <button className={clsx(
          'btn-ghost p-1.5 relative',
          handoffAlerts.length > 0 && 'text-amber-400'
        )}>
          <Bell size={18} />
          {handoffAlerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-mono font-bold">
              {handoffAlerts.length}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

// ── Handoff Alert Banner ───────────────────────────────────────────
export function HandoffAlerts() {
  const { handoffAlerts, dismissHandoffAlert } = useStore()
  if (handoffAlerts.length === 0) return null

  return (
    <div className="px-4 pt-3 space-y-2 animate-slide-up">
      {handoffAlerts.slice(0, 3).map(alert => (
        <div
          key={alert.conversationId}
          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3"
        >
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">{alert.contactName} aguarda atendimento humano</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{alert.lastMessage}</p>
          </div>
          <button
            onClick={() => dismissHandoffAlert(alert.conversationId)}
            className="text-slate-500 hover:text-white p-0.5 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
