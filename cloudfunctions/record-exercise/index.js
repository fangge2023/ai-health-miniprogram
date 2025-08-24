// cloudfunctions/record-exercise/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, exerciseData } = event;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  if (!exerciseData) {
    return {
      success: false,
      error: '运动数据不能为空'
    };
  }

  try {
    const recordId = await recordExercise(userId, exerciseData);
    const achievements = await checkAchievements(userId, exerciseData);

    return {
      success: true,
      data: {
        recordId: recordId,
        caloriesBurned: exerciseData.caloriesBurned || 0,
        achievements: achievements,
        message: '运动记录已保存'
      }
    };

  } catch (error) {
    console.error('记录运动失败:', error);
    return {
      success: false,
      error: error.message || '记录运动失败'
    };
  }
};

async function recordExercise(userId, exerciseData) {
  const today = new Date().toISOString().split('T')[0];
  
  // 查找今日是否已有记录
  const existingResult = await db.collection('exercise_records').where({
    userId: userId,
    date: today
  }).get();

  const exerciseRecord = {
    id: generateId(),
    exerciseType: exerciseData.exerciseType,
    exerciseName: exerciseData.exerciseName,
    startTime: exerciseData.startTime || new Date(),
    endTime: exerciseData.endTime || new Date(),
    duration: exerciseData.duration || 0,
    intensity: exerciseData.intensity || 'medium',
    caloriesBurned: exerciseData.caloriesBurned || 0,
    distance: exerciseData.distance || 0,
    steps: exerciseData.steps || 0,
    notes: exerciseData.notes || ''
  };

  if (existingResult.data.length > 0) {
    // 更新现有记录
    const existingRecord = existingResult.data[0];
    const updatedExercises = [...(existingRecord.exercises || []), exerciseRecord];
    const totalDuration = updatedExercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    const totalCaloriesBurned = updatedExercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
    const totalSteps = updatedExercises.reduce((sum, ex) => sum + (ex.steps || 0), 0);

    await db.collection('exercise_records').doc(existingRecord._id).update({
      data: {
        exercises: updatedExercises,
        totalDuration: totalDuration,
        totalCaloriesBurned: totalCaloriesBurned,
        totalSteps: totalSteps,
        updateTime: new Date()
      }
    });

    return exerciseRecord.id;
  } else {
    // 创建新记录
    const newRecord = {
      userId: userId,
      date: today,
      exercises: [exerciseRecord],
      totalDuration: exerciseRecord.duration,
      totalCaloriesBurned: exerciseRecord.caloriesBurned,
      totalSteps: exerciseRecord.steps,
      createTime: new Date()
    };

    const result = await db.collection('exercise_records').add({
      data: newRecord
    });

    return exerciseRecord.id;
  }
}

async function checkAchievements(userId, exerciseData) {
  const achievements = [];
  
  // 检查时长成就
  if (exerciseData.duration >= 30) {
    achievements.push('30分钟运动达成');
  }
  
  if (exerciseData.duration >= 60) {
    achievements.push('1小时运动达成');
  }
  
  // 检查热量成就
  if (exerciseData.caloriesBurned >= 100) {
    achievements.push('消耗100卡路里');
  }
  
  if (exerciseData.caloriesBurned >= 300) {
    achievements.push('消耗300卡路里');
  }

  // 检查连续运动天数
  const recentRecords = await db.collection('exercise_records')
    .where({ userId })
    .orderBy('date', 'desc')
    .limit(7)
    .get();

  if (recentRecords.data.length >= 3) {
    achievements.push('连续运动3天');
  }

  if (recentRecords.data.length >= 7) {
    achievements.push('连续运动一周');
  }

  return achievements;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}