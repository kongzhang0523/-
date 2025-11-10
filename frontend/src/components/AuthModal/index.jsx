import React, { useState } from 'react'
import { Modal, Form, Input, Button, Tabs, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useUser } from '../../contexts/UserContext'

const AuthModal = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const { login, register } = useUser()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const success = await login(values.email, values.password)
      if (success) {
        onClose()
        loginForm.resetFields()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    try {
      const success = await register(values.email, values.password, values.username)
      if (success) {
        onClose()
        registerForm.resetFields()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  const handleClose = () => {
    loginForm.resetFields()
    registerForm.resetFields()
    onClose()
  }

  return (
    <Modal
      title="用户认证"
      open={visible}
      onCancel={handleClose}
      footer={null}
      className="auth-modal"
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'login',
            label: '登录',
            children: (
              <Form
                form={loginForm}
                layout="vertical"
                onFinish={handleLogin}
                className="auth-form"
              >
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={React.createElement(MailOutlined)}
                    placeholder="请输入邮箱"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={React.createElement(LockOutlined)}
                    placeholder="请输入密码"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                  >
                    登录
                  </Button>
                </Form.Item>
              </Form>
            )
          },
          {
            key: 'register',
            label: '注册',
            children: (
              <Form
                form={registerForm}
                layout="vertical"
                onFinish={handleRegister}
                className="auth-form"
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input
                    prefix={React.createElement(UserOutlined)}
                    placeholder="请输入用户名"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input
                    prefix={React.createElement(MailOutlined)}
                    placeholder="请输入邮箱"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密码"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少6位' }
                  ]}
                >
                  <Input.Password
                    prefix={React.createElement(LockOutlined)}
                    placeholder="请输入密码（至少6位）"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={React.createElement(LockOutlined)}
                    placeholder="请再次输入密码"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                  >
                    注册
                  </Button>
                </Form.Item>
              </Form>
            )
          }
        ]}
      />
    </Modal>
  )
}

export default AuthModal