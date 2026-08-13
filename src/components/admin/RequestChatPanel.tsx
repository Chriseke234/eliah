'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, Paperclip, Video, ExternalLink, Loader2, MessageSquare, FileText, CheckCircle2 } from 'lucide-react'
import { postComment, getRequestComments, markRequestAsRead } from '@/app/actions/chat'
import { type RequestCommentWithSender } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/client'
import { ScheduleCallModal } from './ScheduleCallModal'
import { formatDate } from '@/lib/utils'

interface RequestChatPanelProps {
  requestId: string
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return formatDate(dateString)
}

export function RequestChatPanel({ requestId }: RequestChatPanelProps) {
  const [comments, setComments] = useState<RequestCommentWithSender[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const loadComments = async () => {
    const list = await getRequestComments(requestId)
    setComments(list)
    setLoading(false)
    scrollToBottom()

    // Mark as read when viewing thread
    markRequestAsRead(requestId)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    }, 100)
  }

  useEffect(() => {
    loadComments()

    // Supabase Realtime subscription for real-time messages
    const supabase = createClient()
    const channel = supabase
      .channel(`request_comments:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_comments',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    const text = messageText.trim()
    setMessageText('')

    startTransition(async () => {
      const res = await postComment({
        requestId,
        message: text,
      })

      if (res.comment) {
        setComments((prev) => [...prev, res.comment!])
        scrollToBottom()
      }
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const filePath = `chat/${requestId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, file)

      if (uploadError) {
        console.error('[chat file upload]', uploadError)
        setIsUploading(false)
        return
      }

      await postComment({
        requestId,
        message: `Uploaded file attachment: ${file.name}`,
        attachmentPath: filePath,
        attachmentName: file.name,
      })

      loadComments()
    } catch (err) {
      console.error('[chat file upload] error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-[480px] bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Request Chat & Calls
          </h3>
        </div>

        {/* Schedule a Call Companion Link-out button */}
        <button
          type="button"
          onClick={() => setScheduleModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-all shadow-sm"
        >
          <Video className="w-3.5 h-3.5" />
          Schedule a Call
        </button>
      </div>

      {/* Messages Thread Container */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading conversation...
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 p-6">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-medium text-slate-400">No messages yet</p>
            <p className="text-[11px] text-slate-500">
              Start a real-time conversation or schedule a call link for this request.
            </p>
          </div>
        ) : (
          comments.map((c) => {
            const senderName = c.sender?.full_name || c.sender?.email || 'User'
            const initials = senderName.slice(0, 2).toUpperCase()

            // Render Distinct "Upcoming Call" Card
            if (c.call_link) {
              return (
                <div key={c.id} className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-500/30 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block">
                          Upcoming Call Scheduled
                        </span>
                        <h4 className="text-xs font-semibold text-white">{c.call_title || 'Meeting Sync'}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-violet-500/20">
                    <p className="text-xs text-slate-300 truncate max-w-[240px]">{c.call_link}</p>
                    <a
                      href={c.call_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors shadow-md"
                    >
                      Join Call <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )
            }

            // System Message
            if (c.is_system) {
              return (
                <div key={c.id} className="text-center py-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-violet-400" />
                    {c.message}
                  </span>
                </div>
              )
            }

            // User Chat Bubble
            return (
              <div key={c.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{senderName}</span>
                    <span className="text-[10px] text-slate-500">{timeAgo(c.created_at)}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                    {c.message}
                    {c.attachment_name && (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2 text-violet-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="font-medium truncate">{c.attachment_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
        <label className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors flex-shrink-0">
          <Paperclip className="w-4 h-4" />
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading || isPending}
            className="hidden"
          />
        </label>

        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          disabled={isPending}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />

        <button
          type="submit"
          disabled={isPending || !messageText.trim()}
          className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 transition-all flex-shrink-0 shadow-md shadow-violet-600/20"
        >
          {isPending || isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        requestId={requestId}
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onCallScheduled={loadComments}
      />
    </div>
  )
}
