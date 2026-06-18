import Expert from '../models/Expert.js'

export const getExperts = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 50)
    const category = req.query.category?.trim()
    const search = req.query.search?.trim()

    const filter = {}

    if (category) {
      filter.category = category
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    const [experts, total] = await Promise.all([
      Expert.find(filter).sort({ rating: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Expert.countDocuments(filter)
    ])

    res.json({
      experts,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    })
  } catch (error) {
    next(error)
  }
}

export const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id)

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' })
    }

    res.json({ expert })
  } catch (error) {
    next(error)
  }
}