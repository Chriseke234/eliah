'use client'

import { useState, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { updateRequest } from '@/app/actions/requests'
import { type RequestWithClient, type RequestStatus } from '@/lib/database.types'
import { KanbanCard } from './KanbanCard'
import { RequestDrawer } from './RequestDrawer'
import { statusConfig } from '@/components/ui/status-badge'

interface KanbanBoardProps {
  initialRequests: RequestWithClient[]
}

const COLUMNS: RequestStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']

export function KanbanBoard({ initialRequests }: KanbanBoardProps) {
  const [requests, setRequests] = useState<RequestWithClient[]>(initialRequests)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithClient | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Group requests by status
  const columns = COLUMNS.reduce<Record<RequestStatus, RequestWithClient[]>>(
    (acc, status) => {
      acc[status] = requests.filter((r) => r.status === status)
      return acc
    },
    { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], COMPLETED: [] }
  )

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return

      const newStatus = destination.droppableId as RequestStatus

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) => (r.id === draggableId ? { ...r, status: newStatus } : r))
      )

      // Persist
      const { error } = await updateRequest(draggableId, { status: newStatus })
      if (error) {
        // Revert on failure
        setRequests((prev) =>
          prev.map((r) =>
            r.id === draggableId ? { ...r, status: source.droppableId as RequestStatus } : r
          )
        )
        console.error('[KanbanBoard] drag update failed:', error)
      }
    },
    []
  )

  const openDrawer = (request: RequestWithClient) => {
    setSelectedRequest(request)
    setDrawerOpen(true)
  }

  const handleRequestUpdate = (updated: Partial<RequestWithClient> & { id: string }) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    )
    if (selectedRequest?.id === updated.id) {
      setSelectedRequest((prev) => (prev ? { ...prev, ...updated } : prev))
    }
  }

  return (
    <>
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map((status) => {
              const config = statusConfig[status]
              const items = columns[status]

              return (
                <div key={status} className="flex flex-col w-72 xl:w-80 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>

                  {/* Droppable column */}
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-3 min-h-[120px] rounded-xl p-2 transition-colors ${
                          snapshot.isDraggingOver
                            ? 'bg-violet-500/5 border-2 border-dashed border-violet-500/30'
                            : 'border-2 border-dashed border-transparent'
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
                                className={`transition-shadow ${
                                  snapshot.isDragging
                                    ? 'shadow-2xl shadow-slate-900/80 opacity-95 rotate-1'
                                    : ''
                                }`}
                              >
                                <KanbanCard
                                  request={request}
                                  onClick={() => openDrawer(request)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Empty column hint */}
                        {items.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-slate-800/60">
                            <p className="text-xs text-slate-600">Drop cards here</p>
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

      {/* Request drawer */}
      <RequestDrawer
        request={selectedRequest}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={handleRequestUpdate}
      />
    </>
  )
}
