import { useState } from 'react'
import { createBooking } from '../api/bookings'

export default function BookingScreen({ expertId }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    date: '', timeSlot: '', notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createBooking({ ...form, expertId })
      setSuccess(true)
      setForm({ name: '', email: '', phone: '', date: '', timeSlot: '', notes: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) return <p className="text-green-500">Booking confirmed! ✅</p>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input name="name"     value={form.name}     onChange={handleChange} placeholder="Name"   required />
      <input name="email"    value={form.email}    onChange={handleChange} placeholder="Email"  required type="email" />
      <input name="phone"    value={form.phone}    onChange={handleChange} placeholder="Phone"  required />
      <input name="date"     value={form.date}     onChange={handleChange} type="date"          required />
      <input name="timeSlot" value={form.timeSlot} onChange={handleChange} placeholder="Slot"  required />
      <textarea name="notes" value={form.notes}    onChange={handleChange} placeholder="Notes" />

      {error && <p className="text-red-500">{error}</p>}

      <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
        {loading ? 'Booking...' : 'Book Now'}
      </button>
    </form>
  )
}