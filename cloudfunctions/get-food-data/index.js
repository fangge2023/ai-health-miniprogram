// cloudfunctions/get-food-data/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 食物数据云函数
exports.main = async (event, context) => {
  const { action, foodName, quantity, keyword, page, limit } = event;

  try {
    switch (action) {
      case 'search':
        return await searchFood(keyword, page, limit);
      default:
        return await getFoodNutrition(foodName, quantity);
    }
  } catch (error) {
    console.error('获取食物数据失败:', error);
    return {
      success: false,
      error: error.message || '获取食物数据失败'
    };
  }
};

// 获取食物营养信息
async function getFoodNutrition(foodName, quantity = 100) {
  if (!foodName) {
    throw new Error('食物名称不能为空');
  }

  try {
    // 首先从本地数据库查找
    const localResult = await searchLocalFoodDatabase(foodName);
    
    if (localResult) {
      return calculateNutrition(localResult, quantity);
    }
    
    // 如果本地没有，调用外部API
    const apiResult = await callNutritionAPI(foodName);
    
    if (apiResult) {
      // 保存到本地数据库
      await saveFoodToDatabase(apiResult);
      return calculateNutrition(apiResult, quantity);
    }
    
    throw new Error('未找到该食物的营养信息');
    
  } catch (error) {
    console.error('获取食物营养信息失败:', error);
    throw error;
  }
}

// 搜索本地食物数据库
async function searchLocalFoodDatabase(foodName) {
  try {
    const result = await db.collection('food_database').where({
      name: db.RegExp({
        regexp: foodName,
        options: 'i'
      })
    }).limit(1).get();
    
    return result.data[0] || null;
    
  } catch (error) {
    console.error('搜索本地数据库失败:', error);
    return null;
  }
}

// 调用外部营养API (模拟实现)
async function callNutritionAPI(foodName) {
  // 这里应该调用真实的营养数据API
  // 目前使用模拟数据
  
  const mockFoodData = {
    '苹果': {
      name: '苹果',
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      fiber: 2.4,
      sugar: 10.4,
      sodium: 1,
      category: '水果',
      image: '/images/foods/apple.jpg'
    },
    '香蕉': {
      name: '香蕉',
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12.2,
      sodium: 1,
      category: '水果',
      image: '/images/foods/banana.jpg'
    },
    '鸡胸肉': {
      name: '鸡胸肉',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      category: '肉类',
      image: '/images/foods/chicken-breast.jpg'
    },
    '白米饭': {
      name: '白米饭',
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      sodium: 1,
      category: '主食',
      image: '/images/foods/rice.jpg'
    },
    '西兰花': {
      name: '西兰花',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      fiber: 2.6,
      sugar: 1.5,
      sodium: 33,
      category: '蔬菜',
      image: '/images/foods/broccoli.jpg'
    }
  };

  // 模糊匹配
  for (const [key, value] of Object.entries(mockFoodData)) {
    if (foodName.includes(key) || key.includes(foodName)) {
      return {
        ...value,
        id: generateFoodId(value.name),
        source: 'api',
        updateTime: new Date()
      };
    }
  }
  
  return null;
}

// 保存食物到数据库
async function saveFoodToDatabase(foodData) {
  try {
    await db.collection('food_database').add({
      data: {
        ...foodData,
        createTime: new Date()
      }
    });
  } catch (error) {
    console.error('保存食物数据失败:', error);
  }
}

// 计算营养信息
function calculateNutrition(foodData, quantity) {
  const ratio = quantity / 100; // 以100g为基准
  
  const nutrition = {
    name: foodData.name,
    quantity: quantity,
    unit: 'g',
    calories: Math.round(foodData.calories * ratio),
    protein: Math.round(foodData.protein * ratio * 10) / 10,
    carbs: Math.round(foodData.carbs * ratio * 10) / 10,
    fat: Math.round(foodData.fat * ratio * 10) / 10,
    fiber: Math.round(foodData.fiber * ratio * 10) / 10,
    sugar: Math.round(foodData.sugar * ratio * 10) / 10,
    sodium: Math.round(foodData.sodium * ratio),
    category: foodData.category,
    image: foodData.image
  };

  return {
    success: true,
    data: {
      nutritionInfo: nutrition,
      recommendations: generateFoodRecommendations(nutrition)
    }
  };
}

// 生成食物建议
function generateFoodRecommendations(nutrition) {
  const recommendations = [];
  
  if (nutrition.calories > 200) {
    recommendations.push('该食物热量较高，建议适量食用');
  }
  
  if (nutrition.protein > 10) {
    recommendations.push('富含蛋白质，有助于肌肉合成');
  }
  
  if (nutrition.fiber > 3) {
    recommendations.push('富含膳食纤维，有助于消化');
  }
  
  if (nutrition.sodium > 200) {
    recommendations.push('钠含量较高，注意控制摄入量');
  }
  
  if (nutrition.sugar > 10) {
    recommendations.push('糖分较高，减肥期间建议少量食用');
  }
  
  return recommendations;
}

// 搜索食物
async function searchFood(keyword, page = 1, limit = 10) {
  if (!keyword) {
    throw new Error('搜索关键词不能为空');
  }

  try {
    const skip = (page - 1) * limit;
    
    // 搜索本地数据库
    const result = await db.collection('food_database').where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).skip(skip).limit(limit).get();
    
    const foods = result.data.map(food => ({
      id: food._id,
      name: food.name,
      calories: food.calories,
      category: food.category,
      image: food.image
    }));
    
    // 如果本地搜索结果不足，可以调用外部API补充
    if (foods.length < limit) {
      const apiResults = await searchExternalAPI(keyword, limit - foods.length);
      foods.push(...apiResults);
    }
    
    return {
      success: true,
      data: {
        foods: foods,
        page: page,
        hasMore: foods.length === limit
      }
    };
    
  } catch (error) {
    console.error('搜索食物失败:', error);
    throw error;
  }
}

// 搜索外部API (模拟实现)
async function searchExternalAPI(keyword, limit) {
  // 模拟外部API搜索结果
  const mockResults = [
    {
      id: 'ext_001',
      name: `${keyword}相关食物1`,
      calories: 100,
      category: '其他',
      image: '/images/foods/default.jpg'
    },
    {
      id: 'ext_002',
      name: `${keyword}相关食物2`,
      calories: 150,
      category: '其他',
      image: '/images/foods/default.jpg'
    }
  ];
  
  return mockResults.slice(0, limit);
}

// 生成食物ID
function generateFoodId(name) {
  return name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
}

// 获取热门食物
async function getPopularFoods(limit = 20) {
  try {
    const result = await db.collection('food_database').orderBy('searchCount', 'desc').limit(limit).get();
    
    return {
      success: true,
      data: result.data
    };
    
  } catch (error) {
    console.error('获取热门食物失败:', error);
    throw error;
  }
}

// 更新食物搜索次数
async function updateFoodSearchCount(foodId) {
  try {
    await db.collection('food_database').doc(foodId).update({
      data: {
        searchCount: db.command.inc(1),
        lastSearchTime: new Date()
      }
    });
  } catch (error) {
    console.error('更新搜索次数失败:', error);
  }
}