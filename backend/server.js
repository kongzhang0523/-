import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import sessionRoutes from './routes/sessions.js'
import transactionRoutes from './routes/transactions.js'
import assetRoutes from './routes/assets.js'
import overviewRoutes from './routes/overview.js'
import dataRoutes from './routes/data.js'

dotenv.config()

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/overview', overviewRoutes)
app.use('/api/data', dataRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: '梦幻资产管家后端服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dream-asset-manager'
const PORT = process.env.PORT || 5000

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('成功连接到 MongoDB')
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`)
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB 连接失败:', error)
    process.exit(1)
  })

export default app