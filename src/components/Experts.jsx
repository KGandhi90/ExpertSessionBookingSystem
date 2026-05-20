import { useState, useEffect } from 'react'
import { getExperts } from '../api/experts'

export default function Experts() {
  const [experts, setExperts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getExperts({ page, category, search })
        setExperts(data.experts)
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchExperts()
  }, [page, category, search]) // refetch when these change

  if (loading) return <p className="text-center">Loading experts...</p>
  if (error)   return <p className="text-red-500 text-center">{error}</p>

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name..."
        className="border p-2 rounded w-full"
      />
      {experts.map(expert => (
        <div key={expert._id}>{expert.name}</div>
      ))}
    </div>
  )
}