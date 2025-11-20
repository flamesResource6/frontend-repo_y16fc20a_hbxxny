import { useState, useMemo, useRef, useEffect } from 'react'
import Spline from '@splinetool/react-spline'
import { motion, AnimatePresence } from 'framer-motion'
import BrainRegionModal from './BrainRegionModal'

const PALETTE = {
  navy: '#0b1b3a',
  warm: '#f9f7f4',
  black: '#0a0a0a',
  orange: '#ff7a00',
}

const REGIONS = [
  {
    key: 'prefrontal',
    name: 'Prefrontal Cortex',
    folderKey: 'tasks',
    label: 'Planning • Tasks',
    description: 'Executive control, planning, prioritization — the home for your actionable tasks and next steps.'
  },
  {
    key: 'temporal',
    name: 'Temporal Lobe',
    folderKey: 'reads',
    label: 'Language • Reads',
    description: 'Auditory and language processing — articles, bookmarks, transcripts and things to read.'
  },
  {
    key: 'hippocampus',
    name: 'Hippocampus',
    folderKey: 'notes',
    label: 'Memory • Notes',
    description: 'Formation of memories — notes, meeting summaries, and knowledge you want to retain.'
  },
  {
    key: 'parietal',
    name: 'Parietal Lobe',
    folderKey: 'inbox',
    label: 'Integration • Inbox',
    description: 'Sensory integration and attention — capture first, sort later. Everything lands here if uncertain.'
  },
  {
    key: 'association',
    name: 'Association Network',
    folderKey: 'ideas',
    label: 'Imagination • Ideas',
    description: 'Creative association and ideation — concepts, sparks, and free-form brainstorming.'
  },
]

const OVERVIEW = {
  key: 'overview',
  name: 'Executive Overview',
  folderKey: 'overview',
  label: 'Summary • Highlights',
  description: 'A condensed view of your most important notes and open tasks across regions.'
}

export default function BrainScene() {
  const [activeRegion, setActiveRegion] = useState(null)
  const [hoverRegion, setHoverRegion] = useState(null)
  const brainWrapRef = useRef(null)

  // Strongly prevent zoom/scroll and panning; keep rotation only
  useEffect(() => {
    const el = brainWrapRef.current
    if (!el) return

    const stop = (e) => { e.preventDefault(); e.stopPropagation() }

    // Prevent wheel zoom
    el.addEventListener('wheel', stop, { passive: false })
    // Prevent touch scroll/pinch
    el.addEventListener('touchmove', stop, { passive: false })
    el.addEventListener('gesturestart', stop)
    el.addEventListener('gesturechange', stop)
    el.addEventListener('gestureend', stop)

    return () => {
      el.removeEventListener('wheel', stop)
      el.removeEventListener('touchmove', stop)
      el.removeEventListener('gesturestart', stop)
      el.removeEventListener('gesturechange', stop)
      el.removeEventListener('gestureend', stop)
    }
  }, [])

  const byName = useMemo(() => {
    const map = new Map()
    for (const r of REGIONS) map.set(r.name.toLowerCase(), r)
    return map
  }, [])

  const handleMouseDown = (e) => {
    const t = e?.target
    if (!t?.name) return
    const name = String(t.name).toLowerCase()
    const matched = Array.from(byName.keys()).find((n) => name.includes(n))
    if (matched) {
      setActiveRegion(byName.get(matched))
      return
    }
    if (name.includes('overview') || name.includes('summary')) {
      setActiveRegion(OVERVIEW)
    }
  }

  const handleMouseHover = (e) => {
    const t = e?.target
    if (!t?.name) {
      setHoverRegion(null)
      return
    }
    const name = String(t.name).toLowerCase()
    const matched = Array.from(byName.keys()).find((n) => name.includes(n))
    if (matched) setHoverRegion(byName.get(matched))
    else if (name.includes('overview') || name.includes('summary')) setHoverRegion(OVERVIEW)
    else setHoverRegion(null)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${PALETTE.warm}, #ffffff)` }}>
      {/* Header with more airy spacing */}
      <header className="relative z-10 flex items-center justify-between px-8 py-7">
        <div className="flex items-baseline gap-4">
          <div className="text-sm font-semibold tracking-[0.18em] uppercase" style={{ color: PALETTE.navy }}>
            Smart
          </div>
          <div className="text-2xl font-extrabold tracking-[0.28em]" style={{ color: PALETTE.navy }}>
            Second Brain
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.navy }}>
          <span className="opacity-70">Drag to rotate</span>
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: PALETTE.orange }} />
          <span className="opacity-70">Click regions to enter</span>
        </div>
      </header>

      {/* Centered brain container; rotation in place */}
      <div
        ref={brainWrapRef}
        className="relative z-0 mx-auto mt-2 flex h-[64vh] w-[92vw] max-w-5xl items-center justify-center rounded-[24px] border shadow-[0_15px_70px_rgba(11,27,58,0.10)] select-none"
        style={{
          borderColor: 'rgba(11,27,58,0.12)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))',
          backdropFilter: 'blur(6px)',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          cursor: hoverRegion ? 'pointer' : 'grab',
        }}
      >
        <div className="pointer-events-auto h-full w-full">
          <Spline
            scene="https://prod.spline.design/kow0cKDK6Tap7xO9/scene.splinecode"
            style={{ width: '100%', height: '100%' }}
            onMouseDown={handleMouseDown}
            onMouseHover={handleMouseHover}
          />
        </div>

        {/* Per-region hover glow and anchors overlay */}
        <AnimatePresence>
          {hoverRegion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(40% 40% at 50% 50%, rgba(255,122,0,0.12), rgba(255,122,0,0) 60%)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Subtle center ring to visually "anchor" the brain */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[54vh] w-[54vh] rounded-full" style={{ boxShadow: 'inset 0 0 0 1px rgba(11,27,58,0.10), 0 0 80px rgba(11,27,58,0.10)' }}>
            {/* Tiny orange anchors along circumference */}
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="absolute block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${50 + 46 * Math.cos((i / 12) * 2 * Math.PI)}%`,
                  top: `${50 + 46 * Math.sin((i / 12) * 2 * Math.PI)}%`,
                  backgroundColor: PALETTE.orange,
                  opacity: hoverRegion ? 0.9 : 0.35,
                  boxShadow: hoverRegion ? '0 0 10px rgba(255,122,0,0.8)' : '0 0 4px rgba(255,122,0,0.5)'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Title + explanation (harmonized colors) */}
      <div className="pointer-events-none relative z-10 mx-auto mt-6 flex max-w-5xl flex-col items-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-balance text-4xl font-semibold sm:text-5xl"
          style={{ color: PALETTE.navy }}
        >
          Explore your living brain
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="mt-3 text-base"
          style={{ color: '#2b2b2b' }}
        >
          Regions and labels are one — they rotate together. Click to step inside and work in context.
        </motion.p>
      </div>

      {/* Hover chip near center (acts as the rotating label companion) */}
      <AnimatePresence>
        {hoverRegion && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute left-1/2 top-[20%] z-10 -translate-x-1/2"
          >
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs shadow-md backdrop-blur"
                 style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: PALETTE.navy, border: '1px solid rgba(11,27,58,0.10)' }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.orange }} />
              <span className="font-medium">{hoverRegion.name}</span>
              <span className="opacity-70">• {hoverRegion.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend dock with original naming + overview */}
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-3 py-2 shadow-lg"
           style={{ backgroundColor: 'rgba(255,255,255,0.72)', borderColor: 'rgba(11,27,58,0.10)', backdropFilter: 'blur(8px)', color: PALETTE.navy }}>
        {[OVERVIEW, ...REGIONS].map((r, idx) => (
          <button
            key={r.key}
            onClick={() => setActiveRegion(r)}
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs hover:opacity-90"
          >
            <span className="h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: idx === 0 ? PALETTE.orange : '#c7d2fe' }} />
            <span className="font-medium">{idx === 0 ? 'Overview' : r.name}</span>
          </button>
        ))}
      </div>

      {/* Modal mount */}
      <AnimatePresence>
        {activeRegion && (
          <BrainRegionModal
            open={!!activeRegion}
            region={activeRegion}
            onClose={() => setActiveRegion(null)}
          />
        )}
      </AnimatePresence>

      {/* Ambient vignette */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.04), transparent 60%)' }} />
    </div>
  )
}
