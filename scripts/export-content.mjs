import fs from 'node:fs';
import C from '../src/domain/curriculum.js';
import B from '../src/domain/bank.js';
const output = new URL('../backend/seed/content.json', import.meta.url);
fs.writeFileSync(output, JSON.stringify({chapters:C.chapters, questions:B.ids.flatMap(id=>Array.from({length:5},(_,variant)=>B.make(id,variant)))},null,2)+'\n');
console.log(`Exported ${C.chapters.length} chapters, ${C.chapters.flatMap(c => c.lessons).length} lessons and ${B.ids.length * 5} template variants.`);
