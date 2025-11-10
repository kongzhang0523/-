import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  Space, 
  Table,
  message 
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useData } from '../../contexts/DataContext'
import './SettlementModal.css'

const { Option } = Select

const SettlementModal = ({ visible, session, onClose }) => {
  const [form] = Form.useForm()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const { createTransactions, updateSession } = useData()

  useEffect(() => {
    if (visible) {
      setTransactions([])
      form.resetFields()
    }
  }, [visible, form])

  const addTransaction = () => {
    setTransactions(prev => [...prev, {
      id: Date.now(),
      type: 'income',
      category: '抓鬼',
      amount: 0,
      item: ''
    }])
  }

  const removeTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const updateTransaction = (id, field, value) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  const handleSubmit = async () => {
    if (transactions.length === 0) {
      message.warning('请至少添加一条收益记录')
      return
    }

    setLoading(true)
    try {
      // 结束会话
      await updateSession(session.id, {
        status: 'ended',
        endTime: new Date().toISOString(),
        durationHours: calculateDuration()
      })

      // 创建交易记录（强制关联当前会话）
      const transactionsData = transactions.map(t => ({
        ...t,
        sessionId: session.id
      }))

      await createTransactions(transactionsData)
      
      message.success('游戏结算完成！')
      onClose()
    } catch (error) {
      message.error('结算失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = () => {
    if (!session?.startTime) return 0
    const start = new Date(session.startTime)
    const end = new Date()
    return Number(((end - start) / (1000 * 60 * 60)).toFixed(2))
  }

  const transactionColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (_, record) => (
        <Select
          value={record.type}
          onChange={(value) => updateTransaction(record.id, 'type', value)}
          style={{ width: '100%' }}
        >
          <Option value="income">收入</Option>
          <Option value="expense">支出</Option>
        </Select>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (_, record) => (
        <Select
          value={record.category}
          onChange={(value) => updateTransaction(record.id, 'category', value)}
          style={{ width: '100%' }}
        >
          <Option value="师门">师门</Option>
          <Option value="抓鬼">抓鬼</Option>
          <Option value="副本">副本</Option>
          <Option value="封妖">封妖</Option>
          <Option value="炼妖">炼妖</Option>
          <Option value="活动">活动</Option>
          <Option value="其他">其他</Option>
        </Select>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={record.amount}
          onChange={(value) => updateTransaction(record.id, 'amount', value || 0)}
          min={0}
          step={10000}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '物品收获',
      dataIndex: 'item',
      key: 'item',
      render: (_, record) => (
        <Input
          value={record.item}
          onChange={(e) => updateTransaction(record.id, 'item', e.target.value)}
          placeholder="如：金刚石、修炼果等"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={React.createElement(DeleteOutlined)}
          onClick={() => removeTransaction(record.id)}
        />
      )
    }
  ]

  const totalAmount = transactions.reduce((sum, t) => {
    const amount = t.type === 'income' ? t.amount : -t.amount
    return sum + (Number(amount) || 0)
  }, 0)

  return (
    <Modal
      title="游戏结算"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="settlement-modal"
    >
      {session && (
        <div className="session-summary">
          <div className="summary-item">
            <label>游戏时长：</label>
            <span>{calculateDuration()} 小时</span>
          </div>
          <div className="summary-item">
            <label>多开数量：</label>
            <span>{session.multiAccount} 个角色</span>
          </div>
          <div className="summary-item">
            <label>点卡成本：</label>
            <span>¥{(calculateDuration() * session.multiAccount * 0.6).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="transactions-section">
        <div className="section-header">
          <h4>收益记录</h4>
          <Button
            type="dashed"
            icon={React.createElement(PlusOutlined)}
            onClick={addTransaction}
          >
            添加记录
          </Button>
        </div>

        <Table
          columns={transactionColumns}
          dataSource={transactions}
          rowKey="id"
          pagination={false}
          size="small"
          className="transactions-table"
        />

        {transactions.length > 0 && (
          <div className="transaction-total">
            总计收益: <span>{totalAmount.toLocaleString()}</span> 游戏币
          </div>
        )}
      </div>

      <div className="modal-actions">
        <Space>
          <Button onClick={onClose}>
            取消
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            disabled={transactions.length === 0}
          >
            完成结算
          </Button>
        </Space>
      </div>
    </Modal>
  )
}

export default SettlementModal