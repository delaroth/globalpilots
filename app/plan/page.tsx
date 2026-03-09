'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ChatMessage from '@/components/ChatMessage'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function PlanPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('globepilot_chat_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed)
      } catch {
        // Ignore parsing errors
      }
    } else {
      // Start with welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm GlobePilot, your AI travel planning assistant. 👋

I specialize in finding amazing budget-friendly trips tailored to you.

To get started, tell me:
• What's your budget?
• Where are you traveling from?
• When do you want to go?
• What kind of trip are you looking for? (beach, adventure, city, etc.)

Let's plan your next adventure!`,
        },
      ])
    }
  }, [])

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('globepilot_chat_history', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          role: 'assistant',
          content: `Chat cleared! Let's start fresh. What trip are you planning?`,
        },
      ])
      localStorage.removeItem('globepilot_chat_history')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex flex-col">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearChat}
              className="text-skyblue-light hover:text-skyblue transition text-sm"
            >
              Clear Chat
            </button>
            <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          AI Trip Planner 🤖
        </h1>
        <p className="text-skyblue-light">
          Chat with AI to plan your perfect budget trip
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 pb-4 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 bg-navy-light/30 backdrop-blur-sm rounded-2xl p-6 border border-skyblue/10">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start max-w-[80%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-white mr-3">
                  🤖
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your trip..."
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-skyblue hover:bg-skyblue-dark text-navy font-semibold px-8 py-3 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Send
            </button>
          </div>
        </form>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'Beach vacation under $1500',
              'Weekend trip from NYC',
              'Adventure trip in Asia',
              'Europe on a budget',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInput(prompt)}
                className="bg-navy-light/50 hover:bg-navy-light text-white text-sm py-2 px-3 rounded-lg transition border border-skyblue/20 hover:border-skyblue/50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
