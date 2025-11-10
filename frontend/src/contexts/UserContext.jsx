import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查本地是否有登录信息
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    
    if (token && userInfo) {
      try {
        setUser(JSON.parse(userInfo))
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.user))
        setUser(data.user)
        message.success('登录成功')
        return true
      } else {
        message.error(data.message || '登录失败')
        return false
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
      return false
    }
  }

  const register = async (email, password, username) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.user))
        setUser(data.user)
        message.success('注册成功')
        return true
      } else {
        message.error(data.message || '注册失败')
        return false
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    setUser(null)
    message.success('已退出登录')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isLoggedIn: !!user
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}