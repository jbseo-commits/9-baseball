// Career credit is opt-in at a real fresh campaign entry, never in engine fixtures.
export const HITTER_CAREER_KEY='9zone-hitter-career-v1';
export const CAREER_GOALS=Object.freeze({
 'contact-v1':{metric:null,target:0,label:'기본 타자'},
 'slugger-v1':{metric:'longHits',target:3,label:'일반 경기 장타 3개'},
 'bad-ball-v1':{metric:'takenBalls',target:5,label:'지켜본 볼 5개'},
 'spray-v1':{metric:'runs',target:3,label:'일반 경기 득점 3점'},
});
const keys=['longHits','takenBalls','runs'];
const count=x=>Number.isSafeInteger(x)&&x>=0&&x<=10000000;
export const validCareerReceipt=c=>!!c&&c.version===1&&typeof c.id==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(c.id)&&count(c.pitch)&&keys.every(k=>count(c[k]));
const empty=()=>({version:1,runs:{}});
const durableGet=(storage,key)=>storage?.getDurableItem?storage.getDurableItem(key):storage?.getItem(key);
export function readHitterCareer(storage){
 try{const p=JSON.parse(durableGet(storage,HITTER_CAREER_KEY));if(p?.version!==1||!p.runs||Array.isArray(p.runs)||typeof p.runs!=='object')return empty();
 const runs={};for(const [id,r] of Object.entries(p.runs)){if(validCareerReceipt({...r,id})&&Number.isInteger(r.seed)&&r.seed>=0&&r.seed<=4294967295)runs[id]=r;}return {version:1,runs};
 }catch{return empty();}
}
export function careerProgress(profile,id){const g=CAREER_GOALS[id];if(!g)return {unlocked:false,value:0,target:0};const value=g.metric?Object.values(profile?.runs||{}).reduce((n,r)=>n+(r[g.metric]||0),0):0;return {...g,value:Math.min(g.target,value),unlocked:!g.metric||value>=g.target};}
function write(storage,p){const value=JSON.stringify(p);storage.setItem(HITTER_CAREER_KEY,value);if(durableGet(storage,HITTER_CAREER_KEY)!==value)throw Error('career persistence unavailable');return p;}
export function registerCareer(storage,state,id,{normalEntry=false}={}){
 if(!normalEntry||state?.version!==10||state.phase!=='map'||state.stats?.pitches!==0||state.defenseLab||state.runMap?.nodes?.some(n=>n.opponent?.artId==='regular-01-red-rush')||!validCareerReceipt({version:1,id,pitch:0,longHits:0,takenBalls:0,runs:0}))return state;
 const profile=readHitterCareer(storage);if(profile.runs[id])return state;
 const receipt={version:1,id,pitch:0,longHits:0,takenBalls:0,runs:0};
 write(storage,{...profile,runs:{...profile.runs,[id]:{...receipt,seed:state.initialSeed}}});
 return {...state,v10:{...state.v10,career:receipt}};
}
export function recordCareerPitch(before,next,{credit=true}={}){
 const c=before?.v10?.career,r=next?.battle?.revealed;
 if(!validCareerReceipt(c)||before.version!==10||before.phase!=='battle'||before.defenseLab||!r||next.stats?.pitches!==before.stats?.pitches+1||c.pitch!==before.stats.pitches)return next;
 if(!credit)return {...next,v10:{...next.v10,career:{...c,pitch:next.stats.pitches}}};
 return {...next,v10:{...next.v10,career:{...c,pitch:next.stats.pitches,longHits:c.longHits+(r.kind==='hit'&&next.stats.totalBases-before.stats.totalBases>=2?1:0),takenBalls:c.takenBalls+(r.action==='take'&&r.kind==='ball'?1:0),runs:c.runs+Math.max(0,next.stats.runs-before.stats.runs)}}};
}
export function reconcileCareer(storage,state){
 const c=state?.v10?.career;if(!validCareerReceipt(c)||state.version!==10||state.defenseLab||c.pitch!==state.stats?.pitches)return readHitterCareer(storage);
 const profile=readHitterCareer(storage),old=profile.runs[c.id];if(!old||old.seed!==state.initialSeed||c.pitch<=old.pitch)return profile;
 // Require the exact run receipt to be durable before awarding anything.
 const saved=JSON.parse(durableGet(storage,'9zone-v10-run')||'null');if(JSON.stringify(saved?.v10?.career)!==JSON.stringify(c)||saved?.initialSeed!==state.initialSeed)return profile;
 const merged={...old,pitch:c.pitch};for(const k of keys)merged[k]=Math.max(old[k],c[k]);return write(storage,{...profile,runs:{...profile.runs,[c.id]:merged}});
}
