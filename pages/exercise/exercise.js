// pages/exercise/exercise.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');

import * as echarts from '../../ec-canvas/echarts';

Page({
  data: {
    // 日期相关
    selectedDate: '',
    dateDesc: '',
    
    // 今日统计
    todayStats: {
      duration: 0,
      calories: 0,
      count: 0,
      steps: 0
    },
    
    // 目标和进度
    dailyGoal: 30, // 每日运动目标（分钟）
    goalProgress: 0,
    hasAchievement: false,
    
    // 快捷运动
    quickExercises: [],
    
    // 运动计时器
    currentExercise: null,
    isRunning: false,
    elapsedTime: 0,
    currentCalories: 0,
    timer: null,
    startTime: null,
    
    // 运动记录
    exerciseRecords: [],
    recordView: 'list', // list 或 chart
    
    // 图表数据
    exerciseChart: {},
    weeklyChart: {},
    
    // 浮动按钮
    fabExpanded: false,
    
    // 运动详情弹窗
    showExerciseModal: false,
    selectedExercise: {},
    plannedDuration: 30,
    estimatedCalories: 0,
    
    // 加载状态
    loading: true
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.refreshData();
  },

  onHide() {
    // 如果计时器在运行，暂停但不清除
    if (this.data.isRunning) {
      this.pauseTimer();
    }
  },

  onUnload() {
    // 清理计时器
    this.clearTimer();
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 初始化页面
  async initPage() {
    try {
      this.setCurrentDate();
      await Promise.all([
        this.loadQuickExercises(),
        this.loadTodayExerciseData(),
        this.loadUserGoals()
      ]);
      this.initCharts();
    } catch (error) {
      console.error('页面初始化失败:', error);
      app.showError('页面加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 设置当前日期
  setCurrentDate() {
    const today = new Date();
    const selectedDate = util.formatDate(today, 'YYYY-MM-DD');
    const dateDesc = this.getDateDescription(today);
    
    this.setData({
      selectedDate,
      dateDesc
    });
  },

  // 获取日期描述
  getDateDescription(date) {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const dateStr = util.formatDate(date, 'YYYY-MM-DD');
    const todayStr = util.formatDate(today, 'YYYY-MM-DD');
    const yesterdayStr = util.formatDate(yesterday, 'YYYY-MM-DD');
    const tomorrowStr = util.formatDate(tomorrow, 'YYYY-MM-DD');
    
    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';
    if (dateStr === tomorrowStr) return '明天';
    
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[date.getDay()];
  },

  // 加载快捷运动
  async loadQuickExercises() {
    try {
      const quickExercises = [
        {
          id: 'walking',
          name: '快走',
          icon: '🚶',
          met: 3.5,
          intensity: '低强度',
          caloriesPerMin: 4,
          recommendedDuration: 30,
          category: 'cardio'
        },
        {
          id: 'running',
          name: '跑步',
          icon: '🏃',
          met: 8.0,
          intensity: '中高强度',
          caloriesPerMin: 10,
          recommendedDuration: 20,
          category: 'cardio'
        },
        {
          id: 'cycling',
          name: '骑行',
          icon: '🚴',
          met: 6.0,
          intensity: '中强度',
          caloriesPerMin: 7,
          recommendedDuration: 25,
          category: 'cardio'
        },
        {
          id: 'swimming',
          name: '游泳',
          icon: '🏊',
          met: 7.0,
          intensity: '中高强度',
          caloriesPerMin: 8,
          recommendedDuration: 30,
          category: 'cardio'
        },
        {
          id: 'yoga',
          name: '瑜伽',
          icon: '🧘',
          met: 2.5,
          intensity: '低强度',
          caloriesPerMin: 3,
          recommendedDuration: 45,
          category: 'flexibility'
        },
        {
          id: 'strength',
          name: '力量训练',
          icon: '💪',
          met: 5.0,
          intensity: '中强度',
          caloriesPerMin: 6,
          recommendedDuration: 40,
          category: 'strength'
        }
      ];
      
      this.setData({ quickExercises });
    } catch (error) {
      console.error('加载快捷运动失败:', error);
    }
  },

  // 加载今日运动数据
  async loadTodayExerciseData() {
    try {
      const result = await api.exerciseData.getTodayExercise();
      
      if (result && result.data) {
        this.processTodayData(result.data);
      } else {
        this.initEmptyData();
      }
    } catch (error) {
      console.error('加载今日运动数据失败:', error);
      this.initEmptyData();
    }
  },

  // 处理今日数据
  processTodayData(exerciseData) {
    let totalDuration = 0;
    let totalCalories = 0;
    let totalSteps = 0;
    let exerciseCount = 0;
    
    const records = [];
    
    if (exerciseData.exercises && exerciseData.exercises.length > 0) {
      exerciseData.exercises.forEach(exercise => {
        totalDuration += exercise.duration || 0;
        totalCalories += exercise.caloriesBurned || 0;
        totalSteps += exercise.steps || 0;
        exerciseCount++;
        
        // 处理记录显示
        const exerciseInfo = this.data.quickExercises.find(q => q.id === exercise.exerciseType) || {};
        records.push({
          id: exercise.id || util.generateId(),
          exerciseName: exercise.exerciseName || exerciseInfo.name || '运动',
          icon: exerciseInfo.icon || '🏃',
          startTime: util.formatDate(new Date(exercise.startTime), 'HH:mm'),
          endTime: util.formatDate(new Date(exercise.endTime), 'HH:mm'),
          duration: exercise.duration,
          caloriesBurned: exercise.caloriesBurned,
          distance: exercise.distance,
          steps: exercise.steps
        });
      });
    }
    
    const goalProgress = Math.min((totalDuration / this.data.dailyGoal) * 100, 100);
    const hasAchievement = goalProgress >= 100;
    
    this.setData({
      todayStats: {
        duration: totalDuration,
        calories: Math.round(totalCalories),
        count: exerciseCount,
        steps: totalSteps
      },
      exerciseRecords: records,
      goalProgress: Math.round(goalProgress),
      hasAchievement
    });
  },

  // 初始化空数据
  initEmptyData() {
    this.setData({
      todayStats: {
        duration: 0,
        calories: 0,
        count: 0,
        steps: 0
      },
      exerciseRecords: [],
      goalProgress: 0,
      hasAchievement: false
    });
  },

  // 加载用户目标
  async loadUserGoals() {
    try {
      const result = await api.userData.getGoals();
      if (result && result.data && result.data.dailyExerciseMinutes) {
        this.setData({
          dailyGoal: result.data.dailyExerciseMinutes
        });
        this.updateGoalProgress();
      }
    } catch (error) {
      console.error('加载运动目标失败:', error);
    }
  },

  // 更新目标进度
  updateGoalProgress() {
    const goalProgress = Math.min((this.data.todayStats.duration / this.data.dailyGoal) * 100, 100);
    const hasAchievement = goalProgress >= 100;
    
    this.setData({
      goalProgress: Math.round(goalProgress),
      hasAchievement
    });
  },

  // 日期切换
  changeDate(e) {
    const direction = e.currentTarget.dataset.direction;
    const currentDate = new Date(this.data.selectedDate);
    
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const selectedDate = util.formatDate(currentDate, 'YYYY-MM-DD');
    const dateDesc = this.getDateDescription(currentDate);
    
    this.setData({
      selectedDate,
      dateDesc,
      loading: true
    });
    
    this.loadExerciseDataByDate(selectedDate);
  },

  // 选择日期
  pickDate() {
    wx.showModal({
      title: '功能提示',
      content: '日期选择功能开发中...',
      showCancel: false
    });
  },

  // 开始运动
  startExercise(e) {
    const exercise = e.currentTarget.dataset.exercise;
    this.setData({
      selectedExercise: exercise,
      plannedDuration: exercise.recommendedDuration,
      showExerciseModal: true
    });
    this.calculateEstimatedCalories();
  },

  // 计算预计消耗热量
  calculateEstimatedCalories() {
    const { selectedExercise, plannedDuration } = this.data;
    const estimatedCalories = Math.round(selectedExercise.caloriesPerMin * plannedDuration);
    this.setData({ estimatedCalories });
  },

  // 修改运动时长
  changeDuration(e) {
    const change = parseInt(e.currentTarget.dataset.change);
    const newDuration = Math.max(5, this.data.plannedDuration + change);
    this.setData({ plannedDuration: newDuration });
    this.calculateEstimatedCalories();
  },

  // 输入运动时长
  onDurationInput(e) {
    const duration = parseInt(e.detail.value) || 5;
    this.setData({ plannedDuration: Math.max(5, Math.min(180, duration)) });
    this.calculateEstimatedCalories();
  },

  // 确认开始运动
  confirmStartExercise() {
    const { selectedExercise, plannedDuration } = this.data;
    
    this.setData({
      currentExercise: {
        ...selectedExercise,
        plannedDuration: plannedDuration
      },
      showExerciseModal: false,
      elapsedTime: 0,
      currentCalories: 0,
      fabExpanded: false
    });
    
    this.startTimer();
  },

  // 关闭运动弹窗
  closeExerciseModal() {
    this.setData({ showExerciseModal: false });
  },

  // 开始计时器
  startTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    
    const startTime = this.data.startTime || new Date();
    const initialElapsedTime = this.data.elapsedTime || 0;
    
    const timer = setInterval(() => {
      this.updateTimer(startTime, initialElapsedTime);
    }, 1000);
    
    this.setData({
      timer,
      isRunning: true,
      startTime: startTime
    });
  },

  // 更新计时器
  updateTimer(startTime, initialElapsedTime) {
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const totalElapsedTime = initialElapsedTime + elapsedSeconds;
    
    const currentCalories = Math.round((this.data.currentExercise.caloriesPerMin * totalElapsedTime) / 60);
    
    this.setData({
      elapsedTime,
      currentCalories
    });
  },

  // 切换计时器状态
  toggleTimer() {
    if (this.data.isRunning) {
      this.pauseTimer();
    } else {
      this.resumeTimer();
    }
  },

  // 暂停计时器
  pauseTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
    this.setData({
      isRunning: false,
      timer: null
    });
  },

  // 恢复计时器
  resumeTimer() {
    const currentTime = new Date();
    const pausedTime = this.data.elapsedTime || 0;
    
    this.setData({
      startTime: new Date(currentTime.getTime() - pausedTime * 1000)
    }, () => {
      this.startTimer();
    });
  },

  // 停止运动
  stopExercise() {
    if (this.data.elapsedTime < 60) {
      wx.showModal({
        title: '确认停止',
        content: '运动时间较短，确定要停止吗？',
        success: (res) => {
          if (res.confirm) {
            this.finishExercise();
          }
        }
      });
    } else {
      this.finishExercise();
    }
  },

  // 完成运动
  async finishExercise() {
    try {
      this.clearTimer();
      
      const exerciseRecord = {
        exerciseType: this.data.currentExercise.id,
        exerciseName: this.data.currentExercise.name,
        startTime: this.data.startTime,
        endTime: new Date(),
        duration: Math.floor(this.data.elapsedTime / 60), // 转换为分钟
        caloriesBurned: this.data.currentCalories,
        intensity: this.data.currentExercise.intensity
      };
      
      // 保存运动记录
      await api.exerciseData.record(exerciseRecord);
      
      // 重置状态
      this.setData({
        currentExercise: null,
        elapsedTime: 0,
        currentCalories: 0,
        isRunning: false
      });
      
      app.showToast('运动记录已保存');
      
      // 刷新数据
      await this.loadTodayExerciseData();
      
    } catch (error) {
      console.error('保存运动记录失败:', error);
      app.showError('保存失败，请重试');
    }
  },

  // 清理计时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  // 格式化时间显示
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  },

  // 切换记录视图
  switchRecordView(e) {
    const view = e.currentTarget.dataset.view;
    this.setData({ recordView: view });
    
    if (view === 'chart') {
      this.updateExerciseChart();
    }
  },

  // 编辑记录
  editRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '功能提示',
      content: '编辑记录功能开发中...',
      showCancel: false
    });
  },

  // 删除记录
  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条运动记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.removeExerciseRecord(recordId);
        }
      }
    });
  },

  // 移除运动记录
  removeExerciseRecord(recordId) {
    const exerciseRecords = this.data.exerciseRecords.filter(record => record.id !== recordId);
    this.setData({ exerciseRecords });
    
    // 重新计算今日统计
    this.recalculateTodayStats();
    
    app.showToast('删除成功');
  },

  // 重新计算今日统计
  recalculateTodayStats() {
    let totalDuration = 0;
    let totalCalories = 0;
    let totalSteps = 0;
    
    this.data.exerciseRecords.forEach(record => {
      totalDuration += record.duration || 0;
      totalCalories += record.caloriesBurned || 0;
      totalSteps += record.steps || 0;
    });
    
    this.setData({
      todayStats: {
        duration: totalDuration,
        calories: totalCalories,
        count: this.data.exerciseRecords.length,
        steps: totalSteps
      }
    });
    
    this.updateGoalProgress();
  },

  // 查看所有运动
  viewAllExercises() {
    wx.showModal({
      title: '功能提示',
      content: '更多运动类型功能开发中...',
      showCancel: false
    });
  },

  // 切换浮动按钮
  toggleFab() {
    this.setData({
      fabExpanded: !this.data.fabExpanded
    });
  },

  // 快速开始
  quickStart() {
    // 根据时间推荐运动
    const hour = new Date().getHours();
    let recommendedExercise;
    
    if (hour >= 6 && hour < 12) {
      recommendedExercise = this.data.quickExercises.find(e => e.id === 'running');
    } else if (hour >= 12 && hour < 18) {
      recommendedExercise = this.data.quickExercises.find(e => e.id === 'walking');
    } else {
      recommendedExercise = this.data.quickExercises.find(e => e.id === 'yoga');
    }
    
    if (recommendedExercise) {
      this.setData({
        selectedExercise: recommendedExercise,
        plannedDuration: recommendedExercise.recommendedDuration,
        showExerciseModal: true,
        fabExpanded: false
      });
      this.calculateEstimatedCalories();
    }
  },

  // 自定义运动
  customExercise() {
    wx.showModal({
      title: '功能提示',
      content: '自定义运动功能开发中...',
      showCancel: false
    });
    
    this.setData({ fabExpanded: false });
  },

  // 导入健康数据
  importFromHealth() {
    wx.showModal({
      title: '功能提示',
      content: '导入健康数据功能开发中...\n可以从微信运动、Apple Health等导入',
      showCancel: false
    });
    
    this.setData({ fabExpanded: false });
  },

  // 初始化图表
  initCharts() {
    this.initExerciseChart();
    this.initWeeklyChart();
  },

  // 初始化运动图表
  initExerciseChart() {
    this.setData({
      exerciseChart: {
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
                { value: 30, name: '有氧运动', itemStyle: { color: '#FF6B6B' } },
                { value: 20, name: '力量训练', itemStyle: { color: '#4ECDC4' } },
                { value: 15, name: '柔韧性训练', itemStyle: { color: '#45B7D1' } }
              ]
            }]
          };

          chart.setOption(option);
          return chart;
        }
      }
    });
  },

  // 初始化周统计图表
  initWeeklyChart() {
    this.setData({
      weeklyChart: {
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
              data: [30, 45, 25, 60, 40, 35, 50],
              type: 'bar',
              itemStyle: { color: '#FF6B6B' },
              name: '运动时长(分钟)'
            }]
          };

          chart.setOption(option);
          return chart;
        }
      }
    });
  },

  // 更新运动图表
  updateExerciseChart() {
    // 根据实际数据更新图表
    // 这里可以添加具体的图表更新逻辑
  },

  // 按日期加载运动数据
  async loadExerciseDataByDate(date) {
    try {
      // 这里应该根据日期加载对应的运动数据
      // 目前使用今日数据
      await this.loadTodayExerciseData();
    } catch (error) {
      console.error('加载指定日期数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({ loading: true });
    try {
      await this.loadTodayExerciseData();
      app.showToast('刷新成功');
    } catch (error) {
      app.showError('刷新失败');
    } finally {
      this.setData({ loading: false });
    }
  }
});