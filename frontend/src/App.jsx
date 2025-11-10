import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Transactions from './pages/Transactions'
import Assets from './pages/Assets'

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/assets" element={<Assets />} />
          </Routes>
        </Layout>
      </ConfigProvider>
    </BrowserRouter>
  )
}

export default App