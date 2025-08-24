// pages/test/test.js
Page({
  data: {
    message: '测试页面加载成功！',
    timestamp: ''
  },

  onLoad() {
    console.log('测试页面加载');
    this.setData({
      timestamp: new Date().toLocaleString()
    });
  },

  onReady() {
    console.log('测试页面渲染完成');
  },

  testButton() {
    wx.showToast({
      title: '测试成功',
      icon: 'success'
    });
  }
});