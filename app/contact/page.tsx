'use client'

import { useState, FormEvent } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const subjects = [
  { value: '', label: 'Select a subject...' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'feature', label: 'Feature Request' },
]

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    // Client-side validation
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Get in <span className="text-sky-400">Touch</span>
            </h1>
            <p className="text-xl text-white/70 max-w-xl mx-auto">
              Have a question, found a bug, or want to partner with us? We&apos;d
              love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              {/* Email */}
              <div className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">
                  <span role="img" aria-label="email">✉️</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Email</h3>
                <a
                  href="mailto:hello@globepilots.com"
                  className="text-sky-400 hover:text-sky-300 transition text-sm"
                >
                  hello@globepilots.com
                </a>
              </div>

              {/* Response time */}
              <div className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">
                  <span role="img" aria-label="clock">⏱️</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Response Time</h3>
                <p className="text-white/70 text-sm">
                  We typically respond within 24 hours.
                </p>
              </div>

              {/* What to expect */}
              <div className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">
                  <span role="img" aria-label="lightbulb">💡</span>
                </div>
                <h3 className="text-white font-semibold mb-1">Quick Tip</h3>
                <p className="text-white/70 text-sm">
                  Check our{' '}
                  <a href="/faq" className="text-sky-400 hover:text-sky-300 transition underline">
                    FAQ page
                  </a>{' '}
                  first — your question might already be answered.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              {status === 'success' ? (
                <div className="bg-white/[0.04] backdrop-blur-lg border border-green-500/30 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">
                    <span role="img" aria-label="check">✅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Message sent!
                  </h2>
                  <p className="text-white/70 mb-6">
                    Thanks for reaching out. We&apos;ll get back to you within 24
                    hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white rounded-xl transition cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-8 space-y-6"
                >
                  {/* Error banner */}
                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-white text-sm font-medium mb-2">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition appearance-none cursor-pointer"
                    >
                      {subjects.map((s) => (
                        <option key={s.value} value={s.value} className="bg-slate-900 text-white">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-white text-sm font-medium mb-2">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full px-8 py-3 bg-sky-500 hover:bg-sky-600 text-slate-900 font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
