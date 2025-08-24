// cloudfunctions/ai-chat/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// AI聊天云函数
exports.main = async (event, context) => {
  const { userMessage, context: conversationContext, userId, action } = event;

  try {
    // 根据不同的action执行不同操作
    switch (action) {
      case 'getHistory':
        return await getChatHistory(userId, event.limit);
      case 'getExerciseRecommendations':
        return await getExerciseRecommendations(userId);
      default:
        return await processChatMessage(userMessage, conversationContext, userId);
    }
  } catch (error) {
    console.error('AI聊天处理失败:', error);
    return {
      success: false,
      error: error.message || '处理失败'
    };
  }
};

// 处理聊天消息
async function processChatMessage(userMessage, conversationContext, userId) {
  if (!userMessage || !userMessage.trim()) {
    throw new Error('消息内容不能为空');
  }

  try {
    // 获取用户数据用于个性化回复
    const userData = await getUserContextData(userId);
    
    // 构建AI请求上下文
    const aiContext = buildAIContext(userMessage, conversationContext, userData);
    
    // 调用AI服务 (这里需要集成实际的AI服务API)
    const aiResponse = await callAIService(aiContext);
    
    // 保存对话记录
    await saveChatRecord(userId, userMessage, aiResponse);
    
    // 生成相关建议
    const suggestions = generateSuggestions(userMessage, aiResponse, userData);
    
    return {
      success: true,
      aiResponse: aiResponse,
      suggestions: suggestions,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('处理聊天消息失败:', error);
    throw error;
  }
}

// 获取用户上下文数据
async function getUserContextData(userId) {
  if (!userId) return null;
  
  try {
    // 获取用户基本信息
    const userResult = await db.collection('users').where({
      openId: userId
    }).get();
    
    const userData = userResult.data[0] || {};
    
    // 获取最近的健康数据
    const healthResult = await db.collection('health_metrics').where({
      userId: userId
    }).orderBy('date', 'desc').limit(1).get();
    
    const healthData = healthResult.data[0] || {};
    
    // 获取最近的饮食数据
    const dietResult = await db.collection('diet_records').where({
      userId: userId
    }).orderBy('date', 'desc').limit(3).get();
    
    const dietData = dietResult.data || [];
    
    // 获取最近的运动数据
    const exerciseResult = await db.collection('exercise_records').where({
      userId: userId
    }).orderBy('date', 'desc').limit(3).get();
    
    const exerciseData = exerciseResult.data || [];
    
    return {
      user: userData,
      health: healthData,
      diet: dietData,
      exercise: exerciseData
    };
    
  } catch (error) {
    console.error('获取用户上下文数据失败:', error);
    return null;
  }
}

// 构建AI请求上下文
function buildAIContext(userMessage, conversationContext, userData) {
  let context = `你是一个专业的健康减肥AI助手，请根据用户的问题和数据提供专业、个性化的建议。\n\n`;
  
  // 添加用户基本信息
  if (userData && userData.user) {
    const user = userData.user;
    context += `用户信息：\n`;
    context += `- 性别：${user.gender || '未知'}\n`;
    context += `- 年龄：${user.age || '未知'}岁\n`;
    context += `- 身高：${user.height || '未知'}cm\n`;
    context += `- 减肥目标：${user.goals?.targetWeight || '未设置'}kg\n\n`;
  }
  
  // 添加健康数据
  if (userData && userData.health) {
    const health = userData.health;
    context += `最新健康数据：\n`;
    context += `- 体重：${health.weight || '未知'}kg\n`;
    context += `- BMI：${health.bmi || '未知'}\n`;
    context += `- 体脂率：${health.bodyFat || '未知'}%\n\n`;
  }
  
  // 添加最近饮食情况
  if (userData && userData.diet && userData.diet.length > 0) {
    context += `最近饮食情况：\n`;
    userData.diet.forEach((record, index) => {
      context += `- ${record.date}：摄入${record.totalCalories || 0}kcal\n`;
    });
    context += '\n';
  }
  
  // 添加最近运动情况
  if (userData && userData.exercise && userData.exercise.length > 0) {
    context += `最近运动情况：\n`;
    userData.exercise.forEach((record, index) => {
      context += `- ${record.date}：运动${record.totalDuration || 0}分钟，消耗${record.totalCaloriesBurned || 0}kcal\n`;
    });
    context += '\n';
  }
  
  // 添加对话历史
  if (conversationContext && conversationContext.length > 0) {
    context += `对话历史：\n`;
    const recentContext = conversationContext.slice(-6); // 最近3轮对话
    recentContext.forEach(msg => {
      context += `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}\n`;
    });
    context += '\n';
  }
  
  context += `用户当前问题：${userMessage}\n\n`;
  context += `请提供专业、个性化的回答，如果是关于饮食或运动的问题，请给出具体的建议。`;
  
  return context;
}

// 调用AI服务 (模拟实现，实际需要集成真实AI API)
async function callAIService(context) {
  // 这里应该调用实际的AI服务API，如腾讯云AI、OpenAI等
  // 目前使用模拟响应
  
  const responses = {
    '饮食': '根据您的数据，建议您每日摄入热量控制在1800-2000kcal之间。可以多吃蛋白质丰富的食物如鸡胸肉、鱼类和豆制品，同时增加蔬菜摄入量，减少精制碳水化合物。',
    '运动': '建议您每周进行3-4次有氧运动，如快走、慢跑或游泳，每次30-45分钟。同时可以加入一些力量训练来提高基础代谢率。',
    '体重': '您的减肥进度很好！建议继续保持当前的饮食和运动习惯，每周减重0.5-1kg是健康的减重速度。',
    '计划': '我为您制定了个性化的健康计划：\n1. 每日热量控制在目标范围内\n2. 每周运动3-4次\n3. 保证充足的睡眠\n4. 多喝水，每日至少2000ml'
  };
  
  // 简单的关键词匹配
  for (const [keyword, response] of Object.entries(responses)) {
    if (context.includes(keyword)) {
      return response;
    }
  }
  
  return '感谢您的提问！作为您的健康助手，我建议您保持规律的饮食和运动习惯。如果您有具体的健康问题，请详细描述，我会为您提供更精准的建议。';
}

// 保存聊天记录
async function saveChatRecord(userId, userMessage, aiResponse) {
  if (!userId) return;
  
  try {
    await db.collection('ai_conversations').add({
      data: {
        userId: userId,
        messages: [
          {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          }
        ],
        createTime: new Date()
      }
    });
  } catch (error) {
    console.error('保存聊天记录失败:', error);
  }
}

// 生成相关建议
function generateSuggestions(userMessage, aiResponse, userData) {
  const suggestions = [];
  
  if (userMessage.includes('饮食') || userMessage.includes('吃')) {
    suggestions.push('查看今日饮食记录');
    suggestions.push('搜索健康食谱');
    suggestions.push('计算食物热量');
  }
  
  if (userMessage.includes('运动') || userMessage.includes('锻炼')) {
    suggestions.push('记录运动数据');
    suggestions.push('查看运动计划');
    suggestions.push('计算消耗热量');
  }
  
  if (userMessage.includes('体重') || userMessage.includes('减肥')) {
    suggestions.push('记录当前体重');
    suggestions.push('查看体重趋势');
    suggestions.push('调整减肥目标');
  }
  
  return suggestions.slice(0, 3); // 最多返回3个建议
}

// 获取聊天历史
async function getChatHistory(userId, limit = 20) {
  if (!userId) {
    throw new Error('用户ID不能为空');
  }
  
  try {
    const result = await db.collection('ai_conversations').where({
      userId: userId
    }).orderBy('createTime', 'desc').limit(limit).get();
    
    const history = [];
    result.data.forEach(record => {
      record.messages.forEach(msg => {
        history.push({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        });
      });
    });
    
    return {
      success: true,
      data: history.reverse() // 按时间正序排列
    };
    
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    throw error;
  }
}

// 获取运动建议
async function getExerciseRecommendations(userId) {
  try {
    const userData = await getUserContextData(userId);
    
    const recommendations = [
      '有氧运动：每周3-4次，每次30-45分钟的快走或慢跑',
      '力量训练：每周2-3次，包括深蹲、俯卧撑等基础动作',
      '柔韧性训练：每天10-15分钟的拉伸运动',
      '日常活动：尽量增加日常活动量，如爬楼梯、步行等'
    ];
    
    return {
      success: true,
      recommendations: recommendations
    };
    
  } catch (error) {
    console.error('获取运动建议失败:', error);
    throw error;
  }
}