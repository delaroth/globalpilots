'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPhrasebook, type LanguagePhrases } from '@/data/key-phrases'
import { getPlugInfo, type PlugInfo } from '@/data/plug-types'
import { getTippingInfo, type TippingInfo } from '@/data/tipping-customs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TripPrepProps {
  countryCode: string
  cityName: string
  climate?: { avgTempC: number; description: string; packingTip: string }
  tripDuration: number
  activities?: string[]  // from itinerary, to suggest activity-specific items
}

type TabId = 'phrases' | 'packing' | 'practical'

interface PackingItem {
  category: string
  item: string
  reason?: string
}

// ---------------------------------------------------------------------------
// Emergency numbers (static, by country code)
// ---------------------------------------------------------------------------

const EMERGENCY_NUMBERS: Record<string, { police: string; ambulance: string; fire: string }> = {
  TH: { police: '191', ambulance: '1669', fire: '199' },
  ID: { police: '110', ambulance: '118', fire: '113' },
  SG: { police: '999', ambulance: '995', fire: '995' },
  MY: { police: '999', ambulance: '999', fire: '994' },
  VN: { police: '113', ambulance: '115', fire: '114' },
  PH: { police: '117', ambulance: '911', fire: '911' },
  KH: { police: '117', ambulance: '119', fire: '118' },
  LA: { police: '1191', ambulance: '1195', fire: '1190' },
  JP: { police: '110', ambulance: '119', fire: '119' },
  KR: { police: '112', ambulance: '119', fire: '119' },
  HK: { police: '999', ambulance: '999', fire: '999' },
  TW: { police: '110', ambulance: '119', fire: '119' },
  CN: { police: '110', ambulance: '120', fire: '119' },
  IN: { police: '100', ambulance: '108', fire: '101' },
  LK: { police: '119', ambulance: '110', fire: '111' },
  NP: { police: '100', ambulance: '102', fire: '101' },
  AE: { police: '999', ambulance: '998', fire: '997' },
  TR: { police: '155', ambulance: '112', fire: '110' },
  QA: { police: '999', ambulance: '999', fire: '999' },
  IL: { police: '100', ambulance: '101', fire: '102' },
  JO: { police: '911', ambulance: '911', fire: '911' },
  EG: { police: '122', ambulance: '123', fire: '180' },
  GB: { police: '999', ambulance: '999', fire: '999' },
  FR: { police: '17', ambulance: '15', fire: '18' },
  NL: { police: '112', ambulance: '112', fire: '112' },
  ES: { police: '112', ambulance: '112', fire: '112' },
  PT: { police: '112', ambulance: '112', fire: '112' },
  CZ: { police: '158', ambulance: '155', fire: '150' },
  HU: { police: '107', ambulance: '104', fire: '105' },
  GR: { police: '100', ambulance: '166', fire: '199' },
  IT: { police: '113', ambulance: '118', fire: '115' },
  DE: { police: '110', ambulance: '112', fire: '112' },
  AT: { police: '133', ambulance: '144', fire: '122' },
  PL: { police: '997', ambulance: '999', fire: '998' },
  DK: { police: '112', ambulance: '112', fire: '112' },
  IE: { police: '999', ambulance: '999', fire: '999' },
  US: { police: '911', ambulance: '911', fire: '911' },
  MX: { police: '911', ambulance: '911', fire: '911' },
  CO: { police: '123', ambulance: '125', fire: '119' },
  PE: { police: '105', ambulance: '117', fire: '116' },
  AR: { police: '101', ambulance: '107', fire: '100' },
  BR: { police: '190', ambulance: '192', fire: '193' },
  CL: { police: '133', ambulance: '131', fire: '132' },
  PA: { police: '104', ambulance: '911', fire: '103' },
  CR: { police: '911', ambulance: '911', fire: '911' },
  MA: { police: '19', ambulance: '15', fire: '15' },
  ZA: { police: '10111', ambulance: '10177', fire: '10177' },
  KE: { police: '999', ambulance: '999', fire: '999' },
  SN: { police: '17', ambulance: '15', fire: '18' },
  GE: { police: '112', ambulance: '112', fire: '112' },
  AU: { police: '000', ambulance: '000', fire: '000' },
  NZ: { police: '111', ambulance: '111', fire: '111' },
}

// ---------------------------------------------------------------------------
// Packing List Generator
// ---------------------------------------------------------------------------

function generatePackingList(
  climate: TripPrepProps['climate'],
  tripDuration: number,
  activities: string[],
  plugInfo: PlugInfo | null,
): PackingItem[] {
  const items: PackingItem[] = []

  // -- Base essentials (always) --
  items.push(
    { category: 'Essentials', item: 'Passport (+ photocopy stored separately)' },
    { category: 'Essentials', item: 'Phone + charger' },
    { category: 'Essentials', item: 'Travel insurance documents' },
    { category: 'Essentials', item: 'Credit/debit cards + small amount of local cash' },
    { category: 'Essentials', item: 'Prescription medications (in original packaging)' },
    { category: 'Essentials', item: 'Reusable water bottle' },
  )

  // -- Plug adapter --
  if (plugInfo?.adapterNeeded) {
    const typeList = plugInfo.types.join('/')
    items.push({
      category: 'Essentials',
      item: `Type ${typeList} plug adapter`,
      reason: plugInfo.description,
    })
  }

  // -- Climate-based --
  if (climate) {
    const temp = climate.avgTempC

    if (temp > 28) {
      items.push(
        { category: 'Climate', item: 'Light, breathable clothing', reason: `Average ${temp}°C — hot climate` },
        { category: 'Climate', item: 'Sunscreen SPF 50+' },
        { category: 'Climate', item: 'Sunglasses' },
        { category: 'Climate', item: 'Hat or cap' },
        { category: 'Climate', item: 'Insect repellent' },
      )
    } else if (temp > 20) {
      items.push(
        { category: 'Climate', item: 'Light layers (t-shirts + light jacket)', reason: `Average ${temp}°C — warm climate` },
        { category: 'Climate', item: 'Sunscreen SPF 30+' },
        { category: 'Climate', item: 'Sunglasses' },
      )
    } else if (temp > 10) {
      items.push(
        { category: 'Climate', item: 'Layered clothing (sweater + jacket)', reason: `Average ${temp}°C — mild climate` },
        { category: 'Climate', item: 'Light rain jacket or windbreaker' },
        { category: 'Climate', item: 'Comfortable walking shoes (closed-toe)' },
      )
    } else {
      items.push(
        { category: 'Climate', item: 'Warm winter coat', reason: `Average ${temp}°C — cold climate` },
        { category: 'Climate', item: 'Thermal layers / base layers' },
        { category: 'Climate', item: 'Warm hat, gloves, and scarf' },
        { category: 'Climate', item: 'Warm waterproof boots' },
      )
    }

    // Rainy / monsoon detection from description
    const desc = (climate.description + ' ' + climate.packingTip).toLowerCase()
    if (desc.includes('rain') || desc.includes('monsoon') || desc.includes('wet')) {
      items.push(
        { category: 'Climate', item: 'Rain jacket or compact umbrella' },
        { category: 'Climate', item: 'Waterproof bag / dry bag for electronics' },
        { category: 'Climate', item: 'Quick-dry clothing' },
      )
    }
  } else {
    // No climate data — add versatile defaults
    items.push(
      { category: 'Climate', item: 'Layered clothing (prepare for varying temps)' },
      { category: 'Climate', item: 'Light rain jacket' },
      { category: 'Climate', item: 'Sunscreen' },
    )
  }

  // -- Duration-based --
  if (tripDuration > 7) {
    items.push(
      { category: 'Extended Stay', item: 'Laundry bag', reason: `${tripDuration}-day trip — plan for laundry` },
      { category: 'Extended Stay', item: 'Travel laundry detergent sheets' },
      { category: 'Extended Stay', item: 'Extra zip-lock bags for organization' },
    )
  }

  if (tripDuration > 14) {
    items.push(
      { category: 'Extended Stay', item: 'Portable clothesline' },
      { category: 'Extended Stay', item: 'First aid kit' },
    )
  }

  // -- Activity-based --
  const allActivities = activities.join(' ').toLowerCase()

  if (allActivities.includes('temple') || allActivities.includes('mosque') || allActivities.includes('church') || allActivities.includes('shrine') || allActivities.includes('religious')) {
    items.push(
      { category: 'Activities', item: 'Modest clothing (covers shoulders & knees)', reason: 'Required for temple/religious site visits' },
      { category: 'Activities', item: 'Easy slip-on shoes (removed at temple entrances)' },
    )
  }

  if (allActivities.includes('beach') || allActivities.includes('swim') || allActivities.includes('snorkel') || allActivities.includes('surf') || allActivities.includes('island') || allActivities.includes('coast')) {
    items.push(
      { category: 'Activities', item: 'Swimsuit' },
      { category: 'Activities', item: 'Reef-safe sunscreen', reason: 'Protects coral reefs' },
      { category: 'Activities', item: 'Quick-dry towel' },
      { category: 'Activities', item: 'Water shoes or flip-flops' },
    )
  }

  if (allActivities.includes('hik') || allActivities.includes('trek') || allActivities.includes('mountain') || allActivities.includes('trail') || allActivities.includes('climb')) {
    items.push(
      { category: 'Activities', item: 'Sturdy hiking shoes/boots', reason: 'Essential for trail comfort & safety' },
      { category: 'Activities', item: 'Daypack / backpack' },
      { category: 'Activities', item: 'Moisture-wicking socks' },
      { category: 'Activities', item: 'Trekking poles (if multi-day)' },
    )
  }

  if (allActivities.includes('dive') || allActivities.includes('diving') || allActivities.includes('scuba')) {
    items.push(
      { category: 'Activities', item: 'Dive certification card (if certified)' },
      { category: 'Activities', item: 'Underwater camera or GoPro' },
    )
  }

  if (allActivities.includes('safari') || allActivities.includes('wildlife') || allActivities.includes('game drive')) {
    items.push(
      { category: 'Activities', item: 'Neutral/earth-tone clothing', reason: 'Avoids startling wildlife' },
      { category: 'Activities', item: 'Binoculars' },
      { category: 'Activities', item: 'Zoom camera lens' },
    )
  }

  if (allActivities.includes('night') || allActivities.includes('club') || allActivities.includes('bar') || allActivities.includes('rooftop') || allActivities.includes('fine dining')) {
    items.push(
      { category: 'Activities', item: 'Smart casual outfit (for upscale venues)' },
    )
  }

  if (allActivities.includes('market') || allActivities.includes('shopping') || allActivities.includes('bazaar') || allActivities.includes('souk')) {
    items.push(
      { category: 'Activities', item: 'Foldable tote bag for purchases' },
    )
  }

  // -- Comfort & convenience --
  items.push(
    { category: 'Comfort', item: 'Earplugs + eye mask (for flights & noisy hotels)' },
    { category: 'Comfort', item: 'Portable power bank' },
    { category: 'Comfort', item: 'Day bag or crossbody bag' },
  )

  return items
}

// ---------------------------------------------------------------------------
// localStorage helpers for packing checklist
// ---------------------------------------------------------------------------

function getCheckedItems(storageKey: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveCheckedItems(storageKey: string, checked: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify([...checked]))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TripPrep({
  countryCode,
  cityName,
  climate,
  tripDuration,
  activities = [],
}: TripPrepProps) {
  const [activeTab, setActiveTab] = useState<TabId>('phrases')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const code = countryCode.toUpperCase()

  // Fetch static data
  const phrasebook: LanguagePhrases | null = useMemo(() => getPhrasebook(code), [code])
  const plugInfo: PlugInfo | null = useMemo(() => getPlugInfo(code), [code])
  const tippingInfo: TippingInfo | null = useMemo(() => getTippingInfo(code), [code])
  const emergencyNumbers = EMERGENCY_NUMBERS[code] ?? null

  // Generate packing list
  const packingItems: PackingItem[] = useMemo(
    () => generatePackingList(climate, tripDuration, activities, plugInfo),
    [climate, tripDuration, activities, plugInfo],
  )

  // Default to 'practical' if no phrasebook (English-speaking country)
  useEffect(() => {
    if (!phrasebook && activeTab === 'phrases') {
      setActiveTab('packing')
    }
  }, [phrasebook, activeTab])

  // Load checked items from localStorage
  const storageKey = `trip-prep-packing-${code}-${cityName}`
  useEffect(() => {
    setCheckedItems(getCheckedItems(storageKey))
  }, [storageKey])

  const toggleItem = useCallback((item: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      saveCheckedItems(storageKey, next)
      return next
    })
  }, [storageKey])

  // Group packing items by category
  const packingByCategory = useMemo(() => {
    const map = new Map<string, PackingItem[]>()
    for (const item of packingItems) {
      const list = map.get(item.category) || []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [packingItems])

  const checkedCount = checkedItems.size
  const totalCount = packingItems.length

  // Tab definitions
  const tabs: { id: TabId; label: string; icon: string; hidden?: boolean }[] = [
    { id: 'phrases', label: 'Phrases', icon: '💬', hidden: !phrasebook },
    { id: 'packing', label: 'Packing', icon: '🎒' },
    { id: 'practical', label: 'Practical', icon: '🔌' },
  ]

  const visibleTabs = tabs.filter(t => !t.hidden)

  return (
    <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <h3 className="text-white font-semibold text-lg">
          Pre-Trip Prep
          <span className="text-white/40 font-normal text-sm ml-2">{cityName}</span>
        </h3>
      </div>

      {/* Tab Bar */}
      <div className="px-4 sm:px-6 pb-2">
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
                }
              `}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {tab.id === 'packing' && totalCount > 0 && (
                <span className="ml-1.5 text-xs text-white/30">
                  {checkedCount}/{totalCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        {/* --- PHRASES TAB --- */}
        {activeTab === 'phrases' && phrasebook && (
          <div>
            <p className="text-white/40 text-sm mb-3">
              Essential {phrasebook.language} phrases for your trip
            </p>
            <div className="rounded-lg overflow-hidden border border-white/5">
              {/* Header row */}
              <div className="grid grid-cols-2 gap-0">
                <div className="px-3 py-2 bg-white/[0.06] text-white/50 text-xs font-semibold uppercase tracking-wider">
                  English
                </div>
                <div className="px-3 py-2 bg-white/[0.06] text-white/50 text-xs font-semibold uppercase tracking-wider">
                  {phrasebook.language}
                </div>
              </div>
              {/* Phrase rows */}
              {phrasebook.phrases.map((phrase, i) => (
                <div
                  key={phrase.english}
                  className={`grid grid-cols-2 gap-0 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <div className="px-3 py-2.5 text-white/80 text-sm border-r border-white/5">
                    {phrase.english}
                  </div>
                  <div className="px-3 py-2.5">
                    <div className="text-[#7dd3fc] text-sm">
                      {phrase.local}
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {phrase.pronunciation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PACKING TAB --- */}
        {activeTab === 'packing' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/40 text-sm">
                {tripDuration}-day trip to {cityName}
                {climate ? ` (avg ${climate.avgTempC}°C)` : ''}
              </p>
              {checkedCount > 0 && (
                <button
                  onClick={() => {
                    setCheckedItems(new Set())
                    saveCheckedItems(storageKey, new Set())
                  }}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="space-y-4">
              {[...packingByCategory.entries()].map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-white font-semibold text-sm mb-2">{category}</h4>
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const isChecked = checkedItems.has(item.item)
                      return (
                        <label
                          key={item.item}
                          className="flex items-start gap-3 py-1.5 px-2 rounded-md hover:bg-white/[0.03] cursor-pointer transition-colors group"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(item.item)}
                            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#7dd3fc] focus:ring-[#7dd3fc]/50 focus:ring-offset-0 cursor-pointer accent-[#7dd3fc]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm transition-all ${isChecked ? 'text-white/30 line-through' : 'text-white/80'}`}>
                              {item.item}
                            </span>
                            {item.reason && (
                              <span className="block text-xs text-white/30 mt-0.5">
                                {item.reason}
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                  <span>Packing progress</span>
                  <span>{Math.round((checkedCount / totalCount) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7dd3fc]/60 rounded-full transition-all duration-300"
                    style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- PRACTICAL TAB --- */}
        {activeTab === 'practical' && (
          <div className="space-y-5">
            {/* Plug Adapter Info */}
            {plugInfo && (
              <div>
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>🔌</span> Plug &amp; Power
                </h4>
                <div className="bg-white/[0.03] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Plug types</span>
                    <span className="text-white/90 text-sm font-mono">
                      {plugInfo.types.map(t => `Type ${t}`).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Voltage / Frequency</span>
                    <span className="text-white/90 text-sm font-mono">
                      {plugInfo.voltage}V / {plugInfo.frequency}Hz
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Adapter needed?</span>
                    <span className={`text-sm font-medium ${plugInfo.adapterNeeded ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {plugInfo.adapterNeeded ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs pt-1 border-t border-white/5">
                    {plugInfo.description}
                  </p>
                </div>
              </div>
            )}

            {/* Tipping Customs */}
            {tippingInfo && (
              <div>
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>💰</span> Tipping Customs
                </h4>
                <div className="bg-white/[0.03] rounded-lg overflow-hidden">
                  {[
                    { label: 'Restaurants', value: tippingInfo.restaurants },
                    { label: 'Taxis', value: tippingInfo.taxis },
                    { label: 'Hotels', value: tippingInfo.hotels },
                    { label: 'Tours', value: tippingInfo.tours },
                  ].map((row, i) => (
                    <div
                      key={row.label}
                      className={`px-3 py-2.5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} ${i < 3 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="text-white/50 text-xs font-medium mb-0.5">{row.label}</div>
                      <div className="text-white/80 text-sm">{row.value}</div>
                    </div>
                  ))}
                  <div className="px-3 py-2.5 bg-white/[0.02] border-t border-white/5">
                    <p className="text-white/40 text-xs italic">{tippingInfo.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Numbers */}
            {emergencyNumbers && (
              <div>
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>🚨</span> Emergency Numbers
                </h4>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Police', number: emergencyNumbers.police },
                      { label: 'Ambulance', number: emergencyNumbers.ambulance },
                      { label: 'Fire', number: emergencyNumbers.fire },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <div className="text-white/50 text-xs mb-0.5">{item.label}</div>
                        <div className="text-white/90 text-base font-mono font-semibold">{item.number}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
