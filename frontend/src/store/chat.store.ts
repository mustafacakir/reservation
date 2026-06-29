import { create } from 'zustand'

export interface MessageDto {
  id: string
  fromUserId: string
  toUserId: string
  toProviderId: string
  content: string
  sentAt: string
  isRead: boolean
  fromUserName: string
}

export interface ConversationDto {
  conversationUserId: string
  conversationProviderIdForRoute: string
  displayName: string
  avatarUrl?: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

interface ChatState {
  conversations: ConversationDto[]
  activeMessages: MessageDto[]
  activeUserId: string | null
  unreadTotal: number

  setConversations: (list: ConversationDto[]) => void
  setActiveMessages: (msgs: MessageDto[], userId: string) => void
  addMessage: (msg: MessageDto) => void
  markRead: (userId: string) => void
  incrementUnread: (fromUserId: string) => void
  setUnreadTotal: (count: number) => void
  clearActive: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  activeMessages: [],
  activeUserId: null,
  unreadTotal: 0,

  setConversations: (list) => {
    const total = list.reduce((acc, c) => acc + c.unreadCount, 0)
    set({ conversations: list, unreadTotal: total })
  },

  setActiveMessages: (msgs, userId) => {
    set({ activeMessages: msgs, activeUserId: userId })
  },

  addMessage: (msg) => {
    const state = get()

    // Append to active thread if it's the right conversation
    const isSelf = msg.fromUserId === state.activeUserId || msg.toUserId === state.activeUserId
    if (isSelf && state.activeUserId !== null) {
      set((s) => ({ activeMessages: [...s.activeMessages, msg] }))
    }

    // Update conversation list
    set((s) => {
      // For the active conversation, the partner is always state.activeUserId.
      // For background incoming messages, the partner is the sender (msg.fromUserId).
      const otherUserId = (isSelf && state.activeUserId !== null)
        ? state.activeUserId
        : msg.fromUserId

      const existingIdx = s.conversations.findIndex(
        (c) => c.conversationUserId === otherUserId
      )

      if (existingIdx >= 0) {
        const updated: ConversationDto = {
          ...s.conversations[existingIdx],
          lastMessage: msg.content,
          lastMessageAt: msg.sentAt,
          unreadCount: isSelf ? 0 : s.conversations[existingIdx].unreadCount + 1,
        }
        const convs = [updated, ...s.conversations.filter((_, i) => i !== existingIdx)]
        const total = convs.reduce((acc, c) => acc + c.unreadCount, 0)
        return { conversations: convs, unreadTotal: total }
      }

      // Only create a new entry for incoming messages (not our own echoed messages).
      // For sent messages without an existing entry, the conversations query will populate it.
      if (isSelf) return {}

      const newEntry: ConversationDto = {
        conversationUserId: otherUserId,
        conversationProviderIdForRoute: msg.toProviderId,
        displayName: msg.fromUserName,
        avatarUrl: null,
        lastMessage: msg.content,
        lastMessageAt: msg.sentAt,
        unreadCount: 1,
      }
      const convs = [newEntry, ...s.conversations]
      const total = convs.reduce((acc, c) => acc + c.unreadCount, 0)
      return { conversations: convs, unreadTotal: total }
    })
  },

  markRead: (userId) => {
    set((s) => {
      const convs = s.conversations.map((c) =>
        c.conversationUserId === userId ? { ...c, unreadCount: 0 } : c
      )
      const total = convs.reduce((acc, c) => acc + c.unreadCount, 0)
      return { conversations: convs, unreadTotal: total }
    })
  },

  incrementUnread: (fromUserId) => {
    set((s) => ({
      unreadTotal: s.unreadTotal + 1,
      conversations: s.conversations.map((c) =>
        c.conversationUserId === fromUserId
          ? { ...c, unreadCount: c.unreadCount + 1 }
          : c
      ),
    }))
  },

  setUnreadTotal: (count) => set({ unreadTotal: count }),

  clearActive: () => set({ activeMessages: [], activeUserId: null }),
}))
