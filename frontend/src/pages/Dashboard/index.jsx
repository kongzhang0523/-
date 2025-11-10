import React, { useState, useEffect } from 'react'
import { Row, Col, Card, DatePicker, Select, Space, Spin, Empty } from 'antd'
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  PlayCircleOutlined,
  DollarOutlined 
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useData } from '../../contexts/DataContext'
import { useUser } from '../../contexts/UserContext'
import './Dashboard.css'

const { RangePicker } = DatePicker
const { Option } = Select

const Dashboard = () => {
  const { overview, loading, loadAllData } = useData()
  const { isLoggedIn } = useUser()
  const [dateRange, setDateRange] = useState('30days')
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (overview) {
      processChartData()
    }
  }, [overview])

  const processChartData = () => {
    if (!overview) return

    // 收益趋势图配置
    const profitChartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          const date = params[0].axisValue
          const profit = params[0].value
          const color = profit >= 0 ? '#52c41a' : '#f5222d'
          return `
            <div style="text-align: left;">
              <div>${date}</div>
              <div style="color: ${color}; font-weight: bold;">
                净收益: ¥${profit.toFixed(2)}
              </div>
            </div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: overview.profitTrend?.dates || [],
        axisLine: {
          lineStyle: {
            color: '#d9d9d9'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#d9d9d9'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [
        {
          name: '净收益',
          type: 'line',
          data: overview.profitTrend?.profits || [],
          smooth: true,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#1890ff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(24, 144, 255, 0.3)'
              }, {
                offset: 1, color: 'rgba(24, 144, 255, 0.05)'
              }]
            }
          }
        }
      ]
    }

    // 收入来源分布图配置
    const incomeSourceOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: overview.incomeSources?.categories || []
      },
      series: [
        {
          name: '收入来源',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: overview.incomeSources?.data || []
        }
      ]
    }

    setChartData({
      profitChartOption,
      incomeSourceOption
    })
  }

  const handleDateRangeChange = (value) => {
    setDateRange(value)
  }

  if (loading && !overview) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载数据中...</div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="dashboard-empty">
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无数据"
        >
          <p>开始记录您的第一笔游戏收益吧！</p>
        </Empty>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">数据看板</h1>
        <p className="page-description">
          全面掌握您的游戏资产与收益情况
        </p>
      </div>

      {/* 时间筛选器 */}
      <div className="dashboard-filters">
        <Space>
          <Select 
            value={dateRange} 
            onChange={handleDateRangeChange}
            style={{ width: 120 }}
          >
            <Option value="7days">最近7天</Option>
            <Option value="30days">最近30天</Option>
            <Option value="90days">最近90天</Option>
            <Option value="custom">自定义</Option>
          </Select>
          {dateRange === 'custom' && (
            <RangePicker />
          )}
        </Space>
      </div>

      {/* KPI 指标卡片 */}
      <Row gutter={[16, 16]} className="kpi-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-content">
              <div className="kpi-icon total-investment">
                <DollarOutlined />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">
                  ¥{overview.totalInvestment?.toFixed(2) || '0.00'}
                </div>
                <div className="kpi-label">总投入成本</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-content">
              <div className="kpi-icon net-profit">
                {overview.netProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              </div>
              <div className="kpi-info">
                <div className={`kpi-value ${overview.netProfit >= 0 ? 'positive' : 'negative'}`}>
                  ¥{overview.netProfit?.toFixed(2) || '0.00'}
                </div>
                <div className="kpi-label">净收益</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-content">
              <div className="kpi-icon hourly-efficiency">
                <PlayCircleOutlined />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">
                  ¥{overview.hourlyEfficiency?.toFixed(2) || '0.00'}
                </div>
                <div className="kpi-label">单机小时收益</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <div className="kpi-content">
              <div className="kpi-icon total-sessions">
                <PlayCircleOutlined />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">
                  {overview.totalSessions || 0}
                </div>
                <div className="kpi-label">总游戏次数</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className="charts-row">
        <Col xs={24} lg={16}>
          <Card 
            title="净收益趋势" 
            className="chart-card"
          >
            {chartData?.profitChartOption ? (
              <ReactECharts
                option={chartData.profitChartOption}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="收入来源分布" 
            className="chart-card"
          >
            {chartData?.incomeSourceOption ? (
              <ReactECharts
                option={chartData.incomeSourceOption}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 数据状态提示 */}
      {!isLoggedIn && (
        <div className="local-storage-notice">
          <span>💡 当前数据保存在本地，注册后可永久保存和多设备同步</span>
        </div>
      )}
    </div>
  )
}

export default Dashboard