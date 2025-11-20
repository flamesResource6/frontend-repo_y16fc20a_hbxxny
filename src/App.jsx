import Hero from './components/Hero'
import CapturePanel from './components/CapturePanel'
import BrainBoard from './components/BrainBoard'
import { motion } from 'framer-motion'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <section className="mx-auto -mt-24 max-w-6xl px-6 pb-24">
        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CapturePanel onIngest={() => window.dispatchEvent(new CustomEvent('refresh-thoughts'))} />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur">
            <h3 className="text-lg font-semibold text-gray-900">How it thinks</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Captures text, links and images instantly</li>
              <li>Routes items into smart folders based on intent</li>
              <li>Surfaces active items and lets stale ones fade</li>
              <li>Grows with you by learning topics and patterns</li>
            </ul>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-10">
          <BrainBoard />
        </motion.div>
      </section>
    </div>
  )
}

export default App
