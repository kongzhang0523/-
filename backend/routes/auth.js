import express from 'express'
import User from '../models/User.js'
import { generateToken, protect } from '../middleware/auth.js'

const router = express.Router()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6位'
      })
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      })
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password
    })

    // 生成 token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供邮箱和密码'
      })
    }

    // 获取用户（包含密码字段）
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }

    // 验证密码
    const isPasswordCorrect = await user.correctPassword(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }

    // 生成 token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
})

// 获取当前用户信息
router.get('/profile', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName
      }
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

export default router