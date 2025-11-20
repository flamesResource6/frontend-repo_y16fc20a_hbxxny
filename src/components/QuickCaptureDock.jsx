import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, StopCircle, Send } from 'lucide-react'

const PALETTE = {
  navy: '#0b1b3a',
  warm: '#f9f7f4',
  black: '#0a0a0a',
  orange: '#ff7a00',
}

export default function QuickCaptureDock({ align = 'center' }) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const recRef = useRef(null)

  // Setup speech recognition if available
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (event) => {
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        finalText += res[0].transcript
      }
      setTranscript(finalText.trim())
    }
    rec.onerror = (e) => {
      setError(e.error || 'Speech recognition error')
      setRecording(false)
    }
    rec.onend = () => {
      setRecording(false)
    }
    recRef.current = rec
  }, [])

  const startVoice = () => {
    setError('')
    const rec = recRef.current
    if (!rec) {
      setError('Voice capture not supported on this browser')
      return
    }
    try {
      setTranscript('')
      rec.start()
      setRecording(true)
    } catch (e) {
      setError(e.message)
    }
  }

  const stopVoice = () => {
    const rec = recRef.current
    if (rec && recording) rec.stop()
    setRecording(false)
    if (transcript && !text) setText(transcript)
  }

  const save = async (payloadText, modality = 'text') => {
    if (!payloadText || !payloadText.trim()) return
    try {
      setSaving(true)
      setError('')
      const res = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payloadText.split('\n')[0]?.slice(0, 80),
          content: payloadText,
          modality,
          // Rely on backend heuristic routing to correct folder
          tags: ['inbox']
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({detail:'Failed'}))
        throw new Error(data.detail || 'Failed to save')
      }
      setTranscript('')
      setText('')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const alignedPosition = useMemo(() => {
    switch (align) {
      case 'top':
        return 'top-1/2 -translate-y-[48vh] left-1/2 -translate-x-1/2'
      case 'bottom':
        return 'bottom-8 left-1/2 -translate-x-1/2'
      case 'right':
        return 'right-8 top-1/2 -translate-y-1/2'
      case 'left':
        return 'left-8 top-1/2 -translate-y-1/2'
      default:
        return 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
    }
  }, [align])

  return (
    <div className={`pointer-events-auto absolute z-20 ${alignedPosition} w-[92vw] max-w-xl`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border shadow-xl backdrop-blur"
        style={{ backgroundColor: 'rgba(255,255,255,0.75)', borderColor: 'rgba(11,27,58,0.14)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.navy }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PALETTE.orange }} />
            <span className="font-medium">Quick Save</span>
            <span className="opacity-60">Speak or type — we route it smartly</span>
          </div>
          {error && (
            <span className="text-[11px]" style={{ color: '#b42318' }}>{error}</span>
          )}
        </div>

        {/* Input row */}
        <div className="flex items-stretch gap-2 p-3 pt-2">
          <div className="relative flex-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a thought, add hints like due:2025-01-15 or #idea"
              className="w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:ring"
              style={{ borderColor: 'rgba(11,27,58,0.15)' }}
            />
            {transcript && !text && (
              <div className="pointer-events-none absolute inset-0 rounded-xl px-3 py-3 text-sm" style={{ color: '#465', opacity: 0.7 }}>
                {transcript}
              </div>
            )}
          </div>
          <button
            onClick={recording ? stopVoice : startVoice}
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow"
            style={{ backgroundColor: recording ? '#b42318' : PALETTE.navy }}
            title={recording ? 'Stop' : 'Record'}
          >
            {recording ? <StopCircle size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={() => save(text || transcript, transcript && !text ? 'voice' : 'text')}
            disabled={saving || (!text && !transcript)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: PALETTE.orange }}
          >
            <Send size={16} />
            Save
          </button>
        </div>

        {/* Tips */}
        <div className="flex items-center gap-3 px-3 pb-3 text-[11px]" style={{ color: '#556' }}>
          <span>Hints: "due in 3 days", "#tasks", "@read"</span>
        </div>
      </motion.div>
    </div>
  )
}
