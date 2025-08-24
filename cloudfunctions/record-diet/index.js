// cloudfunctions/record-diet/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 饮食记录云函数
exports.main = async (event, context) => {
  const { userId, mealData } = event;

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }

  if (!mealData) {
    return {
      success: false,
      error: '饮食数据不能为空'
    };
  }

  try {
    const recordId = await recordMeal(userId, mealData);
    const nutritionAnalysis = await analyzeNutrition(userId, mealData);

    return {
      success: true,
      data: {
        recordId: recordId,
        calories: mealData.calories || 0,
        nutritionAnalysis: nutritionAnalysis,
        message: '饮食记录已保存'
      }
    };

  } catch (error) {
    console.error('记录饮食失败:', error);
    return {
      success: false,
      error: error.message || '记录饮食失败'
    };
  }
};

// 记录饮食
async function recordMeal(userId, mealData) {
  const today = new Date().toISOString().split('T')[0];
  
  // 查找今日是否已有记录
  const existingResult = await db.collection('diet_records').where({
    userId: userId,
    date: today
  }).get();

  const mealRecord = {
    id: generateId(),
    mealType: mealData.mealType || 'other',
    mealName: mealData.mealName || '',
    foods: mealData.foods || [],
    calories: mealData.calories || 0,
    protein: mealData.protein || 0,
    carbs: mealData.carbs || 0,
    fat: mealData.fat || 0,
    fiber: mealData.fiber || 0,
    sugar: mealData.sugar || 0,
    sodium: mealData.sodium || 0,
    notes: mealData.notes || '',
    timestamp: new Date()
  };

  if (existingResult.data.length > 0) {
    // 更新现有记录
    const existingRecord = existingResult.data[0];
    const updatedMeals = [...(existingRecord.meals || []), mealRecord];
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = updatedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = updatedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

    await db.collection('diet_records').doc(existingRecord._id).update({
      data: {
        meals: updatedMeals,
        totalCalories: totalCalories,
        totalProtein: totalProtein,
        totalCarbs: totalCarbs,
        totalFat: totalFat,
        updateTime: new Date()
      }
    });

    return mealRecord.id;
  } else {
    // 创建新记录
    const newRecord = {
      userId: userId,
      date: today,
      meals: [mealRecord],
      totalCalories: mealRecord.calories,
      totalProtein: mealRecord.protein,
      totalCarbs: mealRecord.carbs,
      totalFat: mealRecord.fat,
      createTime: new Date()
    };

    const result = await db.collection('diet_records').add({
      data: newRecord
    });

    return mealRecord.id;
  }
}

// 营养分析
async function analyzeNutrition(userId, mealData) {
  const analysis = {
    mealType: mealData.mealType,
    totalCalories: mealData.calories || 0,
    proteinPercentage: 0,
    carbsPercentage: 0,
    fatPercentage: 0,
    healthScore: 0,
    recommendations: []
  };

  // 计算营养比例
  const totalMacros = (mealData.protein || 0) + (mealData.carbs || 0) + (mealData.fat || 0);
  if (totalMacros > 0) {
    analysis.proteinPercentage = Math.round((mealData.protein / totalMacros) * 100);
    analysis.carbsPercentage = Math.round((mealData.carbs / totalMacros) * 100);
    analysis.fatPercentage = Math.round((mealData.fat / totalMacros) * 100);
  }

  // 计算健康评分 (0-100)
  analysis.healthScore = calculateHealthScore(mealData);

  // 生成建议
  analysis.recommendations = generateNutritionRecommendations(mealData, analysis);

  return analysis;
}

// 计算健康评分
function calculateHealthScore(mealData) {
  let score = 80; // 基础分

  // 热量评分
  const calories = mealData.calories || 0;
  if (calories > 800) score -= 20;
  else if (calories > 600) score -= 10;
  else if (calories < 300) score += 10;

  // 蛋白质评分
  const protein = mealData.protein || 0;
  if (protein > 20) score += 10;
  else if (protein < 10) score -= 5;

  // 脂肪评分
  const fat = mealData.fat || 0;
  if (fat > 20) score -= 15;
  else if (fat < 5) score += 5;

  // 纤维评分
  const fiber = mealData.fiber || 0;
  if (fiber > 5) score += 10;
  else if (fiber < 2) score -= 5;

  // 糖分评分
  const sugar = mealData.sugar || 0;
  if (sugar > 15) score -= 15;
  else if (sugar < 5) score += 5;

  return Math.max(0, Math.min(100, score));
}

// 生成营养建议
function generateNutritionRecommendations(mealData, analysis) {
  const recommendations = [];

  // 热量建议
  if (mealData.calories > 800) {
    recommendations.push('这餐热量较高，建议下一餐适当减少热量摄入');
  } else if (mealData.calories < 300) {
    recommendations.push('这餐热量较低，可以适当增加营养摄入');
  }

  // 蛋白质建议
  if (analysis.proteinPercentage < 15) {
    recommendations.push('蛋白质摄入不足，建议增加蛋白质食物');
  } else if (analysis.proteinPercentage > 35) {
    recommendations.push('蛋白质摄入较高，建议均衡其他营养素');
  }

  // 脂肪建议
  if (analysis.fatPercentage > 35) {
    recommendations.push('脂肪摄入偏高，建议选择更健康的脂肪来源');
  }

  // 纤维建议
  if (mealData.fiber < 3) {
    recommendations.push('膳食纤维摄入不足，建议增加蔬菜水果');
  }

  // 糖分建议
  if (mealData.sugar > 20) {
    recommendations.push('糖分摄入较高，建议减少添加糖的摄入');
  }

  // 根据餐型给出建议
  if (mealData.mealType === 'breakfast') {
    recommendations.push('早餐应该包含充足的蛋白质和复合碳水化合物');
  } else if (mealData.mealType === 'lunch') {
    recommendations.push('午餐应该营养均衡，包含蛋白质、碳水化合物和蔬菜');
  } else if (mealData.mealType === 'dinner') {
    recommendations.push('晚餐应该清淡易消化，避免过多热量摄入');
  } else if (mealData.mealType === 'snack') {
    recommendations.push('零食应该选择健康的选项，如水果、坚果等');
  }

  return recommendations.slice(0, 3); // 最多返回3条建议
}

// 生成ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 获取用户目标
async function getUserGoals(userId) {
  try {
    const result = await db.collection('users').where({
      openId: userId
    }).get();

    const user = result.data[0];
    return user?.goals || {
      targetCalories: 1800,
      targetProtein: 70,
      targetCarbs: 200,
      targetFat: 60
    };

  } catch (error) {
    console.error('获取用户目标失败:', error);
    return {
      targetCalories: 1800,
      targetProtein: 70,
      targetCarbs: 200,
      targetFat: 60
    };
  }
}

// 检查是否达到目标
async function checkGoalsAchievement(userId, mealData) {
  try {
    const goals = await getUserGoals(userId);
    const today = new Date().toISOString().split('T')[0];

    // 获取今日总摄入
    const result = await db.collection('diet_records').where({
      userId: userId,
      date: today
    }).get();

    let totalCalories = mealData.calories || 0;
    let totalProtein = mealData.protein || 0;
    let totalCarbs = mealData.carbs || 0;
    let totalFat = mealData.fat || 0;

    if (result.data.length > 0) {
      const record = result.data[0];
      totalCalories += record.totalCalories || 0;
      totalProtein += record.totalProtein || 0;
      totalCarbs += record.totalCarbs || 0;
      totalFat += record.totalFat || 0;
    }

    const achievements = [];

    if (totalCalories <= goals.targetCalories) {
      achievements.push('热量目标达成');
    }

    if (totalProtein >= goals.targetProtein * 0.8) {
      achievements.push('蛋白质目标达成');
    }

    return achievements;

  } catch (error) {
    console.error('检查目标达成失败:', error);
    return [];
  }
}