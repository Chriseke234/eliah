'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { type RequestWithClient, type RequestStatus } from '@/lib/database.types'
import { KanbanCard } from './KanbanCard'
import { statusConfig } from '@/components/ui/status-badge'

interface KanbanBoardProps {
  initialRequests: RequestWithClient[]
  onOpenDrawer?: (request: RequestWithClient) => void
  onStatusChange?: (requestId: string, newStatus: RequestStatus) => void
}

const COLUMNS: RequestStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']

const COLUMN_GLOW_CLASSES: Record<RequestStatus, string> = {
  TODO: 'column-glow-todo border-t-slate-500',
  IN_PROGRESS: 'column-glow-progress border-t-amber-500',
  IN_REVIEW: 'column-glow-review border-t-violet-500',
  COMPLETED: 'column-glow-completed border-t-emerald-500',
}

export function KanbanBoard({ initialRequests, onOpenDrawer, onStatusChange }: KanbanBoardProps) {
  const [requests, setRequests] = useState<RequestWithClient[]>(initialRequests)

  useEffect(() => {
    setRequests(initialRequests)
  }, [initialRequests])

  // Group requests by status
  const columns = COLUMNS.reduce<Record<RequestStatus, RequestWithClient[]>>(
    (acc, status) => {
      acc[status] = requests.filter((r) => r.status === status)
      return acc
    },
    { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], COMPLETED: [] }
  )

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return

      const newStatus = destination.droppableId as RequestStatus

      // Optimistic update locally
      setRequests((prev) =>
        prev.map((r) => (r.id === draggableId ? { ...r, status: newStatus } : r))
      )

      if (onStatusChange) {
        onStatusChange(draggableId, newStatus)
      }
    },
    [onStatusChange]
  )

  return (
    <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((status) => {
            const config = statusConfig[status]
            const items = columns[status]
            const glowClass = COLUMN_GLOW_CLASSES[status]

            return (
              <div key={status} className="flex flex-col w-72 xl:w-80 flex-shrink-0">
                {/* Column header with glowing top border */}
                <div className={`flex items-center justify-between mb-3 px-3 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl ${glowClass}`}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-bold bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                {/* Droppable column */}
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-3 min-h-[140px] rounded-2xl p-2 transition-all ${
                        snapshot.isDraggingOver
                          ? 'bg-violet-500/10 border-2 border-dashed border-violet-500/40 shadow-inner'
                          : 'bg-slate-900/30 border border-slate-800/40'
                      }`}
                    >
                      {items.map((request, index) => (
                        <Draggable
                          key={request.id}
                          draggableId={request.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              className={`transition-all ${
                                snapshot.isDragging
                                  ? 'shadow-2xl shadow-slate-950 opacity-95 scale-105 rotate-1 z-50'
                                  : ''
                              }`}
                            >
                              <KanbanCard
                                request={request}
                                onClick={() => onOpenDrawer?.(request)}
                                onStatusChange={(newStatus) => onStatusChange?.(request.id, newStatus)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty column hint */}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40">
                          <p className="text-xs text-slate-500">Drop requests here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
