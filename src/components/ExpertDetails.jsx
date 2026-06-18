import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getExpertById } from '../api/experts'
import { socket } from '../api/socket'

function SocketChip({ connected }) {
  return (
    <span className={`socket-chip ${connected ? 'connected' : 'disconnected'}`}>
      <span className="dot" />
      {connected ? 'Live updates on' : 'Reconnecting…'}
    </span>
  )
}

const ExpertDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expert, setExpert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [socketConnected, setSocketConnected] = useState(socket.connected)

  // Used by both initial load and socket-triggered refresh
  const refreshExpert = useCallback(async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getExpertById(id)
      if (!signal?.aborted) setExpert(data.expert)
    } catch (err) {
      if (!signal?.aborted) setError(err.response?.data?.message || 'Unable to load expert details.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [id])

  // Initial load
  useEffect(() => {
    let aborted = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getExpertById(id)
        if (!aborted) setExpert(data.expert)
      } catch (err) {
        if (!aborted) setError(err.response?.data?.message || 'Unable to load expert details.')
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    run()
    return () => { aborted = true }
  }, [id])

  // Socket: real-time slot updates + connection state
  useEffect(() => {
    const handleBookingChange = (payload) => {
      if (!payload?.expertId || String(payload.expertId) !== String(id)) return
      refreshExpert()
    }
    const onConnect = () => setSocketConnected(true)
    const onDisconnect = () => setSocketConnected(false)

    socket.on('bookingChanged', handleBookingChange)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('bookingChanged', handleBookingChange)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [id, refreshExpert])

  const groupedSlots = useMemo(() => expert?.availability || [], [expert])

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner" />
        <span>Loading expert details…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-frame narrow">
        <div className="page-state error" role="alert">{error}</div>
        <Link className="button button-ghost" to="/">← Back to experts</Link>
      </div>
    )
  }

  const totalFree = groupedSlots.reduce(
    (sum, day) => sum + day.slots.filter((s) => !s.booked).length,
    0
  )

  return (
    <div className="page-frame">
      {/* Hero */}
      <section className="panel panel-hero">
        <div>
          <p className="section-label">Expert profile</p>
          <h2>{expert.name}</h2>
          <p className="section-copy">
            {expert.category} · {expert.experience} years experience · ★ {Number(expert.rating).toFixed(1)}
          </p>
          {expert.summary && (
            <p className="section-copy" style={{ marginTop: 10 }}>{expert.summary}</p>
          )}
        </div>
        <div className="hero-actions" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <Link className="button" to={`/booking/${expert._id}`} id="open-booking-btn">
            Book a session
          </Link>
          <Link className="button button-ghost" to="/">← All experts</Link>
        </div>
      </section>

      {/* Available slots */}
      <section className="panel">
        <div className="section-row" style={{ marginBottom: 20 }}>
          <div>
            <h3 className="section-title">Available time slots</h3>
            <p className="section-copy" style={{ marginTop: 4 }}>
              {totalFree} free slot{totalFree !== 1 ? 's' : ''} across {groupedSlots.length} date{groupedSlots.length !== 1 ? 's' : ''}
            </p>
          </div>
          <SocketChip connected={socketConnected} />
        </div>

        {groupedSlots.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📅</span>
            <h3>No availability</h3>
            <p>This expert has no upcoming slots. Check back later.</p>
          </div>
        ) : (
          <div className="availability-grid">
            {groupedSlots.map((day) => {
              const freeCount = day.slots.filter((s) => !s.booked).length
              return (
                <article className="availability-card" key={day.date}>
                  <div className="card-head compact">
                    <div>
                      <p className="card-title">{day.date}</p>
                      <p className="card-subtitle">{freeCount} of {day.slots.length} free</p>
                    </div>
                    {freeCount === 0 && <span className="stat-chip">Full</span>}
                  </div>
                  <div className="slot-grid">
                    {day.slots.map((slot) => (
                      <button
                        key={`${day.date}-${slot.timeSlot}`}
                        type="button"
                        className={`slot-chip ${slot.booked ? 'is-booked' : ''}`}
                        disabled={slot.booked}
                        title={slot.booked ? 'Already booked' : `Book ${slot.timeSlot} on ${day.date}`}
                        onClick={() =>
                          navigate(`/booking/${expert._id}`, {
                            state: { expertId: expert._id, date: day.date, timeSlot: slot.timeSlot }
                          })
                        }
                      >
                        {slot.timeSlot}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default ExpertDetails