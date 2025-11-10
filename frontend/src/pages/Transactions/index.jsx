import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Space, 
  Select, 
  Input, 
  DatePicker,
  Modal,
  Form,
  InputNumber,
  message,
  Empty,
  Spin
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useData } from '../../contexts/DataContext'
import './Transactions.css'

const { Option } = Select
const { RangePicker } = DatePicker
const { Search } = Input

const Transactions = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filterParams, setFilterParams] = useState({})
  const [form] = Form.useForm()
  const { transactions, sessions, loading, createTransaction, updateTransaction, deleteTransaction } = useData()

  useEffect(() => {
    if (modalVisible && editingTransaction) {
      form.setFieldsValue(editingTransaction)
    } else if (modalVisible) {
      form.resetFields()
    }
  }, [modalVisible, editingTransaction, form])

  const handleAdd = () => {
    setEditingTransaction(null)
    setModalVisible(true)
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setModalVisible(true)
  }

  const handleDelete = (transaction) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除这条${transaction.type === 'income' ? '收入' : '支出'}记录吗？`,
      onOk: async () => {
        try {
          await deleteTransaction(transaction.id)
          message.success('删除成功')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async (values) => {
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, values)
        message.success('更新成功')
      } else {
        await createTransaction(values)
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(editingTransaction ? '更新失败' : '添加失败')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilterParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getSessionName = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId)
    return session ? `${new Date(session.startTime).toLocaleDateString()} ${session.multiAccount}开` : '未知会话'
  }

  const getTypeColor = (type) => {
    return type === 'income' ? 'green' : 'red'
  }

  const getTypeText = (type) => {
    return type === 'income' ? '收入' : '支出'
  }

  const getCategoryColor = (category) => {
    const colors = {
      '师门': 'blue',
      '抓鬼': 'green',
      '副本': 'purple',
      '封妖': 'orange',
      '炼妖': 'magenta',
      '活动': 'cyan',
      '其他': 'default'
    }
    return colors[category] || 'default'
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      width: 150
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {getTypeText(type)}
        </Tag>
      ),
      filters: [
        { text: '收入', value: 'income' },
        { text: '支出', value: 'expense' }
      ],
      onFilter: (value, record) => record.type === value,
      width: 80
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {category}
        </Tag>
      ),
      filters: [
        { text: '师门', value: '师门' },
        { text: '抓鬼', value: '抓鬼' },
        { text: '副本', value: '副本' },
        { text: '封妖', value: '封妖' },
        { text: '炼妖', value: '炼妖' },
        { text: '活动', value: '活动' },
        { text: '其他', value: '其他' }
      ],
      onFilter: (value, record) => record.category === value,
      width: 100
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span className={record.type === 'income' ? 'amount-income' : 'amount-expense'}>
          {record.type === 'income' ? '+' : '-'}{amount?.toLocaleString()}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
      width: 120
    },
    {
      title: '物品收获',
      dataIndex: 'item',
      key: 'item',
      render: (item) => item || '-',
      ellipsis: true
    },
    {
      title: '关联会话',
      dataIndex: 'sessionId',
      key: 'sessionId',
      render: (sessionId) => getSessionName(sessionId),
      width: 150
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            size="small"
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const filteredTransactions = transactions.filter(transaction => {
    const { type, category, sessionId, keyword } = filterParams
    
    if (type && transaction.type !== type) return false
    if (category && transaction.category !== category) return false
    if (sessionId && transaction.sessionId !== sessionId) return false
    if (keyword && !transaction.item?.includes(keyword)) return false
    
    return true
  })

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">流水记录</h1>
            <p className="page-description">
              管理您的游戏收入与支出记录
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            添加记录
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card className="filters-card">
        <Space wrap size="middle">
          <Select
            placeholder="类型筛选"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => handleFilterChange('type', value)}
          >
            <Option value="income">收入</Option>
            <Option value="expense">支出</Option>
          </Select>

          <Select
            placeholder="分类筛选"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => handleFilterChange('category', value)}
          >
            <Option value="师门">师门</Option>
            <Option value="抓鬼">抓鬼</Option>
            <Option value="副本">副本</Option>
            <Option value="封妖">封妖</Option>
            <Option value="炼妖">炼妖</Option>
            <Option value="活动">活动</Option>
            <Option value="其他">其他</Option>
          </Select>

          <Select
            placeholder="关联会话"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => handleFilterChange('sessionId', value)}
          >
            {sessions.map(session => (
              <Option key={session.id} value={session.id}>
                {getSessionName(session.id)}
              </Option>
            ))}
          </Select>

          <Search
            placeholder="搜索物品名称"
            style={{ width: 200 }}
            onSearch={(value) => handleFilterChange('keyword', value)}
            allowClear
          />
        </Space>
      </Card>

      <Card className="transactions-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载中...</div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredTransactions}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 800 }}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={transactions.length === 0 ? "暂无流水记录" : "暂无匹配的记录"}
          >
            {transactions.length === 0 && (
              <Button 
                type="primary"
                onClick={handleAdd}
              >
                添加第一条记录
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingTransaction ? '编辑记录' : '添加记录'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="transaction-form"
        >
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Option value="income">收入</Option>
              <Option value="expense">支出</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="师门">师门</Option>
              <Option value="抓鬼">抓鬼</Option>
              <Option value="副本">副本</Option>
              <Option value="封妖">封妖</Option>
              <Option value="炼妖">炼妖</Option>
              <Option value="活动">活动</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额（游戏币）"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={10000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="请输入金额"
            />
          </Form.Item>

          <Form.Item
            name="item"
            label="物品收获"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入获得的物品名称，如：金刚石、修炼果、兽决等"
            />
          </Form.Item>

          <Form.Item
            name="sessionId"
            label="关联游戏会话"
          >
            <Select placeholder="请选择关联的游戏会话（可选）">
              {sessions.map(session => (
                <Option key={session.id} value={session.id}>
                  {getSessionName(session.id)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTransaction ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Transactions