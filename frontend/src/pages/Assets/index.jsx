import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Select,
  message,
  Empty,
  Spin
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons'
import { useData } from '../../contexts/DataContext'
import './Assets.css'

const { Option } = Select

const Assets = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [form] = Form.useForm()
  const { assets, loading, createAsset, updateAsset, deleteAsset } = useData()

  useEffect(() => {
    if (modalVisible && editingAsset) {
      form.setFieldsValue(editingAsset)
    } else if (modalVisible) {
      form.resetFields()
    }
  }, [modalVisible, editingAsset, form])

  const handleAdd = () => {
    setEditingAsset(null)
    setModalVisible(true)
  }

  const handleEdit = (asset) => {
    setEditingAsset(asset)
    setModalVisible(true)
  }

  const handleDelete = (asset) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除资产"${asset.name}"吗？`,
      onOk: async () => {
        try {
          await deleteAsset(asset.id)
          message.success('删除成功')
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async (values) => {
    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, values)
        message.success('更新成功')
      } else {
        await createAsset(values)
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(editingAsset ? '更新失败' : '添加失败')
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      '角色': 'blue',
      '装备': 'green',
      '召唤兽': 'purple',
      '游戏币': 'gold',
      '其他': 'default'
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div className="asset-name">{name}</div>
          {record.description && (
            <div className="asset-description">{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {type}
        </Tag>
      ),
      filters: [
        { text: '角色', value: '角色' },
        { text: '装备', value: '装备' },
        { text: '召唤兽', value: '召唤兽' },
        { text: '游戏币', value: '游戏币' },
        { text: '其他', value: '其他' }
      ],
      onFilter: (value, record) => record.type === value,
      width: 100
    },
    {
      title: '估值（元）',
      dataIndex: 'value',
      key: 'value',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-',
      sorter: (a, b) => (a.value || 0) - (b.value || 0),
      width: 120
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity) => quantity || 1,
      width: 80
    },
    {
      title: '总价值',
      key: 'totalValue',
      render: (_, record) => {
        const total = (record.value || 0) * (record.quantity || 1)
        return total ? `¥${total.toLocaleString()}` : '-'
      },
      sorter: (a, b) => {
        const totalA = (a.value || 0) * (a.quantity || 1)
        const totalB = (b.value || 0) * (b.quantity || 1)
        return totalA - totalB
      },
      width: 120
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

  const totalAssetsValue = assets.reduce((sum, asset) => {
    return sum + ((asset.value || 0) * (asset.quantity || 1))
  }, 0)

  return (
    <div className="assets-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">资产清单</h1>
            <p className="page-description">
              管理您的游戏资产总览
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
          >
            添加资产
          </Button>
        </div>
      </div>

      {/* 资产统计 */}
      <div className="assets-summary">
        <Card className="summary-card">
          <div className="summary-content">
            <div className="summary-item">
              <div className="summary-label">总资产数量</div>
              <div className="summary-value">{assets.length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">总估值</div>
              <div className="summary-value">¥{totalAssetsValue.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="assets-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载中...</div>
          </div>
        ) : assets.length > 0 ? (
          <Table
            columns={columns}
            dataSource={assets}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 项资产`
            }}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无资产记录"
          >
            <Button 
              type="primary"
              onClick={handleAdd}
            >
              添加第一项资产
            </Button>
          </Empty>
        )}
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingAsset ? '编辑资产' : '添加资产'}
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
          className="asset-form"
        >
          <Form.Item
            name="name"
            label="资产名称"
            rules={[{ required: true, message: '请输入资产名称' }]}
          >
            <Input placeholder="例如：大唐官府角色、无级别武器、8红攻宠等" />
          </Form.Item>

          <Form.Item
            name="type"
            label="资产类型"
            rules={[{ required: true, message: '请选择资产类型' }]}
          >
            <Select placeholder="请选择资产类型">
              <Option value="角色">角色</Option>
              <Option value="装备">装备</Option>
              <Option value="召唤兽">召唤兽</Option>
              <Option value="游戏币">游戏币</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label="估值（人民币）"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/¥\s?|(,*)/g, '')}
              placeholder="请输入估值金额"
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="数量"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="请输入数量"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入资产的详细描述，如：装备属性、召唤兽技能、角色修炼等"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAsset ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Assets