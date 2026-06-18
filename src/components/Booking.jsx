import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createBooking } from '../api/bookings'
import { getExpertById } from '../api/experts'
import { socket } from '../api/socket'

export default function BookingScreen({ expertId }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    date: '', timeSlot: '', notes: ''
  })
  const [expert, setExpert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const activeExpertId = expertId || id || location.state?.expertId
  const presetDate = location.state?.date || ''
  const presetTimeSlot = location.state?.timeSlot || ''

  const availableDates = useMemo(() => expert?.availability || [], [expert])
  const activeDay = availableDates.find((item) => item.date === form.date)
  const timeSlots = activeDay?.slots || []

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  useEffect(() => {
    const loadExpert = async () => {
      if (!activeExpertId) {
        setPageLoading(false)
        setError('Select an expert before booking.')
        return
      }

      try {
        setPageLoading(true)
        const data = await getExpertById(activeExpertId)
        setExpert(data.expert)
        setForm((previous) => ({
          ...previous,
          date: previous.date || presetDate || data.expert.availability?.[0]?.date || '',
          timeSlot: previous.timeSlot || presetTimeSlot || ''
        }))
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load expert')
      } finally {
        setPageLoading(false)
      }
    }

    loadExpert()
  }, [activeExpertId, presetDate, presetTimeSlot])

  useEffect(() => {
    const handleBookingChange = async (payload) => {
      if (!payload?.expertId || String(payload.expertId) !== String(activeExpertId)) return
      const data = await getExpertById(activeExpertId)
      setExpert(data.expert)
    }

    socket.on('bookingChanged', handleBookingChange)
    return () => {
      socket.off('bookingChanged', handleBookingChange)
    }
  }, [activeExpertId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createBooking({ ...form, expertId })
      setSuccess(true)
      setForm({ name: '', email: '', phone: '', date: '', timeSlot: '', notes: '' })
      localStorage.setItem('lastBookingEmail', form.email.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) return <div className="page-state">Loading booking form...</div>
  if (success) return <div className="page-state success">Booking confirmed. Your request has been saved.</div>

  return (
    <div className="page-frame narrow">
      <section className="panel panel-hero">
        <div>
          <p className="section-label">Booking</p>
          <h2>{expert?.name}</h2>
          <p className="section-copy">Choose a free date and time slot, then submit the session request.</p>
        </div>
        <Link className="button button-ghost" to={`/experts/${activeExpertId}`}>Back to expert</Link>
      </section>

      <form onSubmit={handleSubmit} className="panel form-grid">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="input" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="input" required type="email" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="input" required pattern="[0-9+\- ]{7,}" />

        <select name="date" value={form.date} onChange={handleChange} className="input" required>
          <option value="">Select date</option>
          {availableDates.map((item) => (
            <option key={item.date} value={item.date}>{item.date}</option>
          ))}
        </select>

        <select name="timeSlot" value={form.timeSlot} onChange={handleChange} className="input" required>
          <option value="">Select time slot</option>
          {timeSlots.map((slot) => (
            <option key={slot.timeSlot} value={slot.timeSlot} disabled={slot.booked}>{slot.timeSlot}{slot.booked ? ' - booked' : ''}</option>
          ))}
        </select>

        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="input textarea" rows="4" />

        {error && <div className="form-message error">{error}</div>}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="button button-primary">
            {loading ? 'Booking...' : 'Book now'}
          </button>
          <button type="button" className="button button-ghost" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </form>
    </div>
  )
}