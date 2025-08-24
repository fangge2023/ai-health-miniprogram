# TabBar 图标说明

## 已创建的图标文件

本目录包含微信小程序TabBar所需的所有图标文件：

### 首页图标
- `tab-home.png` - 首页未选中状态图标
- `tab-home-active.png` - 首页选中状态图标

### AI咨询图标
- `tab-ai.png` - AI咨询未选中状态图标
- `tab-ai-active.png` - AI咨询选中状态图标

### 饮食管理图标
- `tab-diet.png` - 饮食管理未选中状态图标
- `tab-diet-active.png` - 饮食管理选中状态图标

### 运动记录图标
- `tab-exercise.png` - 运动记录未选中状态图标
- `tab-exercise-active.png` - 运动记录选中状态图标

### 个人资料图标
- `tab-profile.png` - 个人资料未选中状态图标
- `tab-profile-active.png` - 个人资料选中状态图标

## 当前状态

目前创建的是占位图标文件，用于解决微信小程序编译时的文件缺失错误。

## 建议

为了更好的用户体验，建议后续：

1. **替换为实际设计的图标**
   - 推荐尺寸：78px x 78px（3x）, 52px x 52px（2x）, 26px x 26px（1x）
   - 格式：PNG，支持透明背景
   - 颜色：未选中状态使用灰色(#666666)，选中状态使用主题色(#4CAF50)

2. **图标设计要求**
   - 简洁明了，符合功能含义
   - 统一设计风格
   - 适配iOS和Android平台

3. **可以使用的工具**
   - 设计软件：Sketch、Figma、Adobe Illustrator
   - 图标库：Iconfont、Feather Icons、Material Icons
   - 在线生成器：已提供的 `icon-generator.html`

## 使用icon-generator.html

本目录包含一个图标生成器HTML文件，可以用于快速生成所需的图标：

1. 在浏览器中打开 `icon-generator.html`
2. 选择图标类型和样式
3. 自定义颜色和尺寸
4. 下载生成的PNG文件
5. 替换对应的占位图标

注意：确保生成的图标文件名与app.json中配置的路径完全一致。