import fs from 'node:fs';
import C from '../src/domain/curriculum.js';
import B from '../src/domain/bank.js';
const output = new URL('../backend/seed/content.json', import.meta.url);
fs.writeFileSync(output, JSON.stringify({chapters:C.chapters, questions:B.ids.flatMap(id=>Array.from({length:5},(_,variant)=>B.make(id,variant)))},null,2)+'\n');
console.log('Exported 11 chapters, 72 lessons and 90 template variants.');
