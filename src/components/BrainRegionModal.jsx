import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PALETTE = {
  navy: '#0b1b3a',
  warm: '#f9f7f4',
  black: '#0a0a0a',
  orange: '#ff7a00',
}

function analyze(items) {
  if (!items || items.length === 0) {
    return {
      total: 0,
      text: 0,
      images: 0,
      avg_age_days: 0,
      completed: 0,
      completion_rate: 0,
      latest_age_days: 0,
    }
  }
  const now = Date.now()
  const text = items.filter(i => i.modality === 'text').length
  const images = items.filter(i => i.image_data_url || i.modality === 'image').length
  const ages = items.map(i => {
    const t = new Date(i.updated_at || i.created_at || now).getTime()
    return Math.max(0, (now - t) / (1000 * 60 * 60 * 24))
  })
  const avg_age_days = Math.round((ages.reduce((a,b)=>a+b,0) / ages.length) * 10) / 10
  const latest_age_days = Math.round((Math.min(...ages)) * 10) / 10
  const completed = items.filter(i => i.completed === true || i.status === 'done' || /\b(done|completed|finished)\b/i.test(`${i.title || ''} ${i.content || ''}`) || /\[(x|X)\]/.test(i.content || '')).length
  const completion_rate = Math.round((completed / items.length) * 100)
  return { total: items.length, text, images, avg_age_days, completed, completion_rate, latest_age_days }
}

// Lightweight due date parser: looks for due:YYYY-MM-DD or "due in X d/day(s)" tokens
function parseDueDate(it) {
  const src = `${it.title || ''} ${it.content || ''}`
  const iso = src.match(/due\s*:?\s*(\d{4}-\d{2}-\d{2})/i)
  if (iso) {
    const d = new Date(iso[1])
    if (!isNaN(d.getTime())) return d
  }
  const inDays = src.match(/due\s+in\s+(\d+)\s*(d|day|days)/i)
  if (inDays) {
    const days = parseInt(inDays[1], 10)
    if (!isNaN(days)) {
      const d = new Date()
      d.setDate(d.getDate() + days)
      return d
    }
  }
  // Fallback to explicit field if present
  if (it.due_at) {
    const d = new Date(it.due_at)
    if (!isNaN(d.getTime())) return d
  }
  return null
}

function toDays(deltaMs) {
  return Math.round((deltaMs / (1000 * 60 * 60 * 24)) * 10) / 10
}

export default function BrainRegionModal({ open, region, onClose }) {
  const [items, setItems] = useState([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const isOverview = region?.key === 'overview'

  useEffect(() => {
    if (!open) return
    const load = async () => {
      try {
        if (isOverview) {
          const folders = ['tasks', 'notes', 'inbox']
          const responses = await Promise.all(
            folders.map(f => fetch(`${baseUrl}/api/thoughts?folder=${f}`).then(r => r.json()))
          )
          const merged = responses.flatMap(r => r.items || [])
          merged.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          setItems(merged)
        } else {
          const res = await fetch(`${baseUrl}/api/thoughts?folder=${region.folderKey}`)
          const data = await res.json()
          setItems(data.items || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [open, region, isOverview])

  const saveNote = async () => {
    if (!note.trim()) return
    try {
      setLoading(true)
      const targetTag = isOverview ? 'inbox' : region.folderKey
      const res = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.split('\n')[0]?.slice(0, 80),
          content: note,
          modality: 'text',
          tags: [targetTag],
        })
      })
      const data = await res.json()
      if (res.ok) {
        setNote('')
        // Reload
        if (isOverview) {
          const folders = ['tasks', 'notes', 'inbox']
          const responses = await Promise.all(
            folders.map(f => fetch(`${baseUrl}/api/thoughts?folder=${f}`).then(r => r.json()))
          )
          const merged = responses.flatMap(r => r.items || [])
          merged.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          setItems(merged)
        } else {
          const r2 = await fetch(`${baseUrl}/api/thoughts?folder=${region.folderKey}`)
          const d2 = await r2.json()
          setItems(d2.items || [])
        }
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

  const stats = useMemo(() => analyze(items), [items])

  // Overview refinements: create Due Soon and Recently Updated slices
  const { dueSoon, recentlyUpdated } = useMemo(() => {
    const now = new Date()
    const withDue = items.map((it) => {
      const due = parseDueDate(it)
      const updatedAt = new Date(it.updated_at || it.created_at || now)
      return { ...it, __due: due, __updated: updatedAt }
    })

    const dueSoonRaw = withDue
      .filter(it => it.__due && toDays(it.__due - now) <= 7)
      .sort((a, b) => (a.__due || now) - (b.__due || now))
      .slice(0, 6)

    const recentlyRaw = [...withDue]
      .sort((a, b) => (b.__updated) - (a.__updated))
      .slice(0, 6)

    return { dueSoon: dueSoonRaw, recentlyUpdated: recentlyRaw }
  }, [items])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="relative z-10 grid w-[92vw] max-w-5xl grid-cols-1 gap-6 rounded-2xl p-6 shadow-2xl md:grid-cols-5"
        style={{ background: PALETTE.warm, border: '1px solid rgba(11,27,58,0.12)' }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border px-2 py-0.5 text-xs hover:opacity-90"
          style={{ borderColor: 'rgba(11,27,58,0.15)', color: PALETTE.navy, backgroundColor: 'white' }}
        >
          Close
        </button>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold" style={{ color: PALETTE.navy }}>{isOverview ? 'Executive Overview' : region.name}</h3>
          <p className="mt-1 text-sm" style={{ color: '#344' }}>{isOverview ? 'Most important notes and open tasks across your Second Brain.' : region.description}</p>

          <div className="mt-4 rounded-xl p-3 text-xs" style={{ border: '1px solid rgba(11,27,58,0.12)', backgroundColor: 'white', color: '#213' }}>
            <div>Folder mapping: <span className="font-medium" style={{ color: PALETTE.black }}>{isOverview ? 'tasks + notes + inbox' : region.folderKey}</span></div>
            <div className="mt-1" style={{ color: '#435' }}>Label: {isOverview ? 'Summary • Highlights' : region.label}</div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium" style={{ color: PALETTE.navy }}>{isOverview ? 'Quick capture (goes to Inbox)' : 'Quick note'}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isOverview ? 'Capture a quick task or note…' : `Add something to ${region.folderKey}…`}
              className="mt-2 h-28 w-full resize-y rounded-xl border bg-white p-3 text-sm outline-none focus:ring"
              style={{ borderColor: 'rgba(11,27,58,0.15)', boxShadow: '0 0 0 2px rgba(11,27,58,0.06) inset' }}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              {isOverview && (
                <span className="text-[11px]" style={{ color: '#667' }}>Tip: add "due:YYYY-MM-DD" or "due in 3 days"</span>
              )}
              <button
                onClick={saveNote}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: PALETTE.navy }}
              >
                {loading ? 'Saving…' : isOverview ? 'Save to Inbox' : 'Save to region'}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold" style={{ color: PALETTE.navy }}>{isOverview ? 'Priority highlights' : 'What lives here'}</h4>
            <span className="text-xs" style={{ color: '#556' }}>{items.length} items</span>
          </div>

          {/* Overview special sections */}
          {isOverview && (
            <div className="mt-3 grid grid-cols-1 gap-3">
              {/* Due soon */}
              <section className="rounded-xl border bg-white p-3" style={{ borderColor: 'rgba(11,27,58,0.12)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.orange }} />
                    <h5 className="text-sm font-semibold" style={{ color: PALETTE.black }}>Due soon</h5>
                  </div>
                  <span className="text-[11px]" style={{ color: '#667' }}>{dueSoon.length} items</span>
                </div>
                {dueSoon.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs" style={{ borderColor: 'rgba(11,27,58,0.2)', color: '#667' }}>No upcoming deadlines found.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {dueSoon.map((it) => {
                      const d = parseDueDate(it)
                      const now = new Date()
                      const days = d ? Math.ceil((d - now) / (1000*60*60*24)) : null
                      const overdue = days !== null && days < 0
                      return (
                        <article key={it.id} className="rounded-lg border p-3" style={{ borderColor: 'rgba(11,27,58,0.12)', backgroundColor: overdue ? '#fff2ef' : 'white' }}>
                          <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: '#667' }}>
                            <span>{new Date(it.created_at || Date.now()).toLocaleDateString()}</span>
                            <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#eef2ff', color: PALETTE.navy }}>{it.modality}</span>
                          </div>
                          {it.title && <h6 className="mb-1 text-sm font-medium" style={{ color: PALETTE.black }}>{it.title}</h6>}
                          <div className="text-xs" style={{ color: overdue ? '#b42318' : PALETTE.navy }}>
                            {d ? (overdue ? `Overdue by ${Math.abs(days)}d` : `Due in ${days}d`) : 'Due date'}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Recently updated */}
              <section className="rounded-xl border bg-white p-3" style={{ borderColor: 'rgba(11,27,58,0.12)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.navy }} />
                    <h5 className="text-sm font-semibold" style={{ color: PALETTE.black }}>Recently updated</h5>
                  </div>
                  <span className="text-[11px]" style={{ color: '#667' }}>{recentlyUpdated.length} items</span>
                </div>
                {recentlyUpdated.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-center text-xs" style={{ borderColor: 'rgba(11,27,58,0.2)', color: '#667' }}>No recent updates yet.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {recentlyUpdated.map((it) => (
                      <article key={it.id} className="rounded-lg border p-3" style={{ borderColor: 'rgba(11,27,58,0.12)', backgroundColor: 'white' }}>
                        <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: '#667' }}>
                          <span>Updated {new Date(it.updated_at || it.created_at || Date.now()).toLocaleString()}</span>
                          <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#eef2ff', color: PALETTE.navy }}>{it.modality}</span>
                        </div>
                        {it.title && <h6 className="mb-1 text-sm font-medium" style={{ color: PALETTE.black }}>{it.title}</h6>}
                        {it.content && <p className="line-clamp-3 whitespace-pre-wrap text-xs" style={{ color: '#233' }}>{it.content}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Default list when not overview */}
          {!isOverview && (
            items.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'rgba(11,27,58,0.2)', color: '#667' }}>
                Nothing here yet. Your notes and captures in this domain will appear instantly.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((it) => (
                  <article key={it.id} className="rounded-xl border bg-white p-3 shadow-sm" style={{ borderColor: 'rgba(11,27,58,0.12)' }}>
                    <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: '#667' }}>
                      <span>{new Date(it.created_at || Date.now()).toLocaleString()}</span>
                      <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#eef2ff', color: PALETTE.navy }}>{it.modality}</span>
                    </div>
                    {it.title && <h5 className="mb-1 text-sm font-medium" style={{ color: PALETTE.black }}>{it.title}</h5>}
                    {it.content && <p className="line-clamp-4 whitespace-pre-wrap text-sm" style={{ color: '#233' }}>{it.content}</p>}
                    {it.source_url && (
                      <a href={it.source_url} target="_blank" className="mt-2 inline-block text-xs font-medium hover:underline" style={{ color: PALETTE.navy }}>
                        Source ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )
          )}

          {/* Follow-up & development analysis */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Total</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{stats.total}</div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Completed</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{stats.completed}</div>
              <div className="text-[11px]" style={{ color: PALETTE.navy }}>{stats.completion_rate}%</div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Avg age</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{stats.avg_age_days}d</div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Latest update</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{stats.latest_age_days}d</div>
            </div>
          </div>

          {/* Modality breakdown */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Text</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{stats.text}</div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Images</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{stats.images}</div>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ border: '1px solid rgba(11,27,58,0.12)' }}>
              <div className="text-xs" style={{ color: '#556' }}>Other</div>
              <div className="text-2xl font-semibold" style={{ color: PALETTE.black }}>{Math.max(0, stats.total - stats.text - stats.images)}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
