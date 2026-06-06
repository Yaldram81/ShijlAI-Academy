/**
 * apply-brand-fonts.js
 *
 * Replaces plain "ShijlAI" text rendered in TSX JSX with styled <span> elements:
 *   "Shijl" → font-family: ScriptMTBold, cursive
 *   "AI"    → font-family: LatinModernRoman, serif
 *
 * Only targets JSX text content (text between tags that renders on screen).
 * Skips string literals, template literals, comments, imports, component names.
 *
 * Usage: node scripts/apply-brand-fonts.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const STYLED_SHIJLAI = `<span style={{fontFamily:"ScriptMTBold, cursive", fontWeight:"bold"}}>Shijl</span><span style={{fontFamily:"LatinModernRoman, serif", fontWeight:"bold"}}>AI</span>`;

function walk(dir, ext) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      results.push(...walk(fullPath, ext));
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

function isCodeIdentifier(content, index) {
  if (index > 0) {
    const before = content[index - 1];
    if (/[a-zA-Z0-9_./\-<]/.test(before)) return true;
  }
  const afterPos = index + 7;
  if (afterPos < content.length) {
    const after = content[afterPos];
    if (/[a-zA-Z0-9_]/.test(after)) return true;
  }
  const lineStart = content.lastIndexOf('\n', index - 1) + 1;
  const lineEnd = content.indexOf('\n', index);
  const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
  if (line.match(/^\s*import\s/) || line.match(/from\s+['"]/) ) return true;
  return false;
}

function isInsideComment(content, index) {
  const lineStart = content.lastIndexOf('\n', index - 1) + 1;
  const beforeOnLine = content.substring(lineStart, index).trimStart();
  if (beforeOnLine.startsWith('//') || beforeOnLine.startsWith('*') || beforeOnLine.startsWith('/*')) return true;
  const lastBlockOpen = content.lastIndexOf('/*', index);
  if (lastBlockOpen !== -1) {
    const lastBlockClose = content.lastIndexOf('*/', index);
    if (lastBlockClose < lastBlockOpen) return true;
  }
  return false;
}

/**
 * Check if inside any kind of string literal.
 * Scans ALL the way back from index to the start of the file for backticks.
 */
function isInsideStringLiteral(content, index) {
  // For backticks: scan ALL the way back from position 0 to index
  let backtickCount = 0;
  for (let i = 0; i < index; i++) {
    const ch = content[i];
    if (ch === '`' && (i === 0 || content[i-1] !== '\\')) backtickCount++;
  }
  if (backtickCount % 2 === 1) return true;
  
  // For single/double quotes: only check same line
  const lineStart = content.lastIndexOf('\n', index - 1) + 1;
  const beforeOnLine = content.substring(lineStart, index);
  let singleCount = 0, doubleCount = 0;
  for (let j = 0; j < beforeOnLine.length; j++) {
    const ch = beforeOnLine[j];
    const prev = j > 0 ? beforeOnLine[j-1] : '';
    if (prev === '\\') continue;
    if (ch === "'") singleCount++;
    if (ch === '"') doubleCount++;
  }
  if (singleCount % 2 === 1) return true;
  if (doubleCount % 2 === 1) return true;
  
  return false;
}

function isJSXTextContent(content, index) {
  let i = index - 1;
  while (i >= 0 && /\s/.test(content[i])) i--;
  if (i < 0) return false;
  
  const ch = content[i];
  if (ch === '>') return true;
  
  if (/[a-zA-Z0-9.,!?;:\-—'"()\s]/.test(content[index - 1])) {
    let j = i;
    while (j >= 0) {
      const c = content[j];
      if (c === '>') return true;
      if (c === '<' || c === '{' || c === '}') return false;
      if (c === "'" || c === '"' || c === '`') return false;
      j--;
    }
  }
  
  return false;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (filePath.includes('brand-text.tsx')) return { changed: false };
  if (!filePath.endsWith('.tsx')) return { changed: false };
  
  const regex = /ShijlAI/g;
  let match;
  const replacements = [];
  
  while ((match = regex.exec(content)) !== null) {
    const idx = match.index;
    if (isCodeIdentifier(content, idx)) continue;
    if (isInsideComment(content, idx)) continue;
    if (isInsideStringLiteral(content, idx)) continue;
    if (isJSXTextContent(content, idx)) {
      replacements.push({ index: idx, length: 7, replacement: STYLED_SHIJLAI });
    }
  }
  
  if (replacements.length === 0) return { changed: false };
  
  let newContent = content;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    newContent = newContent.substring(0, r.index) + r.replacement + newContent.substring(r.index + r.length);
  }
  
  const relPath = path.relative(process.cwd(), filePath);
  
  if (DRY_RUN) {
    console.log(`[DRY-RUN] ${relPath}: ${replacements.length} replacement(s)`);
    for (const r of replacements) {
      const lineNum = content.substring(0, r.index).split('\n').length;
      const lineStart = content.lastIndexOf('\n', r.index - 1) + 1;
      const lineEnd = content.indexOf('\n', r.index);
      const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd).trim();
      console.log(`  Line ${lineNum}: ${line.substring(0, 140)}`);
    }
  } else {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${relPath}: ${replacements.length} replacement(s)`);
  }
  
  return { changed: true, count: replacements.length };
}

// Main
const srcDir = path.join(process.cwd(), 'src');
const files = walk(srcDir, ['.tsx']);

console.log(`\n🔍 Scanning ${files.length} .tsx files for plain "ShijlAI" text in JSX...\n`);
if (DRY_RUN) console.log('  ⚠️  DRY-RUN MODE — no files will be modified\n');

let totalFiles = 0;
let totalReplacements = 0;

for (const f of files) {
  const result = processFile(f);
  if (result.changed) {
    totalFiles++;
    totalReplacements += result.count;
  }
}

console.log(`\n📊 Summary: ${totalReplacements} replacements across ${totalFiles} files.`);
if (DRY_RUN) console.log('   (No files were modified — remove --dry-run to apply changes)');
console.log('');
