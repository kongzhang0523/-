import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    enum: ['师门', '抓鬼', '副本', '封妖', '炼妖', '活动', '其他'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  item: {
    type: String,
    maxlength: 200
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
})

// 虚拟字段：显示类型
transactionSchema.virtual('typeText').get(function() {
  return this.type === 'income' ? '收入' : '支出'
})

// 索引优化
transactionSchema.index({ user: 1, createdAt: -1 })
transactionSchema.index({ user: 1, session: 1 })
transactionSchema.index({ user: 1, type: 1 })
transactionSchema.index({ user: 1, category: 1 })

// 转换 JSON 输出
transactionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  }
})

export default mongoose.model('Transaction', transactionSchema)