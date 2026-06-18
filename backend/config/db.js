import mongoose from 'mongoose'

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined')
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  return mongoose.connect(mongoUri)
}

export default connectDB