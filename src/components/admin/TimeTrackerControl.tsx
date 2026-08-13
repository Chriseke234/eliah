'use client'

import { useState, useEffect, useTransition } from 'react'
import { Play, Square, Clock, Loader2 } from 'lucide-react'
import { startTimeTracking, stopTimeTracking, getRequestTimeSummary } from '@/app/actions/time-tracking'
import { type RequestTimeEntryRow } from '@/lib/database.types'

interface TimeTrackerControlProps {
  requestId: string
  onTimeUpdated?: (totalSeconds: number) => void
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function formatStopwatch(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
}

export function TimeTrackerControl({ requestId, onTimeUpdated }: TimeTrackerControlProps) {
  const [activeEntry, setActiveEntry] = useState<RequestTimeEntryRow | null>(null)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Load summary on mount
  useEffect(() => {
    let isMounted = true
    const loadSummary = async () => {
      setLoading(true)
      const res = await getRequestTimeSummary(requestId)
      if (isMounted) {
        setTotalSeconds(res.totalSeconds)
        setActiveEntry(res.activeEntry)
        if (onTimeUpdated) onTimeUpdated(res.totalSeconds)

        if (res.activeEntry) {
          const startMs = new Date(res.activeEntry.start_time).getTime()
          const nowMs = Date.now()
          setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)))
        }
        setLoading(false)
      }
    }

    loadSummary()
    return () => {
      isMounted = false
    }
  }, [requestId])

  // Live ticker for active timer
  useEffect(() => {
    if (!activeEntry) return

    const interval = setInterval(() => {
      const startMs = new Date(activeEntry.start_time).getTime()
      const nowMs = Date.now()
      setElapsedSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeEntry])

  const handleStart = () => {
    startTransition(async () => {
      const res = await startTimeTracking(requestId)
      if (res.entry) {
        setActiveEntry(res.entry)
        setElapsedSeconds(0)
      }
    })
  }

  const handleStop = () => {
    if (!activeEntry) return
    startTransition(async () => {
      const res = await stopTimeTracking(activeEntry.id)
      if (res.entry) {
        setActiveEntry(null)
        const newTotal = totalSeconds + (res.durationSeconds || 0)
        setTotalSeconds(newTotal)
        if (onTimeUpdated) onTimeUpdated(newTotal)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-500 text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading timer...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex-shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Time Logged
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {formatDuration(totalSeconds)}
            </span>
            {activeEntry && (
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse">
                {formatStopwatch(elapsedSeconds)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Start / Stop Button */}
      {activeEntry ? (
        <button
          type="button"
          onClick={handleStop}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all shadow-md"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Square className="w-3.5 h-3.5 fill-current" />
          )}
          Stop Timer
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-all shadow-md"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          Start Timer
        </button>
      )}
    </div>
  )
}
