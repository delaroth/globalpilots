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
          'GlobePilots is a suite of free, AI-powered travel planning tools designed for budget-conscious adventurers. We help you discover destinations, estimate trip costs, and plan adventures that fit any budget — no sign-up required.',
      },
      {
        question: 'How does GlobePilots make money?',
        answer:
          'We use an affiliate model. When you click through to book flights or hotels via our partner links (such as TravelPayouts), we may earn a small commission at no extra cost to you. This keeps all our tools free to use.',
      },
      {
        question: 'Do you support international destinations?',
        answer:
          'Yes! GlobePilots supports destinations worldwide. Our Mystery Vacation tool can suggest destinations across every continent, and our Trip Cost Calculator covers 60+ cities around the globe with localized cost data.',
      },
      {
        question: 'What airlines are included?',
        answer:
          'Our flight data covers hundreds of airlines worldwide through our data partners, including budget carriers, full-service airlines, and regional operators. Results include airlines like Ryanair, AirAsia, Emirates, Delta, and many more.',
      },
    ],
  },
  {
    name: 'Mystery Vacation',
    faqs: [
      {
        question: 'How does Mystery Vacation work?',
        answer:
          'Set your budget, departure city, and travel dates — then let our AI surprise you with a destination that fits. You get a complete trip plan including flight estimates, hotel suggestions, daily itineraries, and a full budget breakdown. You can reveal the destination when you are ready or keep it a mystery until departure.',
      },
      {
        question: 'How are destinations chosen?',
        answer:
          'Our AI considers your budget, departure airport, travel dates, and preferences to find destinations where your money goes furthest. It factors in flight costs, local accommodation prices, food, and activity costs to ensure the destination truly fits your budget.',
      },
      {
        question: 'How does the budget breakdown work?',
        answer:
          'When you set a total budget, the AI allocates it across flights, accommodation, food, activities, and local transport. You can see exactly how much is estimated for each category. The breakdown adjusts based on the destination cost of living.',
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
    name: 'Pricing & Booking',
    faqs: [
      {
        question: 'Are the flight prices accurate?',
        answer:
          'Our prices are estimates based on data from TravelPayouts and other sources. They give you a reliable ballpark, but actual prices may vary. We always link you to the booking provider so you can see the real-time price before you pay.',
      },
      {
        question: 'How often are prices updated?',
        answer:
          'Flight price data is refreshed regularly through our data partners. However, airfares are highly dynamic — prices can change multiple times a day. We recommend booking promptly if you find a great deal.',
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
    name: 'Privacy & Security',
    faqs: [
      {
        question: 'What data do you collect?',
        answer:
          'We collect minimal data: your search preferences (origin, budget, dates) to provide results, and an optional email if you subscribe to deal alerts. We do not sell your data or share it with third parties for marketing. See our Privacy Policy for full details.',
      },
      {
        question: 'How does the Travel Passport work?',
        answer:
          'The Travel Passport is your personal profile that tracks destinations you have explored through GlobePilots. It stores data locally in your browser, so you don not need an account. If you create an account, your passport syncs across devices.',
      },
      {
        question: 'Can I save trips without an account?',
        answer:
          'Yes! Trip data and your Travel Passport are saved in your browser local storage. No account needed. However, creating a free account lets you sync your data across devices and ensures nothing is lost if you clear your browser data.',
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
