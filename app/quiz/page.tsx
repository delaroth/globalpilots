'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizQuestion {
  id: string
  question: string
  options: { emoji: string; label: string; value: string }[]
}

interface Destination {
  name: string
  country: string
  flag: string
  vibes: string[]
  budgetTier: string[]
  flightTolerance: string[]
  weather: string[]
  priority: string[]
  adventureLevel: string[]
  costRange: [number, number]
  personality: string
  tagline: string
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'vibe',
    question: "What's your ideal vacation vibe?",
    options: [
      { emoji: '🏖️', label: 'Beach', value: 'beach' },
      { emoji: '🏙️', label: 'City', value: 'city' },
      { emoji: '🏔️', label: 'Adventure', value: 'adventure' },
      { emoji: '🏛️', label: 'Culture', value: 'culture' },
      { emoji: '🌿', label: 'Nature', value: 'nature' },
    ],
  },
  {
    id: 'budget',
    question: "What's your budget comfort zone?",
    options: [
      { emoji: '💵', label: 'Under $500', value: 'low' },
      { emoji: '💰', label: '$500 – $1,000', value: 'mid' },
      { emoji: '💎', label: '$1,000 – $2,000', value: 'high' },
      { emoji: '👑', label: '$2,000+', value: 'luxury' },
    ],
  },
  {
    id: 'flight',
    question: 'How do you feel about long flights?',
    options: [
      { emoji: '✈️', label: 'Love them', value: 'long' },
      { emoji: '🤷', label: "Don't mind", value: 'medium' },
      { emoji: '⏱️', label: 'Keep it short (under 6h)', value: 'short' },
    ],
  },
  {
    id: 'weather',
    question: 'Pick your ideal weather',
    options: [
      { emoji: '☀️', label: 'Hot & sunny', value: 'hot' },
      { emoji: '🌴', label: 'Warm & breezy', value: 'warm' },
      { emoji: '🍂', label: 'Cool & crisp', value: 'cool' },
      { emoji: '🌈', label: "Don't care", value: 'any' },
    ],
  },
  {
    id: 'priority',
    question: "What's most important to you?",
    options: [
      { emoji: '🍜', label: 'Amazing food', value: 'food' },
      { emoji: '🏞️', label: 'Stunning nature', value: 'nature' },
      { emoji: '📜', label: 'Rich history', value: 'history' },
      { emoji: '🎉', label: 'Nightlife', value: 'nightlife' },
    ],
  },
  {
    id: 'adventure',
    question: 'How adventurous are you?',
    options: [
      { emoji: '🛡️', label: 'Play it safe', value: 'safe' },
      { emoji: '🧭', label: 'Somewhat adventurous', value: 'moderate' },
      { emoji: '🚀', label: 'Full send', value: 'fullsend' },
    ],
  },
]

const DESTINATIONS: Destination[] = [
  {
    name: 'Bali',
    country: 'Indonesia',
    flag: '🇮🇩',
    vibes: ['beach', 'nature', 'culture'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['long', 'medium'],
    weather: ['hot', 'warm', 'any'],
    priority: ['nature', 'food'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [400, 800],
    personality: 'Zen Explorer',
    tagline: 'Rice terraces, temples, and world-class surf',
  },
  {
    name: 'Bangkok',
    country: 'Thailand',
    flag: '🇹🇭',
    vibes: ['city', 'culture'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['long', 'medium'],
    weather: ['hot', 'warm', 'any'],
    priority: ['food', 'nightlife'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [300, 600],
    personality: 'Street Food Connoisseur',
    tagline: 'Temples, night markets, and the best street food on Earth',
  },
  {
    name: 'Lisbon',
    country: 'Portugal',
    flag: '🇵🇹',
    vibes: ['city', 'culture', 'beach'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['long', 'medium'],
    weather: ['warm', 'any'],
    priority: ['food', 'history', 'nightlife'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [500, 1000],
    personality: 'Culture Vulture',
    tagline: 'Pastel de nata, fado music, and coastal charm',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    flag: '🇯🇵',
    vibes: ['city', 'culture'],
    budgetTier: ['mid', 'high', 'luxury'],
    flightTolerance: ['long'],
    weather: ['cool', 'warm', 'any'],
    priority: ['food', 'history'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [800, 1500],
    personality: 'Urban Adventurer',
    tagline: 'Ancient traditions meet futuristic innovation',
  },
  {
    name: 'Medellin',
    country: 'Colombia',
    flag: '🇨🇴',
    vibes: ['city', 'adventure', 'nature'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['long', 'medium'],
    weather: ['warm', 'any'],
    priority: ['nightlife', 'nature', 'food'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [350, 700],
    personality: 'Adventure Seeker',
    tagline: 'City of eternal spring with incredible mountain scenery',
  },
  {
    name: 'Reykjavik',
    country: 'Iceland',
    flag: '🇮🇸',
    vibes: ['nature', 'adventure'],
    budgetTier: ['high', 'luxury'],
    flightTolerance: ['medium', 'short'],
    weather: ['cool', 'any'],
    priority: ['nature'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [900, 1800],
    personality: 'Nature Purist',
    tagline: 'Northern lights, geysers, and otherworldly landscapes',
  },
  {
    name: 'Marrakech',
    country: 'Morocco',
    flag: '🇲🇦',
    vibes: ['culture', 'adventure'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['medium', 'long'],
    weather: ['hot', 'warm', 'any'],
    priority: ['food', 'history'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [400, 800],
    personality: 'Bazaar Navigator',
    tagline: 'Souks, spices, and stunning riads',
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    vibes: ['city', 'beach', 'culture'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['medium', 'long'],
    weather: ['warm', 'hot', 'any'],
    priority: ['food', 'nightlife', 'history'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [600, 1200],
    personality: 'Beach Bum',
    tagline: 'Gaudi, tapas, and Mediterranean beaches',
  },
  {
    name: 'Cape Town',
    country: 'South Africa',
    flag: '🇿🇦',
    vibes: ['nature', 'adventure', 'beach'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['long'],
    weather: ['warm', 'any'],
    priority: ['nature', 'food'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [700, 1300],
    personality: 'Thrill Chaser',
    tagline: 'Table Mountain, wine country, and great white sharks',
  },
  {
    name: 'Budapest',
    country: 'Hungary',
    flag: '🇭🇺',
    vibes: ['city', 'culture'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['medium', 'long'],
    weather: ['cool', 'warm', 'any'],
    priority: ['history', 'nightlife', 'food'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [350, 700],
    personality: 'History Buff',
    tagline: 'Thermal baths, ruin bars, and stunning architecture',
  },
  {
    name: 'Cusco',
    country: 'Peru',
    flag: '🇵🇪',
    vibes: ['adventure', 'culture', 'nature'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['long'],
    weather: ['cool', 'any'],
    priority: ['history', 'nature'],
    adventureLevel: ['fullsend'],
    costRange: [600, 1200],
    personality: 'Ruin Raider',
    tagline: 'Gateway to Machu Picchu and the Sacred Valley',
  },
  {
    name: 'Chiang Mai',
    country: 'Thailand',
    flag: '🇹🇭',
    vibes: ['culture', 'nature'],
    budgetTier: ['low'],
    flightTolerance: ['long', 'medium'],
    weather: ['hot', 'warm', 'any'],
    priority: ['food', 'nature', 'history'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [250, 500],
    personality: 'Mindful Wanderer',
    tagline: 'Temples, night bazaars, and jungle treks on a tiny budget',
  },
  {
    name: 'Dubrovnik',
    country: 'Croatia',
    flag: '🇭🇷',
    vibes: ['beach', 'culture'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['medium', 'long'],
    weather: ['warm', 'hot', 'any'],
    priority: ['history', 'nature'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [600, 1100],
    personality: 'Coastal Explorer',
    tagline: 'Walled city, crystal seas, and Game of Thrones magic',
  },
  {
    name: 'Queenstown',
    country: 'New Zealand',
    flag: '🇳🇿',
    vibes: ['adventure', 'nature'],
    budgetTier: ['high', 'luxury'],
    flightTolerance: ['long'],
    weather: ['cool', 'any'],
    priority: ['nature'],
    adventureLevel: ['fullsend'],
    costRange: [1000, 2000],
    personality: 'Adrenaline Junkie',
    tagline: 'Bungee jumping, skiing, and Lord of the Rings scenery',
  },
  {
    name: 'Hanoi',
    country: 'Vietnam',
    flag: '🇻🇳',
    vibes: ['culture', 'city'],
    budgetTier: ['low'],
    flightTolerance: ['long', 'medium'],
    weather: ['warm', 'hot', 'any'],
    priority: ['food', 'history'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [250, 500],
    personality: 'Budget Explorer',
    tagline: 'Pho, motorbikes, and 1,000 years of history',
  },
  {
    name: 'Santorini',
    country: 'Greece',
    flag: '🇬🇷',
    vibes: ['beach', 'culture'],
    budgetTier: ['high', 'luxury'],
    flightTolerance: ['medium', 'long'],
    weather: ['hot', 'warm', 'any'],
    priority: ['food', 'history'],
    adventureLevel: ['safe'],
    costRange: [800, 1600],
    personality: 'Romantic Dreamer',
    tagline: 'Blue domes, sunsets, and volcanic beaches',
  },
  {
    name: 'Tbilisi',
    country: 'Georgia',
    flag: '🇬🇪',
    vibes: ['culture', 'adventure', 'city'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['medium', 'long'],
    weather: ['warm', 'cool', 'any'],
    priority: ['food', 'history'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [300, 600],
    personality: 'Hidden Gem Hunter',
    tagline: 'Wine, khinkali, and a city carved into the hillside',
  },
  {
    name: 'Kyoto',
    country: 'Japan',
    flag: '🇯🇵',
    vibes: ['culture', 'nature'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['long'],
    weather: ['cool', 'warm', 'any'],
    priority: ['history', 'nature', 'food'],
    adventureLevel: ['safe', 'moderate'],
    costRange: [700, 1400],
    personality: 'Tranquil Spirit',
    tagline: 'Zen gardens, geisha districts, and bamboo forests',
  },
  {
    name: 'Mexico City',
    country: 'Mexico',
    flag: '🇲🇽',
    vibes: ['city', 'culture'],
    budgetTier: ['low', 'mid'],
    flightTolerance: ['medium', 'short'],
    weather: ['warm', 'any'],
    priority: ['food', 'history', 'nightlife'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [350, 700],
    personality: 'Taco Philosopher',
    tagline: 'World-class museums, street tacos, and vibrant neighborhoods',
  },
  {
    name: 'Zanzibar',
    country: 'Tanzania',
    flag: '🇹🇿',
    vibes: ['beach', 'nature', 'adventure'],
    budgetTier: ['mid', 'high'],
    flightTolerance: ['long'],
    weather: ['hot', 'warm', 'any'],
    priority: ['nature', 'food'],
    adventureLevel: ['moderate', 'fullsend'],
    costRange: [600, 1200],
    personality: 'Island Nomad',
    tagline: 'Spice tours, turquoise water, and Stone Town alleys',
  },
]

const PERSONALITY_MAP: Record<string, { emoji: string; description: string }> = {
  'Zen Explorer': { emoji: '🧘', description: 'You seek balance between adventure and relaxation. Temples at sunrise, surfing at sunset.' },
  'Street Food Connoisseur': { emoji: '🍜', description: 'Your travel itinerary is basically a food tour. You find the best eats on every corner.' },
  'Culture Vulture': { emoji: '🎭', description: 'Museums, local customs, and hidden history — you travel to understand the world.' },
  'Urban Adventurer': { emoji: '🌃', description: 'You thrive in big cities with endless things to discover around every corner.' },
  'Adventure Seeker': { emoji: '🧗', description: 'Comfort zone? Never heard of it. You chase the rush of new experiences.' },
  'Nature Purist': { emoji: '🌋', description: 'Your happy place is far from civilization, surrounded by raw natural beauty.' },
  'Bazaar Navigator': { emoji: '🕌', description: 'You love getting lost in markets, haggling for treasures, and soaking up exotic culture.' },
  'Beach Bum': { emoji: '🏖️', description: 'Sand between your toes, waves in your ears — you were born for the coast.' },
  'Thrill Chaser': { emoji: '🦈', description: 'If it gets your heart racing, you are in. Shark dives, cliff jumps, bring it on.' },
  'History Buff': { emoji: '🏰', description: 'Ancient ruins and cobblestone streets speak to your soul. Every building has a story.' },
  'Ruin Raider': { emoji: '🗿', description: 'You climb mountains to see what civilizations built centuries ago. Indiana Jones energy.' },
  'Mindful Wanderer': { emoji: '🪷', description: 'You travel slowly, savoring every moment. Quality over quantity, always.' },
  'Coastal Explorer': { emoji: '⛵', description: 'Historic ports, sea-sprayed walls, and the pull of the Mediterranean define your trips.' },
  'Adrenaline Junkie': { emoji: '🪂', description: 'Bungee, skydive, white-water raft — if it has a waiver, you are signing it.' },
  'Budget Explorer': { emoji: '🎒', description: 'You prove that incredible trips do not require deep pockets. Master of the deal.' },
  'Romantic Dreamer': { emoji: '🌅', description: 'Sunsets, wine, and breathtaking views. You travel for the beauty of it all.' },
  'Hidden Gem Hunter': { emoji: '💎', description: 'While everyone else crowds the hotspots, you uncover the places nobody talks about.' },
  'Tranquil Spirit': { emoji: '🍵', description: 'Quiet gardens, meditative walks, and peaceful moments are your kind of adventure.' },
  'Taco Philosopher': { emoji: '🌮', description: 'You ponder life over street food and find meaning in the chaos of vibrant cities.' },
  'Island Nomad': { emoji: '🏝️', description: 'Crystal water, spice-scented breezes, and island time — you follow the tides.' },
}

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

function matchDestination(answers: Record<string, string>): Destination {
  let bestMatch = DESTINATIONS[0]
  let bestScore = -1

  for (const dest of DESTINATIONS) {
    let score = 0

    // Vibe match (highest weight)
    if (dest.vibes.includes(answers.vibe)) score += 4

    // Budget match
    if (dest.budgetTier.includes(answers.budget)) score += 3

    // Flight tolerance
    if (dest.flightTolerance.includes(answers.flight)) score += 2

    // Weather match
    if (dest.weather.includes(answers.weather)) score += 2

    // Priority match
    if (dest.priority.includes(answers.priority)) score += 3

    // Adventure level
    if (dest.adventureLevel.includes(answers.adventure)) score += 2

    if (score > bestScore) {
      bestScore = score
      bestMatch = dest
    }
  }

  return bestMatch
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current) / total) * 100
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-xs text-white/40 mb-2">
        <span>Question {Math.min(current + 1, total)} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-sky-500 to-purple-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  onSelect,
}: {
  question: QuizQuestion
  onSelect: (value: string) => void
}) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
        {question.question}
      </h2>
      <div className="grid gap-3">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="group bg-white/[0.04] backdrop-blur-lg border border-white/10 hover:border-sky-500/50 hover:bg-white/[0.08] rounded-xl px-6 py-4 flex items-center gap-4 transition-all active:scale-[0.98]"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">
              {opt.emoji}
            </span>
            <span className="text-lg text-white/80 group-hover:text-white font-medium transition-colors">
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function ResultCard({
  destination,
  answers,
}: {
  destination: Destination
  answers: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)
  const personalityInfo = PERSONALITY_MAP[destination.personality] || {
    emoji: '🌍',
    description: 'You are a unique traveler with your own style.',
  }

  // Build share URL with encoded result
  const shareParams = new URLSearchParams({
    result: destination.name,
    p: destination.personality,
    ...answers,
  })

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/quiz?${shareParams.toString()}`
      : ''

  const handleCopyLink = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [shareUrl])

  // Map quiz vibe to mystery page vibe param
  const vibeMap: Record<string, string> = {
    beach: 'beach',
    city: 'city',
    adventure: 'adventure',
    culture: 'food',
    nature: 'nature',
  }
  const mysteryVibe = vibeMap[answers.vibe] || ''

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Result card */}
      <div className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
        {/* Header with flag */}
        <div className="bg-gradient-to-br from-sky-500/20 to-purple-500/20 p-8 text-center">
          <div className="text-7xl mb-4">{destination.flag}</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {destination.name}
          </h2>
          <p className="text-sky-300 text-lg">{destination.country}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Tagline */}
          <p className="text-white/60 text-center italic">
            &ldquo;{destination.tagline}&rdquo;
          </p>

          {/* Personality */}
          <div className="bg-white/[0.04] rounded-xl p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-2">
              Your Travel Personality
            </p>
            <p className="text-2xl font-bold text-white mb-1">
              {personalityInfo.emoji} {destination.personality}
            </p>
            <p className="text-sm text-white/50">
              {personalityInfo.description}
            </p>
          </div>

          {/* Cost range */}
          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30 mb-1">
                Est. Trip Cost
              </p>
              <p className="text-xl font-bold text-emerald-400">
                ${destination.costRange[0]} – ${destination.costRange[1]}
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href={`/mystery${mysteryVibe ? `?vibe=${mysteryVibe}` : ''}`}
              className="block w-full text-center px-6 py-3 bg-sky-500 text-slate-900 font-bold rounded-xl hover:bg-sky-500-light transition-colors text-lg"
            >
              Try Mystery Vacation
            </Link>

            <button
              onClick={handleCopyLink}
              className="w-full px-6 py-3 bg-white/[0.06] border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/[0.1] hover:text-white transition-all text-sm"
            >
              {copied ? '✓ Link copied!' : '📋 Share your result'}
            </button>
          </div>
        </div>
      </div>

      {/* Retake */}
      <div className="text-center mt-6">
        <button
          onClick={() => window.location.replace('/quiz')}
          className="text-sm text-white/40 hover:text-white/70 underline underline-offset-4 transition"
        >
          Retake quiz
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Shared result view (when visiting with ?result= param)
// ---------------------------------------------------------------------------

function SharedResult({ params }: { params: URLSearchParams }) {
  const destName = params.get('result')
  const personality = params.get('p')
  const dest = DESTINATIONS.find((d) => d.name === destName)

  if (!dest) return null

  const answers: Record<string, string> = {}
  for (const key of ['vibe', 'budget', 'flight', 'weather', 'priority', 'adventure']) {
    const val = params.get(key)
    if (val) answers[key] = val
  }

  return (
    <div className="flex-1 px-6 py-16">
      <div className="text-center mb-8">
        <p className="text-sm text-white/40 mb-2">Someone shared their quiz result with you</p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Their match: <span className="text-sky-400">{dest.name}</span>
        </h1>
        <p className="text-sky-300">
          {personality ? `Travel personality: ${personality}` : dest.tagline}
        </p>
      </div>
      <ResultCard destination={dest} answers={answers} />
      <div className="text-center mt-8">
        <Link
          href="/quiz"
          className="inline-block px-8 py-3 bg-sky-500 text-slate-900 font-bold rounded-xl hover:bg-sky-500-light transition-colors"
        >
          Take the Quiz Yourself
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function QuizPageContent() {
  const searchParams = useSearchParams()
  const hasSharedResult = searchParams.get('result')

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [matchedDest, setMatchedDest] = useState<Destination | null>(null)

  useEffect(() => {
    // If shared result, don't do anything quiz-related
  }, [hasSharedResult])

  const handleSelect = useCallback(
    (value: string) => {
      const questionId = QUESTIONS[currentQ].id
      const newAnswers = { ...answers, [questionId]: value }
      setAnswers(newAnswers)

      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ((prev) => prev + 1)
      } else {
        // All questions answered — compute result
        const dest = matchDestination(newAnswers)
        setMatchedDest(dest)
        setShowResult(true)
      }
    },
    [currentQ, answers],
  )

  // Show shared result view if URL has result params
  if (hasSharedResult) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navigation />
        <SharedResult params={searchParams} />
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header (only during quiz) */}
          {!showResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                Which Mystery Destination{' '}
                <span className="text-sky-400">Suits You?</span>
              </h1>
              <p className="text-sky-300">
                Answer 6 quick questions and we&apos;ll match you with your dream trip.
              </p>
            </motion.div>
          )}

          {/* Progress bar */}
          {!showResult && (
            <ProgressBar current={currentQ} total={QUESTIONS.length} />
          )}

          {/* Questions */}
          {!showResult && (
            <AnimatePresence mode="wait">
              <QuestionCard
                key={QUESTIONS[currentQ].id}
                question={QUESTIONS[currentQ]}
                onSelect={handleSelect}
              />
            </AnimatePresence>
          )}

          {/* Result */}
          {showResult && matchedDest && (
            <div className="pt-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Your Perfect Match
                </h1>
                <p className="text-sky-300">
                  Based on your answers, here&apos;s where you should go next.
                </p>
              </motion.div>
              <ResultCard destination={matchedDest} answers={answers} />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <QuizPageContent />
    </Suspense>
  )
}
