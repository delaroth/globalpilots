'use client'

import { useState, useRef, useEffect } from 'react'
import type { CurrencyInfo } from '@/lib/currency'

interface CurrencySelectorProps {
  code: string
  currencies: CurrencyInfo[]
  onChange: (code: string) => void
  /** Compact mode for inline use (e.g., next to budget input) */
  compact?: boolean
}

export default function CurrencySelector({
  code,
  currencies,
  onChange,
  compact = false,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const current = currencies.find(c => c.code === code) || currencies[0]

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filtered = search
    ? currencies.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : currencies

  if (compact) {
    return (
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
        >
          <span>{current.flag}</span>
          <span>{current.code}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search currency..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 transition text-left ${
                    c.code === code ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <span>{c.flag}</span>
                  <span className="font-mono text-gray-800">{c.code}</span>
                  <span className="text-gray-500 truncate">{c.symbol} — {c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full-size version (for settings pages, etc.)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white hover:border-white/20 transition w-full"
      >
        <span>{current.flag}</span>
        <span className="font-medium">{current.code}</span>
        <span className="text-white/50">({current.symbol})</span>
        <span className="ml-auto text-white/30 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full px-3 py-1.5 text-sm bg-white/[0.06] border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.code); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.06] transition text-left ${
                  c.code === code ? 'bg-white/[0.06] font-semibold text-emerald-400' : 'text-white/80'
                }`}
              >
                <span>{c.flag}</span>
                <span className="font-mono">{c.code}</span>
                <span className="text-white/40 truncate">{c.symbol} — {c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
