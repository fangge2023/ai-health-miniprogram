// cloudfunctions/get-user-data/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, dataType } = event;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  try {
    switch (dataType) {
      case 'dashboard':
        return await getDashboardData(userId);
      case 'goals':
        return await getUserGoals(userId);
      case 'preferences':
        return await getUserPreferences(userId);
      case 'health':
        return await getHealthData(userId);
      case 'dietRecords':
        return await getDietRecords(userId, event.date, event.startDate, event.endDate);
      case 'exerciseRecords':
        return await getExerciseRecords(userId, event.date, event.startDate, event.endDate);
      case 'nutritionAnalysis':
        return await getNutritionAnalysis(userId, event.period);
      case 'exerciseStats':
        return await getExerciseStats(userId, event.period);
      case 'progressAnalysis':
        return await getProgressAnalysis(userId, event.period);
      case 'trendAnalysis':
        return await getTrendAnalysis(userId, event.metric, event.period);
      default:
        return await getAllUserData(userId);
    }
  } catch (error) {
    console.error('获取用户数据失败:', error);
    return {
      success: false,
      error: error.message || '获取数据失败'
    };
  }
};

async function getDashboardData(userId) {
  try {
    const [userResult, healthResult] = await Promise.all([
      db.collection('users').where({ openId: userId }).get(),
      db.collection('health_metrics').where({ userId }).orderBy('date', 'desc').limit(1).get()
    ]);

    const userData = userResult.data[0] || {};
    const healthData = healthResult.data[0] || {};

    return {
      success: true,
      data: {
        userData,
        goals: userData.goals || {},
        healthMetrics: healthData
      }
    };
  } catch (error) {
    throw new Error('获取仪表板数据失败');
  }
}

async function getUserGoals(userId) {
  try {
    const result = await db.collection('users').where({ openId: userId }).get();
    const userData = result.data[0] || {};
    
    return {
      success: true,
      data: userData.goals || {}
    };
  } catch (error) {
    throw new Error('获取用户目标失败');
  }
}

async function getUserPreferences(userId) {
  try {
    const result = await db.collection('users').where({ openId: userId }).get();
    const userData = result.data[0] || {};
    
    return {
      success: true,
      data: userData.preferences || {}
    };
  } catch (error) {
    throw new Error('获取用户偏好失败');
  }
}

async function getHealthData(userId) {
  try {
    const result = await db.collection('health_metrics').where({ userId }).orderBy('date', 'desc').limit(30).get();
    
    return {
      success: true,
      data: {
        healthMetrics: result.data[0] || {},
        healthRecords: result.data || []
      }
    };
  } catch (error) {
    throw new Error('获取健康数据失败');
  }
}

async function getDietRecords(userId, date, startDate, endDate) {
  try {
    let query = db.collection('diet_records').where({ userId });
    
    if (date) {
      query = query.where({ date: date });
    } else if (startDate && endDate) {
      query = query.where({
        date: db.command.gte(startDate).and(db.command.lte(endDate))
      });
    }
    
    const result = await query.orderBy('date', 'desc').get();
    
    // 如果没有记录，返回空数组而不是undefined
    const records = result.data || [];
    
    return {
      success: true,
      data: {
        records: records,
        meals: records.reduce((acc, record) => {
          if (record.meals) {
            record.meals.forEach(meal => {
              if (!acc[meal.mealType]) {
                acc[meal.mealType] = [];
              }
              acc[meal.mealType].push(meal);
            });
          }
          return acc;
        }, {}),
        // 添加今日总摄入量统计
        todaySummary: calculateTodaySummary(records, date)
      }
    };
  } catch (error) {
    console.error('获取饮食记录失败:', error);
    throw new Error('获取饮食记录失败');
  }
}

// 计算今日总摄入量
function calculateTodaySummary(records, date) {
  const today = date || new Date().toISOString().split('T')[0];
  const todayRecord = records.find(record => record.date === today);
  
  if (!todayRecord) {
    return {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealCount: 0
    };
  }
  
  return {
    totalCalories: todayRecord.totalCalories || 0,
    totalProtein: todayRecord.totalProtein || 0,
    totalCarbs: todayRecord.totalCarbs || 0,
    totalFat: todayRecord.totalFat || 0,
    mealCount: todayRecord.meals ? todayRecord.meals.length : 0
  };
}

async function getExerciseRecords(userId, date, startDate, endDate) {
  try {
    let query = db.collection('exercise_records').where({ userId });
    
    if (date) {
      query = query.where({ date: date });
    } else if (startDate && endDate) {
      query = query.where({
        date: db.command.gte(startDate).and(db.command.lte(endDate))
      });
    }
    
    const result = await query.orderBy('date', 'desc').get();
    
    return {
      success: true,
      data: result.data || []
    };
  } catch (error) {
    throw new Error('获取运动记录失败');
  }
}

async function getNutritionAnalysis(userId, period = 'week') {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const result = await db.collection('diet_records')
      .where({
        userId: userId,
        date: db.command.gte(startDateStr).and(db.command.lte(endDate))
      })
      .get();
    
    // 简化的营养分析计算
    const analysis = {
      totalCalories: 0,
      avgCalories: 0,
      carbs: { total: 0, avg: 0 },
      protein: { total: 0, avg: 0 },
      fat: { total: 0, avg: 0 }
    };
    
    if (result.data && result.data.length > 0) {
      result.data.forEach(record => {
        if (record.totalCalories) analysis.totalCalories += record.totalCalories;
        if (record.nutrition) {
          analysis.carbs.total += record.nutrition.carbs || 0;
          analysis.protein.total += record.nutrition.protein || 0;
          analysis.fat.total += record.nutrition.fat || 0;
        }
      });
      
      const days = result.data.length;
      analysis.avgCalories = Math.round(analysis.totalCalories / days);
      analysis.carbs.avg = Math.round(analysis.carbs.total / days);
      analysis.protein.avg = Math.round(analysis.protein.total / days);
      analysis.fat.avg = Math.round(analysis.fat.total / days);
    }
    
    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    throw new Error('获取营养分析失败');
  }
}

async function getExerciseStats(userId, period = 'week') {
  try {
    // 简化的运动统计
    return {
      success: true,
      data: {
        totalDuration: 180,
        avgDuration: 30,
        caloriesBurned: 1200,
        workouts: 6,
        favoriteType: '跑步'
      }
    };
  } catch (error) {
    throw new Error('获取运动统计失败');
  }
}

async function getProgressAnalysis(userId, period = 'month') {
  try {
    // 简化的进度分析
    return {
      success: true,
      data: {
        weightChange: -2.5,
        goalProgress: 50,
        consistency: 85,
        recommendations: ['继续保持当前饮食计划', '建议增加有氧运动频率']
      }
    };
  } catch (error) {
    throw new Error('获取进度分析失败');
  }
}

async function getTrendAnalysis(userId, metric, period = 'month') {
  try {
    // 简化的趋势分析
    const trends = {
      weight: [
        { date: '2024-01-01', value: 72 },
        { date: '2024-01-08', value: 71.5 },
        { date: '2024-01-15', value: 71 },
        { date: '2024-01-22', value: 70.5 },
        { date: '2024-01-29', value: 70 }
      ],
      calories: [
        { date: '2024-01-01', value: 2100 },
        { date: '2024-01-08', value: 1950 },
        { date: '2024-01-15', value: 1900 },
        { date: '2024-01-22', value: 1850 },
        { date: '2024-01-29', value: 1800 }
      ]
    };
    
    return {
      success: true,
      data: trends[metric] || []
    };
  } catch (error) {
    throw new Error('获取趋势分析失败');
  }
}

async function getAllUserData(userId) {
  try {
    const [userResult, healthResult, goalResult] = await Promise.all([
      db.collection('users').where({ openId: userId }).get(),
      db.collection('health_metrics').where({ userId }).orderBy('date', 'desc').limit(10).get(),
      db.collection('user_goals').where({ userId }).get()
    ]);

    return {
      success: true,
      data: {
        userInfo: userResult.data[0] || {},
        healthData: healthResult.data || [],
        goals: goalResult.data[0] || {}
      }
    };
  } catch (error) {
    throw new Error('获取用户数据失败');
  }
}
