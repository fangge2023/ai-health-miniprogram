/**
 * 工具函数库
 */

// 格式化日期
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
};

// 计算BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

// 获取BMI状态
const getBMIStatus = (bmi) => {
  if (bmi < 18.5) return { status: '偏瘦', color: '#2196F3' };
  if (bmi < 24) return { status: '正常', color: '#4CAF50' };
  if (bmi < 28) return { status: '超重', color: '#FF9800' };
  return { status: '肥胖', color: '#F44336' };
};

// 计算基础代谢率(BMR)
const calculateBMR = (weight, height, age, gender) => {
  if (!weight || !height || !age) return 0;
  
  if (gender === 'male') {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  } else {
    return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  }
};

// 计算每日热量需求(TDEE)
const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,      // 久坐
    light: 1.375,        // 轻度活动
    moderate: 1.55,      // 中等活动
    active: 1.725,       // 重度活动
    extra: 1.9           // 极重度活动
  };
  
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

// 计算减肥所需热量缺口
const calculateCalorieDeficit = (currentWeight, targetWeight, weeks) => {
  const weightLoss = currentWeight - targetWeight;
  const totalCalorieDeficit = weightLoss * 7700; // 1kg脂肪 ≈ 7700卡路里
  const dailyDeficit = totalCalorieDeficit / (weeks * 7);
  return Math.round(dailyDeficit);
};

// 格式化数字
const formatNumber = (num, decimals = 0) => {
  if (!num && num !== 0) return '0';
  return Number(num).toFixed(decimals);
};

// 格式化热量
const formatCalories = (calories) => {
  if (!calories && calories !== 0) return '0';
  return Math.round(calories).toLocaleString();
};

// 格式化体重
const formatWeight = (weight) => {
  if (!weight && weight !== 0) return '0.0';
  return Number(weight).toFixed(1);
};

// 获取时间问候语
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

// 获取相对时间
const getRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  
  return formatDate(date);
};

// 验证手机号
const validatePhone = (phone) => {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
};

// 验证邮箱
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// 验证体重范围
const validateWeight = (weight) => {
  return weight >= 30 && weight <= 300;
};

// 验证身高范围
const validateHeight = (height) => {
  return height >= 100 && height <= 250;
};

// 验证年龄范围
const validateAge = (age) => {
  return age >= 10 && age <= 100;
};

// 获取运动消耗热量(每分钟)
const getExerciseCaloriesPerMinute = (exerciseType, weight = 60) => {
  const metValues = {
    'walking': 3.5,      // 步行
    'running': 8.0,      // 跑步
    'cycling': 6.0,      // 骑行
    'swimming': 7.0,     // 游泳
    'yoga': 2.5,         // 瑜伽
    'strength': 5.0,     // 力量训练
    'dancing': 4.0,      // 舞蹈
    'basketball': 8.0,   // 篮球
    'soccer': 9.0,       // 足球
    'tennis': 7.0,       // 网球
    'badminton': 5.5,    // 羽毛球
    'pingpong': 4.0,     // 乒乓球
    'hiking': 6.0,       // 徒步
    'climbing': 8.0      // 爬山
  };
  
  const met = metValues[exerciseType] || 3.5;
  return (met * weight * 3.5) / 200; // MET公式计算每分钟消耗热量
};

// 计算运动消耗总热量
const calculateExerciseCalories = (exerciseType, duration, weight = 60) => {
  const caloriesPerMinute = getExerciseCaloriesPerMinute(exerciseType, weight);
  return Math.round(caloriesPerMinute * duration);
};

// 获取食物营养密度等级
const getNutritionDensity = (calories, protein, fiber, vitamins = 0) => {
  if (!calories) return 'unknown';
  
  const proteinRatio = (protein * 4) / calories;
  const fiberScore = fiber * 2;
  const score = proteinRatio * 100 + fiberScore + vitamins;
  
  if (score >= 20) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
};

// 节流函数
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
};

// 防抖函数
const debounce = (func, wait, immediate) => {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

module.exports = {
  formatDate,
  calculateBMI,
  getBMIStatus,
  calculateBMR,
  calculateTDEE,
  calculateCalorieDeficit,
  formatNumber,
  formatCalories,
  formatWeight,
  getGreeting,
  getRelativeTime,
  validatePhone,
  validateEmail,
  validateWeight,
  validateHeight,
  validateAge,
  getExerciseCaloriesPerMinute,
  calculateExerciseCalories,
  getNutritionDensity,
  throttle,
  debounce,
  deepClone,
  generateId
};