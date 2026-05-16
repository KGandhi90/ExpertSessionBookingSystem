// src/api/experts.js
import api from './axios'

// GET /experts?page=1&limit=10&category=finance&search=john
export const getExperts = async ({ page = 1, limit = 10, category = '', search = '' }) => {
  const res = await api.get('/experts', {
    params: { page, limit, category, search }
  })
  return res.data
}

// GET /experts/:id
export const getExpertById = async (id) => {
  const res = await api.get(`/experts/${id}`)
  return res.data
}