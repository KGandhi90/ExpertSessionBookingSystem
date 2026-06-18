import { useEffect, useState } from 'react'
import { getMyBookings, updateBookingStatus } from '../api/booking'

const MyBookings = () => {
  const [email, setEmail] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const savedEmail = localStorage.getItem('lastBookingEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      void loadBookings(savedEmail)
    }
  }, [])

  const loadBookings = async (targetEmail = email) => {
    if (!targetEmail.trim()) {
      setError('Enter an email address to view bookings.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getMyBookings(targetEmail.trim())
      setBookings(data.bookings || [])
      localStorage.setItem('lastBookingEmail', targetEmail.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (bookingId, status) => {
    try {
      const response = await updateBookingStatus(bookingId, status)
      setBookings((current) => current.map((booking) => (booking._id === bookingId ? response.booking : booking)))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update booking status')
    }
  }

  return (
    <div className="page-frame narrow">
      <section className="panel panel-hero">
        <div>
          <p className="section-label">My bookings</p>
          <h2>Track sessions by email</h2>
        </div>
      </section>

      <section className="panel controls-grid">
        <input className="input" type="email" placeholder="Enter booking email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <button className="button button-primary" onClick={() => loadBookings()}>Load bookings</button>
      </section>

      {error && <div className="page-state error">{error}</div>}
      {loading && <div className="page-state">Loading bookings...</div>}

      <section className="grid-cards">
        {!loading && bookings.length === 0 && <div className="page-state">No bookings found for this email.</div>}
        {bookings.map((booking) => (
          <article key={booking._id} className="card">
            <div className="card-head">
              <div>
                <p className="card-title">{booking.expertId?.name || 'Expert session'}</p>
                <p className="card-subtitle">{booking.date} · {booking.timeSlot}</p>
              </div>
              <span className={`status-pill status-${booking.status.toLowerCase()}`}>{booking.status}</span>
            </div>
            <p className="card-copy">{booking.notes || 'No notes provided.'}</p>
            <div className="status-actions">
              {['Pending', 'Confirmed', 'Completed'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className="button button-ghost"
                  onClick={() => changeStatus(booking._id, status)}
                  disabled={booking.status === status}
                >
                  Mark {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default MyBookings;