import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dream-asset-manager-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      })
    }

    // 验证 token
    const decoded = verifyToken(token)
    
    // 获取用户信息
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('认证中间件错误:', error)
    return res.status(401).json({
      success: false,
      message: 'Token 无效'
    })
  }
}