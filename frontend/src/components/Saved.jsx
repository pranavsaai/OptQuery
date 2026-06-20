import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookMarked, Trash2, Play, RefreshCw, Tag } from 'lucide-react'
import { getSaved, deleteSaved } from '../api'

export default function Saved({ onLoadQuery }) {
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSaved = async () => {
    setLoading(true)
    try {
      const res = await getSaved()
      setSaved(res.data)
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => { fetchSaved() }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteSaved(id)
      setSaved(prev => prev.filter(s => s.id !== id))
    } catch (e) {}
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookMarked size={20} style={{ color: '#6366f1' }} />
          <h2 className="text-lg font-semibold text-white">Saved Queries</h2>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.35)'
            }}
          >
            {saved.length} saved
          </span>
        </div>
        <button
          onClick={fetchSaved}
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading saved queries...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && saved.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <BookMarked size={32} className="mx-auto mb-3"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No saved queries yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Analyze a query and click Save to store it here
          </p>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {saved.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl p-4 group"
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

                  {/* Name */}
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {entry.name}
                  </h3>

                  {/* Description */}
                  {entry.description && (
                    <p className="text-xs mb-2"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {entry.description}
                    </p>
                  )}

                  {/* Query Preview */}
                  <pre className="text-xs font-mono p-3 rounded-xl overflow-x-auto whitespace-pre-wrap"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {entry.query.length > 150
                      ? entry.query.slice(0, 150) + '...'
                      : entry.query}
                  </pre>

                  {/* Tags */}
                  {entry.tags?.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Tag size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      {entry.tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(99,102,241,0.1)',
                            color: '#a78bfa',
                            border: '1px solid rgba(99,102,241,0.2)'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs mt-2"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    Saved {entry.created_at
                      ? new Date(entry.created_at).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onLoadQuery(entry.query)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                    }}
                  >
                    <Play size={11} />
                    Load
                  </motion.button>

                  <button
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs ios-button opacity-0 group-hover:opacity-100 transition-all"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: '#f87171'
                    }}
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}