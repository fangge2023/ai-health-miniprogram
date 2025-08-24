// pages/health/health.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');
import * as echarts from '../../ec-canvas/echarts';

Page({
  data: {
    healthData: {
      bmi: 0,
      weight: 0,
      bodyFat: 0
    },
    activeTab: 'weight',
    healthChart: {
      lazyLoad: true // 设置延迟加载，在组件初始化时不会立即尝试渲染图表
    },
    healthRecords: [],
    loading: true
  },

  onLoad() {
    this.loadHealthData();
    this.initChart();
  },

  async loadHealthData() {
    try {
      const result = await api.userData.get('health');
      if (result && result.data) {
        this.setData({
          healthData: result.data.healthMetrics || this.data.healthData,
          healthRecords: result.data.healthRecords || []
        });
      }
    } catch (error) {
      console.error('加载健康数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.updateChart(tab);
  },

  initChart() {
    console.log('初始化健康图表');
    
    // 创建图表配置对象
    this.setData({
      healthChart: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          });
          
          // 设置默认图表配置
          const option = this.getChartOption('weight');
          chart.setOption(option);
          
          // 保存图表实例
          this.chartInstance = chart;
          return chart;
        }
      }
    });
  },
  
  getChartOption(type) {
    const records = this.data.healthRecords || [];
    const data = records
      .filter(record => record.type === type)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(record => ({
        date: util.formatDate(new Date(record.date)),
        value: record.value
      }));
    
    const xData = data.map(item => item.date);
    const yData = data.map(item => item.value);
    
    let title = '';
    let unit = '';
    
    switch(type) {
      case 'weight':
        title = '体重变化趋势';
        unit = 'kg';
        break;
      case 'bmi':
        title = 'BMI变化趋势';
        unit = '';
        break;
      case 'bodyFat':
        title = '体脂率变化趋势';
        unit = '%';
        break;
    }
    
    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `${params[0].name}<br/>${params[0].seriesName}: ${params[0].value}${unit}`;
        }
      },
      xAxis: {
        type: 'category',
        data: xData,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: unit
      },
      series: [{
        name: title,
        type: 'line',
        data: yData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#07c160'
        },
        lineStyle: {
          color: '#07c160',
          width: 2
        }
      }],
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '20%',
        containLabel: true
      }
    };
  },
  
  updateChart(type) {
    if (this.chartInstance) {
      const option = this.getChartOption(type);
      this.chartInstance.setOption(option);
    }
  },

  addHealthRecord() {
    wx.showModal({
      title: '添加健康记录',
      content: '健康记录功能开发中...',
      showCancel: false
    });
  }
});