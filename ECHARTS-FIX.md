# ECharts 图表组件修复指南

## 问题描述
错误信息：`Error: module 'ec-canvas/echarts.js' is not defined`

## 当前解决方案
已临时禁用ECharts组件，页面现在应该能正常显示。

## 如需完整的图表功能

### 方案一：自动下载（推荐）
```bash
# 在项目根目录运行
node fix-echarts.js
```

### 方案二：手动配置

#### 1. 下载ECharts文件
前往官方仓库下载适用于微信小程序的ECharts：
- 访问：https://github.com/ecomfe/echarts-for-weixin
- 下载 `ec-canvas` 文件夹中的所有文件

#### 2. 替换ec-canvas目录
将下载的文件替换当前的 `ec-canvas` 目录内容。

#### 3. 需要的文件列表
- `ec-canvas/ec-canvas.js`
- `ec-canvas/ec-canvas.wxml`
- `ec-canvas/ec-canvas.wxss`
- `ec-canvas/ec-canvas.json`
- `ec-canvas/echarts.js` ⭐ **关键文件**
- `ec-canvas/wx-canvas.js`

#### 4. 恢复页面中的图表代码
取消以下文件中的ECharts相关注释：
- `pages/dashboard/dashboard.js`
- `pages/exercise/exercise.js`
- `pages/health/health.js`

#### 5. 验证安装
重新编译项目，检查图表是否正常显示。

## 临时解决方案（当前已应用）
如果暂时不需要图表功能：
- ECharts组件已被禁用
- 页面将正常显示，但无图表
- 可以随时按上述步骤恢复图表功能

## 注意事项
1. 确保下载的ECharts版本与微信小程序兼容
2. 图表组件会增加小程序包大小
3. 建议使用ECharts的定制版本以减小体积

---
**当前页面应该已经能正常显示了！**