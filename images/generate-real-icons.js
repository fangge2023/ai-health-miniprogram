#!/usr/bin/env node

const fs = require('fs');
const { createCanvas } = require('canvas');

// 创建画布
const canvas = createCanvas(52, 52);
const ctx = canvas.getContext('2d');

// 图标配置
const icons = [
  { 
    name: 'tab-home.png', 
    desc: '首页图标',
    draw: (ctx) => {
      // 绘制房子图标
      ctx.fillStyle = '#666666';
      // 屋顶
      ctx.beginPath();
      ctx.moveTo(26, 10);
      ctx.lineTo(42, 26);
      ctx.lineTo(10, 26);
      ctx.closePath();
      ctx.fill();
      // 房子主体
      ctx.fillRect(15, 26, 24, 16);
      // 门
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 32, 4, 10);
    }
  },
  { 
    name: 'tab-home-active.png', 
    desc: '首页激活图标',
    draw: (ctx) => {
      // 绘制激活状态的房子图标
      ctx.fillStyle = '#4CAF50';
      // 屋顶
      ctx.beginPath();
      ctx.moveTo(26, 10);
      ctx.lineTo(42, 26);
      ctx.lineTo(10, 26);
      ctx.closePath();
      ctx.fill();
      // 房子主体
      ctx.fillRect(15, 26, 24, 16);
      // 门
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 32, 4, 10);
    }
  },
  { 
    name: 'tab-ai.png', 
    desc: 'AI咨询图标',
    draw: (ctx) => {
      // 绘制AI机器人图标
      ctx.fillStyle = '#666666';
      // 头部
      ctx.fillRect(20, 10, 12, 10);
      // 身体
      ctx.fillRect(16, 20, 20, 16);
      // 眼睛
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(23, 14, 2, 2);
      ctx.fillRect(27, 14, 2, 2);
      // 天线
      ctx.fillStyle = '#666666';
      ctx.fillRect(25, 6, 2, 4);
    }
  },
  { 
    name: 'tab-ai-active.png', 
    desc: 'AI咨询激活图标',
    draw: (ctx) => {
      // 绘制激活状态的AI机器人图标
      ctx.fillStyle = '#4CAF50';
      // 头部
      ctx.fillRect(20, 10, 12, 10);
      // 身体
      ctx.fillRect(16, 20, 20, 16);
      // 眼睛
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(23, 14, 2, 2);
      ctx.fillRect(27, 14, 2, 2);
      // 天线
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(25, 6, 2, 4);
    }
  },
  { 
    name: 'tab-diet.png', 
    desc: '饮食图标',
    draw: (ctx) => {
      // 绘制饮食图标
      ctx.fillStyle = '#666666';
      // 盘子
      ctx.beginPath();
      ctx.arc(26, 26, 12, 0, Math.PI * 2);
      ctx.fill();
      // 内圈
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(26, 26, 9, 0, Math.PI * 2);
      ctx.fill();
      // 叉子
      ctx.fillStyle = '#666666';
      ctx.fillRect(20, 20, 2, 12);
      ctx.fillRect(18, 20, 2, 4);
      ctx.fillRect(22, 20, 2, 4);
    }
  },
  { 
    name: 'tab-diet-active.png', 
    desc: '饮食激活图标',
    draw: (ctx) => {
      // 绘制激活状态的饮食图标
      ctx.fillStyle = '#4CAF50';
      // 盘子
      ctx.beginPath();
      ctx.arc(26, 26, 12, 0, Math.PI * 2);
      ctx.fill();
      // 内圈
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(26, 26, 9, 0, Math.PI * 2);
      ctx.fill();
      // 叉子
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(20, 20, 2, 12);
      ctx.fillRect(18, 20, 2, 4);
      ctx.fillRect(22, 20, 2, 4);
    }
  },
  { 
    name: 'tab-exercise.png', 
    desc: '运动图标',
    draw: (ctx) => {
      // 绘制运动图标
      ctx.fillStyle = '#666666';
      // 头
      ctx.beginPath();
      ctx.arc(26, 14, 6, 0, Math.PI * 2);
      ctx.fill();
      // 身体
      ctx.fillRect(22, 20, 8, 12);
      // 手臂
      ctx.fillRect(14, 22, 8, 3);
      ctx.fillRect(30, 22, 8, 3);
      // 腿
      ctx.fillRect(20, 32, 4, 8);
      ctx.fillRect(28, 32, 4, 8);
    }
  },
  { 
    name: 'tab-exercise-active.png', 
    desc: '运动激活图标',
    draw: (ctx) => {
      // 绘制激活状态的运动图标
      ctx.fillStyle = '#4CAF50';
      // 头
      ctx.beginPath();
      ctx.arc(26, 14, 6, 0, Math.PI * 2);
      ctx.fill();
      // 身体
      ctx.fillRect(22, 20, 8, 12);
      // 手臂
      ctx.fillRect(14, 22, 8, 3);
      ctx.fillRect(30, 22, 8, 3);
      // 腿
      ctx.fillRect(20, 32, 4, 8);
      ctx.fillRect(28, 32, 4, 8);
    }
  },
  { 
    name: 'tab-profile.png', 
    desc: '个人图标',
    draw: (ctx) => {
      // 绘制个人图标
      ctx.fillStyle = '#666666';
      // 头
      ctx.beginPath();
      ctx.arc(26, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // 身体
      ctx.beginPath();
      ctx.arc(26, 40, 12, Math.PI, 0, true);
      ctx.fill();
    }
  },
  { 
    name: 'tab-profile-active.png', 
    desc: '个人激活图标',
    draw: (ctx) => {
      // 绘制激活状态的个人图标
      ctx.fillStyle = '#4CAF50';
      // 头
      ctx.beginPath();
      ctx.arc(26, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      // 身体
      ctx.beginPath();
      ctx.arc(26, 40, 12, Math.PI, 0, true);
      ctx.fill();
    }
  }
];

console.log('正在创建真实的TabBar图标...\n');

// 创建每个图标
icons.forEach(icon => {
  // 清空画布
  ctx.clearRect(0, 0, 52, 52);
  
  // 绘制图标
  icon.draw(ctx);
  
  // 保存为PNG文件
  const buffer = canvas.toBuffer('image/png');
  const iconPath = `images/${icon.name}`;
  
  try {
    fs.writeFileSync(iconPath, buffer);
    console.log(`✅ 已创建: ${icon.name} - ${icon.desc}`);
  } catch (error) {
    console.error(`❌ 创建失败: ${icon.name} - ${error.message}`);
  }
});

console.log('\n🎉 真实图标创建完成！');
console.log('图标使用52x52像素尺寸，符合微信小程序推荐标准。');
console.log('普通状态：灰色 (#666666)');
console.log('激活状态：绿色 (#4CAF50)');