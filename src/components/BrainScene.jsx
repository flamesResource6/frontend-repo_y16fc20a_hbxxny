import { useState } from 'react'
import Spline from '@splinetool/react-spline'
import { motion, AnimatePresence } from 'framer-motion'
import BrainRegionModal from './BrainRegionModal'

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

export default function BrainScene() {
  const [activeRegion, setActiveRegion] = useState(null)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
      {/* 3D Brain */}
      <div className="pointer-events-auto absolute inset-0">
        <Spline
          scene="https://prod.spline.design/kow0cKDK6Tap7xO9/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Minimal header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="text-sm font-medium tracking-tight text-zinc-700">Smart Second Brain</div>
        <div className="text-xs text-zinc-500">Click a brain area to enter</div>
      </header>

      {/* Elegant center title */}
      <div className="pointer-events-none relative z-10 mx-auto mt-8 flex max-w-5xl flex-col items-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-balance bg-gradient-to-b from-zinc-900 to-zinc-700 bg-clip-text text-4xl font-semibold text-transparent sm:text-5xl"
        >
          Explore your living brain
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.05 }}
          className="mt-3 text-base text-zinc-600"
        >
          A minimal, tactile experience. Move the brain. Click labeled regions to step inside.
        </motion.p>
      </div>

      {/* Region labels as refined capsules */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-5xl">
        <div className="relative h-[60vh] w-full">
          {/* Positions are percentage-based to float around center */}
          {REGIONS.map((r, idx) => {
            const positions = {
              prefrontal: { top: '24%', left: '62%' },
              temporal: { top: '58%', left: '62%' },
              hippocampus: { top: '55%', left: '42%' },
              parietal: { top: '30%', left: '40%' },
              association: { top: '18%', left: '48%' },
            }
            const pos = positions[r.key]
            return (
              <motion.button
                key={r.key}
                onClick={() => setActiveRegion(r)}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-none rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white"
                style={{ top: pos.top, left: pos.left }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05, duration: 0.3 }}
              >
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-zinc-500">• {r.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeRegion && (
          <BrainRegionModal
            open={!!activeRegion}
            region={activeRegion}
            onClose={() => setActiveRegion(null)}
          />
        )}
      </AnimatePresence>

      {/* Subtle vignette to add depth while keeping minimal */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(0,0,0,0.03),transparent_60%)]" />
    </div>
  )
}
