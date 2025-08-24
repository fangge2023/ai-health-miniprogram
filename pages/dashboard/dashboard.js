// pages/dashboard/dashboard.js
Page({
  data: {
    todayDate: '',
    caloriesConsumed: 0,
    caloriesTarget: 2000,
    steps: 0,
    stepsTarget: 8000,
    waterIntake: 0,
    waterTarget: 8,
    currentWeight: null,
    initialWeight: null,
    targetWeight: null,
    weightProgressPercentage: 0,
    daysToGoal: 0,
    dailyTip: '',
    healthTips: [
      '保持规律的运动习惯可以帮助提高基础代谢率，即使在休息时也能消耗更多热量。',
      '多喝水不仅能保持身体水分，还能帮助控制食欲，减少不必要的进食。',
      '每天保持7-8小时的充足睡眠，有助于调节荷尔蒙平衡，减少食欲增加。',
      '选择全谷物、蔬菜和蛋白质丰富的食物，可以让你更长时间感到饱腹。',
      '记录你的饮食和运动情况，可以帮助你更好地了解自己的健康习惯并做出改进。'
    ],
  },

  onLoad: function (options) {
    this.setTodayDate();
    this.getRandomTip();
    this.getUserData();
  },

  onShow: function () {
    // 每次页面显示时更新数据
    this.getUserData();
  },


  setTodayDate: function () {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[today.getDay()];
    
    this.setData({
      todayDate: `${year}年${month}月${day}日 星期${weekday}`
    });
  },



  getRandomTip: function () {
    const randomIndex = Math.floor(Math.random() * this.data.healthTips.length);
    this.setData({
      dailyTip: this.data.healthTips[randomIndex]
    });
  },

  refreshTips: function () {
    this.getRandomTip();
  },

  getUserData: function () {
    // 这里应该调用云函数或API获取用户数据
    // 模拟数据
    const mockData = {
      caloriesConsumed: 1250,
      steps: 5600,
      waterIntake: 5,
      currentWeight: 68,
      initialWeight: 75,
      targetWeight: 65,
      daysToGoal: 28
    };
    
    // 计算减重进度百分比
    const totalToLose = mockData.initialWeight - mockData.targetWeight;
    const alreadyLost = mockData.initialWeight - mockData.currentWeight;
    const progressPercentage = Math.round((alreadyLost / totalToLose) * 100);
    
    this.setData({
      caloriesConsumed: mockData.caloriesConsumed,
      steps: mockData.steps,
      waterIntake: mockData.waterIntake,
      currentWeight: mockData.currentWeight,
      initialWeight: mockData.initialWeight,
      targetWeight: mockData.targetWeight,
      daysToGoal: mockData.daysToGoal,
      weightProgressPercentage: progressPercentage
    });
  },

  navigateToDiet: function () {
    wx.switchTab({
      url: '/pages/diet/diet'
    });
  },

  navigateToExercise: function () {
    wx.switchTab({
      url: '/pages/exercise/exercise'
    });
  },

  navigateToWater: function () {
    // 这里可以打开一个添加饮水的模态框
    wx.showToast({
      title: '已添加一杯水',
      icon: 'success'
    });
    
    this.setData({
      waterIntake: this.data.waterIntake + 1
    });
  },

  navigateToWeight: function () {
    // 这里可以打开一个更新体重的模态框
    wx.showModal({
      title: '更新体重',
      content: '请输入您的当前体重(kg)',
      editable: true,
      placeholderText: '例如: 65.5',
      success: (res) => {
        if (res.confirm) {
          const newWeight = parseFloat(res.content);
          if (!isNaN(newWeight) && newWeight > 0) {
            this.setData({
              currentWeight: newWeight
            });
            
            // 重新计算进度
            const totalToLose = this.data.initialWeight - this.data.targetWeight;
            const alreadyLost = this.data.initialWeight - newWeight;
            const progressPercentage = Math.round((alreadyLost / totalToLose) * 100);
            
            this.setData({
              weightProgressPercentage: progressPercentage
            });
            
            wx.showToast({
              title: '体重已更新',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '请输入有效数值',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  viewMoreStats: function () {
    wx.navigateTo({
      url: '/pages/health/health'
    });
  }
});