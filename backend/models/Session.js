import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  durationHours: {
    type: Number,
    min: 0,
    default: 0
  },
  multiAccount: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    default: 1
  },
  pointCardCost: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'ended'],
    default: 'active'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
})

// 计算点卡成本
sessionSchema.methods.calculatePointCardCost = function() {
  const POINT_CARD_RATE = 0.6 // 0.6元/小时
  return (this.durationHours * this.multiAccount * POINT_CARD_RATE).toFixed(2)
}

// 结束会话时自动计算时长和成本
sessionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'ended' && this.endTime) {
    const durationMs = new Date(this.endTime) - new Date(this.startTime)
    this.durationHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2))
    this.pointCardCost = Number(this.calculatePointCardCost())
  }
  next()
})

// 索引优化
sessionSchema.index({ user: 1, startTime: -1 })
sessionSchema.index({ user: 1, status: 1 })

export default mongoose.model('Session', sessionSchema)