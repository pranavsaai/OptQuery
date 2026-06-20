import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History as HistoryIcon, Star, Trash2, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { getHistory, deleteHistory, toggleFavorite } from '../api'

export default function History({ onLoadQuery }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHistory(50)
      setHistory(res.data)
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteHistory(id)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch (e) {}
  }

  const handleFavorite = async (id, isFav, e) => {
    e.stopPropagation()
    try {
      await toggleFavorite(id, !isFav)
      setHistory(prev => prev.map(h =>
        h.id === id ? { ...h, is_favorite: !isFav } : h
      ))
    } catch (e) {}
  }

  const filtered = filter === 'favorites'
    ? history.filter(h => h.is_favorite)
    : history

  const complexityConfig = {
    Simple: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
    Moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    Complex: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
    Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' }
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HistoryIcon size={20} style={{ color: '#6366f1' }} />
          <h2 className="text-lg font-semibold text-white">History</h2>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.35)'
            }}
          >
            {history.length} queries
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl gap-1"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)'
            }}
          >
            {['all', 'favorites'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1.5 rounded-lg capitalize ios-button transition-all"
                style={{
                  background: filter === f
                    ? f === 'favorites'
                      ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'transparent',
                  color: filter === f ? '#ffffff' : 'rgba(255,255,255,0.35)'
                }}
              >
                {f === 'favorites' && <Star size={10} className="inline mr-1" />}
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl ios-button"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.4)'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading history...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <HistoryIcon size={32} className="mx-auto mb-3"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filter === 'favorites' ? 'No favorites yet' : 'No queries analyzed yet'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Analyze a query to see it here
          </p>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((entry, i) => {
            const cfg = complexityConfig[entry.complexity_label] || {
              color: '#6b7280',
              bg: 'rgba(107,114,128,0.08)',
              border: 'rgba(107,114,128,0.2)'
            }
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onLoadQuery(entry.original_query)}
                className="rounded-2xl p-4 cursor-pointer group transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}
                whileHover={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(99,102,241,0.3)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-mono truncate">
                      {entry.original_query}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Clock size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {entry.created_at
                          ? new Date(entry.created_at).toLocaleString()
                          : 'Unknown'}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {entry.analysis_time_ms}ms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
                      style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        color: cfg.color
                      }}
                    >
                      {entry.complexity_label || 'Unknown'}
                    </span>

                    {entry.issue_count > 0 && (
                      <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg"
                        style={{
                          background: 'rgba(249,115,22,0.08)',
                          border: '1px solid rgba(249,115,22,0.2)',
                          color: '#fb923c'
                        }}
                      >
                        <AlertTriangle size={10} />
                        {entry.issue_count}
                      </div>
                    )}

                    <button
                      onClick={(e) => handleFavorite(entry.id, entry.is_favorite, e)}
                      className="p-1.5 rounded-lg ios-button transition-colors"
                      style={{
                        color: entry.is_favorite
                          ? '#fbbf24'
                          : 'rgba(255,255,255,0.2)'
                      }}
                    >
                      <Star size={13} fill={entry.is_favorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="p-1.5 rounded-lg ios-button opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: 'rgba(239,68,68,0.6)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}