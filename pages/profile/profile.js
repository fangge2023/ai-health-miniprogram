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
    loading: true,
    hasUserInfo: false
  },

  onLoad() {
    this.loadUserData();
  },

  onShow() {
    const userInfo = app.globalData.userInfo || {};
    this.setData({
      userInfo: userInfo,
      hasUserInfo: !!userInfo.nickName
    });
  },

  async loadUserData() {
    try {
      const result = await api.userData.get('all');
      if (result && result.data) {
        const userInfo = result.data.userInfo || {};
        this.setData({
          userInfo: userInfo,
          hasUserInfo: !!userInfo.nickName,
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

  async changeAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
      
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempFilePath = res.tempFilePaths[0];
        
        // 显示加载中
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传到云存储
        const timestamp = new Date().getTime();
        const cloudPath = `avatars/${this.data.userInfo.openId || 'user'}_${timestamp}.jpg`;
        
        // 使用云函数上传文件
        const uploadResult = await wx.cloud.callFunction({
          name: 'upload-file',
          data: {
            cloudPath: cloudPath,
            filePath: tempFilePath
          }
        });
        
        if (uploadResult.result && uploadResult.result.fileID) {
          // 更新用户头像
          this.setData({
            'userInfo.avatarUrl': uploadResult.result.fileID
          });
          
          // 保存到用户数据
          await api.userData.update({
            userInfo: { avatarUrl: uploadResult.result.fileID }
          });
          
          app.showToast('头像更新成功');
        }
        
        wx.hideLoading();
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      wx.hideLoading();
      app.showToast('上传失败');
    }
  },

  setGoal(e) {
    const type = e.currentTarget.dataset.type;
    const currentValue = this.data.goals[type] || '';
    const titleMap = {
      'targetWeight': '目标体重',
      'targetDate': '目标日期',
      'dailyCalories': '每日热量目标'
    };
    
    wx.showModal({
      title: `设置${titleMap[type] || type}`,
      content: '请输入新的目标值：',
      editable: true,
      placeholderText: currentValue.toString(),
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            let newValue = res.content;
            
            // 表单验证
            if (type === 'targetWeight' || type === 'dailyCalories') {
              newValue = parseFloat(res.content);
              if (isNaN(newValue) || newValue <= 0) {
                app.showToast('请输入有效的正数');
                return;
              }
              
              if (type === 'targetWeight' && (newValue < 30 || newValue > 200)) {
                app.showToast('目标体重应在30-200kg之间');
                return;
              }
              
              if (type === 'dailyCalories' && (newValue < 500 || newValue > 5000)) {
                app.showToast('每日热量应在500-5000kcal之间');
                return;
              }
            }
            
            // 更新本地数据
            this.setData({
              [`goals.${type}`]: newValue
            });
            
            // 保存到云端
            await api.userData.update({ 
              goals: { [type]: newValue } 
            });
            
            app.showToast('目标设置成功');
            
          } catch (error) {
            console.error('设置目标失败:', error);
            app.showToast('设置失败');
          }
        }
      }
    });
  },

  editInfo(e) {
    const type = e.currentTarget.dataset.type;
    const currentValue = this.data.userInfo[type] || '';
    const titleMap = {
      'nickName': '昵称',
      'gender': '性别',
      'age': '年龄',
      'height': '身高',
      'weight': '体重'
    };
    
    // 特殊处理性别选择
    if (type === 'gender') {
      wx.showActionSheet({
        itemList: ['男', '女', '其他'],
        success: async (res) => {
          const genders = ['男', '女', '其他'];
          const newValue = genders[res.tapIndex];
          
          try {
            // 更新本地数据
            this.setData({
              'userInfo.gender': newValue
            });
            
            // 保存到云端
            await api.userData.update({ 
              userInfo: { gender: newValue } 
            });
            
            app.showToast('更新成功');
            
          } catch (error) {
            console.error('更新性别失败:', error);
            app.showToast('更新失败');
          }
        }
      });
      return;
    }
    
    wx.showModal({
      title: `编辑${titleMap[type] || type}`,
      content: '请输入新的值：',
      editable: true,
      placeholderText: currentValue.toString(),
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const newValue = type === 'age' || type === 'height' || type === 'weight' 
              ? parseFloat(res.content) 
              : res.content;
              
            // 表单验证
            if (type === 'age' || type === 'height' || type === 'weight') {
              if (isNaN(newValue)) {
                app.showToast('请输入有效的数字');
                return;
              }
              
              if (type === 'age' && (newValue < 1 || newValue > 120)) {
                app.showToast('年龄应在1-120岁之间');
                return;
              }
              
              if (type === 'height' && (newValue < 50 || newValue > 250)) {
                app.showToast('身高应在50-250cm之间');
                return;
              }
              
              if (type === 'weight' && (newValue < 5 || newValue > 200)) {
                app.showToast('体重应在5-200kg之间');
                return;
              }
            }
            
            // 更新本地数据
            this.setData({
              [`userInfo.${type}`]: newValue
            });
            
            // 保存到云端
            await api.userData.update({ 
              userInfo: { [type]: newValue } 
            });
            
            app.showToast('更新成功');
            
          } catch (error) {
            console.error('更新信息失败:', error);
            app.showToast('更新失败');
          }
        }
      }
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
      content: 'AI健康减肥小程序 v1.0.0\\n专业的健康管理工具',
      showCancel: false
    });
  },

  getUserInfo(e) {
    if (e.detail.userInfo) {
      // 用户允许授权
      const userInfo = e.detail.userInfo;
      
      // 更新全局数据
      app.globalData.userInfo = userInfo;
      
      // 更新页面数据
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
      
      // 保存用户信息到云端
      api.userData.update({
        userInfo: userInfo
      }).then(() => {
        app.showToast('登录成功');
      }).catch(error => {
        console.error('保存用户信息失败:', error);
      });
    } else {
      // 用户拒绝授权
      wx.showModal({
        title: '提示',
        content: '您拒绝了授权，部分功能可能无法正常使用',
        showCancel: false
      });
    }
  }
});