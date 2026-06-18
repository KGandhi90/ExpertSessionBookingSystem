import { NavLink } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import Experts from './components/Experts'
import ExpertDetails from './components/ExpertDetails'
import Booking from './components/Booking'
import MyBookings from './components/MyBookings'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-dot" />
          <div>
            <p className="eyebrow">Expert Session Booking</p>
            <h1>Real-time expert scheduling</h1>
          </div>
        </div>
        <nav className="topbar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
          >
            Experts
          </NavLink>
          <NavLink
            to="/my-bookings"
            className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
          >
            My Bookings
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Experts />} />
        <Route path="/experts/:id" element={<ExpertDetails />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="*" element={<Experts />} />
      </Routes>
    </div>
  )
}

export default App
