import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, Zap, Database, Copy, Star, BookMarked, ChevronDown, ChevronUp, Lightbulb, TrendingUp } from 'lucide-react'
import { toggleFavorite, saveQuery } from '../api'
import Benchmark from './Benchmark'

export default function AnalysisResult({ result, onSaved }) {
  const [copied, setCopied] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [expandedIssue, setExpandedIssue] = useState(null)

  if (!result) return null

  const { complexity_score, complexity_label } = result

  const complexityConfig = {
    Simple: { color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
    Moderate: { color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
    Complex: { color: '#f97316', glow: 'rgba(249,115,22,0.2)' },
    Critical: { color: '#ef4444', glow: 'rgba(239,68,68,0.2)' }
  }
  const config = complexityConfig[complexity_label] || { color: '#6b7280', glow: 'transparent' }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFavorite = async () => {
    try {
      await toggleFavorite(result.id, !isFav)
      setIsFav(!isFav)
    } catch (e) {}
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    try {
      await saveQuery(saveName, result.original_query, '', [])
      setShowSaveModal(false)
      setSaveName('')
      onSaved?.()
    } catch (e) {}
  }

  return (
    <div className="space-y-4">

      {/* Stats Row */}
      <motion.div
        className="grid grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Complexity */}
        <div className="rounded-2xl p-4 ios-card"
          style={{ boxShadow: `0 0 30px ${config.glow}` }}
        >
          <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Complexity
          </div>
          <div className="text-3xl font-bold mb-2" style={{ color: config.color }}>
            {complexity_score}
          </div>
          <div className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${complexity_score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="text-xs mt-1.5 font-medium" style={{ color: config.color }}>
            {complexity_label}
          </div>
        </div>

        {/* Issues */}
        <div className="rounded-2xl p-4 ios-card">
          <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Issues</div>
          <div className="text-3xl font-bold text-white mb-2">{result.issue_count}</div>
          <div className="flex gap-2 text-xs">
            <span style={{ color: '#f87171' }}>{result.severity_breakdown?.high || 0}H</span>
            <span style={{ color: '#fbbf24' }}>{result.severity_breakdown?.medium || 0}M</span>
            <span style={{ color: '#60a5fa' }}>{result.severity_breakdown?.low || 0}L</span>
          </div>
        </div>

        {/* Query Type */}
        <div className="rounded-2xl p-4 ios-card">
          <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Type</div>
          <div className="text-2xl font-bold gradient-text-blue">{result.query_type}</div>
          <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Statement detected
          </div>
        </div>

        {/* Time */}
        <div className="rounded-2xl p-4 ios-card">
          <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Time</div>
          <div className="text-3xl font-bold" style={{ color: '#22c55e' }}>
            {result.analysis_time_ms}
            <span className="text-base">ms</span>
          </div>
          <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            With AI
          </div>
        </div>
      </motion.div>

      {/* Plain English */}
      {result.plain_explanation && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} style={{ color: '#a78bfa' }} />
            <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>
              What this query does
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {result.plain_explanation}
          </p>
        </motion.div>
      )}

      {/* Issues */}
      {result.issues?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <AlertTriangle size={15} style={{ color: '#f97316' }} />
            <span className="text-sm font-medium text-white">Issues Detected</span>
          </div>
          <div>
            {result.issues.map((issue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                style={{
                  borderBottom: i < result.issues.length - 1
                    ? '1px solid rgba(255,255,255,0.05)'
                    : 'none'
                }}
                onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg badge-${issue.severity.toLowerCase()}`}>
                      {issue.severity}
                    </span>
                    <span className="text-sm text-white">{issue.message}</span>
                  </div>
                  {expandedIssue === i
                    ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  }
                </div>
                <AnimatePresence>
                  {expandedIssue === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 ml-16 text-xs"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Type: {issue.type}
                      {issue.line && <span className="ml-3">Line: {issue.line}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Issues */}
      {result.issues?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.15)'
          }}
        >
          <CheckCircle size={20} style={{ color: '#22c55e' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: '#22c55e' }}>
              No issues detected
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              This query looks well-optimized
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Optimization */}
      {result.ai_optimization?.optimized_query && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(139,92,246,0.2)'
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <Zap size={15} style={{ color: '#a78bfa' }} />
              <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>
                AI Optimized Query
              </span>
            </div>
            <button
              onClick={() => handleCopy(result.ai_optimization.optimized_query)}
              className="flex items-center gap-1.5 text-xs ios-button px-3 py-1.5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.4)'
              }}
            >
              <Copy size={11} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <pre className="p-4 text-sm font-mono overflow-x-auto"
            style={{
              background: 'rgba(0,0,0,0.3)',
              color: '#86efac',
              lineHeight: '1.7'
            }}
          >
            {result.ai_optimization.optimized_query}
          </pre>

          {result.ai_optimization.explanation && (
            <div className="px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-sm leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {result.ai_optimization.explanation}
              </p>
            </div>
          )}

          {result.ai_optimization.key_improvements?.length > 0 && (
            <div className="px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} style={{ color: '#22c55e' }} />
                <span className="text-xs font-medium" style={{ color: '#22c55e' }}>
                  Key Improvements
                </span>
              </div>
              <ul className="space-y-1.5">
                {result.ai_optimization.key_improvements.map((imp, i) => (
                  <li key={i} className="text-xs flex items-start gap-2"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    <span style={{ color: '#22c55e' }} className="mt-0.5">→</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.ai_optimization.performance_impact && (
            <div className="px-4 py-3"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(34,197,94,0.04)'
              }}
            >
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Estimated Impact:{' '}
              </span>
              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>
                {result.ai_optimization.performance_impact}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Index Suggestions */}
      {result.index_suggestions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Database size={15} style={{ color: '#fbbf24' }} />
            <span className="text-sm font-medium text-white">Index Suggestions</span>
          </div>
          <div>
            {result.index_suggestions.map((idx, i) => (
              <div key={i} className="p-4"
                style={{
                  borderBottom: i < result.index_suggestions.length - 1
                    ? '1px solid rgba(255,255,255,0.05)'
                    : 'none'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg badge-${idx.impact === 'HIGH' ? 'high' : 'medium'}`}>
                    {idx.impact} IMPACT
                  </span>
                  <button
                    onClick={() => handleCopy(idx.sql)}
                    className="text-xs ios-button flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.4)'
                    }}
                  >
                    <Copy size={10} />
                    Copy
                  </button>
                </div>
                <pre className="text-xs font-mono p-2.5 rounded-xl overflow-x-auto"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: '#93c5fd'
                  }}
                >
                  {idx.sql}
                </pre>
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {idx.reason}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Benchmark */}
      {result.ai_optimization?.optimized_query && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Benchmark
            originalQuery={result.original_query}
            optimizedQuery={result.ai_optimization.optimized_query}
          />
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <button
          onClick={handleFavorite}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm ios-button"
          style={{
            background: isFav ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isFav ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.08)'}`,
            color: isFav ? '#fbbf24' : 'rgba(255,255,255,0.4)'
          }}
        >
          <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
          {isFav ? 'Favorited' : 'Favorite'}
        </button>

        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm ios-button"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)'
          }}
        >
          <BookMarked size={14} />
          Save Query
        </button>

        <button
          onClick={() => handleCopy(result.original_query)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm ios-button"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)'
          }}
        >
          <Copy size={14} />
          Copy Original
        </button>
      </motion.div>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="w-96 rounded-3xl p-6"
              style={{
                background: 'rgba(20,20,30,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)'
              }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Save Query</h3>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Enter a name..."
                autoFocus
                className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder-white/30 mb-4"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white ios-button"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 8px 25px rgba(99,102,241,0.35)'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-3 rounded-2xl text-sm ios-button"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}