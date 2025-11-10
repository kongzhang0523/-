import React, { useState } from 'react'
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  message,
  Empty,
  Spin
} from 'antd'
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useData } from '../../contexts/DataContext'
import SessionModal from '../../components/SessionModal'
import SettlementModal from '../../components/SettlementModal'
import './Sessions.css'

const Sessions = () => {
  const [sessionModalVisible, setSessionModalVisible] = useState(false)
  const [settlementModalVisible, setSettlementModalVisible] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const { sessions, loading, updateSession } = useData()

  const handleEndSession = (session) => {
    setSelectedSession(session)
    setSettlementModalVisible(true)
  }

  const handleArchiveSession = async (session) => {
    try {
      await updateSession(session.id, { status: 'archived' })
      message.success('会话已存档')
    } catch (error) {
      message.error('存档失败')
    }
  }

  const handleViewDetails = (session) => {
    Modal.info({
      title: '会话详情',
      width: 600,
      content: (
        <div className="session-detail">
          <div className="detail-item">
            <label>开始时间：</label>
            <span>{new Date(session.startTime).toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <label>结束时间：</label>
            <span>{session.endTime ? new Date(session.endTime).toLocaleString() : '进行中'}</span>
          </div>
          <div className="detail-item">
            <label>游戏时长：</label>
            <span>{session.durationHours} 小时</span>
          </div>
          <div className="detail-item">
            <label>多开数量：</label>
            <span>{session.multiAccount} 个角色</span>
          </div>
          <div className="detail-item">
            <label>点卡成本：</label>
            <span>¥{session.pointCardCost?.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <label>状态：</label>
            <Tag color={getStatusColor(session.status)}>
              {getStatusText(session.status)}
            </Tag>
          </div>
          {session.notes && (
            <div className="detail-item">
              <label>备注：</label>
              <span>{session.notes}</span>
            </div>
          )}
        </div>
      )
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      archived: 'blue',
      ended: 'purple'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      active: '进行中',
      archived: '已存档',
      ended: '已结束'
    }
    return texts[status] || '未知'
  }

  const columns = [
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => new Date(time).toLocaleString(),
      sorter: (a, b) => new Date(a.startTime) - new Date(b.startTime)
    },
    {
      title: '游戏时长',
      dataIndex: 'durationHours',
      key: 'durationHours',
      render: (hours) => `${hours} 小时`,
      sorter: (a, b) => a.durationHours - b.durationHours
    },
    {
      title: '多开数量',
      dataIndex: 'multiAccount',
      key: 'multiAccount',
      render: (count) => `${count} 开`,
      sorter: (a, b) => a.multiAccount - b.multiAccount
    },
    {
      title: '点卡成本',
      dataIndex: 'pointCardCost',
      key: 'pointCardCost',
      render: (cost) => cost ? `¥${cost.toFixed(2)}` : '-',
      sorter: (a, b) => (a.pointCardCost || 0) - (b.pointCardCost || 0)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: '进行中', value: 'active' },
        { text: '已存档', value: 'archived' },
        { text: '已结束', value: 'ended' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          
          {record.status === 'active' && (
            <>
              <Button 
                type="link" 
                icon={<PauseCircleOutlined />}
                onClick={() => handleEndSession(record)}
              >
                结束
              </Button>
              <Button 
                type="link" 
                onClick={() => handleArchiveSession(record)}
              >
                存档
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="sessions-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">游戏会话</h1>
            <p className="page-description">
              管理您的游戏时间记录和点卡成本
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => setSessionModalVisible(true)}
            size="large"
          >
            开始游戏
          </Button>
        </div>
      </div>

      <Card className="sessions-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载中...</div>
          </div>
        ) : sessions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={sessions}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无游戏会话记录"
          >
            <Button 
              type="primary"
              onClick={() => setSessionModalVisible(true)}
            >
              开始第一个游戏会话
            </Button>
          </Empty>
        )}
      </Card>

      <SessionModal
        visible={sessionModalVisible}
        onClose={() => setSessionModalVisible(false)}
      />

      <SettlementModal
        visible={settlementModalVisible}
        session={selectedSession}
        onClose={() => {
          setSettlementModalVisible(false)
          setSelectedSession(null)
        }}
      />
    </div>
  )
}

export default Sessions