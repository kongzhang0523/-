import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import validator from 'validator'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    trim: true,
    minlength: [2, '用户名至少2个字符'],
    maxlength: [50, '用户名最多50个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少6个字符'],
    select: false
  }
}, {
  timestamps: true
})

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// 密码验证方法
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

// 虚拟字段：用户显示名
userSchema.virtual('displayName').get(function() {
  return this.username || this.email.split('@')[0]
})

// 转换 JSON 输出
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password
    delete ret.__v
    return ret
  }
})

export default mongoose.model('User', userSchema)