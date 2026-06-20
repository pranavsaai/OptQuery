import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import QueryEditor from './components/QueryEditor'
import AnalysisResult from './components/AnalysisResult'
import History from './components/History'
import Saved from './components/Saved'
import { analyzeQuery, getStats } from './api'
import { Loader2, AlertCircle, Zap, Shield, BarChart3 } from 'lucide-react'

export default function App() {
  const [activePage, setActivePage] = useState('analyzer')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [editorQuery, setEditorQuery] = useState('')

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const res = await getStats()
      setStats(res.data)
    } catch (e) {}
  }

  const handleAnalyze = async (query, useAi) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await analyzeQuery(query, useAi)
      setResult(res.data)
      fetchStats()
    } catch (e) {
      setError(
        e.response?.data?.detail ||
        'Failed to analyze. Make sure backend is running!'
      )
    }
    setLoading(false)
  }

  const handleLoadQuery = (query) => {
    setEditorQuery(query)
    setActivePage('analyzer')
  }

  return (
    <div className="min-h-screen bg-animated">

      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        stats={stats}
      />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <AnimatePresence mode="wait">

          {/* Analyzer Page */}
          {activePage === 'analyzer' && (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="text-center pt-8 pb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      color: '#a78bfa'
                    }}
                  >
                    <Zap size={12} />
                    Powered by Groq AI + LLaMA 3.1
                  </div>

                  <h1 className="text-5xl font-bold tracking-tight text-white mb-4"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    SQL Query{' '}
                    <span className="gradient-text">Analyzer</span>
                  </h1>
                  <p className="text-lg max-w-xl mx-auto"
                    style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}
                  >
                    Detect performance issues, get AI-powered optimizations,
                    and benchmark your queries in real-time.
                  </p>
                </motion.div>

                {/* Feature Pills */}
                <motion.div
                  className="flex items-center justify-center gap-3 mt-6 flex-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[
                    { icon: Shield, label: '10+ Issue Detectors' },
                    { icon: Zap, label: 'AI Optimization' },
                    { icon: BarChart3, label: 'Live Benchmarking' },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.5)'
                      }}
                    >
                      <Icon size={11} />
                      {label}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Editor */}
              <QueryEditor
                onAnalyze={handleAnalyze}
                loading={loading}
                initialQuery={editorQuery}
              />

              {/* Loading */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center pulse-glow"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                      >
                        <Loader2 size={28} className="animate-spin text-white" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">Analyzing your query</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                        Running AI optimization and detecting issues...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)'
                    }}
                  >
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium text-sm">Analysis Failed</p>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <AnimatePresence>
                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <AnalysisResult
                      result={result}
                      onSaved={fetchStats}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* History Page */}
          {activePage === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className="pt-4"
            >
              <History onLoadQuery={handleLoadQuery} />
            </motion.div>
          )}

          {/* Saved Page */}
          {activePage === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
              className="pt-4"
            >
              <Saved onLoadQuery={handleLoadQuery} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}