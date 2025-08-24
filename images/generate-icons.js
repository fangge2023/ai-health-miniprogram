#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 创建简单的Base64编码的1x1像素PNG图片作为占位图标
const createPlaceholderIcon = (color) => {
  // 1x1像素的透明PNG图片的Base64编码
  const transparentPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(transparentPng, 'base64');
};

// 图标配置
const icons = [
  { name: 'tab-home.png', desc: '首页图标' },
  { name: 'tab-home-active.png', desc: '首页激活图标' },
  { name: 'tab-ai.png', desc: 'AI咨询图标' },
  { name: 'tab-ai-active.png', desc: 'AI咨询激活图标' },
  { name: 'tab-diet.png', desc: '饮食图标' },
  { name: 'tab-diet-active.png', desc: '饮食激活图标' },
  { name: 'tab-exercise.png', desc: '运动图标' },
  { name: 'tab-exercise-active.png', desc: '运动激活图标' },
  { name: 'tab-profile.png', desc: '个人图标' },
  { name: 'tab-profile-active.png', desc: '个人激活图标' }
];

// 创建图标文件
console.log('正在创建TabBar图标...');

icons.forEach(icon => {
  const iconPath = path.join(__dirname, icon.name);
  const iconData = createPlaceholderIcon();
  
  try {
    fs.writeFileSync(iconPath, iconData);
    console.log(`✓ 已创建: ${icon.name} - ${icon.desc}`);
  } catch (error) {
    console.error(`✗ 创建失败: ${icon.name} - ${error.message}`);
  }
});

console.log('\n图标创建完成！');
console.log('注意：这些是占位图标，建议后续替换为实际设计的图标。');
console.log('推荐图标尺寸：78px x 78px（3x）, 52px x 52px（2x）, 26px x 26px（1x）');