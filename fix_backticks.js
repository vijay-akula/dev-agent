const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'chatPanel.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace escaped backticks with actual backticks
content = content.replace(/\\`/g, '`');

// Fix template literals
content = content.replace(/`<div class="markdown-content">\\${/g, '`<div class="markdown-content">${');
content = content.replace(/`<div class="output-container">\\${/g, '`<div class="output-container">${');
content = content.replace(/\\${formatMarkdown\(text\)}<\/div>`/g, '${formatMarkdown(text)}</div>`');
content = content.replace(/\\${escapeHtml\(text\)}<\/div>`/g, '${escapeHtml(text)}</div>`');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed backticks in chatPanel.ts');
