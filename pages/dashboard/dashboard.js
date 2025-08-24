// pages/dashboard/dashboard.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');

import * as echarts from '../../ec-canvas/echarts';

Page({
  data: {
    greeting: '',
    currentDate: '',
    userInfo: {},
    loading: true,
    hasData: false,
    
    // 体重相关数据
    currentWeight: 0,
    targetWeight: 0,
    weightChange: 0,
    remainingWeight: 0,
    progressPercent: 0,
    
    // 今日数据
    todayData: {
      caloriesConsumed: 0,
      caloriesBurned: 0,
      steps: 0,
      water: 0
    },
    
    // 热量数据
    bmr: 0,
    targetCalories: 0,
    remainingCalories: 0,
    calorieBalance: 0,
    
    // AI建议
    aiSuggestion: null,
    
    // 图表数据
    chartPeriod: 'week',
    calorieChart: {},
    weightChart: {},
    
    // 天气信息
    weather: null
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 初始化页面
  async initPage() {
    console.log('开始初始化dashboard页面');
    
    try {
      // 设置基础数据，避免依赖工具函数失败
      const currentDate = new Date();
      const greeting = this.getSimpleGreeting();
      const dateStr = this.formatSimpleDate(currentDate);
      
      this.setData({
        greeting: greeting,
        currentDate: dateStr,
        // 设置一些默认数据，避免空白页面
        currentWeight: 70.0,
        targetWeight: 65.0,
        progressPercent: 25,
        bmr: 1500,
        targetCalories: 2000,
        remainingCalories: 500,
        calorieBalance: -200,
        hasData: true
      });
      
      console.log('基础数据设置完成');

      // 尝试获取用户信息（可选）
      try {
        await this.getUserInfo();
      } catch (error) {
        console.warn('获取用户信息失败:', error);
      }
      
      // 尝试加载数据（可选）
      try {
        await this.loadAllData();
      } catch (error) {
        console.warn('加载数据失败:', error);
      }
      
    // 尝试初始化图表（可选）
    try {
      this.initCharts();
    } catch (error) {
      console.warn('初始化图表失败:', error);
    }
      
      console.log('dashboard页面初始化完成');
      
    } catch (error) {
      console.error('页面初始化失败:', error);
      // 设置最基础的数据，确保页面能显示
      this.setData({
        greeting: '你好',
        currentDate: '今天',
        loading: false,
        hasData: true,
        currentWeight: 70.0,
        targetWeight: 65.0
      });
    } finally {
      this.setData({ loading: false });
    }
  },
  
  // 简单的问候语获取
  getSimpleGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  },
  
  // 简单的日期格式化
  formatSimpleDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      if (!app.globalData.userInfo) {
        const userInfo = await app.getUserInfo();
        this.setData({ userInfo });
      } else {
        this.setData({ userInfo: app.globalData.userInfo });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  },

  // 加载所有数据
  async loadAllData() {
    try {
      const promises = [
        this.loadDashboardData(),
        this.loadTodayData(),
        this.loadWeightData(),
        this.getAiSuggestion(),
        this.getWeatherInfo()
      ];

      await Promise.all(promises);
      this.setData({ hasData: true });
    } catch (error) {
      console.error('数据加载失败:', error);
    }
  },

  // 加载仪表板数据
  async loadDashboardData() {
    try {
      const result = await api.analytics.getDashboardData();
      
      if (result && result.data) {
        const { userData, goals, healthMetrics } = result.data;
        
        // 计算BMR和TDEE
        const bmr = util.calculateBMR(
          healthMetrics.weight,
          userData.height,
          userData.age,
          userData.gender
        );
        
        const targetCalories = util.calculateTDEE(bmr, userData.activityLevel || 'moderate');
        
        this.setData({
          bmr,
          targetCalories,
          currentWeight: util.formatWeight(healthMetrics.weight),
          targetWeight: util.formatWeight(goals.targetWeight),
          remainingWeight: util.formatWeight(healthMetrics.weight - goals.targetWeight),
          progressPercent: this.calculateProgress(healthMetrics.weight, userData.initialWeight, goals.targetWeight)
        });
      }
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    }
  },

  // 加载今日数据
  async loadTodayData() {
    try {
      const [dietResult, exerciseResult] = await Promise.all([
        api.dietData.getTodayMeals(),
        api.exerciseData.getTodayExercise()
      ]);

      let caloriesConsumed = 0;
      let caloriesBurned = 0;

      if (dietResult && dietResult.data) {
        caloriesConsumed = dietResult.data.totalCalories || 0;
      }

      if (exerciseResult && exerciseResult.data) {
        caloriesBurned = exerciseResult.data.totalCaloriesBurned || 0;
      }

      const remainingCalories = this.data.targetCalories - caloriesConsumed + caloriesBurned;
      const calorieBalance = caloriesConsumed - this.data.targetCalories - caloriesBurned;

      this.setData({
        'todayData.caloriesConsumed': caloriesConsumed,
        'todayData.caloriesBurned': caloriesBurned,
        'todayData.steps': 0, // 需要接入微信运动API
        'todayData.water': 0, // 需要用户记录
        remainingCalories,
        calorieBalance
      });
    } catch (error) {
      console.error('加载今日数据失败:', error);
    }
  },

  // 加载体重数据
  async loadWeightData() {
    try {
      const result = await api.healthData.getWeightHistory(30);
      
      if (result && result.data && result.data.length > 0) {
        const weightHistory = result.data;
        const latestWeight = weightHistory[weightHistory.length - 1];
        const previousWeight = weightHistory.length > 1 ? weightHistory[weightHistory.length - 2] : null;
        
        const weightChange = previousWeight ? 
          util.formatWeight(latestWeight.weight - previousWeight.weight) : 0;

        this.setData({
          weightChange: parseFloat(weightChange)
        });
      }
    } catch (error) {
      console.error('加载体重数据失败:', error);
    }
  },

  // 获取AI建议
  async getAiSuggestion() {
    try {
      const result = await api.aiChat.sendMessage('请根据我的数据给出今日减肥建议');
      
      if (result && result.aiResponse) {
        this.setData({
          aiSuggestion: {
            content: result.aiResponse.substring(0, 100) + '...',
            fullContent: result.aiResponse
          }
        });
      }
    } catch (error) {
      console.error('获取AI建议失败:', error);
    }
  },

  // 获取天气信息
  async getWeatherInfo() {
    try {
      // 这里应该调用天气API，暂时使用模拟数据
      this.setData({
        weather: {
          temp: 25,
          desc: '晴朗'
        }
      });
    } catch (error) {
      console.error('获取天气信息失败:', error);
    }
  },

  // 计算进度百分比
  calculateProgress(current, initial, target) {
    if (!initial || !target || initial === target) return 0;
    const totalLoss = initial - target;
    const currentLoss = initial - current;
    return Math.min(Math.max((currentLoss / totalLoss) * 100, 0), 100);
  },

  // 初始化图表
  initCharts() {
    console.log('初始化图表');
    this.initCalorieChart();
    this.initWeightChart();
  },

  // 初始化热量图表
  initCalorieChart() {
    this.setData({
      calorieChart: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          });

          const option = {
            tooltip: {
              trigger: 'item'
            },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              data: [
                { value: this.data.todayData.caloriesConsumed, name: '已摄入', itemStyle: { color: '#FF6B6B' } },
                { value: this.data.todayData.caloriesBurned, name: '已消耗', itemStyle: { color: '#4ECDC4' } },
                { value: this.data.remainingCalories, name: '可摄入', itemStyle: { color: '#95E1D3' } }
              ]
            }]
          };

          chart.setOption(option);
          return chart;
        }
      }
    });
  },

  // 初始化体重图表
  initWeightChart() {
    this.setData({
      weightChart: {
        onInit: (canvas, width, height, dpr) => {
          const chart = echarts.init(canvas, null, {
            width: width,
            height: height,
            devicePixelRatio: dpr
          });

          const option = {
            xAxis: {
              type: 'category',
              data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
            },
            yAxis: {
              type: 'value'
            },
            series: [{
              data: [70, 69.8, 69.5, 69.3, 69.1, 68.9, 68.7],
              type: 'line',
              smooth: true,
              itemStyle: { color: '#4CAF50' },
              lineStyle: { color: '#4CAF50' }
            }]
          };

          chart.setOption(option);
          return chart;
        }
      }
    });
  },

  // 切换图表周期
  changePeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ chartPeriod: period });
    this.updateWeightChart(period);
  },

  // 更新体重图表
  async updateWeightChart(period) {
    try {
      // 根据周期获取数据
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
      const result = await api.healthData.getWeightHistory(days);
      
      // 更新图表数据
      // 这里需要根据实际数据更新图表
    } catch (error) {
      console.error('更新图表失败:', error);
    }
  },

  // 快捷记录
  quickRecord(e) {
    const type = e.currentTarget.dataset.type;
    
    switch (type) {
      case 'weight':
        this.recordWeight();
        break;
      case 'meal':
        wx.navigateTo({ url: '/pages/diet/diet' });
        break;
      case 'exercise':
        wx.navigateTo({ url: '/pages/exercise/exercise' });
        break;
      case 'water':
        this.recordWater();
        break;
    }
  },

  // 记录体重
  recordWeight() {
    wx.showModal({
      title: '记录体重',
      content: '请输入当前体重(kg)',
      editable: true,
      placeholderText: '例如：65.5',
      success: async (res) => {
        if (res.confirm && res.content) {
          const weight = parseFloat(res.content);
          if (util.validateWeight(weight)) {
            try {
              await api.healthData.recordWeight(weight);
              app.showToast('体重记录成功');
              this.refreshData();
            } catch (error) {
              app.showError('记录失败，请重试');
            }
          } else {
            app.showError('请输入有效的体重数值');
          }
        }
      }
    });
  },

  // 记录喝水
  recordWater() {
    wx.showActionSheet({
      itemList: ['250ml', '500ml', '750ml', '1000ml'],
      success: (res) => {
        const volumes = [250, 500, 750, 1000];
        const volume = volumes[res.tapIndex];
        
        this.setData({
          'todayData.water': this.data.todayData.water + volume
        });
        
        app.showToast(`已记录 ${volume}ml 水分`);
      }
    });
  },

  // 查看AI建议详情
  viewMore() {
    if (this.data.aiSuggestion && this.data.aiSuggestion.fullContent) {
      wx.showModal({
        title: 'AI建议详情',
        content: this.data.aiSuggestion.fullContent,
        showCancel: false
      });
    }
  },

  // 前往AI咨询页面
  goToAiConsult() {
    wx.switchTab({ url: '/pages/ai-consult/ai-consult' });
  },

  // 刷新数据
  async refreshData() {
    this.setData({ loading: true });
    try {
      await this.loadAllData();
      app.showToast('刷新成功');
    } catch (error) {
      app.showError('刷新失败');
    } finally {
      this.setData({ loading: false });
    }
  }
});