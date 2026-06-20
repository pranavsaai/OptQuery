import axios from 'axios'

const BASE_URL = 'https://optquery.jumpingcrab.com'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Analyze a SQL query
export const analyzeQuery = (query, useAi = true) =>
  api.post('/api/analyze', { query, use_ai: useAi })

// Get query history
export const getHistory = (limit = 20) =>
  api.get(`/api/history?limit=${limit}`)

// Get single history detail
export const getHistoryDetail = (id) =>
  api.get(`/api/history/${id}`)

// Toggle favorite
export const toggleFavorite = (id, isFavorite) =>
  api.patch(`/api/history/${id}/favorite`, { is_favorite: isFavorite })

// Delete history entry
export const deleteHistory = (id) =>
  api.delete(`/api/history/${id}`)

// Save a query
export const saveQuery = (name, query, description, tags) =>
  api.post('/api/saved', { name, query, description, tags })

// Get saved queries
export const getSaved = () =>
  api.get('/api/saved')

// Delete saved query
export const deleteSaved = (id) =>
  api.delete(`/api/saved/${id}`)

// Get stats
export const getStats = () =>
  api.get('/api/stats')

// Get sample queries
export const getSamples = () =>
  api.get('/api/samples')