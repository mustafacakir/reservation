import { useEffect, useRef } from 'react'
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr'
import { useAuthStore } from '@/store/auth.store'
import { useTenantStore } from '@/store/tenant.store'
import { useChatStore, type MessageDto } from '@/store/chat.store'
import { apiClient } from '@/api/client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
  : ''

let globalConnection: HubConnection | null = null

export function useChatConnection() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { slug } = useTenantStore()
  const { addMessage, setUnreadTotal } = useChatStore()
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    // Reuse existing global connection if already connected
    if (
      globalConnection &&
      globalConnection.state === HubConnectionState.Connected
    ) {
      connectionRef.current = globalConnection
      return
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/chat`, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
        headers: slug ? { 'X-Tenant-Slug': slug } : {},
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(
        import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning
      )
      .build()

    connection.on('ReceiveMessage', (msg: MessageDto) => {
      addMessage(msg)
    })

    connection.onreconnected(() => {
      // Refresh unread count after reconnect
      apiClient
        .get<{ count: number }>('/messages/unread-count')
        .then((r) => setUnreadTotal(r.data.count))
        .catch(() => {})
    })

    connection
      .start()
      .then(() => {
        globalConnection = connection
        connectionRef.current = connection
        // Fetch initial unread count
        return apiClient.get<{ count: number }>('/messages/unread-count')
      })
      .then((r) => setUnreadTotal(r.data.count))
      .catch((err) => {
        if (import.meta.env.DEV) console.warn('ChatHub connection failed', err)
      })

    return () => {
      // Do NOT stop the global connection on unmount — keep it alive for the session.
      // The connection is only referenced via globalConnection for reuse.
    }
  }, [isAuthenticated, accessToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return connectionRef
}

/** Call this once when the user logs out to cleanly stop the hub. */
export async function disconnectChat() {
  if (globalConnection) {
    await globalConnection.stop()
    globalConnection = null
  }
}
