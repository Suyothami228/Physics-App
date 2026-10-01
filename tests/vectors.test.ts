import {describe,it,expect} from 'vitest';
import {resultant,vectorPaths,quantities} from '../src/domain/vectors';
import content from '../src/domain/vectors.json';
describe('vector physics',()=>{
 it('handles addition, subtraction and undefined zero direction',()=>{
  expect(resultant(4,3,90).magnitude).toBeCloseTo(5);
  expect(resultant(4,4,180).direction).toBeNull();
  expect(resultant(4,3,0,true).magnitude).toBeCloseTo(1);
  expect(resultant(0,3,270).direction).toBeCloseTo(-90);
 });
 it('telescopes the reference path puzzles',()=>{
  const sums=vectorPaths.map(p=>p.paths.flatMap(path=>path.slice(1).map((name,i)=>[p.points[name][0]-p.points[path[i]][0],p.points[name][1]-p.points[path[i]][1]])).reduce((s,v)=>[s[0]+v[0],s[1]+v[1]],[0,0]));
  expect(sums[2]).toEqual([18,0]);expect(sums[3]).toEqual([18,0]);expect(sums[4]).toEqual([3,0]);expect(sums[6]).toEqual([-40,0]);
 });
 it('has complete bilingual content and valid checks',()=>{
  expect(quantities).toHaveLength(26);
  for(const row of content['02/vectors']){
   expect(row.title_en).toBeTruthy();expect(row.title_ta).toBeTruthy();
   if(row.kind==='check'){
    expect(row.options_en!.split('\n').length).toBe(row.options_ta!.split('\n').length);
    expect(row.correct_option).toBeGreaterThan(0);
    expect(row.explanation_ta).toBeTruthy();
   }
  }
 });
});
