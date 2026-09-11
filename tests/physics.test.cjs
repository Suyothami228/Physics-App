const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('dist/app.js','utf8');
const fn=src.match(/function solve\([\s\S]*?(?=\nfunction reset)/)[0];const solve=vm.runInNewContext('('+fn+')');
let a=solve({speed:10,angle:0,height:10}),b=solve({speed:20,angle:0,height:10});assert.equal(a.flight,b.flight);assert.equal(b.range,2*a.range);
const c=solve({speed:20,angle:45,height:0});assert.ok(Math.abs(c.range-400/9.81)<1e-10);
for(const speed of [5,18,30])for(const angle of[0,40,80])for(const height of[0,5,20]){const s=solve({speed,angle,height});assert.ok(s.flight>=0&&s.range>=0&&s.peak>=height);assert.ok(Math.abs(height+s.vy*s.flight-4.905*s.flight*s.flight)<1e-9)}
const html=fs.readFileSync('dist/lab.html','utf8');for(const name of ['app.js','style.css'])assert.ok(html.includes(name)&&fs.existsSync('dist/'+name));console.log('Physics checks passed: horizontal independence, 45-degree range, 27 parameter combinations, ground intersection; asset references passed.');
