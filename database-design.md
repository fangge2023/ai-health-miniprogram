# 云数据库集合设计文档

## 数据库集合列表

### 1. users (用户信息表)
用于存储用户的基本信息和设置

```javascript
{
  _id: ObjectId,
  openId: String,           // 微信openId，唯一标识
  unionId: String,          // 微信unionId（可选）
  nickname: String,         // 用户昵称
  avatar: String,           // 头像URL
  gender: String,           // 性别：male/female/unknown
  age: Number,              // 年龄
  height: Number,           // 身高(cm)
  initialWeight: Number,    // 初始体重(kg)
  activityLevel: String,    // 活动水平：sedentary/light/moderate/active/extra
  goals: {                  // 目标设置
    targetWeight: Number,   // 目标体重(kg)
    targetDate: Date,       // 目标日期
    weeklyGoal: Number,     // 每周减重目标(kg)
    dailyCalories: Number   // 每日热量目标(kcal)
  },
  preferences: {            // 用户偏好
    dietType: String,       // 饮食类型：balanced/low-carb/low-fat/vegetarian
    exerciseLevel: String,  // 运动水平：beginner/moderate/advanced
    restrictions: Array,    // 饮食限制
    notifications: {        // 通知设置
      reminder: Boolean,
      progress: Boolean,
      tips: Boolean
    }
  },
  settings: {               // 应用设置
    theme: String,          // 主题：light/dark
    language: String,       // 语言：zh-CN/en-US
    units: String           // 单位系统：metric/imperial
  },
  createTime: Date,         // 创建时间
  updateTime: Date          // 更新时间
}
```

### 2. health_metrics (健康指标表)
用于存储用户的健康数据记录

```javascript
{
  _id: ObjectId,
  userId: String,           // 用户openId
  date: Date,               // 记录日期
  weight: Number,           // 体重(kg)
  bmi: Number,              // BMI指数
  bodyFat: Number,          // 体脂率(%)
  muscleMass: Number,       // 肌肉量(kg)
  waterContent: Number,     // 水分含量(%)
  metabolicAge: Number,     // 代谢年龄
  bloodPressure: {          // 血压
    systolic: Number,       // 收缩压
    diastolic: Number       // 舒张压
  },
  heartRate: Number,        // 心率(bpm)
  notes: String,            // 备注
  createTime: Date          // 创建时间
}
```

### 3. diet_records (饮食记录表)
用于存储用户的饮食记录

```javascript
{
  _id: ObjectId,
  userId: String,           // 用户openId
  date: Date,               // 记录日期
  meals: [{                 // 餐次记录
    mealType: String,       // 餐次类型：breakfast/lunch/dinner/snack
    mealTime: Date,         // 用餐时间
    foods: [{               // 食物列表
      foodId: String,       // 食物ID
      foodName: String,     // 食物名称
      amount: Number,       // 食用量
      unit: String,         // 单位：g/ml/piece等
      calories: Number,     // 热量(kcal)
      nutrition: {          // 营养成分
        protein: Number,    // 蛋白质(g)
        carbs: Number,      // 碳水化合物(g)
        fat: Number,        // 脂肪(g)
        fiber: Number,      // 纤维(g)
        sugar: Number,      // 糖分(g)
        sodium: Number      // 钠(mg)
      }
    }],
    totalCalories: Number   // 该餐总热量
  }],
  totalCalories: Number,    // 全天总热量
  totalNutrition: {         // 全天营养总计
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  waterIntake: Number,      // 饮水量(ml)
  notes: String,            // 备注
  createTime: Date          // 创建时间
}
```

### 4. exercise_records (运动记录表)
用于存储用户的运动记录

```javascript
{
  _id: ObjectId,
  userId: String,           // 用户openId
  date: Date,               // 记录日期
  exercises: [{             // 运动项目
    exerciseType: String,   // 运动类型：walking/running/cycling等
    exerciseName: String,   // 运动名称
    startTime: Date,        // 开始时间
    endTime: Date,          // 结束时间
    duration: Number,       // 运动时长(分钟)
    intensity: String,      // 运动强度：low/medium/high
    caloriesBurned: Number, // 消耗热量(kcal)
    distance: Number,       // 距离(km)
    steps: Number,          // 步数
    heartRate: {            // 心率数据
      average: Number,      // 平均心率
      max: Number,          // 最大心率
      zones: Object         // 心率区间
    },
    location: {             // 位置信息（可选）
      latitude: Number,
      longitude: Number,
      address: String
    },
    notes: String           // 备注
  }],
  totalDuration: Number,    // 总运动时长(分钟)
  totalCaloriesBurned: Number, // 总消耗热量(kcal)
  totalSteps: Number,       // 总步数
  achievements: Array,      // 成就列表
  createTime: Date          // 创建时间
}
```

### 5. food_database (食物数据库)
用于存储食物的营养信息

```javascript
{
  _id: ObjectId,
  name: String,             // 食物名称
  alternativeNames: Array,  // 别名
  category: String,         // 食物分类：fruit/vegetable/meat/grain等
  brand: String,            // 品牌（可选）
  barcode: String,          // 条形码（可选）
  nutrition: {              // 营养成分（每100g）
    calories: Number,       // 热量(kcal)
    protein: Number,        // 蛋白质(g)
    carbs: Number,          // 碳水化合物(g)
    fat: Number,            // 脂肪(g)
    fiber: Number,          // 纤维(g)
    sugar: Number,          // 糖分(g)
    sodium: Number,         // 钠(mg)
    vitamins: Object,       // 维生素含量
    minerals: Object        // 矿物质含量
  },
  servingSize: {            // 常见份量
    amount: Number,
    unit: String,
    description: String
  },
  image: String,            // 图片URL
  source: String,           // 数据来源：manual/api/user
  verified: Boolean,        // 是否验证
  popularity: Number,       // 受欢迎程度
  searchCount: Number,      // 搜索次数
  tags: Array,              // 标签：low-fat/high-protein等
  allergens: Array,         // 过敏原
  createTime: Date,         // 创建时间
  updateTime: Date          // 更新时间
}
```

### 6. ai_conversations (AI对话记录表)
用于存储AI对话历史

```javascript
{
  _id: ObjectId,
  userId: String,           // 用户openId
  sessionId: String,        // 会话ID
  messages: [{              // 消息列表
    role: String,           // 角色：user/assistant/system
    content: String,        // 消息内容
    timestamp: Date,        // 时间戳
    metadata: {             // 元数据
      messageType: String,  // 消息类型
      confidence: Number,   // 置信度
      suggestions: Array    // 建议
    }
  }],
  context: Object,          // 对话上下文
  sentiment: String,        // 情感分析结果
  topics: Array,            // 话题标签
  feedback: {               // 用户反馈
    rating: Number,         // 评分1-5
    helpful: Boolean,       // 是否有帮助
    comment: String         // 评论
  },
  createTime: Date          // 创建时间
}
```

### 7. user_goals (用户目标表)
用于存储用户的具体目标和进度

```javascript
{
  _id: ObjectId,
  userId: String,           // 用户openId
  goalType: String,         // 目标类型：weight_loss/muscle_gain/health_improve
  status: String,           // 状态：active/paused/completed/cancelled
  startDate: Date,          // 开始日期
  targetDate: Date,         // 目标日期
  currentProgress: Number,  // 当前进度(%)
  milestones: [{            // 里程碑
    date: Date,
    description: String,
    achieved: Boolean,
    value: Number
  }],
  settings: {               // 目标设置
    reminderEnabled: Boolean,
    reminderTime: String,
    weeklyCheckIn: Boolean
  },
  notes: String,            // 备注
  createTime: Date,         // 创建时间
  updateTime: Date          // 更新时间
}
```

### 8. app_logs (应用日志表)
用于存储应用使用日志和错误信息

```javascript
{
  _id: ObjectId,
  userId: String,           // 用户openId（可选）
  level: String,            // 日志级别：info/warn/error
  category: String,         // 分类：user_action/system/error
  action: String,           // 操作类型
  page: String,             // 页面路径
  data: Object,             // 相关数据
  userAgent: String,        // 用户代理
  version: String,          // 应用版本
  timestamp: Date           // 时间戳
}
```

## 数据库索引建议

### 1. users集合
```javascript
// 主要查询字段
db.users.createIndex({ "openId": 1 }, { unique: true })
db.users.createIndex({ "createTime": -1 })
```

### 2. health_metrics集合
```javascript
// 按用户和日期查询
db.health_metrics.createIndex({ "userId": 1, "date": -1 })
db.health_metrics.createIndex({ "userId": 1, "createTime": -1 })
```

### 3. diet_records集合
```javascript
// 按用户和日期查询
db.diet_records.createIndex({ "userId": 1, "date": -1 })
db.diet_records.createIndex({ "userId": 1, "createTime": -1 })
```

### 4. exercise_records集合
```javascript
// 按用户和日期查询
db.exercise_records.createIndex({ "userId": 1, "date": -1 })
db.exercise_records.createIndex({ "userId": 1, "createTime": -1 })
```

### 5. food_database集合
```javascript
// 文本搜索和分类查询
db.food_database.createIndex({ "name": "text", "alternativeNames": "text" })
db.food_database.createIndex({ "category": 1 })
db.food_database.createIndex({ "popularity": -1 })
db.food_database.createIndex({ "searchCount": -1 })
```

### 6. ai_conversations集合
```javascript
// 按用户查询
db.ai_conversations.createIndex({ "userId": 1, "createTime": -1 })
db.ai_conversations.createIndex({ "sessionId": 1 })
```

## 数据权限设置

所有集合都应设置适当的权限规则，确保用户只能访问自己的数据：

```javascript
// 示例权限规则（users集合）
{
  "read": "auth.openid == resource.openId",
  "write": "auth.openid == resource.openId"
}
```

## 数据备份和清理策略

1. **定期备份**：建议每日备份重要数据
2. **日志清理**：app_logs集合数据保留30天
3. **对话清理**：ai_conversations超过100条时清理旧记录
4. **匿名数据**：删除用户时保留匿名统计数据