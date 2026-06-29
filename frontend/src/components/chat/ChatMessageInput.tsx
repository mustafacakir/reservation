import { useRef, useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { Send, Loader2, Smile } from 'lucide-react'

interface Props {
  onSend: (html: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatMessageInput({
  onSend,
  disabled,
  placeholder = 'Mesajınızı yazın...',
}: Props) {
  const [showEmoji, setShowEmoji] = useState(false)
  const emojiRef = useRef<HTMLDivElement>(null)
  const sendRef = useRef<() => void>(() => {})

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          sendRef.current()
          return true
        }
        return false
      },
    },
  })

  sendRef.current = () => {
    if (!editor || editor.isEmpty) return
    onSend(editor.getHTML())
    editor.commands.clearContent(true)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node))
        setShowEmoji(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleEmojiClick = (data: EmojiClickData) => {
    editor?.chain().focus().insertContent(data.emoji).run()
    setShowEmoji(false)
  }

  return (
    <>
      <style>{`
        .chat-editor .tiptap { outline: none; }
        .chat-editor .tiptap p { margin: 0; }
        .chat-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: #9ca3af; pointer-events: none; height: 0;
        }
        .chat-editor .tiptap strong { font-weight: 700; }
        .chat-editor .tiptap em { font-style: italic; }
      `}</style>

      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent overflow-hidden">
          <div
            className="chat-editor min-h-[42px] max-h-32 overflow-y-auto px-4 py-2.5 text-sm cursor-text"
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        <div ref={emojiRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 right-0 z-50">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={Theme.LIGHT}
                height={380}
                width={320}
                searchPlaceholder="Emoji ara…"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => sendRef.current()}
          disabled={disabled || !editor || editor.isEmpty}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40 hover:opacity-90 flex-shrink-0"
          style={{ background: 'var(--color-primary)' }}
        >
          {disabled ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </>
  )
}
