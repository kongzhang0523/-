import express from 'express'
import Asset from '../models/Asset.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(protect)

// 获取资产列表
router.get('/', async (req, res) => {
  try {
    const { type } = req.query
    const filter = { user: req.user._id }
    
    if (type) {
      filter.type = type
    }

    const assets = await Asset.find(filter)
      .sort({ createdAt: -1 })
      .lean()

    res.json(assets)
  } catch (error) {
    console.error('获取资产列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取资产列表失败'
    })
  }
})

// 创建资产
router.post('/', async (req, res) => {
  try {
    const { name, type, value, quantity, description } = req.body

    // 验证必填字段
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: '名称和类型是必需的'
      })
    }

    const asset = await Asset.create({
      user: req.user._id,
      name,
      type,
      value: value ? parseFloat(value) : 0,
      quantity: quantity ? parseInt(quantity) : 1,
      description
    })

    res.status(201).json(asset)
  } catch (error) {
    console.error('创建资产错误:', error)
    res.status(500).json({
      success: false,
      message: '创建资产失败'
    })
  }
})

// 更新资产
router.patch('/:id', async (req, res) => {
  try {
    const assetId = req.params.id
    const updates = req.body

    // 检查资产是否存在且属于当前用户
    const asset = await Asset.findOne({ 
      _id: assetId, 
      user: req.user._id 
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      })
    }

    // 转换数值类型
    if (updates.value !== undefined) {
      updates.value = parseFloat(updates.value)
    }
    if (updates.quantity !== undefined) {
      updates.quantity = parseInt(updates.quantity)
    }

    const updatedAsset = await Asset.findByIdAndUpdate(
      assetId,
      updates,
      { new: true, runValidators: true }
    ).lean()

    res.json(updatedAsset)
  } catch (error) {
    console.error('更新资产错误:', error)
    res.status(500).json({
      success: false,
      message: '更新资产失败'
    })
  }
})

// 删除资产
router.delete('/:id', async (req, res) => {
  try {
    const assetId = req.params.id

    const asset = await Asset.findOne({ 
      _id: assetId, 
      user: req.user._id 
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: '资产不存在'
      })
    }

    await Asset.findByIdAndDelete(assetId)

    res.json({
      success: true,
      message: '资产删除成功'
    })
  } catch (error) {
    console.error('删除资产错误:', error)
    res.status(500).json({
      success: false,
      message: '删除资产失败'
    })
  }
})

export default router