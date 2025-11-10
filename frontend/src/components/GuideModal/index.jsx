import React, { useState, useEffect } from 'react'
import { Modal, Button, Space, Typography, Steps, message } from 'antd'
import { CloudUploadOutlined, SafetyCertificateOutlined, SyncOutlined } from '@antd/icons'
import { useUser } from '../../contexts/UserContext'
import { useData } from '../../contexts/DataContext'
import './GuideModal.css'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

const GuideModal = () => {
  const [visible, setVisible] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const { isLoggedIn, user, register } = useUser()
  const { sessions, migrateData, getLocalData } = useData()

  useEffect(() => {
    // 检查是否需要显示引导弹窗：未登录且有3个或以上会话记录
    if (!isLoggedIn && sessions.length >= 3) {
      const hasShown = localStorage.getItem('guideModalShown')
      if (!hasShown) {
        setVisible(true)
        localStorage.setItem('guideModalShown', 'true')
      }
    }
  }, [sessions.length, isLoggedIn])

  const handleMigrate = async (values) => {
    setMigrating(true)
    try {
      // 快速注册一个账号
      const email = `user_${Date.now()}@dreamasset.com`
      const password = Math.random().toString(36).slice(-8)
      const username = `玩家_${Date.now().toString(36).slice(-4)}`

      const success = await register(email, password, username)
      if (success) {
        // 迁移数据
        const localData = getLocalData()
        await migrateData(localData)
        setVisible(false)
        message.success('数据迁移成功！您的账号已自动创建')
      }
    } catch (error) {
      message.error('数据迁移失败，请重试')
    } finally {
      setMigrating(false)
    }
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleManualRegister = () => {
    setVisible(false)
    // 这里可以触发显示注册模态框
    message.info('请点击右上角登录/注册按钮手动注册')
  }

  if (isLoggedIn) {
    return null
  }

  return (
    <Modal
      title="数据无价，值得珍藏！"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      className="guide-modal"
      closable={true}
    >
      <div className="guide-content">
        <div className="guide-header">
          <Title level={4} className="guide-title">
            <CloudUploadOutlined /> 立即升级到云端存储
          </Title>
          <Text type="secondary">
            您已积累了 <strong>{sessions.length}</strong> 次游戏记录，立即注册即可享受：
          </Text>
        </div>

        <Steps
          direction="vertical"
          current={-1}
          className="guide-steps"
          items={[
            {
              title: '数据永久保存',
              description: '不再担心浏览器缓存清理导致数据丢失',
              icon: <SafetyCertificateOutlined />,
            },
            {
              title: '多设备同步',
              description: '在家和公司不同电脑上无缝继续记录',
              icon: <SyncOutlined />,
            },
            {
              title: '高级分析功能',
              description: '解锁更多数据分析和个性化洞察',
              icon: <CloudUploadOutlined />,
            },
          ]}
        />

        <div className="migration-info">
          <Paragraph type="secondary" className="migration-tip">
            <SafetyCertificateOutlined /> 
            我们将自动把您当前的{sessions.length}条游戏记录迁移到云端
          </Paragraph>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            type="primary"
            size="large"
            loading={migrating}
            onClick={handleMigrate}
            block
            className="migrate-button"
          >
            {migrating ? '正在迁移数据...' : '一键注册并迁移数据'}
          </Button>
          
          <Button
            size="large"
            onClick={handleManualRegister}
            block
          >
            手动注册账号
          </Button>
          
          <Button
            type="text"
            size="small"
            onClick={handleCancel}
            block
          >
            稍后再说
          </Button>
        </Space>

        <div className="security-notice">
          <Text type="secondary" className="notice-text">
            我们采用银行级加密技术保护您的数据安全
          </Text>
        </div>
      </div>
    </Modal>
  )
}

export default GuideModal