import { motion } from 'framer-motion'
import { Database, History, BookMarked, BarChart3, Sparkles } from 'lucide-react'

export default function Navbar({ activePage, setActivePage, stats }) {
  const navItems = [
    { id: 'analyzer', label: 'Analyzer', icon: Database },
    { id: 'history', label: 'History', icon: History },
    { id: 'saved', label: 'Saved', icon: BookMarked },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
            }}
          >
            <Database size={18} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-lg tracking-tight">
              Query<span className="gradient-text">Sense</span>
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#a78bfa'
              }}
            >
              <Sparkles size={10} />
              AI
            </div>
          </div>
        </motion.div>

        {/* Nav Pills */}
        <motion.div
          className="flex items-center p-1 rounded-2xl gap-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ios-button"
              style={{
                color: activePage === id ? '#ffffff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {activePage === id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 15px rgba(99,102,241,0.3)'
                  }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={15} />
                {label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.5)'
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BarChart3 size={14} style={{ color: '#6366f1' }} />
          <span>
            <span className="text-white font-semibold">{stats?.total_queries_analyzed || 0}</span>
            {' '}analyzed
          </span>
        </motion.div>
      </div>
    </nav>
  )
}