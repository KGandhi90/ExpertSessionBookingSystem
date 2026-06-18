import api from './axios'

export const createBooking = async (bookingData) => {
  const res = await api.post('/bookings', bookingData)
  return res.data
}

export const getMyBookings = async (email) => {
  const res = await api.get('/bookings', { params: { email } })
  return res.data
}

export const updateBookingStatus = async (id, status) => {
  const res = await api.patch(`/bookings/${id}/status`, { status })
  return res.data
}