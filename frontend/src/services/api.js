// API服务常量配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  TIMEOUT: 10000,
}

// API端点常量
export const ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  
  // 数据相关
  DATA: {
    MIGRATE: '/data/migrate',
    OVERVIEW: '/overview/dashboard',
  },
  
  // 业务相关
  SESSIONS: '/sessions',
  TRANSACTIONS: '/transactions',
  ASSETS: '/assets',
}

// 错误处理
export class APIError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.status = status
  }
}

// 统一响应处理
export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new APIError(
      errorData.message || '请求失败',
      errorData.code || 'UNKNOWN_ERROR',
      response.status
    )
  }
  
  return response.json()
}