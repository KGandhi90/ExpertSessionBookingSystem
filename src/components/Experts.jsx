import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getExperts } from '../api/experts'

const CATEGORIES = ['All', 'Technology', 'Finance', 'Wellness', 'Career', 'Marketing', 'Business']

// Skeleton placeholder cards
function SkeletonCards() {
  return (
    <section className="skeleton-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line avatar" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
          <div className="skeleton-line full" style={{ marginTop: 16 }} />
        </div>
      ))}
    </section>
  )
}

// Initials avatar
function Avatar({ name }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return <div className="card-avatar">{initials}</div>
}

// Read URL params synchronously before first render
function readInitialParams(searchParams) {
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const raw = Number(searchParams.get('page') || 1)
  const page = Number.isNaN(raw) || raw < 1 ? 1 : raw
  return { search, category, page }
}

export default function Experts() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initial = useMemo(() => readInitialParams(searchParams), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [experts, setExperts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(initial.search)
  const [category, setCategory] = useState(initial.category)
  const [page, setPage] = useState(initial.page)
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 })

  const [debouncedSearch, setDebouncedSearch] = useState(initial.search)
  const debounceRef = useRef(null)

  // Debounce search input
  const onSearchChange = useCallback((e) => {
    const value = e.target.value
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      setDebouncedSearch(value.trim())
    }, 300)
  }, [])

  const onCategoryChange = (e) => {
    setPage(1)
    setCategory(e.target.value)
  }

  // Sync URL
  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (debouncedSearch) next.set('search', debouncedSearch)
      else next.delete('search')
      if (category) next.set('category', category)
      else next.delete('category')
      if (page > 1) next.set('page', String(page))
      else next.delete('page')
      return next
    }, { replace: true })
  }, [category, debouncedSearch, page, setSearchParams])

  // Fetch experts
  useEffect(() => {
    let cancelled = false
    const fetchExperts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getExperts({ page, category, search: debouncedSearch })
        if (!cancelled) {
          setExperts(data.experts)
          setMeta({ totalPages: data.totalPages || 1, total: data.total || 0 })
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load experts. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchExperts()
    return () => { cancelled = true }
  }, [page, category, debouncedSearch])

  const showEmpty = useMemo(() => !loading && !error && experts.length === 0, [loading, error, experts])

  return (
    <div className="page-frame">
      {/* Hero */}
      <section className="panel panel-hero">
        <div>
          <p className="section-label">Expert directory</p>
          <h2>Find your perfect expert</h2>
          <p className="section-copy">
            Browse by category, compare ratings, and book a live session in seconds.
          </p>
        </div>
        <div className="stat-chip">{meta.total} experts</div>
      </section>

      {/* Controls */}
      <section className="panel controls-grid">
        <input
          id="expert-search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name…"
          className="input"
          aria-label="Search experts by name"
        />
        <select
          id="expert-category"
          value={category}
          onChange={onCategoryChange}
          className="input"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item === 'All' ? '' : item}>{item}</option>
          ))}
        </select>
        <Link className="button button-ghost" to="/my-bookings">My Bookings</Link>
      </section>

      {/* Content */}
      {loading && <SkeletonCards />}

      {error && (
        <div className="page-state error" role="alert">{error}</div>
      )}

      {showEmpty && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No experts found</h3>
          <p>Try a different name or category filter.</p>
        </div>
      )}

      {!loading && !error && experts.length > 0 && (
        <section className="grid-cards" aria-label="Expert cards">
          {experts.map((expert) => (
            <article key={expert._id} className="card">
              <div className="card-avatar-row">
                <Avatar name={expert.name} />
                <div className="card-meta">
                  <p className="card-title">{expert.name}</p>
                  <p className="card-subtitle">{expert.experience} yrs experience</p>
                </div>
                <span className="rating-pill" title="Rating">{Number(expert.rating).toFixed(1)}</span>
              </div>
              <span className="category-chip">{expert.category}</span>
              {expert.summary && (
                <p className="card-copy" style={{ marginTop: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {expert.summary}
                </p>
              )}
              <div className="card-actions">
                <Link className="button" to={`/experts/${expert._id}`} id={`view-expert-${expert._id}`}>
                  View profile
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Pagination */}
      {!loading && !error && (
        <div className="pagination-bar">
          <button
            id="pagination-prev"
            className="button button-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span className="pagination-copy">Page {page} of {meta.totalPages}</span>
          <button
            id="pagination-next"
            className="button button-ghost"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}