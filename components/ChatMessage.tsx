'use client'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  // Convert markdown links to clickable links
  const renderContent = (text: string) => {
    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-skyblue hover:text-skyblue-dark underline font-semibold"
        >
          {match[1]}
        </a>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  // Format content with line breaks and bold text
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold text: **text**
      const boldRegex = /\*\*([^*]+)\*\*/g
      const formatted = []
      let lastIndex = 0
      let match

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          formatted.push(renderContent(line.slice(lastIndex, match.index)))
        }
        formatted.push(
          <strong key={`bold-${i}-${match.index}`} className="font-bold">
            {match[1]}
          </strong>
        )
        lastIndex = match.index + match[0].length
      }

      if (lastIndex < line.length) {
        formatted.push(renderContent(line.slice(lastIndex)))
      }

      return (
        <span key={i}>
          {formatted.length > 0 ? formatted : renderContent(line)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${
            isUser ? 'bg-skyblue ml-3' : 'bg-white mr-3'
          }`}
        >
          {isUser ? '👤' : '🤖'}
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-skyblue text-navy'
              : 'bg-white text-gray-800 shadow-md'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">{formatContent(content)}</div>
        </div>
      </div>
    </div>
  )
}
