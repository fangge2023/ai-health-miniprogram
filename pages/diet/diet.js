// pages/diet/diet.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');

Page({
  data: {
    // 日期相关
    selectedDate: '',
    dateDesc: '',
    
    // 热量统计
    totalCalories: 0,
    exerciseCalories: 0,
    targetCalories: 2000,
    remainingCalories: 0,
    consumedPercent: 0,
    burnedPercent: 0,
    
    // 营养素数据
    nutritionView: 'amount', // amount 或 percent
    nutritionData: {
      carbs: { amount: 0, percent: 0 },
      protein: { amount: 0, percent: 0 },
      fat: { amount: 0, percent: 0 }
    },
    
    // 餐次数据
    meals: [
      {
        type: 'breakfast',
        name: '早餐',
        icon: '🌅',
        totalCalories: 0,
        foods: [],
        expanded: false
      },
      {
        type: 'lunch',
        name: '午餐', 
        icon: '🌞',
        totalCalories: 0,
        foods: [],
        expanded: false
      },
      {
        type: 'dinner',
        name: '晚餐',
        icon: '🌙',
        totalCalories: 0,
        foods: [],
        expanded: false
      },
      {
        type: 'snack',
        name: '加餐',
        icon: '🍎',
        totalCalories: 0,
        foods: [],
        expanded: false
      }
    ],
    
    // 快捷食物
    quickFoods: [],
    
    // 浮动按钮
    fabExpanded: false,
    
    // 搜索弹窗
    showSearchModal: false,
    searchKeyword: '',
    searchFocus: false,
    searchResults: [],
    
    // 加载状态
    loading: true
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 初始化页面
  async initPage() {
    try {
      this.setCurrentDate();
      await Promise.all([
        this.loadTodayDietData(),
        this.loadQuickFoods(),
        this.loadUserCalorieTarget()
      ]);
    } catch (error) {
      console.error('页面初始化失败:', error);
      app.showError('页面加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 设置当前日期
  setCurrentDate() {
    const today = new Date();
    const selectedDate = util.formatDate(today, 'YYYY-MM-DD');
    const dateDesc = this.getDateDescription(today);
    
    this.setData({
      selectedDate,
      dateDesc
    });
  },

  // 获取日期描述
  getDateDescription(date) {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const dateStr = util.formatDate(date, 'YYYY-MM-DD');
    const todayStr = util.formatDate(today, 'YYYY-MM-DD');
    const yesterdayStr = util.formatDate(yesterday, 'YYYY-MM-DD');
    const tomorrowStr = util.formatDate(tomorrow, 'YYYY-MM-DD');
    
    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';
    if (dateStr === tomorrowStr) return '明天';
    
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[date.getDay()];
  },

  // 加载今日饮食数据
  async loadTodayDietData() {
    try {
      const result = await api.dietData.getTodayMeals();
      
      if (result && result.data) {
        this.processDietData(result.data);
      } else {
        this.initEmptyMeals();
      }
    } catch (error) {
      console.error('加载饮食数据失败:', error);
      this.initEmptyMeals();
    }
  },

  // 处理饮食数据
  processDietData(dietRecord) {
    const meals = this.data.meals.map(meal => ({
      ...meal,
      foods: [],
      totalCalories: 0
    }));
    
    let totalCalories = 0;
    let totalNutrition = {
      carbs: 0,
      protein: 0,
      fat: 0
    };

    if (dietRecord.meals && dietRecord.meals.length > 0) {
      dietRecord.meals.forEach(mealRecord => {
        const mealIndex = meals.findIndex(m => m.type === mealRecord.mealType);
        if (mealIndex !== -1) {
          meals[mealIndex].foods = mealRecord.foods || [];
          meals[mealIndex].totalCalories = mealRecord.totalCalories || 0;
          totalCalories += mealRecord.totalCalories || 0;
          
          // 累计营养素
          mealRecord.foods.forEach(food => {
            if (food.nutrition) {
              totalNutrition.carbs += food.nutrition.carbs || 0;
              totalNutrition.protein += food.nutrition.protein || 0;
              totalNutrition.fat += food.nutrition.fat || 0;
            }
          });
        }
      });
    }

    this.setData({
      meals,
      totalCalories
    });

    this.updateCalorieProgress();
    this.updateNutritionData(totalNutrition);
  },

  // 初始化空餐次
  initEmptyMeals() {
    const meals = this.data.meals.map(meal => ({
      ...meal,
      foods: [],
      totalCalories: 0
    }));
    
    this.setData({
      meals,
      totalCalories: 0
    });
    
    this.updateCalorieProgress();
    this.updateNutritionData({ carbs: 0, protein: 0, fat: 0 });
  },

  // 更新热量进度
  updateCalorieProgress() {
    const { totalCalories, exerciseCalories, targetCalories } = this.data;
    const remainingCalories = targetCalories - totalCalories + exerciseCalories;
    const consumedPercent = Math.min((totalCalories / targetCalories) * 100, 100);
    const burnedPercent = Math.min((exerciseCalories / targetCalories) * 100, 20);
    
    this.setData({
      remainingCalories,
      consumedPercent,
      burnedPercent
    });
  },

  // 更新营养数据
  updateNutritionData(nutrition) {
    const totalGrams = nutrition.carbs + nutrition.protein + nutrition.fat;
    
    const nutritionData = {
      carbs: {
        amount: Math.round(nutrition.carbs * 10) / 10,
        percent: totalGrams > 0 ? Math.round((nutrition.carbs / totalGrams) * 100) : 0
      },
      protein: {
        amount: Math.round(nutrition.protein * 10) / 10,
        percent: totalGrams > 0 ? Math.round((nutrition.protein / totalGrams) * 100) : 0
      },
      fat: {
        amount: Math.round(nutrition.fat * 10) / 10,
        percent: totalGrams > 0 ? Math.round((nutrition.fat / totalGrams) * 100) : 0
      }
    };
    
    this.setData({ nutritionData });
  },

  // 加载快捷食物
  async loadQuickFoods() {
    try {
      // 模拟快捷食物数据
      const quickFoods = [
        {
          id: 'quick_001',
          name: '香蕉',
          calories: 89,
          image: '/images/foods/banana.jpg'
        },
        {
          id: 'quick_002', 
          name: '苹果',
          calories: 52,
          image: '/images/foods/apple.jpg'
        },
        {
          id: 'quick_003',
          name: '鸡蛋',
          calories: 155,
          image: '/images/foods/egg.jpg'
        },
        {
          id: 'quick_004',
          name: '牛奶',
          calories: 64,
          image: '/images/foods/milk.jpg'
        }
      ];
      
      this.setData({ quickFoods });
    } catch (error) {
      console.error('加载快捷食物失败:', error);
    }
  },

  // 加载用户热量目标
  async loadUserCalorieTarget() {
    try {
      const result = await api.userData.getGoals();
      if (result && result.data && result.data.dailyCalories) {
        this.setData({
          targetCalories: result.data.dailyCalories
        });
        this.updateCalorieProgress();
      }
    } catch (error) {
      console.error('加载热量目标失败:', error);
    }
  },

  // 日期切换
  changeDate(e) {
    const direction = e.currentTarget.dataset.direction;
    const currentDate = new Date(this.data.selectedDate);
    
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const selectedDate = util.formatDate(currentDate, 'YYYY-MM-DD');
    const dateDesc = this.getDateDescription(currentDate);
    
    this.setData({
      selectedDate,
      dateDesc,
      loading: true
    });
    
    this.loadDietDataByDate(selectedDate);
  },

  // 日期选择
  pickDate() {
    wx.showModal({
      title: '功能提示',
      content: '日期选择功能开发中...',
      showCancel: false
    });
  },

  // 切换营养素视图
  switchNutritionView(e) {
    const view = e.currentTarget.dataset.view;
    this.setData({ nutritionView: view });
  },

  // 切换餐次展开状态
  toggleMeal(e) {
    const mealType = e.currentTarget.dataset.type;
    const meals = this.data.meals.map(meal => {
      if (meal.type === mealType) {
        return { ...meal, expanded: !meal.expanded };
      }
      return meal;
    });
    
    this.setData({ meals });
  },

  // 添加食物
  addFood(e) {
    const mealType = e.currentTarget.dataset.meal;
    this.setData({
      showSearchModal: true,
      searchFocus: true,
      selectedMealType: mealType
    });
  },

  // 编辑食物
  editFood(e) {
    const { meal, food } = e.currentTarget.dataset;
    wx.showModal({
      title: '功能提示',
      content: '食物编辑功能开发中...',
      showCancel: false
    });
  },

  // 删除食物
  deleteFood(e) {
    const { meal, food } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个食物记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.removeFoodFromMeal(meal, food);
        }
      }
    });
  },

  // 从餐次中移除食物
  removeFoodFromMeal(mealType, foodId) {
    const meals = this.data.meals.map(meal => {
      if (meal.type === mealType) {
        const foods = meal.foods.filter(food => food.id !== foodId);
        const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0);
        return { ...meal, foods, totalCalories };
      }
      return meal;
    });
    
    this.setData({ meals });
    this.recalculateTotal();
    app.showToast('删除成功');
  },

  // 快捷添加食物
  quickAdd(e) {
    const food = e.currentTarget.dataset.food;
    // 默认添加到当前时间对应的餐次
    const currentHour = new Date().getHours();
    let mealType = 'snack';
    
    if (currentHour >= 6 && currentHour < 11) {
      mealType = 'breakfast';
    } else if (currentHour >= 11 && currentHour < 17) {
      mealType = 'lunch';
    } else if (currentHour >= 17 && currentHour < 22) {
      mealType = 'dinner';
    }
    
    this.addFoodToMeal(mealType, {
      ...food,
      amount: 100,
      unit: 'g'
    });
  },

  // 切换浮动按钮
  toggleFab() {
    this.setData({
      fabExpanded: !this.data.fabExpanded
    });
  },

  // 搜索食物
  searchFood() {
    if (!this.data.searchKeyword.trim()) {
      app.showToast('请输入搜索关键词');
      return;
    }
    
    this.performFoodSearch(this.data.searchKeyword);
  },

  // 执行食物搜索
  async performFoodSearch(keyword) {
    try {
      app.showLoading('搜索中...');
      
      const result = await api.dietData.searchFood(keyword, 1, 10);
      
      if (result && result.data && result.data.foods) {
        this.setData({
          searchResults: result.data.foods
        });
      } else {
        this.setData({
          searchResults: []
        });
      }
    } catch (error) {
      console.error('搜索食物失败:', error);
      app.showError('搜索失败，请重试');
    } finally {
      app.hideLoading();
    }
  },

  // 扫码添加
  scanBarcode() {
    wx.scanCode({
      success: (res) => {
        wx.showModal({
          title: '扫码结果',
          content: `扫码功能开发中...\n条码：${res.result}`,
          showCancel: false
        });
      },
      fail: () => {
        app.showError('扫码失败');
      }
    });
    
    this.setData({ fabExpanded: false });
  },

  // 自定义食物
  customFood() {
    wx.showModal({
      title: '功能提示',
      content: '自定义食物功能开发中...',
      showCancel: false
    });
    
    this.setData({ fabExpanded: false });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 选择食物
  selectFood(e) {
    const food = e.currentTarget.dataset.food;
    
    // 显示食物详情和添加界面
    wx.showModal({
      title: food.name,
      content: `热量：${food.calories}kcal/100g\n请确认添加到${this.getMealName(this.data.selectedMealType)}`,
      success: (res) => {
        if (res.confirm) {
          this.addFoodToMeal(this.data.selectedMealType, {
            ...food,
            amount: 100,
            unit: 'g'
          });
          this.closeSearchModal();
        }
      }
    });
  },

  // 添加食物到餐次
  addFoodToMeal(mealType, foodData) {
    const meals = this.data.meals.map(meal => {
      if (meal.type === mealType) {
        const newFood = {
          id: util.generateId(),
          name: foodData.name,
          amount: foodData.amount || 100,
          unit: foodData.unit || 'g',
          calories: Math.round((foodData.calories || 0) * (foodData.amount || 100) / 100),
          nutrition: foodData.nutrition || {},
          image: foodData.image
        };
        
        const foods = [...meal.foods, newFood];
        const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0);
        
        return { ...meal, foods, totalCalories, expanded: true };
      }
      return meal;
    });
    
    this.setData({ meals });
    this.recalculateTotal();
    app.showToast('添加成功');
  },

  // 获取餐次名称
  getMealName(mealType) {
    const meal = this.data.meals.find(m => m.type === mealType);
    return meal ? meal.name : '加餐';
  },

  // 重新计算总热量
  recalculateTotal() {
    let totalCalories = 0;
    let totalNutrition = {
      carbs: 0,
      protein: 0,
      fat: 0
    };
    
    this.data.meals.forEach(meal => {
      totalCalories += meal.totalCalories || 0;
      
      meal.foods.forEach(food => {
        if (food.nutrition) {
          const ratio = (food.amount || 100) / 100;
          totalNutrition.carbs += (food.nutrition.carbs || 0) * ratio;
          totalNutrition.protein += (food.nutrition.protein || 0) * ratio;
          totalNutrition.fat += (food.nutrition.fat || 0) * ratio;
        }
      });
    });
    
    this.setData({ totalCalories });
    this.updateCalorieProgress();
    this.updateNutritionData(totalNutrition);
  },

  // 关闭搜索弹窗
  closeSearchModal() {
    this.setData({
      showSearchModal: false,
      searchKeyword: '',
      searchResults: [],
      searchFocus: false
    });
  },

  // 创建自定义食物
  createCustomFood() {
    wx.showModal({
      title: '功能提示',
      content: '自定义食物创建功能开发中...',
      showCancel: false
    });
  },

  // 按日期加载饮食数据
  async loadDietDataByDate(date) {
    try {
      // 这里应该根据日期加载对应的饮食数据
      // 目前使用今日数据
      await this.loadTodayDietData();
    } catch (error) {
      console.error('加载指定日期数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({ loading: true });
    try {
      await this.loadTodayDietData();
      app.showToast('刷新成功');
    } catch (error) {
      app.showError('刷新失败');
    } finally {
      this.setData({ loading: false });
    }
  }
});