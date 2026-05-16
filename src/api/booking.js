// src/api/bookings.js
import api from './axios'

// POST /bookings
export const createBooking = async (bookingData) => {
  const res = await api.post('/bookings', bookingData)
  return res.data
}

// GET /bookings?email=user@example.com
export const getMyBookings = async (email) => {
  const res = await api.get('/bookings', { params: { email } })
  return res.data
}

// PATCH /bookings/:id/status
export const updateBookingStatus = async (id, status) => {
  const res = await api.patch(`/bookings/${id}/status`, { status })
  return res.data
}