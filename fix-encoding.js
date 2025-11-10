const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'src/pages/Dashboard/index.jsx',
  'src/pages/Transactions/index.jsx', 
  'src/pages/Assets/index.jsx',
  'src/pages/Sessions/index.jsx',
  'src/components/Layout/index.jsx',
  'src/App.jsx'
];

console.log('🔧 开始修复文件编码...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      // 读取文件（使用二进制模式避免编码问题）
      const buffer = fs.readFileSync(fullPath);
      // 转换为 UTF-8
      const content = buffer.toString('utf8');
      // 重新写入为 UTF-8
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ 修复编码: ${filePath}`);
    } catch (error) {
      console.log(`❌ 修复失败: ${filePath}`, error.message);
    }
  } else {
    console.log(`⚠️ 文件不存在: ${filePath}`);
  }
});

console.log('🎉 文件编码修复完成！');