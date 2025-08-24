// app.js
App({
  onLaunch() {
    console.log('AI健康减肥小程序启动');
    
    // 初始化云开发 - 暂时注释，需要配置真实环境ID
    // TODO: 请配置真实的云开发环境ID后取消注释
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloudbase-2gk9q3aja2a713a3', // 请替换为真实的云开发环境ID
        traceUser: true,
      });
    }
    

    // 检查更新
    this.checkForUpdate();

    // 获取系统信息
    this.getSystemInfo();
  },

  onShow() {
    // 小程序从后台进入前台时执行
    this.updateCurrentDate();
  },

  onHide() {
    // 小程序从前台进入后台时执行
  },

  // 检查小程序更新
  checkForUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log('是否有新版本：', res.hasUpdate);
    });

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        }
      });
    });

    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
      console.log('新版本下载失败');
    });
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });
  },

  // 更新当前日期
  updateCurrentDate() {
    this.globalData.currentDate = new Date().toISOString().split('T')[0];
  },

  // 获取用户信息
  getUserInfo() {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo);
      } else {
        wx.getUserProfile({
          desc: '用于完善会员资料',
          success: (res) => {
            this.globalData.userInfo = res.userInfo;
            this.globalData.isLoggedIn = true;
            resolve(res.userInfo);
          },
          fail: reject
        });
      }
    });
  },

  // 调用云函数
  callCloudFunction(name, data = {}) {
    // 检查云开发是否已初始化
    if (!wx.cloud) {
      console.warn('云开发未初始化，无法调用云函数:', name);
      return Promise.reject(new Error('云开发未配置'));
    }
    
    return wx.cloud.callFunction({
      name: name,
      data: data
    }).catch(error => {
      console.error('云函数调用失败:', name, error);
      // 返回模拟数据用于测试
      return this.getMockData(name, data);
    });
  },

  // 获取模拟数据（用于测试）
  getMockData(functionName, data) {
    console.log('使用模拟数据:', functionName);
    
    const mockResults = {
      'ai-chat': {
        success: true,
        aiResponse: '这是模拟的AI回复。请配置云开发环境后使用真实的AI服务。'
      },
      'get-user-data': {
        success: true,
        data: {
          weight: 70,
          height: 170,
          age: 25,
          gender: 'male',
          targetWeight: 65
        }
      },
      'get-food-data': {
        success: true,
        data: {
          foods: []
        }
      }
    };
    
    return Promise.resolve({
      result: mockResults[functionName] || { success: true, data: {} }
    });
  },

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  },

  // 显示消息提示
  showToast(title, icon = 'success', duration = 2000) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    });
  },

  // 显示错误信息
  showError(message) {
    wx.showModal({
      title: '错误',
      content: message,
      showCancel: false
    });
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    systemInfo: null,
    currentDate: null,
    todayData: {
      calories: 0,
      caloriesConsumed: 0,
      exercise: 0,
      weight: 0,
      steps: 0
    },
    aiContext: [], // AI对话上下文
    userGoals: {
      targetWeight: null,
      targetDate: null,
      weeklyGoal: 0.5, // 每周减重目标(kg)
      dailyCalories: 2000 // 每日热量目标
    },
    userPreferences: {
      dietType: 'balanced', // balanced, low-carb, low-fat, vegetarian
      exerciseLevel: 'moderate', // beginner, moderate, advanced
      restrictions: [] // 饮食限制
    }
  }
});