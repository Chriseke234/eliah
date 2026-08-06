'use client'

import { useState } from 'react'
import { CreateClientModal } from './CreateClientModal'
import { UserPlus } from 'lucide-react'

export function CreateClientButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 whitespace-nowrap"
        aria-label="Add new client"
      >
        <UserPlus className="w-4 h-4" />
        Add Client
      </button>
      <CreateClientModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
