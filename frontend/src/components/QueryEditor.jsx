import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Sparkles, Code2, ChevronDown, ChevronUp, Command } from 'lucide-react'
import { getSamples } from '../api'

export default function QueryEditor({ onAnalyze, loading, initialQuery }) {
  const [query, setQuery] = useState('')
  const [useAi, setUseAi] = useState(true)
  const [samples, setSamples] = useState([])
  const [showSamples, setShowSamples] = useState(false)

  useEffect(() => {
    getSamples().then(res => setSamples(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery)
  }, [initialQuery])

  const handleAnalyze = () => {
    if (!query.trim()) return
    onAnalyze(query, useAi)
  }

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleAnalyze()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          </div>
          <div className="flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}
          >
            <Code2 size={14} />
            <span>SQL Editor</span>
          </div>
        </div>

        {/* AI Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: useAi ? '#a78bfa' : 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>AI Optimize</span>
            <button
              onClick={() => setUseAi(!useAi)}
              className="relative w-11 h-6 rounded-full transition-all ios-button"
              style={{
                background: useAi
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255,255,255,0.1)'
              }}
            >
              <motion.div
                animate={{ x: useAi ? 20 : 2 }}
                transition={{ type: 'spring', bounce: 0.4, duration: 0.3 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div style={{ background: 'rgba(0,0,0,0.3)' }}>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`-- Write your SQL query here\n-- Ctrl + Enter to analyze\n\nSELECT * FROM orders WHERE status = 'pending'`}
          className="w-full h-56 font-mono text-sm p-5 resize-none"
          style={{
            background: 'transparent',
            color: '#e2e8f0',
            caretColor: '#6366f1',
            lineHeight: '1.7'
          }}
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Sample Queries */}
        <div className="relative">
          <button
            onClick={() => setShowSamples(!showSamples)}
            className="flex items-center gap-2 ios-button px-3 py-1.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '13px'
            }}
          >
            Samples
            {showSamples ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <AnimatePresence>
            {showSamples && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 left-0 w-80 rounded-2xl overflow-hidden z-50"
                style={{
                  background: 'rgba(20,20,30,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(30px)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                }}
              >
                {samples.map((sample, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ background: 'rgba(99,102,241,0.1)' }}
                    onClick={() => { setQuery(sample.query); setShowSamples(false) }}
                    className="w-full text-left px-4 py-3 transition-colors"
                    style={{
                      borderBottom: i < samples.length - 1
                        ? '1px solid rgba(255,255,255,0.05)'
                        : 'none',
                        cursor: 'pointer'
                    }}
                  >
                    <div className="text-sm text-white font-medium">{sample.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {sample.description}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}
          >
            <Command size={11} />
            <span>Enter</span>
          </div>

          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs ios-button px-3 py-1.5 rounded-xl"
              style={{
                color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.05)'
              }}
            >
              Clear
            </button>
          )}

          <motion.button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            whileHover={{ scale: loading || !query.trim() ? 1 : 1.03 }}
            whileTap={{ scale: loading || !query.trim() ? 1 : 0.97 }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: loading || !query.trim()
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: loading || !query.trim()
                ? 'rgba(255,255,255,0.25)'
                : '#ffffff',
              boxShadow: loading || !query.trim()
                ? 'none'
                : '0 8px 25px rgba(99,102,241,0.35)',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            <Play size={13} />
            {loading ? 'Analyzing...' : 'Analyze'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}