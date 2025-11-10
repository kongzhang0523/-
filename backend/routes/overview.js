import express from 'express'
import Session from '../models/Session.js'
import Transaction from '../models/Transaction.js'
import Asset from '../models/Asset.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(protect)

// 获取数据看板概览
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // 构建日期过滤条件
    const dateFilter = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) dateFilter.$lte = new Date(endDate)

    const userFilter = { user: req.user._id }
    const sessionFilter = { ...userFilter }
    const transactionFilter = { ...userFilter }
    
    if (startDate || endDate) {
      sessionFilter.startTime = dateFilter
      transactionFilter.createdAt = dateFilter
    }

    // 并行获取所有数据
    const [
      sessions,
      transactions,
      assets,
      incomeTransactions
    ] = await Promise.all([
      // 获取会话数据
      Session.find(sessionFilter).lean(),
      
      // 获取所有交易记录
      Transaction.find(transactionFilter).lean(),
      
      // 获取资产数据
      Asset.find(userFilter).lean(),
      
      // 获取收入交易用于分类统计
      Transaction.find({
        ...transactionFilter,
        type: 'income'
      }).lean()
    ])

    // 计算总投入（点卡成本）
    const totalInvestment = sessions.reduce((sum, session) => {
      return sum + (session.pointCardCost || 0)
    }, 0)

    // 计算总收入（游戏币转换为人民币）
    const EXCHANGE_RATE = 10000 // 1元人民币 = 10000游戏币
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount / EXCHANGE_RATE), 0)

    // 计算净收益
    const netProfit = totalRevenue - totalInvestment

    // 计算总游戏时长（考虑多开）
    const totalGameHours = sessions.reduce((sum, session) => {
      return sum + (session.durationHours * session.multiAccount)
    }, 0)

    // 计算单机小时收益
    const hourlyEfficiency = totalGameHours > 0 ? netProfit / totalGameHours : 0

    // 收入来源分类统计
    const incomeSources = incomeTransactions.reduce((acc, transaction) => {
      const category = transaction.category
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += transaction.amount / EXCHANGE_RATE
      return acc
    }, {})

    // 转换为图表需要的数据格式
    const incomeSourcesData = Object.entries(incomeSources).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }))

    // 生成收益趋势数据（最近30天）
    const profitTrend = generateProfitTrend(transactions, sessions)

    res.json({
      // 核心指标
      totalInvestment: Number(totalInvestment.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      hourlyEfficiency: Number(hourlyEfficiency.toFixed(2)),
      totalSessions: sessions.length,
      
      // 图表数据
      incomeSources: {
        categories: incomeSourcesData.map(item => item.name),
        data: incomeSourcesData
      },
      
      profitTrend: {
        dates: profitTrend.dates,
        profits: profitTrend.profits
      },
      
      // 资产统计
      totalAssetsValue: assets.reduce((sum, asset) => {
        return sum + (asset.value * (asset.quantity || 1))
      }, 0),
      assetsCount: assets.length
    })
  } catch (error) {
    console.error('获取数据看板错误:', error)
    res.status(500).json({
      success: false,
      message: '获取数据看板失败'
    })
  }
})

// 生成收益趋势数据
function generateProfitTrend(transactions, sessions) {
  const EXCHANGE_RATE = 10000
  const days = 30
  const dates = []
  const profits = []
  
  // 生成最近30天的日期
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString())
  }
  
  // 计算每日净收益
  dates.forEach(dateStr => {
    const date = new Date(dateStr)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    // 计算当日收入
    const dailyIncome = transactions
      .filter(t => {
        const transDate = new Date(t.createdAt)
        return transDate >= date && 
               transDate < nextDate && 
               t.type === 'income'
      })
      .reduce((sum, t) => sum + (t.amount / EXCHANGE_RATE), 0)
    
    // 计算当日点卡成本
    const dailyCost = sessions
      .filter(s => {
        const sessionDate = new Date(s.startTime)
        return sessionDate >= date && sessionDate < nextDate
      })
      .reduce((sum, s) => sum + (s.pointCardCost || 0), 0)
    
    const dailyProfit = dailyIncome - dailyCost
    profits.push(Number(dailyProfit.toFixed(2)))
  })
  
  return { dates, profits }
}

export default router