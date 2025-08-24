// pages/food-search/food-search.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');

Page({
  data: {
    searchKeyword: '',
    searchFocus: false,
    searchResults: [],
    searchSuggestions: [],
    loading: false,
    loadingMore: false,
    hasMore: false,
    page: 1,
    
    // 分类
    categories: [
      { id: 'fruit', name: '水果', icon: '🍎' },
      { id: 'vegetable', name: '蔬菜', icon: '🥬' },
      { id: 'meat', name: '肉类', icon: '🥩' },
      { id: 'seafood', name: '海鲜', icon: '🐟' },
      { id: 'grain', name: '谷物', icon: '🌾' },
      { id: 'dairy', name: '乳制品', icon: '🥛' },
      { id: 'snack', name: '零食', icon: '🍿' },
      { id: 'beverage', name: '饮品', icon: '🥤' }
    ],
    selectedCategory: 'all',
    
    // 排序
    sortBy: 'relevance', // relevance, calories, popularity
    
    // 热门食物
    popularFoods: [],
    
    // 最近搜索
    recentSearches: [],
    
    // 食物详情
    showFoodDetail: false,
    selectedFood: {},
    selectedAmount: 100,
    calculatedNutrition: {},
    selectedMeal: 'breakfast',
    mealTypes: [
      { type: 'breakfast', name: '早餐', icon: '🌅' },
      { type: 'lunch', name: '午餐', icon: '🌞' },
      { type: 'dinner', name: '晚餐', icon: '🌙' },
      { type: 'snack', name: '加餐', icon: '🍎' }
    ]
  },

  onLoad(options) {
    this.initPage();
    
    // 如果有传入的搜索关键词
    if (options.keyword) {
      this.setData({
        searchKeyword: options.keyword,
        searchFocus: true
      });
      this.searchFood();
    }
  },

  onShow() {
    this.loadRecentSearches();
  },

  // 初始化页面
  async initPage() {
    try {
      await Promise.all([
        this.loadPopularFoods(),
        this.loadRecentSearches()
      ]);
    } catch (error) {
      console.error('页面初始化失败:', error);
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    // 获取搜索建议
    if (keyword.length > 0) {
      this.getSearchSuggestions(keyword);
    } else {
      this.setData({ searchSuggestions: [] });
    }
  },

  // 获取搜索建议
  async getSearchSuggestions(keyword) {
    try {
      // 模拟搜索建议
      const suggestions = [
        '苹果', '香蕉', '橙子', '葡萄', '西瓜',
        '鸡胸肉', '牛肉', '猪肉', '鱼肉',
        '白米饭', '面条', '面包', '燕麦'
      ].filter(item => item.includes(keyword)).slice(0, 5);
      
      this.setData({ searchSuggestions: suggestions });
    } catch (error) {
      console.error('获取搜索建议失败:', error);
    }
  },

  // 选择搜索建议
  selectSuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    this.setData({
      searchKeyword: suggestion,
      searchSuggestions: []
    });
    this.searchFood();
  },

  // 搜索食物
  async searchFood() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      app.showToast('请输入搜索关键词');
      return;
    }
    
    this.setData({
      loading: true,
      page: 1,
      searchResults: []
    });
    
    try {
      const result = await api.dietData.searchFood(keyword, 1, 20);
      
      if (result && result.data && result.data.foods) {
        this.setData({
          searchResults: result.data.foods,
          hasMore: result.data.hasMore || false
        });
        
        // 保存到最近搜索
        this.saveRecentSearch(keyword);
      } else {
        this.setData({
          searchResults: [],
          hasMore: false
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      app.showError('搜索失败，请重试');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 扫码搜索
  scanBarcode() {
    wx.scanCode({
      success: async (res) => {
        try {
          app.showLoading('识别中...');
          
          // 这里应该调用条码识别API
          // 目前使用模拟数据
          const mockFood = {
            id: 'barcode_' + res.result,
            name: '扫码食物示例',
            calories: 250,
            protein: 12,
            carbs: 30,
            fat: 8,
            brand: '某品牌',
            image: '/images/default-food.png'
          };
          
          this.setData({
            selectedFood: mockFood,
            showFoodDetail: true
          });
          
          this.calculateNutrition();
          
        } catch (error) {
          app.showError('识别失败，请重试');
        } finally {
          app.hideLoading();
        }
      },
      fail: () => {
        app.showError('扫码失败');
      }
    });
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
    
    if (category === 'all') {
      this.loadPopularFoods();
    } else {
      this.loadCategoryFoods(category);
    }
  },

  // 改变排序方式
  changeSortBy(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({ sortBy });
    this.sortSearchResults();
  },

  // 排序搜索结果
  sortSearchResults() {
    let results = [...this.data.searchResults];
    
    switch (this.data.sortBy) {
      case 'calories':
        results.sort((a, b) => a.calories - b.calories);
        break;
      case 'popularity':
        results.sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
        break;
      default:
        // 相关度排序（默认）
        break;
    }
    
    this.setData({ searchResults: results });
  },

  // 加载更多
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    
    this.setData({ loadingMore: true });
    
    try {
      const nextPage = this.data.page + 1;
      const result = await api.dietData.searchFood(this.data.searchKeyword, nextPage, 20);
      
      if (result && result.data && result.data.foods) {
        const allResults = [...this.data.searchResults, ...result.data.foods];
        this.setData({
          searchResults: allResults,
          page: nextPage,
          hasMore: result.data.hasMore || false
        });
      }
    } catch (error) {
      console.error('加载更多失败:', error);
      app.showError('加载失败');
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  // 选择食物
  selectFood(e) {
    const food = e.currentTarget.dataset.food;
    this.setData({
      selectedFood: food,
      selectedAmount: 100,
      showFoodDetail: true
    });
    this.calculateNutrition();
  },

  // 计算营养成分
  calculateNutrition() {
    const { selectedFood, selectedAmount } = this.data;
    const ratio = selectedAmount / 100;
    
    const calculatedNutrition = {
      calories: Math.round((selectedFood.calories || 0) * ratio),
      protein: Math.round((selectedFood.protein || 0) * ratio * 10) / 10,
      carbs: Math.round((selectedFood.carbs || 0) * ratio * 10) / 10,
      fat: Math.round((selectedFood.fat || 0) * ratio * 10) / 10,
      fiber: Math.round((selectedFood.fiber || 0) * ratio * 10) / 10,
      sodium: Math.round((selectedFood.sodium || 0) * ratio)
    };
    
    this.setData({ calculatedNutrition });
  },

  // 修改数量
  changeAmount(e) {
    const change = parseInt(e.currentTarget.dataset.change);
    const newAmount = Math.max(1, this.data.selectedAmount + change);
    this.setData({ selectedAmount: newAmount });
    this.calculateNutrition();
  },

  // 输入数量
  onAmountInput(e) {
    const amount = parseInt(e.detail.value) || 1;
    this.setData({ selectedAmount: Math.max(1, Math.min(9999, amount)) });
    this.calculateNutrition();
  },

  // 选择餐次
  selectMeal(e) {
    const meal = e.currentTarget.dataset.meal;
    this.setData({ selectedMeal: meal });
  },

  // 获取餐次名称
  getMealName(mealType) {
    const meal = this.data.mealTypes.find(m => m.type === mealType);
    return meal ? meal.name : '';
  },

  // 确认添加食物
  confirmAddFood() {
    const { selectedFood, selectedAmount, selectedMeal, calculatedNutrition } = this.data;
    
    const foodData = {
      id: util.generateId(),
      name: selectedFood.name,
      amount: selectedAmount,
      unit: 'g',
      calories: calculatedNutrition.calories,
      nutrition: {
        protein: calculatedNutrition.protein,
        carbs: calculatedNutrition.carbs,
        fat: calculatedNutrition.fat,
        fiber: calculatedNutrition.fiber,
        sodium: calculatedNutrition.sodium
      },
      image: selectedFood.image
    };
    
    // 通过全局事件或页面间通信添加到饮食记录
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    if (prevPage && prevPage.addFoodToMeal) {
      prevPage.addFoodToMeal(selectedMeal, foodData);
    }
    
    this.closeFoodDetail();
    app.showToast('添加成功');
    
    // 返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1000);
  },

  // 关闭食物详情
  closeFoodDetail() {
    this.setData({ showFoodDetail: false });
  },

  // 加载热门食物
  async loadPopularFoods() {
    try {
      // 模拟热门食物数据
      const popularFoods = [
        {
          id: 'apple',
          name: '苹果',
          calories: 52,
          image: '/images/foods/apple.jpg',
          rating: 5,
          searchCount: 1250
        },
        {
          id: 'banana',
          name: '香蕉', 
          calories: 89,
          image: '/images/foods/banana.jpg',
          rating: 4,
          searchCount: 980
        },
        {
          id: 'chicken',
          name: '鸡胸肉',
          calories: 165,
          image: '/images/foods/chicken.jpg',
          rating: 5,
          searchCount: 856
        },
        {
          id: 'rice',
          name: '白米饭',
          calories: 130,
          image: '/images/foods/rice.jpg',
          rating: 4,
          searchCount: 742
        }
      ];
      
      this.setData({ popularFoods });
    } catch (error) {
      console.error('加载热门食物失败:', error);
    }
  },

  // 按分类加载食物
  async loadCategoryFoods(category) {
    try {
      this.setData({ loading: true });
      
      // 这里应该调用分类食物API
      const mockResults = [
        {
          id: category + '_1',
          name: category + '食物1',
          calories: 100,
          protein: 5,
          carbs: 15,
          fat: 3
        }
      ];
      
      this.setData({
        searchResults: mockResults,
        loading: false
      });
    } catch (error) {
      console.error('加载分类食物失败:', error);
      this.setData({ loading: false });
    }
  },

  // 查看全部热门
  viewAllPopular() {
    this.setData({
      selectedCategory: 'popular',
      searchResults: this.data.popularFoods
    });
  },

  // 保存最近搜索
  saveRecentSearch(keyword) {
    let recentSearches = [...this.data.recentSearches];
    
    // 移除重复项
    recentSearches = recentSearches.filter(item => item !== keyword);
    
    // 添加到开头
    recentSearches.unshift(keyword);
    
    // 限制数量
    recentSearches = recentSearches.slice(0, 10);
    
    this.setData({ recentSearches });
    
    // 保存到本地存储
    wx.setStorageSync('recentFoodSearches', recentSearches);
  },

  // 加载最近搜索
  loadRecentSearches() {
    try {
      const recentSearches = wx.getStorageSync('recentFoodSearches') || [];
      this.setData({ recentSearches });
    } catch (error) {
      console.error('加载最近搜索失败:', error);
    }
  },

  // 搜索最近记录
  searchRecent(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchKeyword: keyword });
    this.searchFood();
  },

  // 清空最近搜索
  clearRecentSearches() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空最近搜索记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ recentSearches: [] });
          wx.removeStorageSync('recentFoodSearches');
          app.showToast('已清空');
        }
      }
    });
  },

  // 创建自定义食物
  createCustomFood() {
    wx.showModal({
      title: '功能提示',
      content: '自定义食物功能开发中...',
      showCancel: false
    });
  }
});