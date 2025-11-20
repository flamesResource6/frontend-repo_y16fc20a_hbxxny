import { useState } from 'react'
import { Mic, Image as ImageIcon, Type, Link2, Send } from 'lucide-react'

export default function CapturePanel({ onIngest }) {
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const handleFile = async (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (modality) => {
    try {
      setLoading(true)
      const res = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: text.split('\n')[0]?.slice(0, 80) || undefined,
          content: text || undefined,
          modality,
          source_url: sourceUrl || undefined,
          image_data_url: imageDataUrl || undefined,
          tags: [],
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      onIngest?.(data)
      setText('')
      setSourceUrl('')
      setImageDataUrl('')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste anything..."
          className="min-h-[100px] w-full resize-y rounded-xl border border-gray-200 bg-white/70 p-3 outline-none ring-blue-500 focus:ring"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Optional: Source URL"
            className="rounded-xl border border-gray-200 bg-white/70 p-3 outline-none ring-blue-500 focus:ring"
          />
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/50 p-3 text-gray-600 hover:bg-gray-50">
            <ImageIcon size={18} /> Image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          <button
            onClick={() => submit('text')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 p-3 font-medium text-white hover:bg-black disabled:opacity-60"
          >
            <Send size={18} /> Quick Save
          </button>
        </div>
        {imageDataUrl && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <img src={imageDataUrl} alt="preview" className="max-h-56 w-full object-cover" />
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1"><Type size={14}/> Text</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1"><Link2 size={14}/> URL</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1"><Mic size={14}/> Voice soon</span>
          </div>
          <span>{loading ? 'Saving…' : 'One-click capture'}</span>
        </div>
      </div>
    </div>
  )
}
