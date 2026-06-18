import mongoose from 'mongoose'
import Booking from '../models/Booking.js'
import Expert from '../models/Expert.js'

const validateBookingPayload = ({ expertId, date, timeSlot, name, email, phone }) => {
  if (!mongoose.isValidObjectId(expertId)) return 'Valid expertId is required'
  if (!name?.trim()) return 'Name is required'
  if (!email?.trim()) return 'Email is required'
  if (!phone?.trim()) return 'Phone is required'
  if (!date?.trim()) return 'Date is required'
  if (!timeSlot?.trim()) return 'Time slot is required'
  return null
}

export const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession()

  try {
    const validationMessage = validateBookingPayload(req.body)
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage })
    }

    const { expertId, date, timeSlot, name, email, phone, notes = '' } = req.body
    const normalizedEmail = email.trim().toLowerCase()

    session.startTransaction()

    const expert = await Expert.findById(expertId).session(session)
    if (!expert) {
      await session.abortTransaction()
      return res.status(404).json({ message: 'Expert not found' })
    }

    const slotExists = expert.availability.some((day) => day.date === date && day.slots.some((slot) => slot.timeSlot === timeSlot))
    if (!slotExists) {
      await session.abortTransaction()
      return res.status(400).json({ message: 'Selected slot is unavailable' })
    }

    const booking = await Booking.create([
      {
        expertId,
        date,
        timeSlot,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        notes: notes.trim()
      }
    ], { session })

    await Expert.updateOne(
      { _id: expertId, 'availability.date': date, 'availability.slots.timeSlot': timeSlot },
      { $set: { 'availability.$[day].slots.$[slot].booked': true } },
      {
        session,
        arrayFilters: [{ 'day.date': date }, { 'slot.timeSlot': timeSlot }]
      }
    )

    await session.commitTransaction()
    req.io?.emit('bookingChanged', { expertId, date, timeSlot })

    return res.status(201).json({ message: 'Booking created successfully', booking: booking[0] })
  } catch (error) {
    await session.abortTransaction().catch(() => {})

    if (error?.code === 11000) {
      return res.status(409).json({ message: 'This slot is already booked' })
    }

    next(error)
  } finally {
    session.endSession()
  }
}

export const getBookings = async (req, res, next) => {
  try {
    const email = req.query.email?.trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' })
    }

    const bookings = await Booking.find({ email }).populate('expertId').sort({ createdAt: -1 })
    res.json({ bookings })
  } catch (error) {
    next(error)
  }
}

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body

    if (!['Pending', 'Confirmed', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' })
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('expertId')

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    res.json({ message: 'Booking status updated', booking })
  } catch (error) {
    next(error)
  }
}