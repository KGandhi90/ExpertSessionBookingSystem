import dotenv from 'dotenv'
import connectDB from './config/db.js'
import Expert from './models/Expert.js'

dotenv.config()

const experts = [
  {
    name: 'Ava Johnson',
    category: 'Technology',
    experience: 9,
    rating: 4.9,
    summary: 'Full-stack engineer focused on product architecture and scaling teams.',
    availability: [
      { date: '2026-06-19', slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '11:30 AM' }, { timeSlot: '02:00 PM' }] },
      { date: '2026-06-20', slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '01:00 PM' }, { timeSlot: '04:00 PM' }] }
    ]
  },
  {
    name: 'Daniel Kim',
    category: 'Finance',
    experience: 12,
    rating: 4.8,
    summary: 'Investment advisor for early-stage founders and operators.',
    availability: [
      { date: '2026-06-19', slots: [{ timeSlot: '09:30 AM' }, { timeSlot: '12:00 PM' }, { timeSlot: '03:30 PM' }] },
      { date: '2026-06-21', slots: [{ timeSlot: '10:30 AM' }, { timeSlot: '01:30 PM' }, { timeSlot: '05:00 PM' }] }
    ]
  },
  {
    name: 'Priya Shah',
    category: 'Career',
    experience: 8,
    rating: 4.7,
    summary: 'Interview coach and leadership mentor for growth-stage professionals.',
    availability: [
      { date: '2026-06-20', slots: [{ timeSlot: '10:00 AM' }, { timeSlot: '12:30 PM' }, { timeSlot: '03:00 PM' }] },
      { date: '2026-06-22', slots: [{ timeSlot: '09:00 AM' }, { timeSlot: '11:00 AM' }, { timeSlot: '02:30 PM' }] }
    ]
  }
]

const run = async () => {
  await connectDB()
  await Expert.deleteMany({})
  await Expert.insertMany(experts)
  console.log('Seeded experts')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})