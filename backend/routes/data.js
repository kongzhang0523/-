import express from 'express'
import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'
import Asset from '../models/Asset.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(protect)

// 数据迁移接口
router.post('/migrate', async (req, res) => {
  try {
    const { sessions, transactions, assets } = req.body

    if (!sessions || !transactions || !assets) {
      return res.status(400).json({
        success: false,
        message: '迁移数据不完整'
      })
    }

    const userId = req.user._id
    const results = {
      sessions: { success: 0, failed: 0 },
      transactions: { success: 0, failed: 0 },
      assets: { success: 0, failed: 0 }
    }

    // 迁移会话数据
    if (Array.isArray(sessions) && sessions.length > 0) {
      const sessionPromises = sessions.map(async (session) => {
        try {
          await Session.create({
            user: userId,
            startTime: session.startTime,
            endTime: session.endTime,
            durationHours: session.durationHours,
            multiAccount: session.multiAccount,
            pointCardCost: session.pointCardCost,
            status: session.status,
            notes: session.notes
          })
          results.sessions.success++
        } catch (error) {
          console.error('迁移会话错误:', error)
          results.sessions.failed++
        }
      })
      await Promise.all(sessionPromises)
    }

    // 迁移交易记录数据
    if (Array.isArray(transactions) && transactions.length > 0) {
      // 先获取所有迁移后的会话，建立ID映射
      const migratedSessions = await Session.find({ user: userId }).lean()
      const sessionMap = new Map()
      migratedSessions.forEach(session => {
        // 这里假设本地数据有某种ID映射关系，实际可能需要更复杂的映射逻辑
        sessionMap.set(session.originalId || session.id, session._id)
      })

      const transactionPromises = transactions.map(async (transaction) => {
        try {
          const transactionData = {
            user: userId,
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            item: transaction.item,
            notes: transaction.notes
          }

          // 如果有会话关联，尝试映射
          if (transaction.sessionId && sessionMap.has(transaction.sessionId)) {
            transactionData.session = sessionMap.get(transaction.sessionId)
          }

          await Transaction.create(transactionData)
          results.transactions.success++
        } catch (error) {
          console.error('迁移交易记录错误:', error)
          results.transactions.failed++
        }
      })
      await Promise.all(transactionPromises)
    }

    // 迁移资产数据
    if (Array.isArray(assets) && assets.length > 0) {
      const assetPromises = assets.map(async (asset) => {
        try {
          await Asset.create({
            user: userId,
            name: asset.name,
            type: asset.type,
            value: asset.value,
            quantity: asset.quantity,
            description: asset.description
          })
          results.assets.success++
        } catch (error) {
          console.error('迁移资产错误:', error)
          results.assets.failed++
        }
      })
      await Promise.all(assetPromises)
    }

    res.json({
      success: true,
      message: '数据迁移完成',
      results,
      summary: {
        totalMigrated: 
          results.sessions.success + 
          results.transactions.success + 
          results.assets.success,
        totalFailed: 
          results.sessions.failed + 
          results.transactions.failed + 
          results.assets.failed
      }
    })
  } catch (error) {
    console.error('数据迁移错误:', error)
    res.status(500).json({
      success: false,
      message: '数据迁移失败'
    })
  }
})

// 数据导出接口
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id

    const [sessions, transactions, assets] = await Promise.all([
      Session.find({ user: userId }).lean(),
      Transaction.find({ user: userId }).populate('session').lean(),
      Asset.find({ user: userId }).lean()
    ])

    const exportData = {
      exportTime: new Date().toISOString(),
      user: req.user.email,
      data: {
        sessions: sessions.map(session => ({
          ...session,
          id: session._id
        })),
        transactions: transactions.map(transaction => ({
          ...transaction,
          id: transaction._id,
          sessionId: transaction.session?._id
        })),
        assets: assets.map(asset => ({
          ...asset,
          id: asset._id
        }))
      }
    }

    // 设置响应头，提示下载
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="dream-asset-data-export.json"')
    
    res.json(exportData)
  } catch (error) {
    console.error('数据导出错误:', error)
    res.status(500).json({
      success: false,
      message: '数据导出失败'
    })
  }
})

// 数据统计接口
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id

    const [
      totalSessions,
      totalTransactions,
      totalAssets,
      recentSessions
    ] = await Promise.all([
      Session.countDocuments({ user: userId }),
      Transaction.countDocuments({ user: userId }),
      Asset.countDocuments({ user: userId }),
      Session.find({ user: userId })
        .sort({ startTime: -1 })
        .limit(5)
        .lean()
    ])

    // 计算最近7天的活跃度
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await Session.countDocuments({
      user: userId,
      startTime: { $gte: sevenDaysAgo }
    })

    res.json({
      summary: {
        totalSessions,
        totalTransactions,
        totalAssets,
        recentActivity
      },
      recentSessions: recentSessions.map(session => ({
        id: session._id,
        startTime: session.startTime,
        durationHours: session.durationHours,
        multiAccount: session.multiAccount,
        status: session.status
      }))
    })
  } catch (error) {
    console.error('获取数据统计错误:', error)
    res.status(500).json({
      success: false,
      message: '获取数据统计失败'
    })
  }
})

export default router