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
    healthChart: {},
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
    this.setData({
      healthChart: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          });

          const option = {
            xAxis: {
              type: 'category',
              data: ['1月', '2月', '3月', '4月', '5月', '6月']
            },
            yAxis: {
              type: 'value'
            },
            series: [{
              data: [70, 69.5, 69, 68.5, 68, 67.5],
              type: 'line',
              smooth: true,
              itemStyle: { color: '#4CAF50' }
            }]
          };

          chart.setOption(option);
          return chart;
        }
      }
    });
  },

  updateChart(type) {
    // 根据类型更新图表数据
  },

  addHealthRecord() {
    wx.showModal({
      title: '添加健康记录',
      content: '健康记录功能开发中...',
      showCancel: false
    });
  }
});