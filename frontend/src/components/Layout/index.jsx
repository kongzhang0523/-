import React, { useState } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd'
import {
  DashboardOutlined,
  PlayCircleOutlined,
  TransactionOutlined,
  GoldOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import SessionModal from '../SessionModal'
import AuthModal from '../AuthModal'
import GuideModal from '../GuideModal'
import './Layout.css'

const { Header, Sider, Content } = Layout

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [sessionModalVisible, setSessionModalVisible] = useState(false)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const { user, logout, isLoggedIn } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/sessions',
      icon: <PlayCircleOutlined />,
      label: '游戏会话',
    },
    {
      key: '/transactions',
      icon: <TransactionOutlined />,
      label: '流水记录',
    },
    {
      key: '/assets',
      icon: <GoldOutlined />,
      label: '资产清单',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      danger: true,
    },
  ]

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
    }
  }

  return (
    <Layout className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="layout-sider"
      >
        <div className="logo">
          <GoldOutlined />
          {!collapsed && <span>梦幻资产管家</span>}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout className="layout-content">
        <Header className="layout-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
          </div>

          <div className="header-right">
            <Space>
              <Button 
                type="primary" 
                onClick={() => setSessionModalVisible(true)}
                className="start-session-btn"
              >
                <PlayCircleOutlined />
                开始游戏
              </Button>

              {isLoggedIn ? (
                <Dropdown
                  menu={{
                    items: userMenuItems,
                    onClick: handleUserMenuClick,
                  }}
                  placement="bottomRight"
                >
                  <Avatar 
                    icon={<UserOutlined />} 
                    className="user-avatar"
                  />
                </Dropdown>
              ) : (
                <Button onClick={() => setAuthModalVisible(true)}>
                  登录/注册
                </Button>
              )}
            </Space>
          </div>
        </Header>

        <Content className="layout-main">
          {children}
        </Content>
      </Layout>

      {/* 模态框 */}
      <SessionModal
        visible={sessionModalVisible}
        onClose={() => setSessionModalVisible(false)}
      />

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      <GuideModal />
    </Layout>
  )
}

export default AppLayout