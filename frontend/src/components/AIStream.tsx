import { useEffect, useRef } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface Props { content: string; isStreaming: boolean; placeholder?: string }

export default function AIStream({ content, isStreaming, placeholder }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isStreaming) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [content, isStreaming])

  if (!content && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600">
        <Sparkles className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm">{placeholder || 'Select a finding to get AI analysis'}</p>
      </div>
    )
  }

  // Simple markdown-like rendering
  const rendered = content
    .replace(/^## (.+)$/gm, '<h2 class="text-blue-400 font-bold text-lg mt-4 mb-2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-slate-200 font-semibold mt-3 mb-1">$1</h3>')
    .replace(/`([^`]+)`/g, '<code class="bg-[#0d1117] text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-slate-300 ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="text-slate-300 ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>')

  return (
    <div className="relative">
      {isStreaming && (
        <div className="flex items-center gap-2 text-blue-400 text-sm mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Gemini AI is analyzing...</span>
        </div>
      )}
      <div
        className="ai-stream text-slate-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
      {isStreaming && <span className="typing-cursor text-blue-400 ml-1" />}
      <div ref={endRef} />
    </div>
  )
}

