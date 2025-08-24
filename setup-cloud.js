#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== AI健康减肥小程序云开发配置助手 ===\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('请按照以下步骤配置云开发环境：\n');
  
  console.log('1. 登录微信公众平台 (https://mp.weixin.qq.com)');
  console.log('2. 进入"开发" -> "云开发"');
  console.log('3. 创建云开发环境（如果还没有）');
  console.log('4. 复制环境ID\n');
  
  const envId = await question('请输入你的云开发环境ID: ');
  
  if (!envId || envId.trim() === '') {
    console.log('❌ 环境ID不能为空');
    rl.close();
    return;
  }
  
  // 读取app.js文件
  const appJsPath = path.join(__dirname, 'app.js');
  
  try {
    let content = fs.readFileSync(appJsPath, 'utf8');
    
    // 替换环境ID并启用云开发
    content = content.replace(
      /\/\*[\s\S]*?\*\//,
      `// 云开发已配置
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: '${envId.trim()}',
        traceUser: true,
      });
    }`
    );
    
    // 写回文件
    fs.writeFileSync(appJsPath, content, 'utf8');
    
    console.log('\n✅ 云开发环境配置成功！');
    console.log(`📍 环境ID: ${envId.trim()}`);
    console.log('\n接下来请：');
    console.log('1. 在微信开发者工具中重新编译项目');
    console.log('2. 部署云函数：node deploy-all.js');
    console.log('3. 测试小程序功能');
    
  } catch (error) {
    console.error('❌ 配置失败:', error.message);
  }
  
  rl.close();
}

main().catch(console.error);