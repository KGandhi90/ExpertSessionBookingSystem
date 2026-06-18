import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyBookings, updateBookingStatus } from '../api/booking'
import { socket } from '../api/socket'

// Forward-only valid transitions (mirrors the backend)
const NEXT_STATUS = {
  Pending: ['Confirmed', 'Completed'],
  Confirmed: ['Completed'],
  Completed: []
}

const STATUS_LABELS = {
  Pending: '🕐 Pending',
  Confirmed: '✅ Confirmed',
  Completed: '🏁 Completed'
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MyBookings = () => {
  const [email, setEmail] = useState(
    () => localStorage.getItem('lastBookingEmail') || ''
  )
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const loadBookings = useCallback(async (targetEmail) => {
    const trimmed = (targetEmail ?? email).trim()
    if (!trimmed) {
      setError('Please enter an email address.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setHasSearched(true)
      const data = await getMyBookings(trimmed)
      setBookings(data.bookings || [])
      localStorage.setItem('lastBookingEmail', trimmed)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email])

  // Auto-load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastBookingEmail')
    if (savedEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadBookings(savedEmail)
    }
  // Run once on mount — loadBookings stable at this point
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Real-time status update from socket
  useEffect(() => {
    const handleStatusChanged = ({ bookingId, status }) => {
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
      )
    }

    socket.on('bookingStatusChanged', handleStatusChanged)
    return () => socket.off('bookingStatusChanged', handleStatusChanged)
  }, [])

  const changeStatus = async (bookingId, newStatus) => {
    try {
      const response = await updateBookingStatus(bookingId, newStatus)
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? response.booking : b))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') loadBookings()
  }

  return (
    <div className="page-frame narrow">
      {/* Hero */}
      <section className="panel panel-hero">
        <div>
          <p className="section-label">My bookings</p>
          <h2>Track your sessions</h2>
          <p className="section-copy">Enter the email you used when booking to view all your sessions.</p>
        </div>
        <Link className="button button-ghost" to="/">← Experts</Link>
      </section>

      {/* Email search */}
      <section className="panel controls-grid" style={{ gridTemplateColumns: '1fr auto' }}>
        <input
          id="bookings-email-input"
          className="input"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Email to look up bookings"
        />
        <button
          id="bookings-load-btn"
          className="button button-primary"
          onClick={() => loadBookings()}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Load bookings'}
        </button>
      </section>

      {/* Error */}
      {error && <div className="form-message error" role="alert">{error}</div>}

      {/* Loading spinner */}
      {loading && (
        <div className="spinner-wrapper">
          <div className="spinner" />
          <span>Fetching bookings…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && hasSearched && bookings.length === 0 && !error && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No bookings found</h3>
          <p>We couldn't find any sessions for <strong>{email}</strong>.</p>
          <Link className="button" to="/" style={{ marginTop: 8 }}>Browse experts</Link>
        </div>
      )}

      {/* Bookings list */}
      {!loading && bookings.length > 0 && (
        <section className="grid-cards" aria-label="Your bookings">
          {bookings.map((booking) => {
            const nextActions = NEXT_STATUS[booking.status] ?? []
            return (
              <article key={booking._id} className="card">
                <div className="card-head">
                  <div style={{ minWidth: 0 }}>
                    <p className="card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.expertId?.name || 'Expert session'}
                    </p>
                    {booking.expertId?.category && (
                      <span className="category-chip">{booking.expertId.category}</span>
                    )}
                  </div>
                  <span className={`status-pill status-${booking.status.toLowerCase()}`}>
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>

                <div className="booking-detail" style={{ marginTop: 12 }}>
                  📅 <strong>{booking.date}</strong> &nbsp;·&nbsp; 🕐 <strong>{booking.timeSlot}</strong>
                </div>

                {booking.notes && (
                  <p className="card-copy" style={{ marginTop: 8 }}>
                    {booking.notes}
                  </p>
                )}

                {nextActions.length > 0 && (
                  <div className="status-actions" style={{ marginTop: 14 }}>
                    {nextActions.map((status) => (
                      <button
                        key={status}
                        id={`status-btn-${booking._id}-${status.toLowerCase()}`}
                        type="button"
                        className="button button-ghost"
                        onClick={() => changeStatus(booking._id, status)}
                      >
                        Mark {status}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}

export default MyBookings