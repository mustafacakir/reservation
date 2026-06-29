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
let isConnecting = false

export function useChatConnection() {
  const { accessToken, isAuthenticated } = useAuthStore()
  const { slug } = useTenantStore()
  const { addMessage, setUnreadTotal } = useChatStore()
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    // Reuse if already connected
    if (globalConnection?.state === HubConnectionState.Connected) {
      connectionRef.current = globalConnection
      return
    }

    // Prevent duplicate connection attempts (StrictMode double-invoke, layout + page both calling hook)
    if (isConnecting) return

    isConnecting = true

    const connection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/chat${slug ? `?tenant=${encodeURIComponent(slug)}` : ''}`, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(
        import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning
      )
      .build()

    connection.on('ReceiveMessage', (msg: MessageDto) => {
      useChatStore.getState().addMessage(msg)
    })

    connection.onreconnected(() => {
      apiClient
        .get<{ count: number }>('/messages/unread-count')
        .then((r) => useChatStore.getState().setUnreadTotal(r.data.count))
        .catch(() => {})
    })

    connection
      .start()
      .then(() => {
        globalConnection = connection
        connectionRef.current = connection
        isConnecting = false
        return apiClient.get<{ count: number }>('/messages/unread-count')
      })
      .then((r) => useChatStore.getState().setUnreadTotal(r.data.count))
      .catch((err) => {
        isConnecting = false
        if (import.meta.env.DEV) console.warn('ChatHub connection failed', err)
      })

    return () => {
      // Do NOT stop the global connection on unmount — keep it alive for the session.
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
  isConnecting = false
}
