import React, { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Button, Space, message } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { useData } from '../../contexts/DataContext'
import './SessionModal.css'

const SessionModal = ({ visible, onClose }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { createSession, sessions, archiveSession } = useData()
  
  // 查找当前活跃的会话
  const activeSession = sessions.find(session => session.status === 'active')

  useEffect(() => {
    if (visible) {
      // 设置默认多开数量为上一个会话的值，或者1
      const lastSession = sessions[0]
      form.setFieldsValue({
        multiAccount: lastSession?.multiAccount || 1
      })
    }
  }, [visible, sessions, form])

  const handleStartSession = async (values) => {
    setLoading(true)
    try {
      await createSession({
        ...values,
        status: 'active',
        startTime: new Date().toISOString()
      })
      message.success('游戏会话已开始！')
      onClose()
    } catch (error) {
      message.error('开始会话失败')
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveSession = async () => {
    setLoading(true)
    try {
      await archiveSession(activeSession.id)
      message.success('会话已存档，可以开始新的游戏会话')
      onClose()
    } catch (error) {
      message.error('存档失败')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueSession = () => {
    message.info('请先结束当前游戏会话')
    onClose()
  }

  // 如果有活跃会话，显示存档并继续选项
  if (activeSession && visible) {
    return (
      <Modal
        title="发现活跃会话"
        open={visible}
        onCancel={onClose}
        footer={null}
        className="session-modal"
      >
        <div className="active-session-alert">
          <p>您有一个进行中的游戏会话：</p>
          <div className="session-info">
            <div>开始时间：{new Date(activeSession.startTime).toLocaleString()}</div>
            <div>多开数量：{activeSession.multiAccount}个角色</div>
          </div>
          
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Button
              type="primary"
              icon={React.createElement(PauseCircleOutlined)}
              onClick={handleArchiveSession}
              loading={loading}
              block
              size="large"
            >
              存档并开始新会话
            </Button>
            
            <Button
              onClick={handleContinueSession}
              block
              size="large"
            >
              返回当前会话
            </Button>
          </Space>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="开始游戏会话"
      open={visible}
      onCancel={onClose}
      footer={null}
      className="session-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleStartSession}
        initialValues={{ multiAccount: 1 }}
      >
        <Form.Item
          name="multiAccount"
          label="同时在线角色数量"
          rules={[
            { required: true, message: '请输入角色数量' },
            { type: 'number', min: 1, max: 8, message: '角色数量应在1-8之间' }
          ]}
        >
          <InputNumber
            min={1}
            max={8}
            placeholder="请输入1-8之间的数字"
            style={{ width: '100%' }}
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={React.createElement(PlayCircleOutlined)}
            loading={loading}
            block
            size="large"
            className="start-button"
          >
            开始游戏
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default SessionModal