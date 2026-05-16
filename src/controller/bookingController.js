// controllers/bookingController.js
import Booking from '../models/Booking.js'

export const createBooking = async (req, res) => {
  try {
    const { expertId, date, timeSlot, name, email, phone, notes } = req.body

    // ✅ Prevent double booking (race condition safe)
    const existing = await Booking.findOneAndUpdate(
      { expertId, date, timeSlot, status: { $ne: 'cancelled' } },
      { $setOnInsert: { expertId, date, timeSlot, name, email, phone, notes } },
      { upsert: true, new: false, rawResult: true }
    )

    if (existing.lastErrorObject?.updatedExisting) {
      return res.status(409).json({ message: 'This slot is already booked' })
    }

    res.status(201).json({ message: 'Booking created successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getBookings = async (req, res) => {
  try {
    const { email } = req.query
    const bookings = await Booking.find({ email }).populate('expertId')
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    res.json(booking)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}