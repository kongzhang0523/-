import { message } from 'antd'

class DataManager {
  constructor() {
    this.baseURL = '/api'
    this.isOnline = false
  }

  // 检查网络状态和认证状态
  checkAuth() {
    const token = localStorage.getItem('token')
    this.isOnline = !!token
    return this.isOnline
  }

  // 统一请求方法
  async request(endpoint, options = {}) {
    this.checkAuth()

    if (this.isOnline) {
      // 在线模式：调用API
      return this.apiRequest(endpoint, options)
    } else {
      // 离线模式：使用localStorage
      return this.localRequest(endpoint, options)
    }
  }

  // API请求
  async apiRequest(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  // 本地存储请求
  async localRequest(endpoint, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 100)) // 模拟网络延迟

    try {
      switch (options.method) {
        case 'GET':
          return this.localGet(endpoint)
        case 'POST':
          return this.localPost(endpoint, options.body)
        case 'PATCH':
          return this.localPatch(endpoint, options.body)
        case 'DELETE':
          return this.localDelete(endpoint)
        default:
          return this.localGet(endpoint)
      }
    } catch (error) {
      console.error('本地存储操作失败:', error)
      throw error
    }
  }

  // 本地存储的CRUD操作
  localGet(endpoint) {
    const key = this.getLocalStorageKey(endpoint)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  localPost(endpoint, body) {
    const key = this.getLocalStorageKey(endpoint)
    const existingData = this.localGet(endpoint)
    const newItem = {
      id: this.generateId(),
      ...JSON.parse(body),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const newData = [newItem, ...existingData]
    localStorage.setItem(key, JSON.stringify(newData))
    return newItem
  }

  localPatch(endpoint, body) {
    const key = this.getLocalStorageKey(endpoint)
    const existingData = this.localGet(endpoint)
    const updates = JSON.parse(body)
    const updatedData = existingData.map(item => 
      item.id === updates.id 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    )
    
    localStorage.setItem(key, JSON.stringify(updatedData))
    return updatedData.find(item => item.id === updates.id)
  }

  localDelete(endpoint) {
    const key = this.getLocalStorageKey(endpoint)
    const id = endpoint.split('/').pop()
    const existingData = this.localGet(endpoint)
    const filteredData = existingData.filter(item => item.id !== id)
    localStorage.setItem(key, JSON.stringify(filteredData))
    return { success: true }
  }

  // 工具方法
  getLocalStorageKey(endpoint) {
    const route = endpoint.split('/')[2] // 提取 sessions, transactions, assets
    return `dream_asset_${route}`
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 数据迁移
  async migrateData(localData) {
    if (!this.checkAuth()) {
      throw new Error('需要登录才能迁移数据')
    }

    try {
      const response = await this.apiRequest('/data/migrate', {
        method: 'POST',
        body: JSON.stringify(localData)
      })

      // 迁移成功后清除本地数据
      this.clearLocalData()
      message.success('数据迁移成功！')
      
      return response
    } catch (error) {
      message.error('数据迁移失败')
      throw error
    }
  }

  clearLocalData() {
    const keys = ['sessions', 'transactions', 'assets'].map(
      key => `dream_asset_${key}`
    )
    keys.forEach(key => localStorage.removeItem(key))
  }

  // 获取本地数据（用于迁移）
  getLocalSessions() {
    return this.localGet('/sessions') || []
  }

  getLocalTransactions() {
    return this.localGet('/transactions') || []
  }

  getLocalAssets() {
    return this.localGet('/assets') || []
  }

  // 具体的业务方法
  async getSessions() {
    return this.request('/sessions')
  }

  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    })
  }

  async updateSession(id, updates) {
    return this.request(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/transactions?${queryString}`)
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    })
  }

  async createTransactions(transactionsData) {
    if (this.isOnline) {
      return this.request('/transactions/batch', {
        method: 'POST',
        body: JSON.stringify(transactionsData)
      })
    } else {
      // 离线模式下逐个创建
      const results = []
      for (const data of transactionsData) {
        results.push(await this.createTransaction(data))
      }
      return results
    }
  }

  async updateTransaction(id, updates) {
    return this.request(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE'
    })
  }

  async getAssets() {
    return this.request('/assets')
  }

  async createAsset(assetData) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    })
  }

  async updateAsset(id, updates) {
    return this.request(`/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async deleteAsset(id) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE'
    })
  }

  async getOverview(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/overview/dashboard?${queryString}`)
  }
}

export const dataManager = new DataManager()