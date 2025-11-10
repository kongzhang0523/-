import express from 'express'
import Transaction from '../models/Transaction.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(protect)

// 获取交易记录列表
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      sessionId, 
      startDate, 
      endDate,
      page = 1,
      limit = 50
    } = req.query

    const filter = { user: req.user._id }
    
    // 构建过滤条件
    if (type) filter.type = type
    if (category) filter.category = category
    if (sessionId) filter.session = sessionId
    
    // 日期范围过滤
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    const transactions = await Transaction.find(filter)
      .populate('session', 'startTime multiAccount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    const total = await Transaction.countDocuments(filter)

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取交易记录错误:', error)
    res.status(500).json({
      success: false,
      message: '获取交易记录失败'
    })
  }
})

// 创建交易记录
router.post('/', async (req, res) => {
  try {
    const { type, category, amount, item, notes, sessionId } = req.body

    // 验证必填字段
    if (!type || !category || !amount) {
      return res.status(400).json({
        success: false,
        message: '类型、分类和金额是必需的'
      })
    }

    const transactionData = {
      user: req.user._id,
      type,
      category,
      amount: parseFloat(amount),
      item,
      notes
    }

    // 如果提供了 sessionId，验证会话是否存在且属于当前用户
    if (sessionId) {
      const Session = (await import('../models/Session.js')).default
      const session = await Session.findOne({ 
        _id: sessionId, 
        user: req.user._id 
      })
      
      if (!session) {
        return res.status(400).json({
          success: false,
          message: '关联的会话不存在'
        })
      }
      transactionData.session = sessionId
    }

    const transaction = await Transaction.create(transactionData)

    // 填充会话信息返回
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('session', 'startTime multiAccount')
      .lean()

    res.status(201).json(populatedTransaction)
  } catch (error) {
    console.error('创建交易记录错误:', error)
    res.status(500).json({
      success: false,
      message: '创建交易记录失败'
    })
  }
})

// 批量创建交易记录
router.post('/batch', async (req, res) => {
  try {
    const transactionsData = req.body

    if (!Array.isArray(transactionsData) || transactionsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的交易记录数据'
      })
    }

    // 验证所有记录并添加用户ID
    const transactionsToCreate = transactionsData.map(transaction => ({
      ...transaction,
      user: req.user._id,
      amount: parseFloat(transaction.amount)
    }))

    // 批量创建
    const transactions = await Transaction.insertMany(transactionsToCreate)

    // 填充会话信息返回
    const populatedTransactions = await Transaction.find({
      _id: { $in: transactions.map(t => t._id) }
    })
      .populate('session', 'startTime multiAccount')
      .lean()

    res.status(201).json(populatedTransactions)
  } catch (error) {
    console.error('批量创建交易记录错误:', error)
    res.status(500).json({
      success: false,
      message: '批量创建交易记录失败'
    })
  }
})

// 更新交易记录
router.patch('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id
    const updates = req.body

    // 检查交易记录是否存在且属于当前用户
    const transaction = await Transaction.findOne({ 
      _id: transactionId, 
      user: req.user._id 
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      })
    }

    // 如果更新 sessionId，验证新会话是否存在且属于当前用户
    if (updates.sessionId) {
      const Session = (await import('../models/Session.js')).default
      const session = await Session.findOne({ 
        _id: updates.sessionId, 
        user: req.user._id 
      })
      
      if (!session) {
        return res.status(400).json({
          success: false,
          message: '关联的会话不存在'
        })
      }
      updates.session = updates.sessionId
      delete updates.sessionId
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updates,
      { new: true, runValidators: true }
    )
      .populate('session', 'startTime multiAccount')
      .lean()

    res.json(updatedTransaction)
  } catch (error) {
    console.error('更新交易记录错误:', error)
    res.status(500).json({
      success: false,
      message: '更新交易记录失败'
    })
  }
})

// 删除交易记录
router.delete('/:id', async (req, res) => {
  try {
    const transactionId = req.params.id

    const transaction = await Transaction.findOne({ 
      _id: transactionId, 
      user: req.user._id 
    })

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      })
    }

    await Transaction.findByIdAndDelete(transactionId)

    res.json({
      success: true,
      message: '交易记录删除成功'
    })
  } catch (error) {
    console.error('删除交易记录错误:', error)
    res.status(500).json({
      success: false,
      message: '删除交易记录失败'
    })
  }
})

export default router