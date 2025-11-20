import { useEffect } from 'react'
import { motion } from 'framer-motion'
import BrainScene from './components/BrainScene'

function App() {
  // Subtle fade-in for page
  useEffect(() => {
    document.body.style.backgroundColor = '#ffffff'
    return () => { document.body.style.backgroundColor = '' }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <BrainScene />
      </motion.div>
    </div>
  )
}

export default App
