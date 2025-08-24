// pages/ai-consult/ai-consult.js
const app = getApp();
const util = require('../../utils/util');
const api = require('../../utils/api');

Page({
  data: {
    userInfo: {},
    messages: [],
    inputText: '',
    inputFocus: false,
    loading: true,
    sending: false,
    aiThinking: false,
    showFunctions: false,
    showVoice: false,
    scrollTop: 0,
    scrollIntoView: '',
    errorMessage: '',
    
    // 消息计数器
    messageCounter: 0,
    
    // 打字机效果
    typingTimer: null,
    typingIndex: 0,
    
    // 上下文
    conversationContext: []
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.setData({ inputFocus: true });
  },

  onUnload() {
    // 清理定时器
    if (this.data.typingTimer) {
      clearInterval(this.data.typingTimer);
    }
  },

  // 初始化页面
  async initPage() {
    try {
      // 用户信息需要在按钮点击时获取（微信安全策略）
      // 移除了自动获取用户信息的代码
      
      // 加载聊天历史
      await this.loadChatHistory();
      
      // 滚动到底部
      this.scrollToBottom();
      
    } catch (error) {
      console.error('页面初始化失败:', error);
      this.setData({ 
        errorMessage: '页面加载失败，请重试',
        loading: false 
      });
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      if (!app.globalData.userInfo) {
        const userInfo = await app.getUserInfo();
        this.setData({ userInfo });
      } else {
        this.setData({ userInfo: app.globalData.userInfo });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  },

  // 加载聊天历史
  async loadChatHistory() {
    try {
      const result = await api.aiChat.getHistory(20);
      
      if (result && result.data && result.data.length > 0) {
        const messages = result.data.map((item, index) => ({
          id: util.generateId(),
          type: item.role === 'user' ? 'user' : 'ai',
          content: item.content,
          time: util.getRelativeTime(item.timestamp),
          suggestions: item.suggestions || [],
          liked: item.liked || false
        }));
        
        this.setData({ 
          messages,
          messageCounter: messages.length,
          conversationContext: result.data
        });
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 输入事件
  onInput(e) {
    this.setData({ 
      inputText: e.detail.value,
      errorMessage: ''
    });
  },

  // 发送消息
  async sendMessage() {
    const content = this.data.inputText.trim();
    if (!content || this.data.sending) return;

    try {
      // 添加用户消息
      await this.addUserMessage(content);
      
      // 清空输入框
      this.setData({ 
        inputText: '',
        sending: true,
        aiThinking: true 
      });

      // 发送到AI
      await this.sendToAI(content);
      
    } catch (error) {
      console.error('发送消息失败:', error);
      this.setData({ 
        errorMessage: '发送失败，请重试',
        sending: false,
        aiThinking: false 
      });
    }
  },

  // 添加用户消息
  async addUserMessage(content) {
    const userMessage = {
      id: util.generateId(),
      type: 'user',
      content: content,
      time: util.formatDate(new Date(), 'HH:mm')
    };

    const messages = [...this.data.messages, userMessage];
    this.setData({ 
      messages,
      messageCounter: this.data.messageCounter + 1
    });

    this.scrollToBottom();
  },

  // 发送到AI处理
  async sendToAI(content) {
    try {
      const result = await api.aiChat.sendMessage(content, this.data.conversationContext);
      
      if (result && result.aiResponse) {
        await this.addAIMessage(result);
        
        // 更新上下文
        this.updateContext(content, result.aiResponse);
      } else {
        throw new Error('AI响应异常');
      }
      
    } catch (error) {
      console.error('AI处理失败:', error);
      await this.addAIMessage({
        aiResponse: '抱歉，我现在无法回答你的问题，请稍后重试。',
        error: true
      });
    } finally {
      this.setData({ 
        sending: false,
        aiThinking: false 
      });
    }
  },

  // 添加AI消息
  async addAIMessage(result) {
    const aiMessage = {
      id: util.generateId(),
      type: 'ai',
      content: result.aiResponse,
      time: util.formatDate(new Date(), 'HH:mm'),
      suggestions: result.suggestions || [],
      liked: false,
      typing: true,
      typingText: ''
    };

    const messages = [...this.data.messages, aiMessage];
    this.setData({ 
      messages,
      messageCounter: this.data.messageCounter + 1
    });

    // 开始打字机效果
    await this.startTypingEffect(aiMessage.id, result.aiResponse);
    this.scrollToBottom();
  },

  // 打字机效果
  startTypingEffect(messageId, fullText) {
    return new Promise((resolve) => {
      let index = 0;
      const timer = setInterval(() => {
        if (index <= fullText.length) {
          const typingText = fullText.substring(0, index);
          
          // 更新消息
          const messages = this.data.messages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                typingText: typingText,
                typing: index < fullText.length
              };
            }
            return msg;
          });
          
          this.setData({ messages });
          index++;
          
          if (index > fullText.length) {
            clearInterval(timer);
            resolve();
          }
        }
      }, 50); // 50ms一个字符

      // 保存定时器引用以便清理
      this.setData({ typingTimer: timer });
    });
  },

  // 更新对话上下文
  updateContext(userMessage, aiResponse) {
    const newContext = [
      ...this.data.conversationContext,
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: aiResponse, timestamp: new Date() }
    ];

    // 保持上下文不超过10轮对话
    const limitedContext = newContext.slice(-20);
    
    this.setData({ conversationContext: limitedContext });
  },

  // 快速提问
  quickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputText: question });
    this.sendMessage();
  },

  // 应用建议
  applySuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    this.setData({ inputText: suggestion });
  },

  // 切换功能面板
  toggleFunctions() {
    this.setData({ 
      showFunctions: !this.data.showFunctions 
    });
  },

  // 数据分析
  async analyzeData() {
    const question = '请分析一下我最近的健康数据，包括体重变化、饮食和运动情况，给出专业建议。';
    this.setData({ 
      inputText: question,
      showFunctions: false 
    });
    this.sendMessage();
  },

  // 获取饮食计划
  async getDietPlan() {
    const question = '请根据我的身体状况和减肥目标，制定一周的饮食计划。';
    this.setData({ 
      inputText: question,
      showFunctions: false 
    });
    this.sendMessage();
  },

  // 获取运动计划
  async getExercisePlan() {
    const question = '请为我制定适合的运动计划，包括有氧运动和力量训练。';
    this.setData({ 
      inputText: question,
      showFunctions: false 
    });
    this.sendMessage();
  },

  // 获取健康贴士
  async getHealthTips() {
    const question = '请给我一些日常健康管理的小贴士和建议。';
    this.setData({ 
      inputText: question,
      showFunctions: false 
    });
    this.sendMessage();
  },

  // 开始语音输入
  startVoiceInput() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this.doVoiceInput();
        } else {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.doVoiceInput();
            },
            fail: () => {
              app.showError('需要录音权限才能使用语音输入');
            }
          });
        }
      }
    });
  },

  // 执行语音输入
  doVoiceInput() {
    const recorderManager = wx.getRecorderManager();
    
    recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 96000,
      format: 'mp3'
    });

    recorderManager.onStart(() => {
      app.showToast('开始录音，请说话...', 'none');
    });

    recorderManager.onStop((res) => {
      // 这里需要调用语音识别API
      // 暂时使用模拟数据
      app.showToast('语音识别功能开发中...', 'none');
    });

    // 10秒后自动停止
    setTimeout(() => {
      recorderManager.stop();
    }, 10000);
  },

  // 复制消息
  copyMessage(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => {
        app.showToast('已复制到剪贴板');
      }
    });
  },

  // 点赞消息
  likeMessage(e) {
    const messageId = e.currentTarget.dataset.id;
    const messages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, liked: !msg.liked };
      }
      return msg;
    });
    
    this.setData({ messages });
    
    // 这里可以调用API保存点赞状态
  },

  // 重试最后一条消息
  retryLastMessage() {
    const lastUserMessage = [...this.data.messages]
      .reverse()
      .find(msg => msg.type === 'user');
    
    if (lastUserMessage) {
      this.setData({ 
        inputText: lastUserMessage.content,
        errorMessage: ''
      });
      this.sendMessage();
    }
  },

  // 滚动到底部
  scrollToBottom() {
    setTimeout(() => {
      const messageCount = this.data.messages.length;
      if (messageCount > 0) {
        this.setData({
          scrollIntoView: `msg-${messageCount - 1}`
        });
      }
    }, 100);
  },

  // 清空聊天记录
  clearChat() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [],
            conversationContext: [],
            messageCounter: 0
          });
          app.showToast('聊天记录已清空');
        }
      }
    });
  }
});