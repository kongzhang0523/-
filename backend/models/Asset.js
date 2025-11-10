import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['角色', '装备', '召唤兽', '游戏币', '其他'],
    required: true
  },
  value: {
    type: Number,
    min: 0,
    default: 0
  },
  quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  description: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
})

// 虚拟字段：总价值
assetSchema.virtual('totalValue').get(function() {
  return (this.value || 0) * (this.quantity || 1)
})

// 索引优化
assetSchema.index({ user: 1, createdAt: -1 })
assetSchema.index({ user: 1, type: 1 })

// 转换 JSON 输出
assetSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  }
})

export default mongoose.model('Asset', assetSchema)