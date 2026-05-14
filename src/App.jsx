import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Experts from './components/Experts'
import ExpertDetails from './components/ExpertDetails'
import Booking from './components/Booking'
import MyBookings from './components/MyBookings'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Experts />} />
        <Route path="/expertDetails" element={<ExpertDetails />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/myBookings" element={<MyBookings />} />
        {/* <Route path="*" element={<NotFound />} /> 404 catch-all */}
      </Routes>
    </>
  )
}

export default App
