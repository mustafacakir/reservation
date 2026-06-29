import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, ChevronLeft, Loader2 } from 'lucide-react'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore, type ConversationDto, type MessageDto } from '@/store/chat.store'
import { useChatConnection } from '@/hooks/useChatConnection'
import ChatMessageInput from '@/components/chat/ChatMessageInput'

function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string
  avatarUrl?: string | null
  size?: number
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-xl object-cover flex-shrink-0"
    />
  ) : (
    <div
      className="rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: 'var(--color-primary)' }}
    >
      {initials}
    </div>
  )
}

function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: ConversationDto
  active: boolean
  onClick: () => void
}) {
  const lastAt = new Date(conv.lastMessageAt)
  const timeLabel = lastAt.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? 'bg-gray-100' : 'hover:bg-gray-50'
      }`}
    >
      <Avatar name={conv.displayName} avatarUrl={conv.avatarUrl} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{conv.displayName}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeLabel}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{stripHtml(conv.lastMessage)}</p>
      </div>
      {conv.unreadCount > 0 && (
        <span
          className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ background: 'var(--color-primary)' }}
        >
          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
        </span>
      )}
    </button>
  )
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

function MessageBubble({ msg, isOwn }: { msg: MessageDto; isOwn: boolean }) {
  const time = new Date(msg.sentAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const isHtml = msg.content.startsWith('<')
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-gray-100 text-gray-800'
        }`}
        style={isOwn ? { background: 'var(--color-primary)' } : {}}
      >
        {isHtml
          ? <div className="chat-bubble-content" dangerouslySetInnerHTML={{ __html: msg.content }} />
          : <p>{msg.content}</p>
        }
        <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}

export default function ProviderMessagesPage() {
  const connRef = useChatConnection()

  useAuthStore()
  const queryClient = useQueryClient()

  const { conversations, setConversations, activeMessages, setActiveMessages, markRead } =
    useChatStore()

  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeConv, setActiveConv] = useState<ConversationDto | null>(null)
  const [showThread, setShowThread] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load conversations
  const { isLoading: loadingConvs, data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () =>
      apiClient
        .get<ConversationDto[]>('/messages/conversations')
        .then((r) => r.data),
  })

  useEffect(() => {
    if (convsData) setConversations(convsData)
  }, [convsData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load thread
  const { isFetching: loadingThread, data: threadData } = useQuery({
    queryKey: ['thread', activeUserId],
    queryFn: () =>
      apiClient
        .get<MessageDto[]>(`/messages/conversations/${activeUserId}`)
        .then((r) => r.data),
    enabled: !!activeUserId,
  })

  useEffect(() => {
    if (threadData !== undefined && activeUserId) {
      setActiveMessages(threadData, activeUserId)
      markRead(activeUserId)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  }, [threadData, activeUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (html: string) => {
    if (!activeUserId || !activeConv) return
    setSending(true)
    const conn = connRef.current
    if (conn && conn.state === 'Connected') {
      try {
        await conn.invoke('SendMessage', activeUserId, activeConv.conversationProviderIdForRoute, html)
      } catch (err) {
        console.error('Send failed', err)
      }
    }
    setSending(false)
  }

  const openConversation = (conv: ConversationDto) => {
    setActiveUserId(conv.conversationUserId)
    setActiveConv(conv)
    setShowThread(true)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8">
      <div className="flex h-[calc(100vh-56px)] lg:h-[calc(100vh-0px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Conversation list */}
        <div
          className={`${
            showThread ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-80 flex-col border-r border-gray-100 flex-shrink-0`}
        >
          <div className="h-14 flex items-center px-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Mesajlar</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={20} className="animate-spin text-gray-300" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-primary-light)' }}
                >
                  <MessageCircle size={28} style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm text-gray-500">Henüz mesajınız yok</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.conversationUserId}
                  conv={conv}
                  active={activeUserId === conv.conversationUserId}
                  onClick={() => openConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div
          className={`${
            showThread ? 'flex' : 'hidden lg:flex'
          } flex-1 flex-col min-w-0`}
        >
          {activeConv ? (
            <>
              {/* Header */}
              <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setShowThread(false)}
                  className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <Avatar
                  name={activeConv.displayName}
                  avatarUrl={activeConv.avatarUrl}
                  size={32}
                />
                <p className="font-semibold text-gray-900 text-sm">{activeConv.displayName}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingThread ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={20} className="animate-spin text-gray-300" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 mt-8">
                    Mesaj geçmişi boş.
                  </p>
                ) : (
                  activeMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isOwn={msg.fromUserId !== activeUserId}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
                <ChatMessageInput onSend={handleSend} disabled={sending} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--color-primary-light)' }}
              >
                <MessageCircle size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <p className="text-sm text-gray-500">
                Bir öğrenciyle sohbet başlatmak için sol taraftan seçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
