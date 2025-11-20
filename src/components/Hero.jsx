import Spline from '@splinetool/react-spline'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] w-full overflow-hidden bg-white">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/kow0cKDK6Tap7xO9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Gradient veil for text readability (doesn't block pointer events) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-white/60 to-white"></div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 text-center sm:pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-balance bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl"
        >
          Your Smart Second Brain
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-4 max-w-2xl text-lg text-gray-700"
        >
          Capture anything in one click. Let the brain organize, connect, and evolve your ideas automatically.
        </motion.p>
      </div>
    </section>
  )
}
