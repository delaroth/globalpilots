'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Script from 'next/script'

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  name: string
  faqs: FAQ[]
}

const faqCategories: FAQCategory[] = [
  {
    name: 'About GlobePilots',
    faqs: [
      {
        question: 'What is GlobePilots?',
        answer:
          'GlobePilots is a suite of free travel planning tools powered by live Google Flights data. We help you discover destinations, compare real-time flight prices in 30 currencies, check visa requirements, and plan adventures that fit any budget.',
      },
      {
        question: 'Is GlobePilots free?',
        answer:
          'Yes, all features are completely free to use — no sign-up required. We earn a small commission from booking partners when you click through to book, at no extra cost to you.',
      },
      {
        question: 'How does GlobePilots make money?',
        answer:
          'We use an affiliate model. When you click through to book flights or hotels via our partner links, we may earn a small commission at no extra cost to you. Our flight data comes from Google Flights, which keeps results accurate and comprehensive. This model keeps all our tools free.',
      },
      {
        question: 'Do you support international destinations?',
        answer:
          'Yes! GlobePilots supports destinations worldwide. Our Mystery Vacation tool can suggest destinations across every continent, and our Trip Cost Calculator covers 60+ cities around the globe with localized cost data.',
      },
      {
        question: 'What airlines are included?',
        answer:
          'We show results from Google Flights, which indexes virtually all airlines worldwide — including budget carriers, full-service airlines, and regional operators. If it is on Google Flights, you will see it on GlobePilots.',
      },
      {
        question: 'What currencies do you support?',
        answer:
          'We support 30 currencies, powered by the Frankfurter API with exchange rates updated every 6 hours. Select your preferred currency next to the budget input on any tool.',
      },
    ],
  },
  {
    name: 'Mystery Vacation',
    faqs: [
      {
        question: 'How does Mystery Vacation work?',
        answer:
          'Set your budget, departure city, travel dates, and vibe preferences. Our AI uses Google Travel Explore to find destinations that match, then reveals your destination in about 2-3 seconds. While you see the destination, detailed AI-generated itineraries, budget breakdowns, and travel tips stream in behind the scenes. You also get a clue-guessing game to try to figure out the destination before the big reveal.',
      },
      {
        question: 'How are destinations chosen?',
        answer:
          'Google Travel Explore finds real destinations with live flight prices that fit your budget. Each result is scored by how well it matches your selected vibes (beach, culture, adventure, party, etc.), then the final destination is randomized from the top 5 matches — so you get a great fit with a touch of surprise every time.',
      },
      {
        question: 'How does the budget breakdown work?',
        answer:
          'When you set a total budget, the AI allocates it across flights, accommodation, food, activities, and local transport. You can customize the split using sliders, or pick a budget priority preset (e.g., prioritize experiences over hotels). The breakdown adjusts based on the destination cost of living.',
      },
      {
        question: 'How fast are results?',
        answer:
          'Your destination reveals in 2-3 seconds with live flight pricing. The detailed itinerary, local tips, and enrichment data load progressively in the background so you can start exploring immediately while the full trip plan builds out.',
      },
      {
        question: 'Are flight prices accurate?',
        answer:
          'Prices marked LIVE are pulled directly from Google Flights in real time and reflect actual current fares. Some cached estimates from TravelPayouts are marked as estimated. We always show you which type you are looking at.',
      },
      {
        question: 'Can I choose my currency?',
        answer:
          'Yes, we support 30 currencies. Select your preferred currency from the dropdown next to the budget input. All prices — flights, accommodation, daily costs — will convert automatically.',
      },
      {
        question: 'Can I use this for group trips?',
        answer:
          'Absolutely! You can set the number of travellers when planning a Mystery Vacation. The budget breakdown will adjust per person, and the AI factors in group-friendly destinations and activities.',
      },
      {
        question: 'What is the "Dare a Friend" feature?',
        answer:
          'Dare a Friend lets you share a mystery trip with someone. They receive a link with the trip details hidden until they choose to reveal it — perfect for gifting a surprise adventure or challenging friends to take a spontaneous trip.',
      },
    ],
  },
  {
    name: 'Features',
    faqs: [
      {
        question: 'What is the Smart Stopover Finder?',
        answer:
          'The Smart Stopover Finder discovers flights with multi-day layovers that can actually save you money compared to direct routes. It checks visa requirements for your passport nationality at each stopover city, analyzes how much you save, and gives you a "free vacation" verdict when the stopover route costs less than flying direct.',
      },
      {
        question: 'What is the Destination Quiz?',
        answer:
          'A fun 6-question quiz that matches your travel personality with ideal destinations. Answer questions about your preferences and get personalized destination recommendations. You can share your results with friends to compare travel styles.',
      },
      {
        question: 'What is the Festival Calendar?',
        answer:
          'Browse 110+ festivals and events worldwide, organized by month and region. From Songkran in Thailand to Carnival in Brazil, the calendar helps you plan trips around the events you want to experience.',
      },
      {
        question: 'What is the Travel Passport?',
        answer:
          'Your personal travel profile that tracks destinations you discover through GlobePilots. Earn stamps for each destination you explore, unlock badges for achievements (like discovering 5 countries in Asia), and track your discovery streaks.',
      },
      {
        question: 'What is the Leaderboard?',
        answer:
          'The leaderboard shows who found the cheapest mystery trips this week. It adds a competitive element — see how your deal-finding skills stack up against other travelers on GlobePilots.',
      },
    ],
  },
  {
    name: 'Pricing & Booking',
    faqs: [
      {
        question: 'How often are prices updated?',
        answer:
          'Live prices from Google Flights are fetched in real time when you search. Cached estimates refresh periodically. Airfares are highly dynamic — prices can change multiple times a day. We recommend booking promptly if you find a great deal.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          'GlobePilots itself does not process any payments — we are a free planning tool. All bookings are made through third-party providers like airlines or booking platforms. Refund policies depend entirely on the provider you book with.',
      },
      {
        question: 'Is my payment information safe?',
        answer:
          'We never collect or store any payment information. When you click a booking link, you are redirected to a trusted third-party provider (airline website, booking platform, etc.) where all payment processing is handled securely by them.',
      },
    ],
  },
  {
    name: 'Account & Data',
    faqs: [
      {
        question: 'Do I need an account?',
        answer:
          'No, all features work without logging in. Creating a free account lets you save trips, sync your Travel Passport across devices, and track your discovery history.',
      },
      {
        question: 'How do I sign up?',
        answer:
          'You can sign up with Google OAuth (one click) or create an account with your email and password. Both options are free.',
      },
      {
        question: 'What data do you store?',
        answer:
          'For accounts: your profile info, saved trips, and Travel Passport stamps. Search data is cached temporarily (up to 1 hour) to speed up results and is not linked to your account. We do not sell your data or share it with third parties for marketing.',
      },
      {
        question: 'Can I delete my account?',
        answer:
          'Yes. Contact us through the contact page and we will delete all your data, including your profile, saved trips, and passport stamps.',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Yes. Passwords are hashed with bcrypt, our database is secured with Row Level Security policies, and sensitive API keys are rotated regularly. We follow security best practices to keep your information safe.',
      },
    ],
  },
]

// Flatten all FAQs for JSON-LD
const allFaqs = faqCategories.flatMap((cat) => cat.faqs)

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

function AccordionItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FAQ
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.04] transition cursor-pointer"
      >
        <span className="text-white font-medium pr-4">{faq.question}</span>
        <svg
          className={`w-5 h-5 text-skyblue shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-4 text-white/70 leading-relaxed">
            {faq.answer}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  function handleToggle(key: string) {
    setOpenIndex((prev) => (prev === key ? null : key))
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Frequently Asked{' '}
              <span className="text-skyblue">Questions</span>
            </h1>
            <p className="text-xl text-white/70 max-w-xl mx-auto">
              Everything you need to know about GlobePilots and how our tools
              work.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-12">
            {faqCategories.map((category) => (
              <div key={category.name}>
                <h2 className="text-xl font-bold text-skyblue mb-4 flex items-center gap-2">
                  {category.name}
                </h2>
                <div className="space-y-2">
                  {category.faqs.map((faq) => {
                    const key = `${category.name}-${faq.question}`
                    return (
                      <AccordionItem
                        key={key}
                        faq={faq}
                        isOpen={openIndex === key}
                        onToggle={() => handleToggle(key)}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Still have questions?
            </h2>
            <p className="text-white/70 mb-6">
              We&apos;re happy to help. Reach out to our team and we&apos;ll get
              back to you within 24 hours.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-skyblue hover:bg-skyblue-dark text-navy font-bold rounded-xl transition"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
