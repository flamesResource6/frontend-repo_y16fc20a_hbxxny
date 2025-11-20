import { useEffect, useState } from 'react'
import { Sparkles, FolderOpen, Filter, Inbox, Lightbulb, CheckCircle2, BookOpenText, StickyNote } from 'lucide-react'

const icons = {
  inbox: Inbox,
  ideas: Lightbulb,
  tasks: CheckCircle2,
  reads: BookOpenText,
  notes: StickyNote,
}

export default function BrainBoard() {
  const [folders, setFolders] = useState([])
  const [active, setActive] = useState('inbox')
  const [items, setItems] = useState([])
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${baseUrl}/api/folders`).then(r => r.json()).then(setFolders)
  }, [])

  useEffect(() => {
    loadItems(active)
  }, [active])

  const loadItems = async (folder) => {
    const res = await fetch(`${baseUrl}/api/thoughts${folder ? `?folder=${folder}` : ''}`)
    const data = await res.json()
    setItems(data.items || [])
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <div className="sticky top-6 space-y-2">
          {folders.map((f) => {
            const Icon = icons[f.key] || FolderOpen
            const selected = active === f.key
            return (
              <button key={f.key} onClick={() => setActive(f.key)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 transition ${selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                <span className="flex items-center gap-2">
                  <Icon size={18} /> {f.name}
                </span>
                <span className="text-xs opacity-60">smart</span>
              </button>
            )
          })}
        </div>
      </aside>

      <main className="lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{active.charAt(0).toUpperCase() + active.slice(1)}</h3>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
            <Filter size={16}/> Filter
          </button>
        </div>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No entries yet. Capture something and it will land here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((it) => (
              <article key={it.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Sparkles size={14}/> {it.folder}</span>
                  <span>{new Date(it.created_at || Date.now()).toLocaleString()}</span>
                </div>
                {it.image_data_url && (
                  <img src={it.image_data_url} alt="captured" className="mb-3 max-h-56 w-full rounded-lg object-cover"/>
                )}
                {it.title && <h4 className="mb-1 text-base font-semibold text-gray-900">{it.title}</h4>}
                {it.content && <p className="text-sm text-gray-700 whitespace-pre-wrap">{it.content}</p>}
                {it.source_url && (
                  <a href={it.source_url} target="_blank" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">Source ↗</a>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
