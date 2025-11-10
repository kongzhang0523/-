import express from 'express'
import Session from '../models/Session.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(protect)

// 获取游戏会话列表
router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const filter = { user: req.user._id }
    
    if (status) {
      filter.status = status
    }

    const sessions = await Session.find(filter)
      .sort({ startTime: -1 })
      .lean()

    res.json(sessions)
  } catch (error) {
    console.error('获取会话列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取会话列表失败'
    })
  }
})

// 创建游戏会话
router.post('/', async (req, res) => {
  try {
    const { multiAccount, status = 'active' } = req.body

    if (!multiAccount) {
      return res.status(400).json({
        success: false,
        message: '多开数量是必需的'
      })
    }

    const session = await Session.create({
      user: req.user._id,
      multiAccount,
      status,
      startTime: new Date()
    })

    res.status(201).json(session)
  } catch (error) {
    console.error('创建会话错误:', error)
    res.status(500).json({
      success: false,
      message: '创建会话失败'
    })
  }
})

// 更新游戏会话
router.patch('/:id', async (req, res) => {
  try {
    const { status, endTime, notes } = req.body
    const sessionId = req.params.id

    // 检查会话是否存在且属于当前用户
    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      })
    }

    // 更新字段
    const updates = {}
    if (status) updates.status = status
    if (endTime) updates.endTime = endTime
    if (notes !== undefined) updates.notes = notes

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      updates,
      { new: true, runValidators: true }
    ).lean()

    res.json(updatedSession)
  } catch (error) {
    console.error('更新会话错误:', error)
    res.status(500).json({
      success: false,
      message: '更新会话失败'
    })
  }
})

// 删除游戏会话
router.delete('/:id', async (req, res) => {
  try {
    const sessionId = req.params.id

    const session = await Session.findOne({ 
      _id: sessionId, 
      user: req.user._id 
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      })
    }

    await Session.findByIdAndDelete(sessionId)

    res.json({
      success: true,
      message: '会话删除成功'
    })
  } catch (error) {
    console.error('删除会话错误:', error)
    res.status(500).json({
      success: false,
      message: '删除会话失败'
    })
  }
})

export default router