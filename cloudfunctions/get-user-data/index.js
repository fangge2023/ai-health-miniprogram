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