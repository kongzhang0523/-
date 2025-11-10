import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from './UserContext'
import { dataManager } from '../services/dataManager'

const DataContext = createContext()

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

export const DataProvider = ({ children }) => {
  const { user, isLoggedIn } = useUser()
  const [sessions, setSessions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [assets, setAssets] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(false)

  // 当用户登录状态变化时，重新加载数据
  useEffect(() => {
    loadAllData()
  }, [isLoggedIn])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [sessionsData, transactionsData, assetsData, overviewData] = await Promise.all([
        dataManager.getSessions(),
        dataManager.getTransactions(),
        dataManager.getAssets(),
        dataManager.getOverview()
      ])
      
      setSessions(sessionsData)
      setTransactions(transactionsData)
      setAssets(assetsData)
      setOverview(overviewData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 游戏会话管理
  const createSession = async (sessionData) => {
    const newSession = await dataManager.createSession(sessionData)
    setSessions(prev => [newSession, ...prev])
    return newSession
  }

  const updateSession = async (id, updates) => {
    const updatedSession = await dataManager.updateSession(id, updates)
    setSessions(prev => prev.map(session => 
      session.id === id ? updatedSession : session
    ))
    return updatedSession
  }

  const archiveSession = async (id) => {
    return await updateSession(id, { status: 'archived' })
  }

  // 流水记录管理
  const createTransaction = async (transactionData) => {
    const newTransaction = await dataManager.createTransaction(transactionData)
    setTransactions(prev => [newTransaction, ...prev])
    await loadAllData() // 重新加载概览数据
    return newTransaction
  }

  const createTransactions = async (transactionsData) => {
    const newTransactions = await dataManager.createTransactions(transactionsData)
    setTransactions(prev => [...newTransactions, ...prev])
    await loadAllData()
    return newTransactions
  }

  const updateTransaction = async (id, updates) => {
    const updatedTransaction = await dataManager.updateTransaction(id, updates)
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? updatedTransaction : transaction
    ))
    await loadAllData()
    return updatedTransaction
  }

  const deleteTransaction = async (id) => {
    await dataManager.deleteTransaction(id)
    setTransactions(prev => prev.filter(transaction => transaction.id !== id))
    await loadAllData()
  }

  // 资产管理
  const createAsset = async (assetData) => {
    const newAsset = await dataManager.createAsset(assetData)
    setAssets(prev => [newAsset, ...prev])
    return newAsset
  }

  const updateAsset = async (id, updates) => {
    const updatedAsset = await dataManager.updateAsset(id, updates)
    setAssets(prev => prev.map(asset => 
      asset.id === id ? updatedAsset : asset
    ))
    return updatedAsset
  }

  const deleteAsset = async (id) => {
    await dataManager.deleteAsset(id)
    setAssets(prev => prev.filter(asset => asset.id !== id))
  }

  // 数据迁移
  const migrateData = async (localData) => {
    if (!isLoggedIn) throw new Error('用户未登录')
    
    const result = await dataManager.migrateData(localData)
    await loadAllData() // 迁移后重新加载所有数据
    return result
  }

  const value = {
    // 状态
    sessions,
    transactions,
    assets,
    overview,
    loading,
    
    // 方法
    loadAllData,
    createSession,
    updateSession,
    archiveSession,
    createTransaction,
    createTransactions,
    updateTransaction,
    deleteTransaction,
    createAsset,
    updateAsset,
    deleteAsset,
    migrateData,
    
    // 工具
    getLocalData: () => ({
      sessions: dataManager.getLocalSessions(),
      transactions: dataManager.getLocalTransactions(),
      assets: dataManager.getLocalAssets()
    })
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}