import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { TopBar, HandoffAlerts } from '@/components/layout/TopBar'
import {
  MessageSquare, Zap, Clock, Users,
  TrendingUp, DollarSign, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

const from = subDays(new Date(), 30).toISOString()
const to   = new Date().toISOString()

export function DashboardPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn:  () => apiService.getMetrics(from, to),
    refetchInterval: 30000,
  })

  const stats = [
    {
      label: 'Mensagens hoje',
      value: metrics?.totalMessagesToday ?? 0,
      icon: MessageSquare,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      trend: '+12%',
      up: true,
    },
    {
      label: 'Resolvidas pela IA',
      value: `${metrics?.aiResolutionRate ?? 0}%`,
      icon: Zap,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      trend: '+2.1%',
      up: true,
    },
    {
      label: 'Tempo médio resp.',
      value: `${metrics?.avgResponseTimeSeconds?.toFixed(1) ?? '—'}s`,
      icon: Clock,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      trend: '-0.3s',
      up: true,
    },
    {
      label: 'Aguardando humano',
      value: metrics?.pendingHandoffs ?? 0,
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      trend: null,
      up: false,
    },
    {
      label: 'Total no período',
      value: (metrics?.totalMessagesPeriod ?? 0).toLocaleString('pt-BR'),
      icon: TrendingUp,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      trend: null,
      up: true,
    },
    {
      label: 'Custo IA (30d)',
      value: `R$ ${((metrics?.totalCostUsd ?? 0) * 5.2).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      trend: null,
      up: false,
    },
  ]

  const chartData = metrics?.dailyVolume?.map(d => ({
    date: format(new Date(d.date), 'dd/MM', { locale: ptBR }),
    Recebidas: d.inbound,
    Enviadas: d.outbound,
    Transferências: d.handoffs,
  })) ?? []

  // Skeleton
  if (isLoading) return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" />
      <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-28 bg-surface-3" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <TopBar title="Dashboard" />
      <HandoffAlerts />

      <div className="p-4 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg, trend, up }) => (
            <div key={label} className="stat-card animate-slide-up">
              <div className="flex items-start justify-between">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                  <Icon size={18} className={color} />
                </div>
                {trend && (
                  <span className={clsx(
                    'text-xs flex items-center gap-0.5',
                    up ? 'text-brand-400' : 'text-red-400'
                  )}>
                    {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-display font-700 text-white mt-3">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Volume chart */}
        <div className="card p-5">
          <p className="text-sm font-display font-600 text-white mb-5">Volume de mensagens — últimos 30 dias</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="recv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a86e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00a86e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3de4aa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3de4aa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2921" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2921', border: '1px solid #263228', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: '#e8f0eb', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="Recebidas" stroke="#00a86e" fill="url(#recv)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Enviadas"  stroke="#3de4aa" fill="url(#sent)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Handoffs bar chart */}
        {chartData.length > 0 && (
          <div className="card p-5">
            <p className="text-sm font-display font-600 text-white mb-5">Transferências para humano</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2921" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1f2921', border: '1px solid #263228', borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="Transferências" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
