import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Zap, Clock, TrendingUp, TrendingDown, Play, AlertCircle } from 'lucide-react'
import axios from 'axios'

export default function Benchmark({ originalQuery, optimizedQuery }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runBenchmark = async () => {
    if (!originalQuery || !optimizedQuery) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.post('https://optquery.jumpingcrab.com/api/benchmark', {
        original_query: originalQuery,
        optimized_query: optimizedQuery
      })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Benchmark failed')
    }
    setLoading(false)
  }

  const chartData = result ? [
    { name: 'Original', time: result.original.avg_time_ms, fill: '#ef4444' },
    { name: 'Optimized', time: result.optimized.avg_time_ms, fill: '#22c55e' }
  ] : []

  const isImproved = result?.improvement_percentage > 0

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(20,20,30,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <p className="text-white font-semibold">{label}</p>
          <p style={{ color: payload[0].fill }} className="text-sm">
            {payload[0].value}ms avg
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(245,158,11,0.15)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: '#fbbf24' }} />
          <span className="text-sm font-medium text-white">
            Benchmark Comparator
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.35)'
            }}
          >
            3 run average
          </span>
        </div>
        <motion.button
          onClick={runBenchmark}
          disabled={loading || !originalQuery || !optimizedQuery}
          whileHover={{ scale: loading ? 1 : 1.03 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold"
          style={{
            background: loading
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: loading ? 'rgba(255,255,255,0.3)' : '#000000',
            boxShadow: loading ? 'none' : '0 4px 15px rgba(245,158,11,0.3)',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <Play size={11} />
          {loading ? 'Running...' : 'Run Benchmark'}
        </motion.button>
      </div>

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="py-8 text-center text-sm"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Click Run Benchmark to compare query performance on PostgreSQL
        </div>
      )}

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 flex flex-col items-center gap-3"
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#f59e0b' }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Running 3 iterations on PostgreSQL...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="p-4 flex items-center gap-2 text-sm"
          style={{ color: '#f87171' }}
        >
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 space-y-4"
          >
            {/* Verdict */}
            <div className="rounded-2xl p-3 text-sm font-medium"
              style={{
                background: isImproved
                  ? 'rgba(34,197,94,0.08)'
                  : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isImproved
                  ? 'rgba(34,197,94,0.2)'
                  : 'rgba(239,68,68,0.2)'}`,
                color: isImproved ? '#22c55e' : '#f87171'
              }}
            >
              {result.verdict}
            </div>

            {/* Improvement Badge */}
            <div className="flex items-center justify-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xl font-bold"
                style={{
                  background: isImproved
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(239,68,68,0.1)',
                  color: isImproved ? '#22c55e' : '#f87171'
                }}
              >
                {isImproved
                  ? <TrendingUp size={22} />
                  : <TrendingDown size={22} />}
                {Math.abs(result.improvement_percentage)}%{' '}
                {isImproved ? 'Faster' : 'Slower'}
              </motion.div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isImproved
                  ? `Saved ${result.time_saved_ms}ms`
                  : `${Math.abs(result.time_saved_ms)}ms slower`}
              </span>
            </div>

            {/* Chart */}
            <div className="h-44 rounded-2xl overflow-hidden p-2"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="time" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Original */}
              <div className="rounded-2xl p-3"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.15)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={13} style={{ color: '#f87171' }} />
                  <span className="text-xs font-semibold" style={{ color: '#f87171' }}>
                    Original
                  </span>
                </div>
                {[
                  ['Avg', result.original.avg_time_ms],
                  ['Min', result.original.min_time_ms],
                  ['Max', result.original.max_time_ms],
                  ['Planning', result.original.planning_time_ms],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    <span className="text-white font-mono">{val}ms</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 text-xs"
                  style={{ borderTop: '1px solid rgba(239,68,68,0.15)', color: 'rgba(255,255,255,0.25)' }}
                >
                  {result.original.runs?.map(r => `${r}ms`).join(' · ')}
                </div>
              </div>

              {/* Optimized */}
              <div className="rounded-2xl p-3"
                style={{
                  background: 'rgba(34,197,94,0.05)',
                  border: '1px solid rgba(34,197,94,0.15)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={13} style={{ color: '#22c55e' }} />
                  <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                    Optimized
                  </span>
                </div>
                {[
                  ['Avg', result.optimized.avg_time_ms],
                  ['Min', result.optimized.min_time_ms],
                  ['Max', result.optimized.max_time_ms],
                  ['Planning', result.optimized.planning_time_ms],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                    <span className="text-white font-mono">{val}ms</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 text-xs"
                  style={{ borderTop: '1px solid rgba(34,197,94,0.15)', color: 'rgba(255,255,255,0.25)' }}
                >
                  {result.optimized.runs?.map(r => `${r}ms`).join(' · ')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}