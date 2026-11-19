import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/store/useAuthStore'
import { useStore } from '@/store/useStore'

export function useSignalR() {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const { addRealtimeMessage, updateConversationStatus, addHandoffAlert } = useStore()

  const userId = useAuthStore((state) => state.user?.id)
  const tenantId = useAuthStore((state) => state.user?.tenantId)

  useEffect(() => {
    if (!userId || !tenantId) return
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/dashboard', {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.on('NewMessage', (data) => {
      addRealtimeMessage(data)
    })

    conn.on('ConversationUpdated', (data) => {
      updateConversationStatus(data.conversationId, data.status)
    })

    conn.on('HandoffRequested', (data) => {
      addHandoffAlert(data)
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('Transferência solicitada', {
          body: `${data.contactName}: ${data.lastMessage}`,
          icon: '/icon-192.png',
          tag: data.conversationId
        })
      }
    })

    conn.onreconnecting(() => useStore.getState().setSignalRStatus('reconnecting'))
    conn.onreconnected(() => useStore.getState().setSignalRStatus('connected'))
    conn.onclose(() => useStore.getState().setSignalRStatus('disconnected'))

    conn.start()
      .then(() => useStore.getState().setSignalRStatus('connected'))
      .catch(() => useStore.getState().setSignalRStatus('disconnected'))

    connectionRef.current = conn

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      connectionRef.current = null
      void conn.stop()
    }
  }, [addRealtimeMessage, updateConversationStatus, addHandoffAlert, userId, tenantId])

  return connectionRef.current
}
