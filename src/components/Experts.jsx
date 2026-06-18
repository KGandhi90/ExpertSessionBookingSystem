import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getExperts } from '../api/experts'

const categories = ['All', 'Technology', 'Finance', 'Wellness', 'Career', 'Marketing', 'Business']

export default function Experts() {
  const [experts, setExperts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 })
  const [searchParams, setSearchParams] = useSearchParams()

  const normalizedSearch = useMemo(() => search.trim(), [search])

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getExperts({ page, category, search: normalizedSearch })
        setExperts(data.experts)
        setMeta({ totalPages: data.totalPages || 1, total: data.total || 0 })
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchExperts()
  }, [page, category, normalizedSearch])

  useEffect(() => {
    const initialSearch = searchParams.get('search') || ''
    const initialCategory = searchParams.get('category') || ''
    const initialPage = Number(searchParams.get('page') || 1)

    setSearch(initialSearch)
    setCategory(initialCategory)
    setPage(Number.isNaN(initialPage) || initialPage < 1 ? 1 : initialPage)
  }, [])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (normalizedSearch) next.set('search', normalizedSearch)
      else next.delete('search')
      if (category) next.set('category', category)
      else next.delete('category')
      if (page > 1) next.set('page', String(page))
      else next.delete('page')
      return next
    }, { replace: true })
  }, [category, normalizedSearch, page, setSearchParams])

  const onSearchChange = (event) => {
    setPage(1)
    setSearch(event.target.value)
  }

  const onCategoryChange = (event) => {
    setPage(1)
    setCategory(event.target.value)
  }

  if (loading) return <div className="page-state">Loading experts...</div>
  if (error) return <div className="page-state error">{error}</div>

  return (
    <div className="page-frame">
      <section className="panel panel-hero">
        <div>
          <p className="section-label">Expert directory</p>
          <h2>Search and filter experts before booking a live session.</h2>
          <p className="section-copy">Browse by category, compare ratings, and jump into an expert profile with one click.</p>
        </div>
        <div className="stat-chip">{meta.total} experts</div>
      </section>

      <section className="panel controls-grid">
        <input
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name"
          className="input"
        />
        <select value={category} onChange={onCategoryChange} className="input">
          {categories.map((item) => (
            <option key={item} value={item === 'All' ? '' : item}>{item}</option>
          ))}
        </select>
        <Link className="button button-ghost" to="/my-bookings">My bookings</Link>
      </section>

      <section className="grid-cards">
        {experts.length === 0 ? (
          <div className="page-state">No experts match your search.</div>
        ) : experts.map((expert) => (
          <article key={expert._id} className="card">
            <div className="card-head">
              <div>
                <p className="card-title">{expert.name}</p>
                <p className="card-subtitle">{expert.category}</p>
              </div>
              <span className="rating-pill">{Number(expert.rating).toFixed(1)}</span>
            </div>
            <p className="card-copy">{expert.experience} years of experience</p>
            <div className="card-actions">
              <Link className="button" to={`/experts/${expert._id}`}>View details</Link>
            </div>
          </article>
        ))}
      </section>

      <footer className="pagination-bar">
        <button className="button button-ghost" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span className="pagination-copy">Page {page} of {meta.totalPages}</span>
        <button className="button button-ghost" disabled={page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
      </footer>
    </div>
  )
}