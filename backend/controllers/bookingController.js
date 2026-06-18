import mongoose from 'mongoose'
import Booking from '../models/Booking.js'
import Expert from '../models/Expert.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-()\s]{7,20}$/

const validateBookingPayload = ({ expertId, date, timeSlot, name, email, phone }) => {
  if (!mongoose.isValidObjectId(expertId)) return 'Valid expertId is required'
  if (!name?.trim()) return 'Name is required'
  if (!email?.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.trim())) return 'A valid email address is required'
  if (!phone?.trim()) return 'Phone is required'
  if (!PHONE_RE.test(phone.trim())) return 'Phone must be 7–20 digits (may include +, -, spaces)'
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

    const dayEntry = expert.availability.find((day) => day.date === date)
    if (!dayEntry) {
      await session.abortTransaction()
      return res.status(400).json({ message: 'No availability found for this date' })
    }

    const slotEntry = dayEntry.slots.find((slot) => slot.timeSlot === timeSlot)
    if (!slotEntry) {
      await session.abortTransaction()
      return res.status(400).json({ message: 'Selected time slot does not exist' })
    }

    if (slotEntry.booked) {
      await session.abortTransaction()
      return res.status(409).json({ message: 'This slot has already been booked. Please choose another.' })
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
    try { await session.abortTransaction() } catch { /* already aborted */ }

    if (error?.code === 11000) {
      return res.status(409).json({ message: 'This slot is already booked. Please choose another.' })
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

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const bookings = await Booking.find({ email }).populate('expertId').sort({ createdAt: -1 })
    res.json({ bookings })
  } catch (error) {
    next(error)
  }
}

// Valid forward-only transitions
const VALID_TRANSITIONS = {
  Pending: ['Confirmed', 'Completed'],
  Confirmed: ['Completed'],
  Completed: []
}

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body

    if (!['Pending', 'Confirmed', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' })
    }

    const booking = await Booking.findById(req.params.id).populate('expertId')
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const allowed = VALID_TRANSITIONS[booking.status] ?? []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from "${booking.status}" to "${status}"`
      })
    }

    booking.status = status
    await booking.save()

    // Emit real-time event so other clients can update their booking lists
    req.io?.emit('bookingStatusChanged', { bookingId: String(booking._id), status })

    res.json({ message: 'Booking status updated', booking })
  } catch (error) {
    next(error)
  }
}