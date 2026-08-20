const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_PATH = path.join(__dirname, '../../liara-docs/src/pages');
const OUTPUT_PATH = path.join(__dirname, '../data/documents.json');

function extractTextFromMDX(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove frontmatter
  let text = content.replace(/^---[\s\S]*?---\n/, '');
  
  // Remove code blocks but keep their content description
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    const firstLine = match.split('\n')[0];
    return `[کد نمونه: ${firstLine.replace(/```/, '').trim()}]`;
  });
  
  // Remove JSX components
  text = text.replace(/<[A-Z][\s\S]*?>/g, '');
  text = text.replace(/<\/[A-Z][a-zA-Z]*>/g, '');
  
  // Remove markdown syntax but keep text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/#+\s/g, '');
  text = text.replace(/\*\*([^*]*)\*\*/g, '$1');
  text = text.replace(/\*([^*]*)\*/g, '$1');
  text = text.replace(/`([^`]*)`/g, '$1');
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.trim();
  
  return text;
}

function getAllMDXFiles(dir, basePath = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllMDXFiles(filePath, path.join(basePath, file)));
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      const relativePath = path.join(basePath, file).replace(/\\/g, '/');
      results.push({
        path: relativePath,
        fullPath: filePath,
        category: relativePath.split('/')[0] || 'general'
      });
    }
  });
  
  return results;
}

function main() {
  console.log('Starting documentation scraping...');
  
  const files = getAllMDXFiles(DOCS_PATH);
  console.log(`Found ${files.length} documentation files`);
  
  const documents = files.map(file => {
    const text = extractTextFromMDX(file.fullPath);
    const title = path.basename(file.path, '.mdx').replace(/-/g, ' ');
    
    return {
      id: file.path.replace(/[/.]/g, '-'),
      title: title,
      path: file.path,
      category: file.category,
      content: text,
      url: `https://liara.ir/blog/${file.path.replace(/\.(mdx|md)$/, '')}`
    };
  });
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(documents, null, 2));
  console.log(`Saved ${documents.length} documents to ${OUTPUT_PATH}`);
}

main();
