const fs = require('fs');
const path = require('path');

// 要修复的文件列表
const filesToFix = [
  'src/pages/Assets/index.jsx',
  'src/pages/Transactions/index.jsx',
  'src/pages/Sessions/index.jsx',
  'src/components/Layout/index.jsx'
];

console.log('🔧 开始修复图标导入路径...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // 替换导入路径
      const oldContent = content;
      content = content.replace(/from "@antd\/icons"/g, 'from "@ant-design/icons"');
      content = content.replace(/from "@antd-icons"/g, 'from "@ant-design/icons"');
      
      if (content !== oldContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ 修复完成: ${filePath}`);
      } else {
        console.log(`ℹ️  无需修复: ${filePath}`);
      }
    } catch (error) {
      console.log(`❌ 修复失败: ${filePath}`, error.message);
    }
  } else {
    console.log(`⚠️  文件不存在: ${filePath}`);
  }
});

console.log('🎉 图标导入路径修复完成！');