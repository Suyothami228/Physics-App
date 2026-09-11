/* Original AI-authored practice templates. Numerical answers are calculated, not model-generated at runtime. */
(function(root){
  'use strict';
  const bi=(en,ta)=>({en,ta}), rad=d=>d*Math.PI/180;
  const families={
    independence:bi('Independent motion','சார்பற்ற இயக்கங்கள்'),
    components:bi('Velocity components','வேகக் கூறுகள்'),
    time:bi('Time of flight','பறக்கும் நேரம்'),
    range:bi('Range and trajectory','வீச்சமும் பாதையும்'),
    graphs:bi('Graphs and signs','வரைபுகளும் குறிகளும்'),
    energy:bi('Energy and transfer','சக்தியும் பயன்பாடும்')
  };
  const ids=Object.keys(families).flatMap(f=>[1,2,3].map(n=>f+'-'+n));
  const source='https://e-thaksalawa.moe.gov.lk/lcms/pluginfile.php/51563/mod_resource/content/1/eal_phy_pp_p12_ans_2024.pdf#page=1';
  function make(id,variant=0){
    if(!ids.includes(id)||!Number.isInteger(variant)||variant<0)throw Error('Unknown question or variant');
    const family=id.split('-')[0],n=Number(id.slice(-1)),v=variant%5,u=10+5*v,h=5*(v+1),t=v+1,g=10;
    const q={id,variant,family,type:'numeric',unit:'',tolerance:.06,source:null};
    const numeric=(prompt,value,unit,explain)=>Object.assign(q,{prompt,value,unit,explain});
    const choice=(prompt,options,correct,explain)=>Object.assign(q,{type:'choice',prompt,options,correct,explain});
    if(family==='independence'){
      if(n===1)return choice(bi('Two balls leave the same height simultaneously: one is dropped, the other launched horizontally. Which reaches level ground first? Ignore air resistance.','ஒரே உயரத்திலிருந்து ஒரே நேரத்தில் ஒரு பந்து விடப்படுகிறது; மற்றொன்று கிடையாக எறியப்படுகிறது. வளித்தடையைப் புறக்கணித்தால் எது முதலில் தரையை அடையும்?'),[bi('The dropped ball','விடப்பட்ட பந்து'),bi('The launched ball','எறியப்பட்ட பந்து'),bi('Both together','இரண்டும் ஒரே நேரத்தில்'),bi('It depends on their masses','திணிவுகளில் தங்கியுள்ளது'),bi('It depends on horizontal speed','கிடை வேகத்தில் தங்கியுள்ளது')],2,bi('Both have the same initial vertical velocity (zero) and vertical acceleration. Their vertical journeys take the same time.','இரண்டினதும் ஆரம்ப நிலைக்குத்து வேகம் பூச்சியம்; நிலைக்குத்து ஆர்முடுகலும் சமம். ஆகவே விழும் நேரம் சமம்.'));
      if(n===2)return choice(bi('At the top of an oblique projectile path, which statement is correct? Ignore air resistance.','சாய்வாக எறியப்பட்ட பொருளின் பாதையின் உச்சியில் எது சரியானது? வளித்தடையைப் புறக்கணிக்கவும்.'),[bi('Velocity and acceleration are both zero','வேகமும் ஆர்முடுகலும் பூச்சியம்'),bi('Vertical velocity is zero; acceleration is downward','நிலைக்குத்து வேகம் பூச்சியம்; ஆர்முடுகல் கீழ்நோக்கி'),bi('Acceleration is horizontal','ஆர்முடுகல் கிடையாக உள்ளது'),bi('Horizontal velocity is zero','கிடை வேகம் பூச்சியம்'),bi('Gravity stops briefly','ஈர்ப்பு விசை சிறிது நேரம் நின்றுவிடும்')],1,bi('Only the vertical velocity becomes zero. Horizontal velocity remains, and gravity still acts downward.','நிலைக்குத்து வேகம் மட்டுமே பூச்சியமாகிறது. கிடை வேகம் தொடர்கிறது; ஈர்ப்பு விசை கீழ்நோக்கிச் செயல்படுகிறது.'));
      return choice(bi('A projectile is replaced with one of twice the mass. Launch velocity and height stay the same. Without air resistance, its path will…','ஆரம்ப வேகமும் உயரமும் மாறாமல் திணிவு இரட்டிப்பாக்கப்படுகிறது. வளித்தடை இல்லாதபோது பாதை…'),[bi('Have twice the range','இரு மடங்கு வீச்சைக் கொண்டிருக்கும்'),bi('Have half the range','அரை வீச்சைக் கொண்டிருக்கும்'),bi('Have half the flight time','அரைப் பறக்கும் நேரத்தைக் கொண்டிருக்கும்'),bi('Remain unchanged','மாறாது'),bi('Become a straight line','நேர்கோடாகும்')],3,bi('Mass cancels from F = ma with gravitational force mg. Acceleration and the trajectory are unchanged.','F = ma இல் ஈர்ப்பு விசை mg என இடும்போது திணிவு நீங்குகிறது. ஆர்முடுகலும் பாதையும் மாறாது.'));
    }
    if(family==='components'){
      if(n===1)return numeric(bi(`A ball is launched at ${u} m/s, 60° above horizontal. Find its horizontal velocity.`,`${u} m/s வேகத்தில் கிடையுடன் 60° கோணத்தில் பந்து எறியப்படுகிறது. கிடை வேகத்தைக் காண்க.`),u*.5,'m/s',bi(`uₓ = u cos 60° = ${u} × 0.5 = ${u*.5} m/s.`,`uₓ = u cos 60° = ${u} × 0.5 = ${u*.5} m/s.`));
      if(n===2)return numeric(bi(`A ball is launched at ${u} m/s, 30° above horizontal. Find its initial upward velocity.`,`${u} m/s வேகத்தில் கிடையுடன் 30° கோணத்தில் பந்து எறியப்படுகிறது. ஆரம்ப மேல்நோக்கிய வேகத்தைக் காண்க.`),u*.5,'m/s',bi(`uᵧ = u sin 30° = ${u} × 0.5 = ${u*.5} m/s.`,`uᵧ = u sin 30° = ${u} × 0.5 = ${u*.5} m/s.`));
      return numeric(bi(`A launch velocity has components ${3*t} m/s horizontally and ${4*t} m/s upward. Find its magnitude.`,`ஆரம்ப வேகக் கூறுகள் கிடையாக ${3*t} m/s, மேல்நோக்கி ${4*t} m/s. வேகத்தின் பருமனைக் காண்க.`),5*t,'m/s',bi(`u = √(uₓ² + uᵧ²) = √(${3*t}² + ${4*t}²) = ${5*t} m/s.`,`u = √(uₓ² + uᵧ²) = √(${3*t}² + ${4*t}²) = ${5*t} m/s.`));
    }
    if(family==='time'){
      if(n===1){const height=5*t*t;return numeric(bi(`A ball leaves a ${height} m ledge horizontally. How long until it reaches the ground?`,`ஒரு பந்து ${height} m உயரத்திலிருந்து கிடையாக எறியப்படுகிறது. தரையை அடைய எவ்வளவு நேரம் எடுக்கும்?`),t,'s',bi(`Initial vertical velocity is zero. t = √(2h/g) = √(2 × ${height}/10) = ${t} s.`,`ஆரம்ப நிலைக்குத்து வேகம் பூச்சியம். t = √(2h/g) = √(2 × ${height}/10) = ${t} s.`));}
      if(n===2)return numeric(bi(`A ball launches from the ground with an upward velocity component of ${u} m/s. Find the time to return to launch level.`,`தரையிலிருந்து எறியப்பட்ட பந்தின் ஆரம்ப மேல்நோக்கிய வேகக் கூறு ${u} m/s. மீண்டும் அதே மட்டத்தை அடையும் நேரத்தைக் காண்க.`),2*u/g,'s',bi(`For equal launch and landing heights, T = 2uᵧ/g = 2 × ${u}/10 = ${2*u/g} s.`,`ஆரம்பமும் முடிவும் ஒரே மட்டத்தில்: T = 2uᵧ/g = 2 × ${u}/10 = ${2*u/g} s.`));
      const up=5*t,height=10*t*t,ans=2*t;return numeric(bi(`A ball starts ${height} m above ground with upward velocity ${up} m/s. Find the positive time at which it reaches the ground.`,`தரையிலிருந்து ${height} m உயரத்தில் உள்ள பந்து ${up} m/s மேல்நோக்கிய வேகத்துடன் எறியப்படுகிறது. தரையை அடையும் நேரத்தைக் காண்க.`),ans,'s',bi(`Set y = 0: 0 = ${height} + ${up}t − 5t². The physical (positive) root is ${ans} s.`,`y = 0 என இடுக: 0 = ${height} + ${up}t − 5t². பொருத்தமான நேர்மூலம் ${ans} s.`));
    }
    if(family==='range'){
      if(n===1)return numeric(bi(`A horizontal launch has speed ${u} m/s and remains airborne for ${t} s. Find the horizontal distance.`,`கிடையாக ${u} m/s வேகத்தில் எறியப்பட்ட பந்து ${t} s காற்றில் உள்ளது. கிடைத் தூரத்தைக் காண்க.`),u*t,'m',bi(`R = uₓT = ${u} × ${t} = ${u*t} m.`,`R = uₓT = ${u} × ${t} = ${u*t} m.`));
      if(n===2)return numeric(bi(`A ball is launched at ${u} m/s at 45° and lands at the same level. Find its range.`,`${u} m/s வேகத்தில் 45° கோணத்தில் எறியப்பட்ட பந்து அதே மட்டத்தில் விழுகிறது. வீச்சைக் காண்க.`),u*u/g,'m',bi(`R = u² sin(2θ)/g = ${u}² × sin 90°/10 = ${u*u/g} m.`,`R = u² sin(2θ)/g = ${u}² × sin 90°/10 = ${u*u/g} m.`));
      return numeric(bi(`A ball launches horizontally at ${u} m/s from a ${10*t*t} m ledge. What is its height above ground after ${t} s?`,`ஒரு பந்து ${10*t*t} m உயரத்திலிருந்து ${u} m/s கிடை வேகத்தில் எறியப்படுகிறது. ${t} s இன் பின் தரையிலிருந்து அதன் உயரம் என்ன?`),5*t*t,'m',bi(`y = h − ½gt² = ${10*t*t} − 5 × ${t}² = ${5*t*t} m. Horizontal speed does not enter this equation.`,`y = h − ½gt² = ${10*t*t} − 5 × ${t}² = ${5*t*t} m. கிடை வேகம் இச்சமன்பாட்டில் இல்லை.`));
    }
    if(family==='graphs'){
      if(n===1)return choice(bi('Which describes the horizontal velocity–time graph of an airborne projectile without drag?','வளித்தடை இல்லாத எறிய இயக்கத்தில் கிடை வேகம்–நேரம் வரைபு எவ்வாறு இருக்கும்?'),[bi('A line sloping upward','மேல்நோக்கிச் சாயும் கோடு'),bi('A line sloping downward','கீழ்நோக்கிச் சாயும் கோடு'),bi('A horizontal line','கிடைக் கோடு'),bi('A parabola','பரவளையம்'),bi('A vertical line','நிலைக்குத்துக் கோடு')],2,bi('Zero horizontal acceleration means horizontal velocity is constant. The graph has zero slope.','கிடை ஆர்முடுகல் பூச்சியம்; ஆகவே கிடை வேகம் மாறாது. வரைபின் சரிவு பூச்சியம்.'));
      if(n===2){q.graph={start:u,end:u-20,duration:2};return numeric(bi('The vertical velocity–time graph below uses upward as positive. Find its gradient, including the sign.','கீழுள்ள நிலைக்குத்து வேகம்–நேரம் வரைபில் மேல்நோக்கி நேராகக் கொள்ளப்பட்டுள்ளது. குறியுடன் சரிவைக் காண்க.'),-10,'m/s²',bi(`Gradient = Δv/Δt = (${u-20} − ${u})/2 = −10 m/s². This is downward acceleration.`,`சரிவு = Δv/Δt = (${u-20} − ${u})/2 = −10 m/s². இது கீழ்நோக்கிய ஆர்முடுகல்.`));}
      return numeric(bi(`A horizontal velocity–time graph is a constant ${u} m/s from t = 0 to ${t} s. What displacement does its area represent?`,`கிடை வேகம்–நேரம் வரைபில் t = 0 முதல் ${t} s வரை வேகம் ${u} m/s என மாறாமல் உள்ளது. வரைபின் கீழுள்ள பரப்பளவு காட்டும் இடப்பெயர்ச்சி என்ன?`),u*t,'m',bi(`Displacement is the area under the velocity graph: ${u} × ${t} = ${u*t} m.`,`வேகம்–நேரம் வரைபின் கீழுள்ள பரப்பளவு இடப்பெயர்ச்சி: ${u} × ${t} = ${u*t} m.`));
    }
    if(n===1){const angle=[60,45,30,60,45][v],fraction={60:'¼',45:'½',30:'¾'}[angle];q.source=variant===0?source:null;return numeric(bi(`At the highest point, a projectile retains ${fraction} of its launch kinetic energy. Neglecting drag, determine the launch angle above horizontal.`,`பாதையின் உச்சியில் எறியப்பட்ட பொருளின் இயக்கச் சக்தி ஆரம்ப இயக்கச் சக்தியின் ${fraction} பங்காக உள்ளது. வளித்தடையைப் புறக்கணித்து எறிகோணத்தைக் காண்க.`),angle,'°',bi(`At the top, vᵧ = 0. Ktop/Kinitial = cos²θ = ${fraction}, so θ = ${angle}°.`,`உச்சியில் vᵧ = 0. Kஉச்சி/Kஆரம்பம் = cos²θ = ${fraction}. எனவே θ = ${angle}°.`));}
    if(n===2)return numeric(bi(`A ball leaves ground at ${u} m/s and lands on a platform ${h} m higher. What is its speed on arrival? Assume the trajectory reaches the platform and ignore drag.`,`தரையிலிருந்து ${u} m/s வேகத்தில் எறியப்பட்ட பந்து ${h} m உயரமான மேடையை அடைகிறது. மேடையை அடையக்கூடிய பாதை எனக் கொண்டு, வளித்தடையைப் புறக்கணித்து அங்கு வேகத்தைக் காண்க.`),Math.sqrt(u*u-2*g*h),'m/s',bi(`Conservation of energy gives v² = u² − 2gh = ${u*u} − ${2*g*h}. Thus v = ${Math.sqrt(u*u-2*g*h).toFixed(2)} m/s.`,`சக்திக் காப்பு: v² = u² − 2gh = ${u*u} − ${2*g*h}. ஆகவே v = ${Math.sqrt(u*u-2*g*h).toFixed(2)} m/s.`));
    return choice(bi('A projectile lands at its original height without air resistance. How does its landing speed compare with its launch speed?','வளித்தடை இல்லாமல் எறியப்பட்ட பொருள் ஆரம்ப உயரத்திலேயே விழுகிறது. விழும் வேகத்தின் பருமன் ஆரம்ப வேகத்துடன் ஒப்பிடும்போது…'),[bi('It is zero','பூச்சியமாகும்'),bi('It is smaller','குறைவாகும்'),bi('It is larger','அதிகமாகும்'),bi('It is equal','சமமாகும்'),bi('Mass is needed to decide','திணிவு தெரிந்திருக்க வேண்டும்')],3,bi('At the same height, gravitational potential energy is unchanged. Conservation of mechanical energy gives the same speed; the vertical velocity direction is reversed.','அதே உயரத்தில் நிலைச் சக்தி சமம். பொறிமுறைச் சக்திக் காப்பினால் வேகத்தின் பருமன் சமம்; நிலைக்குத்து வேகத்தின் திசை மாறியிருக்கும்.'));
  }
  function grade(q,input){if(input===null||input===undefined||String(input).trim()==='')return{valid:false};const number=Number(input);if(!Number.isFinite(number))return{valid:false};if(q.type==='choice'&&(!Number.isInteger(number)||number<0||number>=q.options.length))return{valid:false};return{valid:true,correct:q.type==='choice'?number===q.correct:Math.abs(number-q.value)<=q.tolerance};}
  function clean(history){return Array.isArray(history)?history.filter(a=>ids.includes(a?.id)&&Number.isInteger(a.variant)&&a.variant>=0&&typeof a.correct==='boolean'&&typeof a.assisted==='boolean'&&Number.isFinite(a.at)&&a.at>0).slice(-600):[];}
  function evaluate(history,now=Date.now()){
    const all=clean(history),seen=new Set(),first=[];
    for(const a of all){const key=a.id+':'+make(a.id,a.variant).prompt.en;if(!seen.has(key)){seen.add(key);first.push(a)}}
    // A fresh variant may show improvement, but only one result per question style counts.
    const latest=new Map();for(const a of first){if(!a.assisted)latest.set(a.id,a)}
    const evidence=[...latest.values()].filter(a=>now-a.at<=14*86400000&&a.at<=now);
    const skills=Object.keys(families).map(f=>{const rows=evidence.filter(a=>a.id.startsWith(f+'-')),correct=rows.filter(a=>a.correct).length;return{id:f,total:rows.length,correct,secure:correct>=2}});
    const correct=evidence.filter(a=>a.correct).length,accuracy=evidence.length?Math.round(100*correct/evidence.length):0;
    const ready=evidence.length>=12&&accuracy>=85&&skills.every(s=>s.secure);
    const lastAt=evidence.length?Math.max(...evidence.map(a=>a.at)):0;
    return{total:evidence.length,correct,accuracy,skills,ready,reviewDue:ready&&now-lastAt>=2*86400000,lastAt,assisted:all.filter(a=>a.assisted).length};
  }
  function next(history,filter='all'){
    const all=clean(history),score=evaluate(all),available=ids.filter(id=>filter==='all'||id.startsWith(filter+'-'));
    if(!available.length)throw Error('Unknown skill');
    const candidates=available.flatMap(id=>[0,1,2,3,4].map(v=>make(id,v))).filter(q=>!all.some(a=>a.id===q.id&&make(a.id,a.variant).prompt.en===q.prompt.en));
    candidates.sort((a,b)=>{const skill=q=>score.skills.find(s=>s.id===q.family);const weight=q=>{const s=skill(q);return(s.secure?100:0)+s.correct*10+s.total};return weight(a)-weight(b)||all.filter(r=>r.id===a.id).length-all.filter(r=>r.id===b.id).length||a.variant-b.variant});
    return candidates[0]||null;
  }
  const api={families,ids,make,grade,evaluate,next,clean,source};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PhysicsBank=api;
})(globalThis);
