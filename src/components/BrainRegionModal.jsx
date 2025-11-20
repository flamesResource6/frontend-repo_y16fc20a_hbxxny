import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function BrainRegionModal({ open, region, onClose }) {
  const [items, setItems] = useState([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    if (!open) return
    const load = async () => {
      const res = await fetch(`${baseUrl}/api/thoughts?folder=${region.folderKey}`)
      const data = await res.json()
      setItems(data.items || [])
    }
    load()
  }, [open, region])

  const saveNote = async () => {
    if (!note.trim()) return
    try {
      setLoading(true)
      const res = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.split('\n')[0]?.slice(0, 80),
          content: note,
          modality: 'text',
          tags: [region.folderKey],
        })
      })
      const data = await res.json()
      if (res.ok) {
        setNote('')
        // Reload
        const r2 = await fetch(`${baseUrl}/api/thoughts?folder=${region.folderKey}`)
        const d2 = await r2.json()
        setItems(d2.items || [])
      } else {
        alert(data.detail || 'Failed to save')
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 grid w-[92vw] max-w-5xl grid-cols-1 gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl md:grid-cols-5"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          Close
        </button>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-zinc-900">{region.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">{region.description}</p>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
            <div>Folder mapping: <span className="font-medium text-zinc-800">{region.folderKey}</span></div>
            <div className="mt-1">Label: {region.label}</div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-800">Quick note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Add something to ${region.folderKey}…`}
              className="mt-2 h-28 w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none ring-zinc-800/20 focus:ring"
            />
            <div className="mt-2 flex items-center justify-end">
              <button
                onClick={saveNote}
                disabled={loading}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save to region'}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-zinc-900">What lives here</h4>
            <span className="text-xs text-zinc-500">{items.length} items</span>
          </div>

          {items.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-zinc-500">
              Nothing here yet. Your notes and captures in this domain will appear instantly.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((it) => (
                <article key={it.id} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{new Date(it.created_at || Date.now()).toLocaleString()}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">{it.modality}</span>
                  </div>
                  {it.title && <h5 className="mb-1 text-sm font-medium text-zinc-900">{it.title}</h5>}
                  {it.content && <p className="line-clamp-4 text-sm text-zinc-700 whitespace-pre-wrap">{it.content}</p>}
                  {it.source_url && (
                    <a href={it.source_url} target="_blank" className="mt-2 inline-block text-xs font-medium text-zinc-700 hover:underline">
                      Source ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Simple analysis stub (can be upgraded later) */}
          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-medium text-zinc-700">Region insights</div>
            <div className="mt-1 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white p-3 text-xs text-zinc-600">
                <div className="text-2xl font-semibold text-zinc-900">{items.length}</div>
                <div>Total items</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-xs text-zinc-600">
                <div className="text-2xl font-semibold text-zinc-900">{items.filter(i => i.modality === 'text').length}</div>
                <div>Text</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-xs text-zinc-600">
                <div className="text-2xl font-semibold text-zinc-900">{items.filter(i => i.image_data_url).length}</div>
                <div>Images</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
