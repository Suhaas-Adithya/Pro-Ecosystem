import fs from 'fs';

const code = fs.readFileSync('E:/Projects/Project Pro/Pro Browser/src/App.jsx', 'utf-8');

const lines = code.split('\n');
let open = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('//')) continue;
    const opens = (line.match(/<div(?=[\s>])/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    const selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
    open += (opens - selfCloses) - closes;
    
    if (i > 2130 && i < 2150) {
        console.log(`Line ${i + 1}: open=${open} | ${line.trim()}`);
    }
}
