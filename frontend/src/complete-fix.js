const fs = require('fs');
const path = require('path');

// 需要修复的所有文件
const filesToFix = [
  'src/pages/Dashboard/index.jsx',
  'src/pages/Transactions/index.jsx',
  'src/pages/Assets/index.jsx',
  'src/pages/Sessions/index.jsx',
  'src/components/Layout/index.jsx',
  'src/App.jsx'
];

console.log('🔧 开始全面修复文件...');

// 修复映射表
const fixMap = {
  '存 ?': '存档',
  '召唤 ?': '召唤兽', 
  '游戏 ?': '游戏币',
  '资 ?': '资产',
  '加 ?': '加载',
  '估 ?': '估值',
  '数 ?': '数量',
  '总价 ?': '总价值',
  '总估 ?': '总估值',
  ' ?': '',
  ' ': ''
};

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      // 读取文件
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 修复所有截断字符
      Object.keys(fixMap).forEach(badChar => {
        content = content.replace(new RegExp(badChar, 'g'), fixMap[badChar]);
      });
      
      // 重新写入为 UTF-8
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ 修复完成: ${filePath}`);
    } catch (error) {
      console.log(`❌ 修复失败: ${filePath}`, error.message);
    }
  } else {
    console.log(`⚠️ 文件不存在: ${filePath}`);
  }
});

console.log('🎉 全面修复完成！建议使用 VS Code 编辑器避免此问题。');