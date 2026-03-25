'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// ---------------------------------------------------------------------------
// Types (mirrors day-trip page)
// ---------------------------------------------------------------------------

interface ActivityItem {
  time: string
  activity: string
  cost: number
  transport?: string
}

interface MealItem {
  meal: string
  suggestion: string
  priceRange: string
  cost: number
}

interface DayItinerary {
  day: number
  morning: ActivityItem[]
  afternoon: ActivityItem[]
  evening: ActivityItem[]
  meals: MealItem[]
  dailyTotal: number
}

interface DayTripDetailProps {
  destination: string
  days: number
  itinerary: DayItinerary[]
  tips: string[]
  savingTips?: string[]
  totalEstimatedCost: number
  loading: boolean
  currencyFormat: (n: number) => string
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActivityRow({ item, fmt }: { item: ActivityItem; fmt: (n: number) => string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-sky-400 text-xs font-mono whitespace-nowrap mt-0.5 w-16 shrink-0">{item.time}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm">{item.activity}</p>
        {item.transport && <p className="text-white/40 text-xs mt-0.5">{item.transport}</p>}
      </div>
      <span className="text-emerald-400 text-sm font-medium whitespace-nowrap shrink-0">
        {item.cost === 0 ? 'Free' : fmt(item.cost)}
      </span>
    </div>
  )
}

function MealRow({ item, fmt }: { item: MealItem; fmt: (n: number) => string }) {
  const icons: Record<string, string> = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌆', Snack: '🍡' }
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-lg w-5 shrink-0">{icons[item.meal] || '🍽'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-medium">{item.meal}</p>
        <p className="text-white/60 text-xs mt-0.5">{item.suggestion}</p>
      </div>
      <span className="text-emerald-400 text-sm font-medium whitespace-nowrap shrink-0">
        {item.priceRange || fmt(item.cost)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DayTripDetail({
  destination, days, itinerary, tips, savingTips,
  totalEstimatedCost, loading, currencyFormat,
}: DayTripDetailProps) {
  const [open, setOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const hasContent = itinerary.length > 0

  const handleDownloadPDF = () => {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${destination} Day Trip Itinerary — GlobePilots</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; padding: 32px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          h2 { font-size: 20px; margin-top: 24px; margin-bottom: 8px; color: #0ea5e9; }
          h3 { font-size: 16px; margin-top: 12px; margin-bottom: 6px; color: #475569; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 4px; }
          .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
          .day-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; page-break-inside: avoid; }
          .activity { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .activity:last-child { border-bottom: none; }
          .time { color: #0ea5e9; font-weight: 600; min-width: 60px; }
          .cost { color: #10b981; font-weight: 600; }
          .tip { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-top: 4px; font-size: 13px; }
          .total { background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: center; margin-top: 20px; }
          .total-amount { font-size: 24px; font-weight: 700; color: #0ea5e9; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 16px; } .day-card { break-inside: avoid; } }
        </style>
      </head>
      <body>
        ${content}
        <div class="footer">Generated by GlobePilots.com — AI-powered travel planning</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => hasContent && setOpen(true)}
        disabled={!hasContent && !loading}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-all ${
          hasContent
            ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.01]'
            : loading
              ? 'bg-white/[0.06] text-white/50 border border-white/10'
              : 'bg-white/[0.04] text-white/30 border border-white/[0.06] cursor-not-allowed'
        }`}
        aria-label="View day trip itinerary"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Building your itinerary...
          </span>
        ) : hasContent ? (
          <span>View {days}-Day Itinerary for {destination}</span>
        ) : (
          <span>No itinerary yet — fill out the form above</span>
        )}
      </button>

      {/* Detail popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-bold text-white">{destination} — {days}-Day Itinerary</h2>
                  <p className="text-sm text-white/50">Total: {currencyFormat(totalEstimatedCost)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition"
                    aria-label="Download itinerary as PDF"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    PDF
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    aria-label="Close"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 72px)' }}>

                {/* Hidden print content */}
                <div ref={printRef} className="hidden">
                  <h1>{destination} — {days}-Day Itinerary</h1>
                  <p className="meta">Total estimated cost: ${totalEstimatedCost}</p>
                  {itinerary.map(day => (
                    <div key={day.day} className="day-card">
                      <h2>Day {day.day} — ${day.dailyTotal} total</h2>
                      {day.morning?.length > 0 && <><h3>Morning</h3>{day.morning.map((a, i) => <div key={i} className="activity"><span><span className="time">{a.time}</span> {a.activity}</span><span className="cost">${a.cost}</span></div>)}</>}
                      {day.afternoon?.length > 0 && <><h3>Afternoon</h3>{day.afternoon.map((a, i) => <div key={i} className="activity"><span><span className="time">{a.time}</span> {a.activity}</span><span className="cost">${a.cost}</span></div>)}</>}
                      {day.evening?.length > 0 && <><h3>Evening</h3>{day.evening.map((a, i) => <div key={i} className="activity"><span><span className="time">{a.time}</span> {a.activity}</span><span className="cost">${a.cost}</span></div>)}</>}
                      {day.meals?.length > 0 && <><h3>Where to Eat</h3>{day.meals.map((m, i) => <div key={i} className="activity"><span>{m.meal}: {m.suggestion}</span><span className="cost">{m.priceRange || `$${m.cost}`}</span></div>)}</>}
                    </div>
                  ))}
                  {tips.length > 0 && <><h2>Tips</h2>{tips.map((t, i) => <div key={i} className="tip">{t}</div>)}</>}
                  <div className="total"><p>Total Estimated Cost</p><p className="total-amount">${totalEstimatedCost}</p></div>
                </div>

                {/* ── Visible popup content ── */}

                {/* Day cards */}
                {itinerary.map(day => (
                  <div key={day.day} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-lg">Day {day.day}</h3>
                      <span className="text-emerald-400 text-sm font-semibold bg-emerald-400/10 px-3 py-1 rounded-full">
                        {currencyFormat(day.dailyTotal)}
                      </span>
                    </div>

                    {day.morning?.length > 0 && (
                      <>
                        <h4 className="flex items-center gap-2 text-white font-semibold text-sm mb-2 mt-3 first:mt-0">
                          <span>🌅</span> Morning
                        </h4>
                        {day.morning.map((item, i) => <ActivityRow key={i} item={item} fmt={currencyFormat} />)}
                      </>
                    )}

                    {day.afternoon?.length > 0 && (
                      <>
                        <h4 className="flex items-center gap-2 text-white font-semibold text-sm mb-2 mt-3">
                          <span>☀️</span> Afternoon
                        </h4>
                        {day.afternoon.map((item, i) => <ActivityRow key={i} item={item} fmt={currencyFormat} />)}
                      </>
                    )}

                    {day.evening?.length > 0 && (
                      <>
                        <h4 className="flex items-center gap-2 text-white font-semibold text-sm mb-2 mt-3">
                          <span>🌙</span> Evening
                        </h4>
                        {day.evening.map((item, i) => <ActivityRow key={i} item={item} fmt={currencyFormat} />)}
                      </>
                    )}

                    {day.meals?.length > 0 && (
                      <>
                        <h4 className="flex items-center gap-2 text-white font-semibold text-sm mb-2 mt-3">
                          <span>🍽</span> Where to Eat
                        </h4>
                        {day.meals.map((item, i) => <MealRow key={i} item={item} fmt={currencyFormat} />)}
                      </>
                    )}
                  </div>
                ))}

                {/* Tips */}
                {tips.length > 0 && (
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
                    <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                      <span>💡</span> Practical Tips
                    </h3>
                    <ul className="space-y-2">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                          <span className="text-sky-400 mt-0.5 shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Saving tips */}
                {savingTips && savingTips.length > 0 && (
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5">
                    <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                      <span>💰</span> Budget Tips
                    </h3>
                    <ul className="space-y-2">
                      {savingTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                          <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Total */}
                <div className="bg-gradient-to-r from-sky-400/10 to-emerald-400/10 border border-sky-400/20 rounded-xl p-5 text-center">
                  <p className="text-white/60 text-sm mb-1">Total Estimated Cost</p>
                  <p className="text-3xl font-bold text-white">{currencyFormat(totalEstimatedCost)}</p>
                  <p className="text-white/40 text-xs mt-1">{days} day{days > 1 ? 's' : ''} in {destination}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
