// pages/profile/profile.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');

Page({
  data: {
    userInfo: {},
    userStatus: '健康管理中',
    goals: {},
    settings: {
      notification: true
    },
    loading: true
  },

  onLoad() {
    this.loadUserData();
  },

  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo || {}
    });
  },

  async loadUserData() {
    try {
      const result = await api.userData.get('all');
      if (result && result.data) {
        this.setData({
          userInfo: result.data.userInfo || {},
          goals: result.data.goals || {},
          settings: result.data.settings || this.data.settings
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  changeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 上传头像逻辑
        app.showToast('头像更新功能开发中...');
      }
    });
  },

  setGoal(e) {
    const type = e.currentTarget.dataset.type;
    wx.showModal({
      title: '设置目标',
      content: `${type === 'weight' ? '目标体重' : '目标日期'}设置功能开发中...`,
      showCancel: false
    });
  },

  editInfo(e) {
    const type = e.currentTarget.dataset.type;
    wx.showModal({
      title: '编辑信息',
      content: `编辑${type}功能开发中...`,
      showCancel: false
    });
  },

  toggleSetting(e) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;
    
    this.setData({
      [`settings.${type}`]: value
    });
    
    // 保存设置
    this.saveSettings();
  },

  async saveSettings() {
    try {
      await api.userData.update({ settings: this.data.settings });
      app.showToast('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  openSetting(e) {
    const type = e.currentTarget.dataset.type;
    wx.showModal({
      title: '设置',
      content: `${type}设置功能开发中...`,
      showCancel: false
    });
  },

  exportData() {
    wx.showModal({
      title: '导出数据',
      content: '数据导出功能开发中...',
      showCancel: false
    });
  },

  feedback() {
    wx.showModal({
      title: '意见反馈',
      content: '反馈功能开发中...',
      showCancel: false
    });
  },

  about() {
    wx.showModal({
      title: '关于应用',
      content: 'AI健康减肥小程序 v1.0.0\n专业的健康管理工具',
      showCancel: false
    });
  }
});