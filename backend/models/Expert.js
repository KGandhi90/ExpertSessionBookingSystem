import mongoose from 'mongoose'

const slotSchema = new mongoose.Schema(
  {
    timeSlot: { type: String, required: true },
    booked: { type: Boolean, default: false }
  },
  { _id: false }
)

const availabilitySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    slots: { type: [slotSchema], default: [] }
  },
  { _id: false }
)

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    experience: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    summary: { type: String, default: '' },
    availability: { type: [availabilitySchema], default: [] }
  },
  { timestamps: true }
)

export default mongoose.model('Expert', expertSchema)