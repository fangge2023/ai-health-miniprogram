// cloudfunctions/update-user-data/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, updateData } = event;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  if (!updateData) {
    return {
      success: false,
      error: '更新数据不能为空'
    };
  }

  try {
    // 检查用户是否存在
    const userResult = await db.collection('users').where({ openId: userId }).get();
    
    if (userResult.data.length === 0) {
      // 创建新用户
      await createNewUser(userId, updateData);
    } else {
      // 更新现有用户
      await updateExistingUser(userId, updateData);
    }

    // 处理健康数据更新
    if (updateData.healthMetrics) {
      await updateHealthMetrics(userId, updateData.healthMetrics);
    }

    return {
      success: true,
      data: {
        message: '用户数据更新成功',
        updateTime: new Date()
      }
    };

  } catch (error) {
    console.error('更新用户数据失败:', error);
    return {
      success: false,
      error: error.message || '更新数据失败'
    };
  }
};

async function createNewUser(userId, userData) {
  const newUser = {
    openId: userId,
    nickname: userData.nickname || '',
    avatar: userData.avatar || '',
    gender: userData.gender || 'unknown',
    age: userData.age || 0,
    height: userData.height || 0,
    initialWeight: userData.initialWeight || 0,
    goals: userData.goals || {},
    preferences: userData.preferences || {},
    settings: userData.settings || {},
    createTime: new Date(),
    updateTime: new Date()
  };

  await db.collection('users').add({
    data: newUser
  });
}

async function updateExistingUser(userId, updateData) {
  const updateFields = {
    updateTime: new Date()
  };

  // 只更新提供的字段
  Object.keys(updateData).forEach(key => {
    if (key !== 'healthMetrics') {
      updateFields[key] = updateData[key];
    }
  });

  await db.collection('users').where({ openId: userId }).update({
    data: updateFields
  });
}

async function updateHealthMetrics(userId, healthData) {
  const healthRecord = {
    userId: userId,
    date: healthData.date || new Date(),
    weight: healthData.weight || 0,
    bmi: calculateBMI(healthData.weight, healthData.height),
    bodyFat: healthData.bodyFat || 0,
    muscleMass: healthData.muscleMass || 0,
    waterContent: healthData.waterContent || 0,
    createTime: new Date()
  };

  await db.collection('health_metrics').add({
    data: healthRecord
  });
}

function calculateBMI(weight, height) {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}