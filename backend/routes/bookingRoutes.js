import { Router } from 'express'
import { createBooking, getBookings, updateStatus } from '../controllers/bookingController.js'

const router = Router()

router.post('/', createBooking)
router.patch('/:id/status', updateStatus)
router.get('/', getBookings)

export default router