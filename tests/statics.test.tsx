// @vitest-environment jsdom
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {resultant,tensions,forceExamples} from '../src/domain/statics';
import {StaticsLab} from '../src/components/StaticsLab';
import {AppProvider} from '../src/state';
vi.mock('../src/components/StaticsScene',()=>({default:()=> <div>3D scene</div>}));
afterEach(cleanup);
it('reproduces all nine reference examples with corrected rounding',()=>{
 const expected=[10,7,20*Math.sqrt(3),18,12*Math.sqrt(2),Math.sqrt(868),20,10,6*Math.sqrt(2)];
 forceExamples.forEach((v,i)=>expect(resultant(v.forces).magnitude).toBeCloseTo(expected[i],8));
});
it('handles cancellation and negative components',()=>{
 expect(resultant([{magnitude:5,angle:0},{magnitude:5,angle:180}])).toMatchObject({magnitude:0,angle:null});
 expect(resultant([{magnitude:3,angle:0},{magnitude:8,angle:180}])).toMatchObject({magnitude:5,angle:180});
});
it('balances asymmetric cables',()=>{
 for(const [a,b] of [[30,30],[15,15],[30,60],[10,80]]){
 const t=tensions(100,a,b)!;
 expect(resultant([{magnitude:t.left,angle:180-a},{magnitude:t.right,angle:b},{magnitude:100,angle:270}]).magnitude).toBe(0);
 }
 expect(tensions(100,30,30)!.left).toBeCloseTo(100);
 expect(tensions(100,0,0)).toBeNull();
});
it('updates resultant and distinguishes a couple from equilibrium',()=>{
 localStorage.setItem('iyal-language','"en"');
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
 render(<AppProvider><StaticsLab kind="statics-resultant"/></AppProvider>);
 fireEvent.click(screen.getByRole('button',{name:'180°'}));expect(screen.getByText('R = 2.00 N')).toBeTruthy();
 cleanup();render(<AppProvider><StaticsLab kind="statics-couple"/></AppProvider>);
 fireEvent.click(screen.getByRole('button',{name:'Separated lines: a couple'}));expect(screen.getByText('Not equilibrium: nonzero moment')).toBeTruthy();
 expect(screen.getByText('τ = 8.00 N m')).toBeTruthy();
});
