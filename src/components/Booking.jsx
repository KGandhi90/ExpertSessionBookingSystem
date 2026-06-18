import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { createBooking } from '../api/booking'
import { getExpertById } from '../api/experts'
import { socket } from '../api/socket'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-()\s]{7,20}$/

function validateForm(form) {
  if (!form.name.trim()) return 'Name is required'
  if (!form.email.trim()) return 'Email is required'
  if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address'
  if (!form.phone.trim()) return 'Phone number is required'
  if (!PHONE_RE.test(form.phone.trim())) return 'Phone must be 7–20 digits (may include +, -, spaces)'
  if (!form.date) return 'Please select a date'
  if (!form.timeSlot) return 'Please select a time slot'
  return null
}

const EMPTY_FORM = { name: '', email: '', phone: '', date: '', timeSlot: '', notes: '' }

export default function Booking() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [expert, setExpert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const { id } = useParams()
  const location = useLocation()

  const activeExpertId = id || location.state?.expertId
  const presetDate = location.state?.date || ''
  const presetTimeSlot = location.state?.timeSlot || ''

  const availableDates = useMemo(() => expert?.availability || [], [expert])
  const activeDay = availableDates.find((item) => item.date === form.date)
  const timeSlots = activeDay?.slots || []

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      // Reset time slot when date changes
      if (name === 'date') return { ...prev, date: value, timeSlot: '' }
      return { ...prev, [name]: value }
    })
  }

  // Load expert on mount
  useEffect(() => {
    const loadExpert = async () => {
      if (!activeExpertId) {
        setPageLoading(false)
        setError('No expert selected. Please go back and pick one.')
        return
      }

      try {
        setPageLoading(true)
        const data = await getExpertById(activeExpertId)
        setExpert(data.expert)
        setForm((prev) => ({
          ...prev,
          date: prev.date || presetDate || data.expert.availability?.[0]?.date || '',
          timeSlot: prev.timeSlot || presetTimeSlot || ''
        }))
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load expert details.')
      } finally {
        setPageLoading(false)
      }
    }

    loadExpert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpertId])

  // Real-time slot refresh
  useEffect(() => {
    const handleBookingChange = async (payload) => {
      if (!payload?.expertId || String(payload.expertId) !== String(activeExpertId)) return
      try {
        const data = await getExpertById(activeExpertId)
        setExpert(data.expert)
      } catch { /* silently swallow */ }
    }

    socket.on('bookingChanged', handleBookingChange)
    return () => socket.off('bookingChanged', handleBookingChange)
  }, [activeExpertId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    const validationError = validateForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    // Check the selected slot is still free
    const selectedSlot = timeSlots.find((s) => s.timeSlot === form.timeSlot)
    if (selectedSlot?.booked) {
      setError('This slot was just booked by someone else. Please select a different time.')
      return
    }

    setLoading(true)

    try {
      await createBooking({ ...form, expertId: activeExpertId })
      localStorage.setItem('lastBookingEmail', form.email.trim().toLowerCase())
      setSuccess(true)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner" />
        <span>Loading booking form…</span>
      </div>
    )
  }

  if (success) {
    return (
      <div className="page-frame narrow">
        <div className="panel success-card">
          <span className="success-icon">🎉</span>
          <h2>Booking Confirmed!</h2>
          <p>Your session request has been submitted. You'll receive a confirmation shortly.</p>
          <div className="success-actions">
            <Link className="button" to="/my-bookings" id="view-bookings-btn">View my bookings</Link>
            <Link className="button button-ghost" to="/">Back to experts</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-frame narrow">
      {/* Hero */}
      <section className="panel panel-hero">
        <div>
          <p className="section-label">Book a session</p>
          <h2>{expert?.name || 'Expert session'}</h2>
          <p className="section-copy">
            {expert ? `${expert.category} · ★ ${Number(expert.rating).toFixed(1)}` : 'Fill in the details below to request a session.'}
          </p>
        </div>
        <Link className="button button-ghost" to={`/experts/${activeExpertId}`}>
          ← Expert profile
        </Link>
      </section>

      {/* Form */}
      <form id="booking-form" onSubmit={handleSubmit} noValidate className="panel form-grid">
        <div>
          <input
            id="booking-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name *"
            className="input"
            autoComplete="name"
          />
        </div>
        <div>
          <input
            id="booking-email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address *"
            className="input"
            type="email"
            autoComplete="email"
          />
        </div>
        <div>
          <input
            id="booking-phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number *"
            className="input"
            type="tel"
            autoComplete="tel"
          />
        </div>

        <div>
          <select
            id="booking-date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="input"
          >
            <option value="">Select date *</option>
            {availableDates.map((item) => (
              <option key={item.date} value={item.date}>{item.date}</option>
            ))}
          </select>
        </div>

        <div className="form-span-full">
          <select
            id="booking-timeslot"
            name="timeSlot"
            value={form.timeSlot}
            onChange={handleChange}
            className="input"
            disabled={!form.date}
          >
            <option value="">{form.date ? 'Select time slot *' : 'Select a date first'}</option>
            {timeSlots.map((slot) => (
              <option key={slot.timeSlot} value={slot.timeSlot} disabled={slot.booked}>
                {slot.timeSlot}{slot.booked ? ' — booked' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-span-full">
          <textarea
            id="booking-notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes or topics to discuss (optional)"
            className="input textarea"
            rows="4"
          />
        </div>

        {error && (
          <div className="form-message error" role="alert">{error}</div>
        )}

        <div className="form-actions form-span-full">
          <button
            id="booking-submit-btn"
            type="submit"
            disabled={loading}
            className="button button-primary"
          >
            {loading ? 'Submitting…' : 'Confirm booking'}
          </button>
          <Link className="button button-ghost" to={`/experts/${activeExpertId}`}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}