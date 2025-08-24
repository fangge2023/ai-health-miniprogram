#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('=== ECharts 图表组件修复工具 ===\n');

// ECharts 微信小程序版本的GitHub Raw链接
const ECHARTS_FILES = {
  'echarts.js': 'https://raw.githubusercontent.com/ecomfe/echarts-for-weixin/master/ec-canvas/echarts.js',
  'wx-canvas.js': 'https://raw.githubusercontent.com/ecomfe/echarts-for-weixin/master/ec-canvas/wx-canvas.js'
};

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', reject);
  });
}

async function fixECharts() {
  const ecCanvasDir = path.join(__dirname, 'ec-canvas');
  
  try {
    console.log('📦 开始下载ECharts文件...\n');
    
    for (const [filename, url] of Object.entries(ECHARTS_FILES)) {
      const filepath = path.join(ecCanvasDir, filename);
      
      try {
        console.log(`⬇️  下载 ${filename}...`);
        await downloadFile(url, filepath);
        console.log(`✅ ${filename} 下载完成`);
      } catch (error) {
        console.error(`❌ ${filename} 下载失败:`, error.message);
      }
    }
    
    // 恢复ec-canvas.js
    console.log('\n🔧 恢复ec-canvas.js配置...');
    const ecCanvasPath = path.join(ecCanvasDir, 'ec-canvas.js');
    
    let content = fs.readFileSync(ecCanvasPath, 'utf8');
    
    // 恢复正常的import语句
    content = content.replace(
      /\/\/ 暂时注释ECharts导入[\s\S]*?const echarts = {[\s\S]*?};/,
      "import * as echarts from './echarts';"
    );
    
    fs.writeFileSync(ecCanvasPath, content, 'utf8');
    
    console.log('✅ 图表组件修复完成！');
    console.log('\n📋 接下来请：');
    console.log('1. 在微信开发者工具中重新编译项目');
    console.log('2. 取消页面中图表相关代码的注释');
    console.log('3. 测试图表功能');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
    console.log('\n💡 建议手动下载ECharts文件：');
    console.log('1. 访问：https://github.com/ecomfe/echarts-for-weixin');
    console.log('2. 下载ec-canvas文件夹中的所有文件');
    console.log('3. 替换当前的ec-canvas目录');
  }
}

// 检查网络连接
console.log('🌐 检查网络连接...');
https.get('https://github.com', (res) => {
  console.log('✅ 网络连接正常\n');
  fixECharts();
}).on('error', (err) => {
  console.error('❌ 网络连接失败:', err.message);
  console.log('\n💡 请检查网络连接后重试，或手动下载ECharts文件');
});