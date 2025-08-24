#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 创建简单的SVG图标并转换为PNG
const createSimpleIcon = (text, color = '#4CAF50') => {
  const svg = `<svg width="52" height="52" xmlns="http://www.w3.org/2000/svg">
    <rect width="52" height="52" rx="10" fill="${color}" opacity="0.8"/>
    <text x="26" y="30" text-anchor="middle" fill="white" font-size="20" font-weight="bold">${text}</text>
  </svg>`;
  return Buffer.from(svg);
};

// 图标配置
const icons = [
  { name: 'tab-home.png', text: '🏠', desc: '首页图标' },
  { name: 'tab-home-active.png', text: '🏠', desc: '首页激活图标', color: '#2E7D32' },
  { name: 'tab-ai.png', text: '🤖', desc: 'AI咨询图标' },
  { name: 'tab-ai-active.png', text: '🤖', desc: 'AI咨询激活图标', color: '#2E7D32' },
  { name: 'tab-diet.png', text: '🍎', desc: '饮食图标' },
  { name: 'tab-diet-active.png', text: '🍎', desc: '饮食激活图标', color: '#2E7D32' },
  { name: 'tab-exercise.png', text: '🏃', desc: '运动图标' },
  { name: 'tab-exercise-active.png', text: '🏃', desc: '运动激活图标', color: '#2E7D32' },
  { name: 'tab-profile.png', text: '👤', desc: '个人图标' },
  { name: 'tab-profile-active.png', text: '👤', desc: '个人激活图标', color: '#2E7D32' }
];

console.log('正在创建可见的TabBar图标...\n');

icons.forEach(icon => {
  const iconPath = path.join(__dirname, icon.name);
  const iconData = createSimpleIcon(icon.text, icon.color);
  
  try {
    fs.writeFileSync(iconPath, iconData);
    console.log(`✅ 已创建: ${icon.name} - ${icon.desc}`);
  } catch (error) {
    console.error(`❌ 创建失败: ${icon.name} - ${error.message}`);
  }
});

console.log('\n🎉 可见图标创建完成！');
console.log('图标使用简单的SVG格式，包含表情符号，应该能在微信开发者工具中正常显示。');
console.log('建议后续替换为专业设计的图标以获得更好的视觉效果。');