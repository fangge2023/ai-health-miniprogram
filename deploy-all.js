// deploy-all.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 云函数列表
const cloudFunctions = [
  'ai-chat',
  'get-food-data', 
  'get-user-data',
  'update-user-data',
  'record-exercise'
];

console.log('开始部署云函数...\n');

// 部署每个云函数
cloudFunctions.forEach((functionName, index) => {
  try {
    console.log(`${index + 1}. 部署 ${functionName}...`);
    
    const functionPath = path.join(__dirname, 'cloudfunctions', functionName);
    
    // 检查目录是否存在
    if (!fs.existsSync(functionPath)) {
      console.log(`   ❌ 目录不存在: ${functionPath}`);
      return;
    }
    
    // 进入云函数目录
    process.chdir(functionPath);
    
    // 安装依赖
    console.log(`   📦 安装依赖...`);
    execSync('npm install', { stdio: 'inherit' });
    
    // 返回根目录
    process.chdir(path.join(__dirname));
    
    console.log(`   ✅ ${functionName} 准备完成`);
    
  } catch (error) {
    console.log(`   ❌ ${functionName} 部署失败:`, error.message);
  }
  
  console.log('');
});

console.log('🎉 所有云函数准备完成！');
console.log('\n📝 接下来的步骤：');
console.log('1. 打开微信开发者工具');
console.log('2. 在云开发控制台中上传并部署这些云函数');
console.log('3. 配置云数据库集合');
console.log('4. 测试云函数功能');

// 生成云函数配置文件
const cloudConfig = {
  functions: cloudFunctions.map(name => ({
    name: name,
    runtime: 'Nodejs18.15',
    timeout: 20,
    memorySize: 256,
    description: getDescription(name)
  }))
};

fs.writeFileSync('cloud-config.json', JSON.stringify(cloudConfig, null, 2));
console.log('\n📄 已生成 cloud-config.json 配置文件');

function getDescription(functionName) {
  const descriptions = {
    'ai-chat': 'AI聊天服务，处理用户与AI的对话交互',
    'get-food-data': '获取食物营养数据，支持搜索和营养计算',
    'get-user-data': '获取用户数据，包括健康数据、饮食记录等',
    'update-user-data': '更新用户数据，包括个人信息、健康指标等',
    'record-exercise': '记录用户运动数据，计算消耗热量'
  };
  
  return descriptions[functionName] || '云函数';
}