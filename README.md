# AI健康减肥小程序

一款基于微信小程序平台的智能健康管理应用，结合人工智能技术，为用户提供个性化的减肥计划、饮食建议和运动指导。

## 🎯 项目概述

### 核心功能
- **AI智能咨询**：基于用户数据提供个性化健康建议
- **饮食管理**：食物记录、营养分析、热量计算
- **运动记录**：运动数据追踪、消耗热量计算
- **健康仪表板**：体重趋势、进度分析、数据可视化
- **目标管理**：个性化减肥目标设置和进度跟踪

### 目标用户
有健康管理需求的用户，尤其是希望通过科学方式减肥的人群。

## 🛠 技术架构

### 技术栈
- **前端**: 微信小程序原生开发
- **后端**: 微信云开发
- **数据库**: 云数据库 (MongoDB)
- **AI服务**: 腾讯云AI服务
- **图表**: ECharts
- **云函数**: Node.js 18.15.0

### 架构模式
```
微信小程序前端
    ↓
微信云开发
    ↓
云函数层 (Node.js)
    ↓
云数据库 + 外部AI服务
```

### 核心云函数
- `ai-chat`: AI聊天服务
- `get-food-data`: 食物营养数据获取
- `get-user-data`: 用户数据查询
- `update-user-data`: 用户数据更新
- `record-exercise`: 运动数据记录

## 📱 页面结构

### 主要页面
1. **健康仪表板** (`pages/dashboard`) - 首页，展示健康概况
2. **AI咨询** (`pages/ai-consult`) - 智能健康咨询
3. **饮食管理** (`pages/diet`) - 饮食记录和分析
4. **运动记录** (`pages/exercise`) - 运动数据管理
5. **食物搜索** (`pages/food-search`) - 食物搜索和选择
6. **健康数据** (`pages/health`) - 健康指标和趋势
7. **个人资料** (`pages/profile`) - 用户信息和设置

### 组件结构
- `ec-canvas/`: ECharts图表组件
- `components/`: 自定义组件
- `utils/`: 工具函数和API封装

## 🚀 快速开始

### 环境要求
- Node.js 18.15.0+
- 微信开发者工具
- 微信小程序账号
- 微信云开发环境

### 安装步骤

1. **克隆项目**
   ```bash
   git clone [项目地址]
   cd ai-health-miniprogram
   ```

2. **安装依赖**
   ```bash
   # 安装云函数依赖
   node deploy-all.js
   ```

3. **配置微信开发者工具**
   - 导入项目到微信开发者工具
   - 配置AppID
   - 开启云开发服务

4. **配置云开发环境**
   - 在微信开发者工具中创建云环境
   - 修改 `app.js` 中的云环境ID
   - 创建数据库集合（参考 `database-design.md`）

5. **部署云函数**
   ```bash
   # 在微信开发者工具中上传并部署云函数
   # 或使用命令行工具
   ```

6. **配置数据库权限**
   - 设置数据库集合的读写权限
   - 创建必要的索引

### 开发环境配置

1. **修改配置文件**
   ```javascript
   // app.js 中修改云环境ID
   wx.cloud.init({
     env: 'your-cloud-env-id', // 替换为你的云环境ID
     traceUser: true,
   });
   ```

2. **配置项目信息**
   ```json
   // project.config.json 中修改AppID
   {
     "appid": "your-app-id", // 替换为你的小程序AppID
     // ...其他配置
   }
   ```

## 📊 数据库设计

### 核心集合
- `users`: 用户信息
- `health_metrics`: 健康指标
- `diet_records`: 饮食记录
- `exercise_records`: 运动记录
- `food_database`: 食物数据库
- `ai_conversations`: AI对话记录

详细的数据库结构请参考 [`database-design.md`](./database-design.md)

## 🔧 配置说明

### 云函数配置
所有云函数使用统一配置：
- Node.js 版本: 18.15.0
- 超时时间: 20秒
- 内存: 256MB
- 依赖包命名规范: kebab-case

### 依赖版本
- `wx-server-sdk`: ~2.6.3
- `minimatch`: ^5.1.0

### 环境变量
```javascript
// 云函数环境变量（在云开发控制台配置）
{
  "AI_API_KEY": "你的AI服务API密钥",
  "NUTRITION_API_KEY": "营养数据API密钥"
}
```

## 🎨 设计规范

### 主题配色
- 主色调: #4CAF50 (健康绿)
- 辅助色: #81C784 (浅绿)
- 强调色: #FF9800 (橙色)
- 错误色: #F44336 (红色)

### 组件规范
- 使用卡片式设计
- 圆角: 16rpx
- 间距: 20rpx 标准间距
- 阴影: 0 2rpx 8rpx rgba(0, 0, 0, 0.1)

### 字体规范
- 标题: 32rpx, 加粗
- 正文: 28rpx
- 辅助文字: 24rpx
- 小字: 20rpx

## 📋 API接口

### 云函数接口

#### AI聊天 (`ai-chat`)
```javascript
// 发送消息
wx.cloud.callFunction({
  name: 'ai-chat',
  data: {
    userMessage: '我今天应该吃什么？',
    context: [], // 对话上下文
    userId: 'user-openid'
  }
})
```

#### 获取食物数据 (`get-food-data`)
```javascript
// 获取食物营养信息
wx.cloud.callFunction({
  name: 'get-food-data',
  data: {
    foodName: '苹果',
    quantity: 150 // 克
  }
})

// 搜索食物
wx.cloud.callFunction({
  name: 'get-food-data',
  data: {
    action: 'search',
    keyword: '水果',
    page: 1,
    limit: 10
  }
})
```

#### 用户数据操作
```javascript
// 获取用户数据
wx.cloud.callFunction({
  name: 'get-user-data',
  data: {
    userId: 'user-openid',
    dataType: 'dashboard' // all/dashboard/goals/preferences
  }
})

// 更新用户数据
wx.cloud.callFunction({
  name: 'update-user-data',
  data: {
    userId: 'user-openid',
    updateData: {
      goals: { targetWeight: 60 }
    }
  }
})
```

## 🧪 测试

### 单元测试
```bash
# 运行云函数测试
npm test
```

### 功能测试清单
- [ ] 用户注册和登录
- [ ] AI对话功能
- [ ] 食物搜索和记录
- [ ] 运动记录功能
- [ ] 数据图表展示
- [ ] 目标设置和进度跟踪

## 📦 部署

### 生产环境部署

1. **代码审查**
   - 检查所有功能是否正常
   - 验证数据库连接
   - 测试云函数调用

2. **云函数部署**
   ```bash
   # 使用一键部署脚本
   node deploy-all.js
   
   # 在微信开发者工具中上传云函数
   ```

3. **小程序发布**
   - 在微信开发者工具中点击"上传"
   - 在微信公众平台提交审核
   - 审核通过后发布

### 性能优化

- 图片压缩和CDN优化
- 云函数冷启动优化
- 数据缓存策略
- 分页加载优化

## 🔐 安全和隐私

### 数据安全
- 所有用户数据加密存储
- 遵循最小权限原则
- 定期安全审计

### 隐私保护
- 不收集敏感个人信息
- 数据本地化存储
- 用户可随时删除数据

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码规范
- 使用ESLint进行代码检查
- 遵循微信小程序开发规范
- 添加必要的注释和文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 问题反馈: [Issues](./issues)
- 邮箱: [your-email@example.com]
- 微信群: [二维码]

## 🚧 开发路线图

### v1.0 (当前版本)
- ✅ 基础功能实现
- ✅ AI咨询功能
- ✅ 饮食和运动记录
- ✅ 数据可视化

### v1.1 (计划中)
- [ ] 社交功能
- [ ] 更多运动类型
- [ ] 高级分析报告
- [ ] 个性化推荐

### v2.0 (远期规划)
- [ ] 穿戴设备集成
- [ ] 语音交互
- [ ] 多语言支持
- [ ] 专业版功能

## 📈 更新日志

### v1.0.0 (2024-08-24)
- 🎉 初始版本发布
- ✨ 实现核心功能
- 🐛 修复已知问题
- 📝 完善文档

---

**让健康管理变得更智能、更简单！** 🌟