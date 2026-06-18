import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getExpertById } from '../api/experts'
import { socket } from '../api/socket'

const ExpertDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expert, setExpert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadExpert = async () => {
    try {
      setLoading(true)
      const data = await getExpertById(id)
      setExpert(data.expert)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load expert')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpert()
  }, [id])

  useEffect(() => {
    const handleBookingChange = async (payload) => {
      if (!payload?.expertId || String(payload.expertId) !== String(id)) return
      await loadExpert()
    }

    socket.on('bookingChanged', handleBookingChange)
    return () => {
      socket.off('bookingChanged', handleBookingChange)
    }
  }, [id])

  const groupedSlots = useMemo(() => expert?.availability || [], [expert])

  if (loading) return <div className="page-state">Loading expert details...</div>
  if (error) return <div className="page-state error">{error}</div>

  return (
    <div className="page-frame">
      <section className="panel panel-hero">
        <div>
          <p className="section-label">Expert profile</p>
          <h2>{expert.name}</h2>
          <p className="section-copy">{expert.category} · {expert.experience} years experience · Rating {Number(expert.rating).toFixed(1)}</p>
        </div>
        <div className="hero-actions">
          <Link className="button button-ghost" to="/">Back</Link>
          <Link className="button" to={`/booking/${expert._id}`}>Open booking form</Link>
        </div>
      </section>

      <section className="panel">
        <h3 className="section-title">About</h3>
        <p className="card-copy">{expert.summary || 'Session details and availability are shown below.'}</p>
      </section>

      <section className="panel">
        <div className="section-row">
          <h3 className="section-title">Available slots</h3>
          <span className="stat-chip">Live updates enabled</span>
        </div>
        <div className="availability-grid">
          {groupedSlots.map((day) => (
            <article className="availability-card" key={day.date}>
              <div className="card-head compact">
                <p className="card-title">{day.date}</p>
                <span className="card-subtitle">{day.slots.filter((slot) => !slot.booked).length} free</span>
              </div>
              <div className="slot-grid">
                {day.slots.map((slot) => (
                  <button
                    key={`${day.date}-${slot.timeSlot}`}
                    type="button"
                    className={`slot-chip ${slot.booked ? 'is-booked' : ''}`}
                    disabled={slot.booked}
                    onClick={() => navigate(`/booking/${expert._id}`, { state: { expertId: expert._id, date: day.date, timeSlot: slot.timeSlot } })}
                  >
                    {slot.timeSlot}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
}

export default ExpertDetails;