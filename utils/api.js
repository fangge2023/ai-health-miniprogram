/**
 * API接口封装
 * 统一管理所有云函数调用
 */

const app = getApp();

// 基础请求封装
const request = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    app.showLoading();
    
    // 使用app中的云函数调用方法（包含错误处理和模拟数据）
    app.callCloudFunction(name, data)
      .then((res) => {
        app.hideLoading();
        if (res.result && res.result.success !== false) {
          resolve(res.result);
        } else {
          const error = res.result?.error || '请求失败';
          console.warn('API请求警告:', error);
          // 不显示错误弹窗，改为控制台警告
          resolve({ success: false, error: error });
        }
      })
      .catch((err) => {
        app.hideLoading();
        console.warn('API请求失败，使用模拟数据:', err.message);
        // 不显示错误弹窗，直接返回空结果
        resolve({ success: false, error: err.message });
      });
  });
};

// AI聊天接口
const aiChat = {
  // 发送消息
  sendMessage: (message, context = []) => {
    return request('ai-chat', {
      userMessage: message,
      context: context,
      userId: app.globalData.userInfo?.openId || ''
    });
  },
  
  // 获取聊天历史
  getHistory: (limit = 20) => {
    return request('ai-chat', {
      action: 'getHistory',
      userId: app.globalData.userInfo?.openId || '',
      limit: limit
    });
  }
};

// 用户数据接口
const userData = {
  // 获取用户数据
  get: (dataType = 'all') => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: dataType
    });
  },
  
  // 更新用户数据
  update: (updateData) => {
    return request('update-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      updateData: updateData
    });
  },
  
  // 获取用户目标
  getGoals: () => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'goals'
    });
  },
  
  // 设置用户目标
  setGoals: (goals) => {
    return request('update-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      updateData: { goals: goals }
    });
  },
  
  // 获取用户偏好设置
  getPreferences: () => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'preferences'
    });
  },
  
  // 更新用户偏好设置
  setPreferences: (preferences) => {
    return request('update-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      updateData: { preferences: preferences }
    });
  }
};

// 健康数据接口
const healthData = {
  // 记录体重
  recordWeight: (weight, date = null) => {
    return request('update-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      updateData: {
        healthMetrics: {
          weight: weight,
          date: date || new Date().toISOString()
        }
      }
    });
  },
  
  // 获取体重历史
  getWeightHistory: (days = 30) => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'weightHistory',
      days: days
    });
  },
  
  // 获取健康报告
  getHealthReport: (startDate, endDate) => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'healthReport',
      startDate: startDate,
      endDate: endDate
    });
  }
};

// 饮食数据接口
const dietData = {
  // 获取食物数据
  getFoodData: (foodName, quantity = 100) => {
    return request('get-food-data', {
      foodName: foodName,
      quantity: quantity
    });
  },
  
  // 搜索食物
  searchFood: (keyword, page = 1, limit = 10) => {
    return request('get-food-data', {
      action: 'search',
      keyword: keyword,
      page: page,
      limit: limit
    });
  },
  
  // 记录饮食
  recordMeal: (mealData) => {
    return request('record-diet', {
      userId: app.globalData.userInfo?.openId || '',
      mealData: mealData
    });
  },
  
  // 获取今日饮食记录
  getTodayMeals: () => {
    const today = new Date().toISOString().split('T')[0];
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'dietRecords',
      date: today
    });
  },
  
  // 获取饮食历史
  getDietHistory: (startDate, endDate) => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'dietRecords',
      startDate: startDate,
      endDate: endDate
    });
  },
  
  // 获取营养分析
  getNutritionAnalysis: (period = 'week') => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'nutritionAnalysis',
      period: period
    });
  }
};

// 运动数据接口
const exerciseData = {
  // 记录运动
  record: (exerciseData) => {
    return request('record-exercise', {
      userId: app.globalData.userInfo?.openId || '',
      exerciseData: exerciseData
    });
  },
  
  // 获取今日运动记录
  getTodayExercise: () => {
    const today = new Date().toISOString().split('T')[0];
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'exerciseRecords',
      date: today
    });
  },
  
  // 获取运动历史
  getHistory: (startDate, endDate) => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'exerciseRecords',
      startDate: startDate,
      endDate: endDate
    });
  },
  
  // 获取运动统计
  getStats: (period = 'week') => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'exerciseStats',
      period: period
    });
  },
  
  // 获取运动建议
  getRecommendations: () => {
    return request('ai-chat', {
      action: 'getExerciseRecommendations',
      userId: app.globalData.userInfo?.openId || ''
    });
  }
};

// 数据分析接口
const analytics = {
  // 获取仪表板数据
  getDashboardData: () => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'dashboard'
    });
  },
  
  // 获取进度分析
  getProgressAnalysis: (period = 'month') => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'progressAnalysis',
      period: period
    });
  },
  
  // 获取趋势分析
  getTrendAnalysis: (dataType, period = 'month') => {
    return request('get-user-data', {
      userId: app.globalData.userInfo?.openId || '',
      dataType: 'trendAnalysis',
      metric: dataType,
      period: period
    });
  }
};

module.exports = {
  request,
  aiChat,
  userData,
  healthData,
  dietData,
  exerciseData,
  analytics
};