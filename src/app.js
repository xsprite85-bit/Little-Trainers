(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- מצב ושמירה (רק במכשיר; אם האחסון חסום, ממשיכים בלי) ---------- */
const KEY='animal-translator.v1';
const blank=()=>({clicks:0,sessions:0,translations:0,tricks:{},quiz:0,badges:[],game:{k:{},stars:0},pet:newPet(),safe:{best:{}},play:{total:0,days:{}}});
const UCOL=['#2e7cf6','#e8458f','#16a34a','#ea580c','#7c3aed','#0891b2','#dc2626','#a16207'];
const DEFU=()=>[{id:'romi',name:'רוֹמִי',age:10,color:'#2e7cf6',animal:'dog',mode:'auto'},{id:'lia',name:'לִיָּה',age:4,color:'#e8458f',animal:'dog',mode:'auto'}];
const S={who:null,users:DEFU(),playGone:0,nu:null,delId:null,screen:'login',animal:'dog',fur:'rgb(162,106,70)',baseline:null,sound:true,
  data:{romi:blank(),lia:blank()},res:null,busy:false,quiz:{lv:null,i:0,ok:0,ans:null},trick:null,
  timer:{left:180,total:180,run:false,h:null},sessClicks:0,gate:null,parentOK:false,sampleId:null,dogName:'פודי',lang:'he',puppy:true,editName:false,nk:true,nkSp:true,pron:{}};
function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j){S.fur=j.fur||S.fur;S.baseline=j.baseline||null;S.sound=j.sound!==false;S.dogName=(typeof j.dogName==='string'&&j.dogName.trim())?j.dogName:'פודי';S.lang=j.lang==='en'?'en':'he';S.catBreed=typeof j.catBreed==='string'?j.catBreed:'tabby';S.real=(j.real&&typeof j.real==='object')?j.real:null;S.puppy=j.puppy!==false;S.nk=j.nk!==false;S.nkSp=j.nkSp!==false;S.pron=(j.pron&&typeof j.pron==='object')?j.pron:{};
  if(Array.isArray(j.users))S.users=j.users.filter(u=>u&&typeof u.id==='string'&&typeof u.name==='string').map(u=>({id:u.id,name:u.name.slice(0,24),age:Math.max(2,Math.min(18,+u.age||6)),color:/^#[0-9a-f]{6}$/i.test(u.color)?u.color:UCOL[0],animal:u.animal==='cat'?'cat':'dog',mode:['auto','simple','full'].includes(u.mode)?u.mode:'auto',g:u.g==='m'?'m':'f'}));
  S.playGone=Math.max(0,+j.playGone||0);S.data={};
  S.users.forEach(u=>{S.data[u.id]=Object.assign(blank(),(j.data&&j.data[u.id])||{})})}}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({fur:S.fur,baseline:S.baseline,sound:S.sound,dogName:S.dogName,puppy:S.puppy,nk:S.nk,nkSp:S.nkSp,lang:S.lang,pron:S.pron,users:S.users,playGone:S.playGone,catBreed:S.catBreed,real:S.real,data:S.data}));return true}catch(e){return false}}
load();

/* ---------- זמן משחק נטו: נספר רק בזמן פעילות בפועל של ילדה מחוברת ---------- */
const PLT={act:Date.now(),tick:Date.now(),dirty:0,IDLE:30000};
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function pBox(k){const d=S.data[k];if(!d.play||typeof d.play!=='object')d.play={total:0,days:{}};if(!d.play.days||typeof d.play.days!=='object')d.play.days={};d.play.total=Math.max(0,+d.play.total||0);return d.play}
const clk=ms=>{const s=Math.floor(Math.max(0,ms)/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')};
['pointerdown','pointermove','touchstart','keydown','wheel','input'].forEach(ev=>document.addEventListener(ev,()=>{PLT.act=Date.now()},{passive:true,capture:true}));
setInterval(()=>{const now=Date.now(),dt=Math.min(now-PLT.tick,2000);PLT.tick=now;
  if(!S.who||S.screen==='login'||S.screen==='parent'||document.hidden||now-PLT.act>PLT.IDLE)return;
  const p=pBox(S.who),k=dayKey();p.total+=dt;p.days[k]=(p.days[k]||0)+dt;PLT.dirty+=dt;
  const ks=Object.keys(p.days);if(ks.length>100)ks.sort().slice(0,ks.length-90).forEach(x=>delete p.days[x]);
  if(PLT.dirty>=10000){PLT.dirty=0;save()}},1000);
const ptFlush=()=>{if(PLT.dirty){PLT.dirty=0;save()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)ptFlush()});window.addEventListener('pagehide',ptFlush);

/* ---------- ניקוד והגייה ---------- */
const NKC='ְ-ּׁׂ',HL='א-ת';
const NKR=new RegExp('['+HL+NKC+']+(?:["\'׳״]['+HL+NKC+']+)*','g'),NKM=new RegExp('['+NKC+']');
const nkStrip=t=>String(t).replace(new RegExp('['+NKC+']','g'),'');
const nk=t=>{t=String(t);for(const k in NKP)if(t.indexOf(k)>=0)t=t.split(k).join(NKP[k]);return t.replace(NKR,w=>NKM.test(w)?w:(NK[w]||w))};
const PRON={};
function pron(text){const P=Object.assign({},PRON,S.pron||{});
  return String(text).replace(NKR,w=>{const b=nkStrip(w);if(P[b])return P[b];return S.nkSp?(NKM.test(w)?w:(NK[w]||w)):b})}
const NKSKIP=/^(SCRIPT|STYLE|TEXTAREA|INPUT)$/,HEBRE=new RegExp('['+HL+']');
function nkNode(root){if(S.lang!=='he'||!root)return;
  if(root.nodeType===3){if(root.parentNode&&!NKSKIP.test(root.parentNode.nodeName)&&HEBRE.test(root.nodeValue)){NOCAT=!!(root.parentNode.closest&&root.parentNode.closest('[data-nocat]'));let v=catW(gnd(root.nodeValue));NOCAT=false;if(NKON())v=gndNk(nk(v));if(v!==root.nodeValue)root.nodeValue=v}return}
  if(root.nodeType!==1||NKSKIP.test(root.nodeName))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>nkNode(n))}
/* ---------- שפות: מילון עברית->אנגלית, מתורגם בזמן ריצה על הטקסט שעל המסך ---------- */
const EN=(typeof I18N_EN==='object'&&I18N_EN)||{};
let TRRE=null;
function trBuild(){const ks=Object.keys(EN).sort((a,b)=>b.length-a.length),R=s=>s.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&');
  TRRE=new RegExp(ks.map(k=>{const e=R(k).replace(/ /g,'\\s+'),HB=/[א-ת]/,last=k.split(' ').pop();return (HB.test(k[0])?'(?<![א-ת])':'')+e+(HB.test(k[k.length-1])&&(k.length<=3||last.length>2)?'(?![א-ת])':'')}).join('|'),'g')}
function tr(s){s=String(s);if(S.lang!=='en'||!HEBRE.test(s))return s;if(!TRRE)trBuild();
  s=nkStrip(s);return catW(s.replace(TRRE,(m,...r)=>{let v=EN[m.replace(/\s+/g,' ')];if(v==null)return m;const o=r[r.length-2],str=r[r.length-1],nx=str[o+m.length]||'',pv=str[o-1]||'';
    if(nx&&/\S/.test(nx)&&!/[.,!?:;)\]"'״׳…]/.test(nx)&&/[\w)]$/.test(v))v+=' ';if(/[\w\u05d0-\u05ea]/.test(pv)&&/^\w/.test(v))v=' '+v;return v}))}
const TRATTR=['placeholder','aria-label','title','alt'];
function trNode(root){if(S.lang!=='en'||!root)return;
  if(root.nodeType===3){const p=root.parentNode;if(p&&!NKSKIP.test(p.nodeName)&&!(p.closest&&p.closest('[data-notr]'))&&HEBRE.test(root.nodeValue)){NOCAT=!!(p.closest&&p.closest('[data-nocat]'));const v=tr(root.nodeValue);NOCAT=false;if(v!==root.nodeValue)root.nodeValue=v}return}
  if(root.nodeType!==1||NKSKIP.test(root.nodeName))return;
  if(root.closest&&root.closest('[data-notr]'))return;
  const els=[root].concat([...root.querySelectorAll('*')]);
  els.forEach(el=>{TRATTR.forEach(a=>{const v=el.getAttribute&&el.getAttribute(a);if(v&&HEBRE.test(v)){const t=tr(v);if(t!==v)el.setAttribute(a,t)}})});
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>trNode(n))}
const NKON=()=>S.nk&&S.lang==='he';
function applyLang(){const en=S.lang==='en';document.documentElement.lang=S.lang;document.documentElement.dir=en?'ltr':'rtl';const a=document.getElementById('app');if(a){a.lang=S.lang;a.dir=en?'ltr':'rtl'}document.title=en?'Little Trainers':'מאלפים קטנים';document.body.classList.toggle('en',en)}
if(window.MutationObserver)new MutationObserver(ms=>{for(const m of ms){if(S.lang==='en'){if(m.type==='characterData')trNode(m.target);else if(m.type==='attributes')trNode(m.target);else m.addedNodes.forEach(n=>trNode(n))}else{if(m.type==='characterData')nkNode(m.target);else if(m.type==='childList')m.addedNodes.forEach(n=>nkNode(n))}}}).observe(document.body,{childList:true,subtree:true,characterData:true});
const D=()=>S.data[S.who];
let inFrame=true;try{inFrame=window.self!==window.top}catch(e){inFrame=true}
let MIC=(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||inFrame||(document.featurePolicy&&document.featurePolicy.allowsFeature&&!document.featurePolicy.allowsFeature('microphone')))?'native':'live';
const DN=()=>{const n=(S.who&&S.data[S.who]&&S.data[S.who].dogName)||S.dogName||'פודי';return S.lang==='en'&&nkStrip(n)==='פודי'?'Poody':n};
const FUR=()=>(S.who&&S.data[S.who]&&S.data[S.who].fur)||S.fur;
const U=()=>S.users.find(u=>u.id===S.who)||null;
const UNAME=()=>{const u=U();return u?u.name:''};
const INI=u=>u?(nkStrip(tr(u.name)).trim()[0]||'?').toUpperCase():'';
const simpleOf=u=>!!u&&(u.mode==='simple'||(u.mode!=='full'&&(+u.age||0)<6));
const lia=()=>simpleOf(U());

/* ---------- אודיו ---------- */
let ctx=null;
function audio(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)ctx=new C()}return ctx}
function unlock(){const c=audio();if(c&&c.state==='suspended')c.resume()}
document.addEventListener('pointerdown',unlock,{passive:true});
function click(){const c=audio();if(!c||!S.sound)return;unlock();const t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type='square';o.frequency.setValueAtTime(2400,t);o.frequency.exponentialRampToValueAtTime(900,t+.03);
  g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.07)}
function chime(){const c=audio();if(!c||!S.sound)return;unlock();[660,880,1320].forEach((f,i)=>{const t=c.currentTime+i*.12,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.32)})}
function playSamples(x,sr){const c=audio();if(!c)return;unlock();const b=c.createBuffer(1,x.length,sr),s=c.createBufferSource();b.copyToChannel(x,0);s.buffer=b;s.connect(c.destination);s.start()}
function NTTS(){const C=window.Capacitor;return C&&C.isNativePlatform&&C.isNativePlatform()&&C.Plugins&&C.Plugins.TextToSpeech?C.Plugins.TextToSpeech:null}
function hebVoice(){const v=window.speechSynthesis?speechSynthesis.getVoices():[];return v.find(x=>/^he/i.test(x.lang))||null}
function enVoice(){const v=window.speechSynthesis?speechSynthesis.getVoices():[];return v.find(x=>/^en[-_]US/i.test(x.lang))||v.find(x=>/^en/i.test(x.lang))||null}
const curVoice=()=>S.lang==='en'?enVoice():hebVoice();
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{};
/* קול כלבלבי: נביחה קצרה ודיבור שמתחיל מיד (טלפונים חוסמים דיבור שמתחיל באיחור אחרי לחיצה) */
let noiseBuf=null;
function bark(kind){const c=audio();if(!c||!S.sound)return;unlock();
  if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate*.4,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const t=c.currentTime+.01,low=kind==='woof',whine=kind==='whine',len=whine?.45:low?.2:.13;
  const out=c.createGain();out.gain.value=.55;out.connect(c.destination);
  // גוף הקול: גל עם צליל אנפפי
  const o=c.createOscillator(),og=c.createGain(),f1=c.createBiquadFilter(),f2=c.createBiquadFilter();
  o.type='sawtooth';const base=low?330:whine?900:620;
  o.frequency.setValueAtTime(base*.85,t);o.frequency.linearRampToValueAtTime(base*(whine?1.25:1.3),t+len*.25);o.frequency.exponentialRampToValueAtTime(base*(whine?.7:.75),t+len);
  f1.type='bandpass';f1.frequency.value=low?600:1100;f1.Q.value=2;f2.type='bandpass';f2.frequency.value=low?1500:2600;f2.Q.value=3;
  og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(whine?.35:.8,t+.012);og.gain.exponentialRampToValueAtTime(.001,t+len);
  o.connect(f1);o.connect(f2);f1.connect(og);f2.connect(og);og.connect(out);o.start(t);o.stop(t+len+.03);
  if(whine){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=6;lg.gain.value=35;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+len)}
  // נשיפה קצרה בהתחלה, כמו בנביחה אמיתית
  if(!whine){const n=c.createBufferSource(),nf=c.createBiquadFilter(),ng=c.createGain();n.buffer=noiseBuf;nf.type='bandpass';nf.frequency.value=low?900:1800;nf.Q.value=.8;
    ng.gain.setValueAtTime(.5,t);ng.gain.exponentialRampToValueAtTime(.001,t+len*.6);n.connect(nf);nf.connect(ng);ng.connect(out);n.start(t);n.stop(t+len)}
}
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let speechReady=false;
function unlockSpeech(){if(speechReady||!IOS||!window.speechSynthesis)return;speechReady=true;try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch(e){}}
document.addEventListener('pointerdown',unlockSpeech,{passive:true});
const clean=t=>String(t).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}]/gu,' ').replace(/\s+/g,' ').trim();
let voiceOK=null;
function speak(text,kind,narrator){
  text=clean(catW(tr(gnd(text))));if(!text)return;
  const dog=!narrator&&S.puppy;
  const av=$('.avatar');const dur=Math.min(7000,800+text.length*75);
  if(av&&!narrator){av.classList.add('talk');clearTimeout(speak.t);speak.t=setTimeout(()=>av.classList.remove('talk'),dur)}
  if(!S.sound)return;
  if(dog)bark(kind||'yip');
  {const nt=NTTS();if(nt){try{nt.stop().catch(()=>{});nt.speak({text:gndNk(pron(text)),lang:S.lang==='en'?'en-US':'he-IL',rate:dog?(lia()?.95:1.05):(lia()?.85:.95),pitch:dog?1.5:1,volume:1,category:'ambient'}).then(()=>{if(!narrator){clearTimeout(speak.t);const a=$('.avatar');if(a)a.classList.remove('talk')}}).catch(()=>{})}catch(e){}return}}
  if(!window.speechSynthesis)return;
  try{
    if(speechSynthesis.speaking||speechSynthesis.pending)speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(gndNk(pron(text)));u.lang=S.lang==='en'?'en-US':'he-IL';const v=curVoice();if(v)u.voice=v;
    if(dog&&voiceOK!==false){u.pitch=1.6;u.rate=lia()?.95:1.05}else{u.pitch=1;u.rate=lia()?.85:.95}
    let started=false;u.onstart=()=>{started=true;voiceOK=true};
    u.onerror=()=>{if(dog)voiceOK=false};
    u.onend=()=>{if(narrator)return;clearTimeout(speak.t);const a=$('.avatar');if(a)a.classList.remove('talk')};
    speechSynthesis.speak(u);
    clearTimeout(speak.g);speak.g=setTimeout(()=>{if(!started&&!speechSynthesis.speaking&&!narrator)toast(tr('לא שמעתם? לחצו על 🔊 כדי לשמוע'))},2500);
  }catch(e){}
}
const KIND={calm:'yip',playful:'yip',alert:'woof',angry:'woof',lonely:'whine',scared:'whine'};
function toast(t){const o=$('.toast');if(o)o.remove();const d=document.createElement('div');d.className='toast';d.setAttribute('role','status');d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3200)}

/* ---------- אווטאר ---------- */
function brows(m){
  const k='stroke="#3b2a1d" stroke-width="5" stroke-linecap="round" fill="none"';
  if(m==='angry')return `<path d="M62 82L90 91M138 82L110 91" ${k}/>`;
  if(m==='sad')return `<path d="M62 92L90 83M138 92L110 83" ${k}/>`;
  if(m==='scared')return `<path d="M64 80Q76 70 90 78M136 80Q124 70 110 78" ${k}/>`;
  if(m==='alert')return `<path d="M64 78Q77 70 90 78M136 78Q123 70 110 78" ${k}/>`;
  return '';
}
function eyes(m){
  const k='stroke="#2b2230" stroke-width="5" stroke-linecap="round" fill="none"';
  if(m==='happy')return `<path d="M64 102q12-16 26 0M110 102q12-16 26 0" ${k}/>`;
  if(m==='calm')return `<path d="M64 98q13 13 26 0M110 98q13 13 26 0" ${k}/>`;
  const r=(m==='scared'||m==='alert')?10:(m==='angry'?6:8);
  const e=x=>`<circle cx="${x}" cy="99" r="${r+3}" fill="#fff"/><circle cx="${x}" cy="100" r="${r}" fill="#2b2230"/><circle cx="${x+3}" cy="96" r="2.6" fill="#fff"/>`;
  return e(78)+e(122)+(m==='sad'?'<path d="M72 112q-4 12 0 18" stroke="#6fc3ff" stroke-width="5" fill="none" stroke-linecap="round"/>':'')+(m==='scared'?'<path d="M158 70q8 12 0 18q-8-6 0-18z" fill="#6fc3ff"/>':'');
}
function mouth(m){
  const k='stroke="#2b2230" stroke-width="5" stroke-linecap="round" fill="none"';
  const o='<ellipse class="mo" cx="100" cy="136" rx="12" ry="11" fill="#7a2740"/>';
  let c;
  if(m==='happy')c='<path d="M80 128Q100 156 120 128Z" fill="#7a2740"/><ellipse cx="100" cy="142" rx="8" ry="6" fill="#ff8fa3"/>';
  else if(m==='calm')c=`<path d="M86 132Q100 142 114 132" ${k}/>`;
  else if(m==='sad')c=`<path d="M86 142Q100 128 114 142" ${k}/>`;
  else if(m==='angry')c=`<path d="M84 140Q100 126 116 140" ${k}/>`;
  else if(m==='scared')c=`<path d="M85 137q6-6 8 0t8 0t8 0t8 0" ${k}/>`;
  else c='<ellipse cx="100" cy="136" rx="6" ry="8" fill="#2b2230"/>';
  return `<g class="mc">${c}</g>${o}`;
}
function avatar(animal,mood){
  mood=mood||'happy';if(animal==='dog'&&petCat()&&S.screen!=='learn')animal='cat';
  const dog=animal==='dog';
  const body=dog?`
    <circle cx="44" cy="104" r="30" fill="var(--furd)"/><circle cx="34" cy="128" r="22" fill="var(--furd)"/><circle cx="156" cy="104" r="30" fill="var(--furd)"/><circle cx="166" cy="128" r="22" fill="var(--furd)"/>
    <circle cx="100" cy="40" r="26" fill="var(--fur)"/><circle cx="74" cy="52" r="22" fill="var(--fur)"/><circle cx="126" cy="52" r="22" fill="var(--fur)"/><circle cx="100" cy="62" r="24" fill="var(--fur)"/>
    <ellipse cx="100" cy="106" rx="58" ry="54" fill="var(--fur)"/>
    <ellipse cx="100" cy="128" rx="32" ry="26" fill="var(--muzzle)"/>
    <ellipse cx="100" cy="116" rx="11" ry="8" fill="#2b2230"/>`
  :`
    <path d="M44 74L52 22L92 54Z" fill="var(--cat)"/><path d="M156 74L148 22L108 54Z" fill="var(--cat)"/>
    <path d="M54 62L56 36L76 54Z" fill="#f4a9b4"/><path d="M146 62L144 36L124 54Z" fill="#f4a9b4"/>
    <ellipse cx="100" cy="108" rx="62" ry="54" fill="var(--cat)"/>
    <ellipse cx="100" cy="128" rx="30" ry="24" fill="#fff4e3"/>
    <path d="M92 112h16l-8 9z" fill="#f08aa0"/>
    <path d="M60 122l-28-6M60 130l-28 4M140 122l28-6M140 130l28 4" stroke="#fff4e3" stroke-width="3" stroke-linecap="round"/>
    <path d="M70 70v-14M84 62v-14M130 62v-14M116 70v-14" stroke="var(--catd)" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
  const svg=`<svg viewBox="0 0 200 200">${body}${brows(mood)}${eyes(mood)}${mouth(mood)}</svg>`;
  return `<div class="avatar" data-animal="${animal}" data-mood="${mood}" aria-hidden="true">${GL.ok?'':svg}</div>`;
}
const MOOD={calm:'calm',playful:'happy',alert:'alert',angry:'angry',lonely:'sad',scared:'scared',none:'happy',happy:'happy'};
const NAME={dog:'פּוּדי',cat:'מִיצי'};

/* ---------- תוכן ---------- */
const SAY={
 dog:{
  calm:['אני רגוע ושמח. בא לי לנוח.','אני רגוע. לא קורה הרבה, אז אני סתם נח.'],
  playful:['אני שמח! בואו נשחק!','אני מתרגש ושמח! נבחתי הרבה פעמים ובקול גבוה, כי בא לי לשחק.'],
  alert:['שמעתי משהו! אני שומר עליכם.','שמעתי משהו שלא הכרתי. הנביחות שלי חדות ומהירות, ככה אני מזהיר שמישהו קרוב.'],
  angry:['לא נוח לי. תתרחקו קצת.','לא נוח לי. הקול שלי נמוך וגרוני. ככה אני מבקש: בבקשה, תנו לי מקום.'],
  lonely:['אני מתגעגע. בואו אליי.','אני קורא לכם בקול ארוך וגבוה. בא לי חברה או קצת תשומת לב.'],
  scared:['אני מפחד. תקראו למבוגר.','קצת מפחיד לי. הקול שלי גבוה ורועד. תנו לי מקום שקט ותקראו למבוגר.']},
 cat:{
  calm:['אני רגועה ונוחה.','אני רגועה. כמעט לא השמעתי קול.'],
  playful:['שלום! כיף לראות אתכם!','שלום! השמעתי מיאו קצר וגבוה. ככה חתולים אומרים היי.'],
  alert:['שמעתי משהו!','שמעתי משהו ואני מקשיבה.'],
  angry:['לא מרוצה! עזבו אותי.','אני לא מרוצה. הקול שלי גרוני, ככה אני אומרת: די.'],
  lonely:['אני רוצה משהו. אולי אוכל?','השמעתי מיאו ארוך. חתולים מבקשים ככה אוכל או תשומת לב.'],
  scared:['אני מפחדת. אני צריכה מקום בטוח.','אני מפחדת. תנו לי מקום להתחבא ותקראו למבוגר.']}};
const LABEL={calm:'רגוע',playful:'שמח ומשחק',alert:'שומר ומזהיר',angry:'לא נוח לו',lonely:'מתגעגע או רוצה משהו',scared:'מפחד',none:'לא שמענו'};
const LIA3={happy:{e:'😀',t:'שמח'},scared:{e:'😨',t:'מפחד'},angry:{e:'😠',t:'כועס'}};
const TO3={calm:'happy',playful:'happy',alert:'angry',angry:'angry',lonely:'scared',scared:'scared'};
const STUDY={
 dog:{calm:'מעט קולות והתרגשות נמוכה מראים שהכלב רגוע (Briefer ועמיתים, 2020).',
  playful:'צלילים גבוהים ונקיים, בקצב מהיר, מופיעים הרבה בזמן משחק (Yin ו-McCowan, 2004; Pongrácz ועמיתים, 2005).',
  alert:'נביחות גרוניות ומהירות הן בדרך כלל התראה על זר או הפרעה (Yin ו-McCowan, 2004).',
  angry:'קול נמוך וגרוני הוא סימן אזהרה שנמצא אצל בעלי חיים רבים (Morton, 1977).',
  lonely:'קול גבוה וארוך נשמע כמו קריאה לחברה או לתשומת לב (Yin ו-McCowan, 2004).',
  scared:'קול גבוה וחוזר, שנשמע רועד, מופיע כשהחיה במתח (Morton, 1977; Briefer, 2012).'},
 cat:{calm:'מעט קולות והתרגשות נמוכה.',playful:'מיאו קצר וגבוה הוא ברכה בין חתולים לבני אדם (McComb ועמיתים, 2009).',alert:'חתולים מקשיבים בשקט לפני שהם מגיבים.',
  angry:'קול גרוני ונמוך הוא אזהרה (Morton, 1977).',lonely:'מיאו ארוך הוא בקשה לאוכל או לתשומת לב (Nicastro, 2004; McComb ועמיתים, 2009).',scared:'קול גבוה וחוזר מצביע על מתח.'}};
const CONF=['','לא בטוח','כנראה','די בטוח'];

/* בנק הטריקים: 3 רמות. ליה רואה רק את רמה 1. כל טריק: צעדים, טיפ, ותמונות לליה ברמה 1 */
const LEVELS=[{n:1,t:'קל',d:'מתחילים כאן'},{n:2,t:'בינוני',d:'אחרי שהקלים מצליחים'},{n:3,t:'מתקדם',d:'לאלופים, עם הרבה סבלנות'}];
const TRICKS=[
 {id:'clicker',lv:1,n:'הקליק שווה חטיף',ic:'🔔',why:'הכלב לומד שהצליל הזה אומר: עשית משהו מצוין, חטיף מגיע.',
  steps:['מחזיקים חטיף קטן ביד אחת, קליקר ביד השנייה','לוחצים קליק','תוך שנייה או שתיים נותנים חטיף (על כף יד פתוחה או על הרצפה)','חוזרים 10 עד 15 פעמים, בלי לבקש כלום מהכלב'],
  tip:'זה הטריק הראשון. בלעדיו הקליקר לא אומר לכלב כלום.',pics:['🔔 קליק','🍖 חטיף מיד','🔁 עוד פעם']},
 {id:'name',lv:1,n:'כשקוראים בשם',ic:'📛',why:'הכלב מסתובב אליכם כששומע את השם שלו.',
  steps:['מחכים שהכלב לא מסתכל עליכם','אומרים את השם שלו פעם אחת, בקול שמח','ברגע שהוא מסתובב אליכם: קליק וחטיף','לא חוזרים על השם שוב ושוב. אם לא הגיב, מחכים ומנסים אחר כך'],
  tip:'משתמשים בשם רק לדברים טובים, אף פעם לא כדי לנזוף.',pics:['📛 קוראים בשם','👀 מסתובב','🍖 חטיף']},
 {id:'sit',lv:1,n:'שב',ic:'🐕',why:'הכי קל להתחיל ממנו.',
  steps:['עומדים מול הכלב וחטיף קטן בין האצבעות','מקרבים את החטיף לאף ומעלים אותו לאט מעל הראש','כשהכלב מרים את האף הישבן יורד. ברגע שהוא נוגע ברצפה: קליק','נותנים חטיף. אחרי כמה פעמים אומרים "שב" רגע לפני שמזיזים את היד'],
  tip:'אם הכלב קופץ, היד גבוהה מדי. מחזיקים את החטיף קרוב לאף.',pics:['🍖 חטיף מעל האף','🐕 הישבן יורד','🍖 חטיף']},
 {id:'touch',lv:1,n:'נגיעה באף',ic:'👃',why:'הכלב נוגע ביד שלכם באף. מעולה לילדים קטנים, כי לא צריך לגעת בכלב.',
  steps:['מציגים כף יד פתוחה במרחק של חצי זרוע','כשהכלב מרחרח או נוגע בה באף: קליק','נותנים חטיף מהיד השנייה','אחרי כמה פעמים אומרים "גע" ומרחיקים את היד קצת'],
  tip:'אפשר לשפשף מעט חטיף על כף היד בהתחלה, כדי שיהיה לו מעניין להריח.',pics:['🖐️ כף יד פתוחה','👃 האף נוגע','🍖 חטיף']},
 {id:'look',lv:1,n:'הסתכל עליי',ic:'👀',why:'הכלב מסתכל לכם בעיניים. עוזר לו להתרכז בכם.',
  steps:['מחזיקים חטיף ליד האף של הכלב','מעלים את החטיף לאט אל ליד העיניים שלכם','כשהעיניים שלו נפגשות בשלכם: קליק וחטיף','מוסיפים את המילה "הסתכל" ומאריכים לשנייה, ואז לשתיים'],
  tip:'מבט קצר מספיק בהתחלה. לא בוהים בכלב הרבה זמן.',pics:['🍖 חטיף ליד העיניים','👀 מבט','🍖 חטיף']},
 {id:'paw',lv:1,n:'תן כף',ic:'🐾',why:'הכלב נותן לכם את הכף שלו. טריק חמוד ונעים.',
  steps:['הכלב יושב. סוגרים חטיף בתוך האגרוף ומחזיקים ליד החזה שלו','מחכים. הכלב ינסה להגיע לחטיף עם הכף','ברגע שהכף נוגעת באגרוף: קליק, פותחים ונותנים חטיף','אחרי כמה פעמים מציגים יד פתוחה ואומרים "כף"'],
  tip:'אם הוא רק מלקק את האגרוף, מחכים בסבלנות. הכף תגיע.',pics:['✊ חטיף באגרוף','🐾 הכף נוגעת','🍖 חטיף']},
 {id:'down',lv:2,n:'שכב',ic:'🛌',why:'מתחילים מ"שב".',
  steps:['הכלב יושב. חטיף בין האצבעות ליד האף','מורידים את היד לאט אל הרצפה, בין הכפות','כשהמרפקים נוגעים ברצפה: קליק וחטיף','אם הכלב קם, מתחילים שוב מ"שב". בלי כעס'],tip:'על שטיח קל יותר לכלב קטן לשכב מאשר על רצפה קרה.'},
 {id:'come',lv:2,n:'בוא אליי',ic:'🏃',why:'הפקודה החשובה ביותר לבטיחות.',
  steps:['מתחילים בחדר שקט, במרחק של שני צעדים','מתכופפים, פותחים ידיים ואומרים "בוא!" בקול שמח','כשהכלב מגיע: קליק וחטיף','לא נוזפים ולא מענישים כשהוא מגיע, גם אם לקח לו זמן'],tip:'אם הוא בורח, לא רודפים אחריו. רצים הפוך, והוא ירצה לבוא.'},
 {id:'stay',lv:2,n:'חכה',ic:'✋',why:'מתחילים משנייה אחת.',
  steps:['הכלב יושב. מציגים כף יד כמו תמרור עצור ואומרים "חכה"','סופרים שנייה אחת. קליק וחטיף','מוסיפים עוד שנייה בכל הצלחה','רק אחרי שזה עובד מתרחקים צעד אחד, עם מבוגר לידכם'],tip:'מוסיפים דבר אחד בכל פעם: יותר זמן, או יותר מרחק. לא את שניהם יחד.'},
 {id:'spin',lv:2,n:'סיבוב',ic:'🌀',why:'כיף ומצחיק.',
  steps:['חטיף ליד האף של הכלב','מזיזים את היד בעיגול סביב הכלב','כשהוא משלים סיבוב: קליק וחטיף','אחרי כמה פעמים אומרים "סובב" ועושים עיגול קטן יותר'],tip:'מתחילים בחצי סיבוב ומקליקים, ואז מבקשים סיבוב שלם.'},
 {id:'hi5',lv:2,n:'היי פייב',ic:'🙌',why:'ממשיכים מ"תן כף".',
  steps:['מבקשים "כף" עם היד נמוכה','בכל פעם מרימים את היד מעט, עד שהיא עומדת כמו בהיי פייב','כשהכף נוגעת בכף היד: קליק וחטיף','מוסיפים את המילה "פייב"'],tip:'צריך קודם ש"תן כף" יעבוד טוב.'},
 {id:'leave',lv:2,n:'עזוב',ic:'🚫',why:'הכלב לומד לא לקחת משהו. חשוב לבטיחות, למשל אוכל שנפל.',
  steps:['סוגרים חטיף פשוט באגרוף ומראים לכלב','הכלב ינסה להגיע אליו. לא פותחים','ברגע שהוא מתרחק מהאגרוף, אפילו קצת: קליק ומביאים חטיף טעים יותר מהיד השנייה','אחרי כמה פעמים אומרים "עזוב" לפני שמראים את האגרוף'],tip:'את החטיף מהאגרוף הכלב לא מקבל אף פעם. הפרס בא מהיד השנייה.'},
 {id:'place',lv:2,n:'למיטה',ic:'🛏️',why:'הכלב הולך למיטה או לשטיח שלו ונח שם.',
  steps:['עומדים ליד המיטה של הכלב. זורקים חטיף עליה','כשהוא עולה על המיטה: קליק','מוסיפים "למיטה" רגע לפני שזורקים','בהמשך מבקשים ממנו גם לשכב שם, ומתרחקים מעט'],tip:'המיטה צריכה להיות מקום נעים. לא שולחים אליה כעונש.'},
 {id:'bow',lv:2,n:'קידה',ic:'🎭',why:'הכלב מוריד את החזה ומשאיר את הישבן למעלה, כמו בתחילת משחק.',
  steps:['הכלב עומד. חטיף ליד האף','מורידים את היד לאט אל הרצפה, בין הכפות הקדמיות','ברגע שהמרפקים יורדים והישבן עדיין למעלה: קליק וחטיף','אם הוא שוכב לגמרי, מקליקים מוקדם יותר בפעם הבאה'],tip:'קל לתפוס את זה כשהכלב מתמתח לבד אחרי שינה. מקליקים מיד.'},
 {id:'roll',lv:3,n:'התגלגל',ic:'🔄',why:'הכלב מתגלגל על הגב לצד השני.',
  steps:['מתחילים מ"שכב", על שטיח רך','מזיזים חטיף מהאף אל הכתף שלו, כך שיישכב על הצד: קליק וחטיף','ממשיכים להזיז את החטיף מעל הגב, עד שהוא מתגלגל: קליק וחטיף','מוסיפים "התגלגל" כשהוא מצליח בקלות'],tip:'רק על משטח רך. כלב שלא אוהב לשכב על הגב, לא מכריחים.'},
 {id:'bang',lv:3,n:'מת!',ic:'💫',why:'אומרים "באנג" והכלב נשכב על הצד ולא זז.',
  steps:['צריך קודם שיידע "שכב"','מהשכיבה, מזיזים חטיף אל הכתף עד שהוא נשכב על הצד','כשהוא שוכב על הצד ושקט שנייה: קליק וחטיף','מוסיפים "באנג!" עם תנועת אצבע, ומאריכים לאט את השקט'],tip:'קצר ושמח. אם הכלב נלחץ, חוזרים לשלב הקודם.'},
 {id:'fetch',lv:3,n:'תחזיר',ic:'🎾',why:'הכלב רץ אחרי צעצוע ומביא אותו בחזרה.',
  steps:['מתחילים עם צעצוע שהכלב אוהב, בחדר קטן','זורקים קרוב. כשהוא לוקח את הצעצוע: קליק וחטיף, והוא יבוא לקחת אותו','בכל פעם מחכים שיתקרב יותר לפני הקליק','בסוף מקליקים רק כשהצעצוע מגיע לידיים שלכם'],tip:'לא רודפים אחריו כשהצעצוע בפה. זה הופך את זה למשחק תופסת.'},
 {id:'drop',lv:3,n:'תן לי',ic:'🤲',why:'הכלב משחרר צעצוע מהפה לידיים שלכם.',
  steps:['משחקים עם הכלב בצעצוע','מראים לו חטיף ליד האף','כשהוא פותח את הפה ומשחרר: קליק, חטיף ומחזירים לו את הצעצוע','מוסיפים "תן לי" לפני שמראים את החטיף'],tip:'מחזירים את הצעצוע כמעט תמיד. ככה הוא לומד שלתת זה לא להפסיד.'},
 {id:'shy',lv:3,n:'מתבייש',ic:'🙈',why:'הכלב מכסה את האף עם הכף.',
  steps:['מדביקים פתק קטן ורך על האף של הכלב (מבוגר עושה זאת בעדינות)','הכלב ינסה להוריד אותו עם הכף','ברגע שהכף נוגעת באף: קליק וחטיף','אחרי כמה פעמים מנסים בלי פתק, ואומרים "מתבייש"'],tip:'אם הכלב לא אוהב את הפתק, מוותרים על הטריק הזה.'},
 {id:'jump',lv:3,n:'קפיצה בחישוק',ic:'⭕',why:'הכלב עובר דרך חישוק או דרך הידיים.',
  steps:['מחזיקים חישוק נוגע ברצפה','זורקים חטיף לצד השני. כשהכלב עובר: קליק','מרימים את החישוק קצת בכל פעם, רק כמה סנטימטרים','מוסיפים "הופ!"'],tip:'כלב קטן לא קופץ גבוה. מקסימום גובה הברך שלו, ורק על משטח שלא מחליק.'},
 {id:'tidy',lv:3,n:'אסוף צעצועים',ic:'🧺',why:'הכלב שם צעצוע בתוך סל. הטריק הכי מרשים.',
  steps:['צריך קודם ש"תן לי" יעבוד','עומדים מעל הסל ומבקשים "תן לי", כך שהצעצוע נופל לתוך הסל: קליק וחטיף','בכל פעם עומדים קצת יותר רחוק מהסל','מוסיפים "לסדר" כשהכלב מבין את הרעיון'],tip:'זה לוקח כמה שבועות. מחלקים לצעדים קטנים ושמחים בכל צעד.'}];

const GOLD=[['🚫','אף פעם לא מענישים ולא צועקים'],['⏱️','הפרס מגיע תוך שנייה או שתיים'],['🗣️','מילה אחת קצרה לכל פקודה, ואותה מילה לכולם'],['⏳','כמה דקות בכל פעם. מסיימים בהצלחה'],['🧑','מבוגר תמיד בסביבה']];
const LV=['עוד לא התחלנו','לומדים','כמעט','מצליח!'];

/* מסלול הבטיחות: 5 שלבים של 5 שאלות. שלבים 1 עד 3 כן/לא (גם לליה), 4 ו-5 בחירה מתוך שלוש (רומי) */
const SLV=[
 {n:'לפני שנוגעים',ic:'🖐️',stars:2,qs:[
  {s:'🐕‍🦺',q:'כלב שלא מכירים ברחוב. רצים ללטף אותו?',a:false,x:'קודם שואלים את הבעלים. כלב זר יכול להיבהל.'},
  {s:'🧑‍🤝‍🧑',q:'הבעלים אמר שאפשר. מלטפים בעדינות בצד הגוף או בחזה?',a:true,x:'מלטפים לאט בצד או בחזה. לא על הראש מלמעלה.'},
  {s:'✊',q:'נותנים לכלב להריח יד סגורה ונמוכה לפני שמלטפים?',a:true,x:'ככה הכלב מכיר אותנו ומחליט בעצמו אם להתקרב.'},
  {s:'🫂',q:'מחבקים כלב חזק סביב הצוואר ומנשקים לו את הפנים?',a:false,x:'רוב הכלבים לא אוהבים חיבוק חזק ופנים קרובות. ליטוף עדין בצד עדיף.'},
  {s:'🐾',q:'מושכים לכלב בזנב או באוזניים בשביל הצחוק?',a:false,x:'זה כואב לו. ידיים עדינות תמיד.'}]},
 {n:'אוכל, שינה ומשחק',ic:'🍽️',stars:2,qs:[
  {s:'🍽️',q:'הכלב אוכל מהקערה. מתקרבים אליו?',a:false,x:'כלב שאוכל שומר על האוכל שלו. נותנים לו שקט עד שיסיים.'},
  {s:'😴',q:'הכלב ישן. מעירים אותו כדי לשחק?',a:false,x:'כלב שנבהל משינה יכול לנשוך. מחכים שיתעורר לבד.'},
  {s:'🦴',q:'לכלב יש עצם בפה. לוקחים לו אותה מהפה?',a:false,x:'קוראים למבוגר. בעזרת "תן לי" והחלפה בחטיף הכלב משחרר בעצמו.'},
  {s:'🛏️',q:'הכלב הלך למיטה שלו. משאירים אותו לבד?',a:true,x:'המיטה היא המקום הבטוח שלו. שם לא מפריעים לו.'},
  {s:'🌳',q:'הכלב מתרגש וקופץ עליך. עומדים בשקט כמו עץ?',a:true,x:'עושים עץ: עומדים בשקט, ידיים צמודות לגוף, ומסתכלים על הרגליים. הכלב יירגע.'}]},
 {n:'מה הכלב מרגיש',ic:'🐶',stars:2,qs:[
  {s:'🥱',q:'הכלב מפהק, מלקק את השפתיים ומסובב את הראש. הוא אומר "די"?',a:true,x:'אלה סימנים שהכלב לא נוח לו. מפסיקים ונותנים לו מרחק.'},
  {s:'🐕',q:'זנב שמכשכש אומר תמיד שהכלב שמח?',a:false,x:'לפעמים הכלב מכשכש כשהוא נרגש או לחוץ. מסתכלים על כל הגוף.'},
  {s:'😬',q:'הכלב נוהם ומראה שיניים. ממשיכים ללטף?',a:false,x:'נהימה היא אזהרה. מתרחקים לאט וקוראים למבוגר.'},
  {s:'😊',q:'גוף רך ומתנועע, פה פתוח קצת ועיניים רכות. זה כלב רגוע?',a:true,x:'נכון. כלב רגוע נראה רך ומשוחרר.'},
  {s:'😟',q:'רואים לבן בעיניים והזנב בין הרגליים. הכלב מפחד?',a:true,x:'נכון. כלב מפוחד צריך מרחק ושקט.'}]},
 {n:'בחוץ וברחוב',ic:'🚶',stars:3,romi:true,qs:[
  {s:'🏃',q:'כלב משוחרר רץ אלייך ברחוב. מה עושים?',o:['בורחים מהר','עומדים בשקט כמו עץ, ידיים צמודות','צועקים עליו'],a:1,x:'ריצה גורמת לכלב לרדוף. עומדים בשקט ומחכים שיאבד עניין.'},
  {s:'🏪',q:'כלב קשור מחוץ לחנות, בלי הבעלים. מה עושים?',o:['מלטפים כי הוא לבד','לא נוגעים, אין את מי לשאול','נותנים לו אוכל'],a:1,x:'בלי לשאול את הבעלים לא נוגעים. כלב קשור לבד יכול להיות לחוץ.'},
  {s:'🚧',q:'כלב נובח מאחורי גדר. מה עושים?',o:['מתקרבים לגדר','מכניסים יד דרך הגדר','ממשיכים ללכת לאט, בלי להסתכל לו בעיניים'],a:2,x:'החצר היא הבית שלו. מתרחקים בשקט.'},
  {s:'🪨',q:'נפלת על הרצפה וכלב מתקרב. מה עושים?',o:['מתכרבלים כמו סלע: ברכיים לבטן וידיים על העורף','קמים ורצים','בועטים בו'],a:0,x:'עושים סלע ושוכבים בשקט עד שהכלב מתרחק או שמבוגר מגיע.'},
  {s:'🍪',q:'רוצים לתת חטיף לכלב של מישהו אחר. איך?',o:['נותנים בלי לשאול','שואלים את הבעלים, ונותנים על כף יד פתוחה','זורקים לו את החטיף לפנים'],a:1,x:'יש כלבים שאסור להם אוכל מסוים. שואלים קודם, ונותנים על יד פתוחה.'}]},
 {n:'מצבים מתקדמים',ic:'🎓',stars:4,romi:true,qs:[
  {s:'🐕🐕',q:'שני כלבים רבים. מה עושים?',o:['מפרידים אותם בידיים','מתרחקים וקוראים מיד למבוגר','מושכים אחד מהם בקולר'],a:1,x:'ידיים בין כלבים רבים נפגעות. רק מבוגר מטפל בזה.'},
  {s:'🎆',q:'הכלב נבהל מזיקוקים. מה עוזר לו?',o:['מחבקים חזק ומרימים אותו','נותנים לו מקום שקט ובטוח ומבוגר מרגיע','מוציאים אותו החוצה לראות'],a:1,x:'כלב מפוחד צריך מקום מסתור שקט. לא מכריחים ולא מוציאים החוצה.'},
  {s:'🩹',q:'כלב נשך מישהו קצת. מה עושים?',o:['לא מספרים לאף אחד','מספרים מיד למבוגר ושוטפים את המקום במים וסבון','מענישים את הכלב'],a:1,x:'כל נשיכה מספרים למבוגר. שוטפים במים וסבון, ומבוגר מחליט אם צריך רופא.'},
  {s:'🐾',q:'הכלב צולע ומלקק את הכף. מה עושים?',o:['לא נוגעים ומספרים למבוגר','מושכים לו את הכף לבדוק','נותנים לו לרוץ'],a:0,x:'כלב כואב יכול לנשוך גם את מי שהוא אוהב. מבוגר בודק או לוקח לווטרינר.'},
  {s:'☀️',q:'יום חם מאוד. מה נכון?',o:['משאירים את הכלב באוטו לכמה דקות','מטיילים בבוקר או בערב, בודקים שהמדרכה לא חמה, ומים תמיד','רצים איתו בצהריים'],a:1,x:'אוטו סגור מתחמם מהר מאוד. מדרכה חמה שורפת כפות. מים ועוד מים.'}]}];
const QUIZ=SLV[0].qs;
const SIGNS=[['🥱','מפהק'],['👅','מלקק את השפתיים'],['↩️','מסתובב הצידה'],['👀','רואים לבן בעיניים'],['🐕','זנב מכווץ בין הרגליים']];

const BADGES=[
 {id:'b1',e:'🔔',t:'קליק ראשון',f:d=>d.clicks>=1},
 {id:'b2',e:'🎯',t:'50 קליקים',f:d=>d.clicks>=50},
 {id:'b3',e:'⏲️',t:'אימון קצר',f:d=>d.sessions>=1},
 {id:'b4',e:'🌟',t:'טריק מצליח',f:d=>Object.values(d.tricks).some(v=>v>=3)},
 {id:'b5',e:'👂',t:'מקשיבים לכלב',f:d=>d.translations>=3},
 {id:'b6',e:'🛡️',t:'שומרי בטיחות',f:d=>d.quiz>=1},
 {id:'b7',e:'🎮',t:'10 כוכבי אילוף',f:d=>d.game&&d.game.stars>=10},
 {id:'b8',e:'💖',t:'יום מושלם',f:d=>!!(d.pet&&d.pet.perfect>=1)},
 {id:'b9',e:'🎩',t:'ארון בגדים',f:d=>!!(d.pet&&d.pet.own.length>=4)}];
function award(){const d=D();BADGES.forEach(b=>{if(!d.badges.includes(b.id)&&b.f(d)){d.badges.push(b.id);save();chime();toast('קיבלת כוכב חדש: '+b.t);const a=$('.avatar');if(a){a.classList.add('bounce');setTimeout(()=>a.classList.remove('bounce'),1300)}}})}

/* ---------- הקלטה והעלאה ---------- */
async function recordMic(sec,tick){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('nomic');
  const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  const c=audio();await c.resume();
  const src=c.createMediaStreamSource(stream),proc=c.createScriptProcessor(4096,1,1),ch=[];
  proc.onaudioprocess=e=>ch.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  src.connect(proc);proc.connect(c.destination);
  for(let s=sec;s>0;s--){tick&&tick(s);await new Promise(r=>setTimeout(r,1000))}
  proc.disconnect();src.disconnect();stream.getTracks().forEach(t=>t.stop());
  const n=ch.reduce((a,b)=>a+b.length,0),out=new Float32Array(n);let p=0;ch.forEach(b=>{out.set(b,p);p+=b.length});
  return{x:out,sr:c.sampleRate};
}
function decode(buf){const c=audio();return new Promise((ok,no)=>{const p=c.decodeAudioData(buf,ok,no);if(p&&p.then)p.then(ok,no)})}
async function fromFile(file){const b=await decode(await file.arrayBuffer());let x=b.getChannelData(0);if(x.length>b.sampleRate*20)x=x.slice(0,b.sampleRate*20);return{x:new Float32Array(x),sr:b.sampleRate}}

function analyzeAndShow(x,sr,tag){
  const f=Engine.analyze(x,sr);
  S.res=Engine.interpret(f,S.animal,S.baseline,!!S.baseline);S.res.tag=tag;
  D().translations++;save();render();
  const r=S.res;if(r.emotion==='none'){speak('לא שמעתי מספיק. נסו שוב ליד הכלב.')}else speak(SAY[S.animal][r.emotion][lia()?0:1],KIND[r.emotion]);
  award();
}

/* ---------- מסכים ---------- */
const V={};
function greet(){const n=S.who?lowNeed(pet()):null,b='היי '+UNAME()+'! אני '+DN()+'.';return n?b+' '+LM(n.k):b+(lia()?' בואו נשחק!':' מה נעשה היום?')}
const app=$('#app');
function render(){document.body.dataset.who=S.who||'';{const u=U(),bs=document.body.style;if(u){bs.setProperty('--accent',u.color);bs.setProperty('--accent-ink','#fff')}else{bs.removeProperty('--accent');bs.removeProperty('--accent-ink')}}if(GL.ok&&GL.setBreed)GL.setBreed((S.who&&D().breed)||'poodle');document.body.classList.toggle('nk',NKON());applyLang();setFur();app.innerHTML=(V[S.screen]||V.login)()+(S.who&&HUBS[S.screen]?tabbar():'');document.body.classList.toggle('fitmode',isFit());document.body.classList.toggle('hastabs',!!(S.who&&HUBS[S.screen]));trNode(app);window.scrollTo(0,0);if(GL.ok){GL.mount();if(S.who)GL.dress(pet().wear);if(GL.dressCat)GL.dressCat(S.who&&petCat()?pet().wear:{});afterMount();if(S.screen==='dress'){const av=$('.avatar');if(av)av.classList.add('dressable')}}if(typeof needBubble==='function')needBubble()}
function go(s){if(s!=='train')S.trick=null;if(s==='translate'&&U())S.animal=U().animal==='cat'?'cat':'dog';if(s!=='story')S.stI=null;if(s==='safety')S.quiz={lv:null,i:0,ok:0,ans:null};if(typeof cClear==='function')cClear();if(GL.ok&&GL.resetView&&s!==S.screen)GL.resetView();if(typeof gClear==='function'){gClear();G.phase='idle'}if(S.timer.h&&s!=='train'){clearInterval(S.timer.h);S.timer.run=false;S.timer.h=null}S.screen=s;S.res=null;render()}
function header(title){return `<div class="top"><button class="back" data-act="home" aria-label="חזרה">→ חזרה</button><div class="who"><span>${esc(title||'')}</span><span class="dot">${esc(INI(U()))}</span></div></div>`}

const langSeg=()=>`<div class="seg lang" role="group" aria-label="Language / שפה" data-notr="1"><button data-act="lang" data-v="he" aria-pressed="${S.lang==='he'}">עברית</button><button data-act="lang" data-v="en" aria-pressed="${S.lang==='en'}">English</button></div>`;
V.login=()=>`
<div class="avatarWrap" style="padding-top:8px">${avatar('dog','happy')}<h1><span class="logo" aria-hidden="true">🐶🐱</span><br>מאלפים קטנים</h1><p class="muted">${S.users.length?'מי משחק היום?':'בואו נפתח משתמש ראשון!'}</p></div>
${S.users.map(u=>`<button class="card who-card" data-act="pick" data-who="${u.id}" style="border-color:${u.color}"><span class="big-dot" style="background:${u.color};color:#fff">${esc(INI(u))}</span><span><h2>${esc(u.name)}</h2><span class="muted">${u.animal==='cat'?'🐱':'🐕'} ${esc((S.data[u.id]&&S.data[u.id].dogName)||'')} · ${simpleOf(u)?'מצב פשוט':'מצב מתקדם'}</span></span></button>`).join('')}
<button class="btn" data-act="newu">➕ משתמש חדש</button>
<button class="btn ghost" data-act="parent">🔒 להורים</button>
${langSeg()}`;

V.home=()=>{
  const g=greet();
  return `<div class="top"><button class="back" data-act="login">→ החלפת משתמש</button><div class="who"><button class="back" data-act="go" data-s="prof" aria-label="הפרופיל שלי">👤 פרופיל</button><span class="dot">${esc(INI(U()))}</span></div></div>
  <div class="avatarWrap">${avatar('dog','happy')}
   ${S.editName?`<form class="card namebox" id="nameForm"><label for="dogName"><b>איך קוראים לכלב?</b></label><input id="dogName" maxlength="24" value="${esc(DN())}" autocomplete="off" enterkeyhint="done"><div class="grid2"><button class="btn good" type="submit">שמירה</button><button class="btn ghost" type="button" data-act="nameCancel">ביטול</button></div></form>`
   :`<div class="row" style="justify-content:center"><h2>${esc(DN())}</h2><button class="back" data-act="nameEdit" aria-label="שינוי שם הכלב">✏️ שינוי שם</button></div>`}
   <button class="bubble ${lia()?'lia':''}" data-act="hello" style="border:0;color:inherit;font:inherit">${g}</button></div>
  <div class="menu">
   <button class="tile t1" data-act="go" data-s="translate"><span class="ic">👂</span>מה הכלב אומר?</button>
   <button class="tile t2" data-act="go" data-s="train"><span class="ic">🦴</span>אילוף</button>
   <button class="tile" data-act="go" data-s="safety"><span class="ic">🛡️</span>פינת הבטיחות</button>
   <button class="tile care ${lowNeed(pet())?'alert':''}" data-act="go" data-s="care"><span class="ic">🐾</span>לטפל ב${esc(DN())}</button>
   <button class="tile" data-act="go" data-s="dress"><span class="ic">👕</span>ארון בגדים</button>
   <button class="tile" data-act="go" data-s="stars"><span class="ic">⭐</span>הכוכבים שלי</button>
  </div>
  <button class="btn sun big" data-act="go" data-s="game">🎮 משחק: מאלפים את ${esc(DN())}</button>
  <div class="grid2"><button class="btn" data-act="go" data-s="mem">🧩 משחק זיכרון</button><button class="btn" data-act="go" data-s="course">🚧 מסלול מכשולים</button>
   <button class="btn" data-act="go" data-s="learn">📚 כרטיסיות לימוד</button><button class="btn" data-act="go" data-s="color">🖍️ מצב צביעה</button>
   <button class="btn" data-act="go" data-s="album">🖼️ האלבום שלי</button><button class="btn" data-act="go" data-s="real" data-nocat="1">🐶 הכלב שלנו</button>
   <button class="btn" data-act="go" data-s="story">📖 הסיפור של היום</button></div>
  ${dailyCard()}
  <label class="btn ghost" for="photo">📷 הכלב שלי: צבע פרווה מתמונה</label>
  <input class="file" id="photo" type="file" accept="image/*" aria-label="בחירת תמונה של הכלב">`;
};

V.translate=()=>{
  const sm=Engine.SAMPLES[S.animal];
  const r=S.res;
  let out='';
  if(r){out=resultHTML(r)}
  const mood=r?MOOD[r.emotion]:'happy';
  return `${header(lia()?'מה הוא אומר?':'מתרגמים קולות')}
  <div class="seg" role="group" aria-label="בחירת חיה"><button data-act="animal" data-a="dog" aria-pressed="${S.animal==='dog'}">🐕 כלב</button><button data-act="animal" data-a="cat" aria-pressed="${S.animal==='cat'}">🐈 חתול</button></div>
  <div class="avatarWrap">${avatar(S.animal,mood)}</div>${S.animal==='cat'?catPick():''}
  ${out||`<div class="bubble ${lia()?'lia':''}">${lia()?'לחצו והקשיבו!':'לחצו על המיקרופון ליד '+(S.animal==='dog'?'הכלב':'החתול')+', או בחרו דוגמה.'}</div>`}
  <div class="card">
    ${MIC==='native'?`<label class="mic" for="cap" aria-label="הקלטה בטלפון">🎤</label><input class="file" id="cap" type="file" accept="audio/*" capture>
    <p class="muted" style="text-align:center" id="micMsg">${lia()?'מבוגר מקליט את הכלב':'נפתח מקליט הקול של הטלפון. מקליטים כמה שניות את הכלב, לוחצים סיום, והניתוח מתחיל. ההקלטה לא נשמרת באפליקציה.'}</p>`
    :`<button class="mic ${S.busy?'rec':''}" data-act="mic" aria-label="הקלטה של 6 שניות">${S.busy?'<span id="cd" style="font-size:2.6rem;font-family:var(--f-display)">6</span>':'🎤'}</button>
    <p class="muted" style="text-align:center" id="micMsg">${lia()?'':'ההקלטה נשארת במכשיר ונמחקת מיד אחרי הניתוח.'}</p>`}
    <h3>${lia()?'או בחרו צליל':'דוגמאות להשמעה'}</h3>
    <div class="samples">${sm.map(s=>`<button class="sample" data-act="sample" data-id="${s.id}"><span class="pic">${s.pic}</span>${esc(s.label)}</button>`).join('')}</div>
    ${lia()?'':`<label class="btn ghost" for="upl">📁 העלאת הקלטה מהמכשיר</label><input class="file" id="upl" type="file" accept="audio/*" aria-label="העלאת קובץ שמע">`}
    ${S.animal==='cat'?`<p class="note">אין חתול בבית, אז החתול מדגים בצלילי דוגמה.</p>`:''}
  </div>`;
};
function resultHTML(r){
  const say=r.emotion==='none'?'לא שמעתי מספיק קול. נסו שוב קרוב יותר.':SAY[S.animal][r.emotion][lia()?0:1];
  if(r.emotion==='none')return `<div class="bubble ${lia()?'lia':''}">${say}</div>`;
  if(lia()){
    const k=TO3[r.emotion];
    return `<div class="bubble lia">${say}</div>
    <div class="faces">${Object.entries(LIA3).map(([id,v])=>`<div class="face ${id===k?'on':''}"><div class="e">${v.e}</div>${v.t}</div>`).join('')}</div>
    <button class="btn sun" data-act="again">🔊 עוד פעם</button>
    <p class="muted" style="text-align:center">גם אני לפעמים טועה.</p>`;
  }
  const m=r.m;
  const lvl=(v,a,b)=>v<a?'נמוך':v<b?'בינוני':'גבוה';
  const rows=[['מהירות קולות',Math.min(100,m.rate/4*100),m.calls<2?'קול אחד':lvl(m.rate,1,2.5)],
    ['גובה הקול',Math.min(100,m.pr/2*100),lvl(m.pr,.85,1.25)],
    ['גרגוריות',m.harsh*100,lvl(m.harsh,.3,.55)],
    ['אורך כל קול',Math.min(100,m.dur/1.2*100),m.dur<.25?'קצר':m.dur<.6?'בינוני':'ארוך'],
    ['עוצמה',m.loud*100,lvl(m.loud,.4,.7)]];
  return `<div class="bubble">${say}</div>
  <div class="card">
    <div class="sci"><span class="k">🔬</span><div style="flex:1"><b>המדענים בדקו: רמת התרגשות ${r.arousal} מתוך 100</b><div class="meter" role="img" aria-label="התרגשות ${r.arousal} מתוך 100"><i style="width:${r.arousal}%"></i></div></div></div>
    <div class="sci"><span class="k">🤔</span><div><b>כנראה: ${LABEL[r.emotion]}</b><br><span class="muted">ביטחון: <span class="conf" aria-hidden="true">${[1,2,3].map(i=>`<b class="${i<=r.confidence?'on':''}"></b>`).join('')}</span> ${CONF[r.confidence]}</span></div></div>
    <div class="sci"><span class="k">🎭</span><div><b>בשביל הכיף:</b> המשפט של ${esc(DN())} הוא ניחוש יצירתי, לא תרגום אמיתי.</div></div>
    <details><summary>איך ידענו?</summary>
      <div style="display:grid;gap:10px">${rows.map(x=>`<div class="bar"><span>${x[0]}</span><div class="meter"><i style="width:${Math.round(x[1])}%"></i></div><b>${x[2]}</b></div>`).join('')}
      <div class="note">📚 ${STUDY[S.animal][r.emotion]}</div>
      <p class="muted">${S.baseline?'הניתוח מכויל לקול הרגוע של הכלב שלכם ('+Math.round(S.baseline)+' הרץ).':'עוד לא כיילנו את קול הכלב שלכם, לכן הגובה נמדד מול ממוצע לגזע ויכול להיות לא מדויק. אפשר לכייל בפינת ההורים.'}</p></div>
    </details>
    <button class="btn sun" data-act="again">🔊 שוב</button>
  </div>`;
}

V.train=()=>{
  const t=S.trick?TRICKS.find(x=>x.id===S.trick):null;
  if(t)return trickView(t);
  const lv=n=>TRICKS.filter(x=>x.lv===n);
  const card=x=>`<button class="card trick" data-act="trick" data-id="${x.id}"><span class="ic">${x.ic}</span><b>${x.n}</b><span class="lvl" role="img" aria-label="${LV[D().tricks[x.id]||0]}">${[1,2,3].map(i=>`<i class="${(D().tricks[x.id]||0)>=i?'on':''}"></i>`).join('')}</span></button>`;
  const done=TRICKS.filter(x=>(D().tricks[x.id]||0)>=3).length;
  return `${header('אילוף')}
  <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">${lia()?'מאלפים רק עם מבוגר לידך!':'מאלפים עם חטיפים וסבלנות. מבוגר תמיד בסביבה.'}</div></div>
  <button class="btn sun big" data-act="go" data-s="game">🎮 מתאמנים על ${esc(DN())} במשחק</button>
  ${petCat()?'<div class="note">🐈 רוב הטריקים עובדים גם עם חתולים, עם קליקר וחטיף. חתולים מתאמנים בקצרה, שתיים-שלוש דקות בכל פעם, ומפסיקים כשהם הולכים.</div>':''}
  <div class="card"><h3>חוקי הזהב</h3><ul class="rules">${GOLD.slice(0,lia()?3:5).map(g=>`<li><span style="font-size:1.6rem">${g[0]}</span>${g[1]}</li>`).join('')}</ul></div>
  <h2>${lia()?'בחרי טריק':'בנק הטריקים'}</h2>
  ${lia()?'':`<p class="muted">${TRICKS.length} טריקים ב-3 רמות. ${esc(DN())} כבר יודע ${done}.</p>`}
  ${(lia()?LEVELS.slice(0,1):LEVELS).map(L=>`<div class="lvhead"><span class="tag">רמה ${L.n}: ${L.t}</span><span class="muted">${L.d}</span></div>${lv(L.n).map(card).join('')}`).join('')}`;
};
function trickView(t){
  const lv=D().tricks[t.id]||0, T=S.timer;
  const mm=String(Math.floor(T.left/60)),ss=String(T.left%60).padStart(2,'0');
  const C=2*Math.PI*64,off=C*(1-T.left/T.total);
  return `<div class="top"><button class="back" data-act="trickBack">→ לכל הטריקים</button><div class="who"><span>${t.n}</span><span class="dot">${esc(INI(U()))}</span></div></div>
  <div class="card"><div class="scene" aria-hidden="true">${t.ic}</div><span class="tag" style="align-self:flex-start">רמה ${t.lv}: ${LEVELS[t.lv-1].t}</span><p>${t.why}</p>
   ${lia()&&t.pics?`<ol class="steps pic">${t.pics.map(p=>`<li>${p}</li>`).join('')}</ol>`:`<ol class="steps">${t.steps.map(s=>`<li>${s}</li>`).join('')}</ol>`}
   <button class="btn ghost" data-act="readSteps">🔊 להקריא</button>
   ${t.tip&&!lia()?`<div class="note">💡 ${t.tip}</div>`:''}
  </div>
  <div class="card"><h3>${lia()?'קליקר':'הקליקר'}</h3>
   <button class="clicker" data-act="click" aria-label="קליק">קליק</button>
   <p style="text-align:center" id="clk"><b>${S.sessClicks}</b> קליקים באימון הזה</p>
   <p class="muted" style="text-align:center">אחרי כל קליק: חטיף תוך שנייה או שתיים.</p>
   ${lia()?`<button class="btn sun big" data-act="treat">🍖 נתתי חטיף</button><p class="muted" style="text-align:center">מבוגר לוחץ על הקליקר, ו${esc(UNAME())} נותנת את החטיף.</p>`:''}
  </div>
  <div class="card"><h3>שעון אימון</h3>
   <div class="ring"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="64" fill="none" stroke="var(--line)" stroke-width="12"/><circle id="arc" cx="75" cy="75" r="64" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg><div class="t" id="tm">${mm}:${ss}</div></div>
   <div class="seg" role="group" aria-label="אורך אימון">${[2,3,5].map(m=>`<button data-act="dur" data-m="${m}" aria-pressed="${T.total===m*60}">${m} דקות</button>`).join('')}</div>
   <button class="btn ${T.run?'warn':'good'} big" data-act="timer">${T.run?'⏸ עצירה':'▶ מתחילים'}</button>
   <p class="muted">אימונים קצרים עובדים הכי טוב. מסיימים כשהכלב מצליח, וחוזרים עוד פעם בהמשך היום.</p></div>
  <div class="card"><h3>איך הולך?</h3>
   <button class="btn ghost" data-act="level" data-id="${t.id}">${LV[lv]} (לחצו לשינוי)</button></div>`;
}

const SB=()=>{const d=D();if(!d.safe)d.safe={best:{}};return d.safe};
const sMax=()=>lia()?3:SLV.length;
const sOpen=n=>n===1||(SB().best[n-1]||0)>=4;
V.safety=()=>{
  const q=S.quiz,B=SB().best;
  const extra=`${!lia()?`<div class="card"><h3>הכלב אומר "די"</h3><p class="muted">אלה סימנים שהכלב רוצה שנפסיק:</p><div class="grid2">${SIGNS.map(s=>`<div class="note"><span style="font-size:1.6rem">${s[0]}</span> ${s[1]}</div>`).join('')}</div></div>`:''}
  <div class="card"><h3>3 חוקים</h3><ul class="rules"><li><span style="font-size:1.6rem">🧑</span>שואלים מבוגר לפני שנוגעים</li><li><span style="font-size:1.6rem">🤲</span>ידיים עדינות. לא מושכים אוזניים וזנב</li><li><span style="font-size:1.6rem">😴</span>כלב אוכל או ישן: משאירים אותו בשקט</li></ul></div>`;
  if(!q.lv){
    const done=SLV.slice(0,sMax()).filter((L,i)=>(B[i+1]||0)>=4).length;
    return `${header('פינת הבטיחות')}
    <div class="bubble ${lia()?'lia':''}">${lia()?'בחרי שלב. בכל שלב 5 שאלות!':'מסלול הבטיחות: '+sMax()+' שלבים, 5 שאלות בכל שלב. 4 תשובות נכונות פותחות את השלב הבא.'}</div>
    <div class="path">${SLV.slice(0,sMax()).map((L,i)=>{const n=i+1,op=sOpen(n),b=B[n]||0,ok=b>=4,cur=op&&!ok;
      return `<button class="station ${op?'':'locked'} ${ok?'done':''} ${cur?'cur':''}" data-act="slv" data-n="${n}" ${op?'':'aria-disabled="true"'} aria-label="שלב ${n}: ${L.n}${op?'':' (נעול)'}">
        <span class="st-c">${op?L.ic:'🔒'}</span><span class="st-t"><b>שלב ${n}</b> ${L.n}<small>${ok?'✅ '+b+'/5':op?'⭐ '+L.stars+' כוכבים לארון':'עוד נעול'}</small></span></button>`}).join('')}</div>
    <p class="muted" style="text-align:center">${done} מתוך ${sMax()} שלבים הושלמו</p>${extra}`;
  }
  const L=SLV[q.lv-1];
  if(q.i>=L.qs.length){const pass=q.ok>=4,nxt=q.lv<sMax()&&pass;
    return `${header('שלב '+q.lv+': '+L.n)}<div class="avatarWrap">${avatar('dog',pass?'happy':'calm')}<div class="bubble ${lia()?'lia':''}">${pass?'כל הכבוד! ':'כמעט! '}ענית נכון על ${q.ok} מתוך 5.${pass?(q.got?' קיבלת '+q.got+' כוכבים לארון!':''):' צריך 4 כדי לעבור. ננסה שוב?'}</div></div>
    ${nxt?`<button class="btn sun big" data-act="slv" data-n="${q.lv+1}">לשלב ${q.lv+1} ←</button>`:''}
    <button class="btn ${nxt?'ghost':'sun big'}" data-act="slv" data-n="${q.lv}">🔁 לשחק שוב בשלב הזה</button><button class="btn ghost" data-act="smap">🗺️ למסלול</button>`;
  }
  const c=L.qs[q.i],right=q.ans!==null&&(c.o?+q.ans===c.a:(q.ans==='1')===c.a);
  return `${header('שלב '+q.lv+': '+L.n)}
  <div class="qdots" aria-label="שאלה ${q.i+1} מתוך 5">${L.qs.map((_,k)=>`<i class="${k<q.i?(q.res[k]?'ok':'no'):k===q.i?'now':''}"></i>`).join('')}</div>
  <div class="card"><div class="scene" aria-hidden="true">${c.s}</div><h2 style="text-align:center">${c.q}</h2>
  ${q.ans===null?(c.o?`<div class="opts">${c.o.map((t,k)=>`<button class="btn ghost opt" data-act="ans" data-v="${k}">${t}</button>`).join('')}</div>`
    :`<div class="grid2"><button class="btn good big" data-act="ans" data-v="1">✅ כן</button><button class="btn warn big" data-act="ans" data-v="0">✋ לא</button></div>`)
  :`<div class="bubble ${lia()?'lia':''}"><b>${right?'נכון!':'לא בדיוק.'}</b><br>${c.x}</div><button class="btn sun big" data-act="next">${q.i<4?'הבא':'סיום השלב'}</button>`}</div>
  ${extra}`;
};
V.stars=()=>{const d=D();return `${header('הכוכבים שלי')}
 <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">${d.badges.length} מתוך ${BADGES.length} כוכבים</div></div>
 <div class="badges">${BADGES.map(b=>`<div class="badge ${d.badges.includes(b.id)?'on':''}"><div class="e">${b.e}</div>${b.t}</div>`).join('')}</div>
 <div class="grid2"><button class="btn" data-act="go" data-s="coll">🏆 אוסף הגזעים</button><button class="btn" data-act="go" data-s="cert">🏅 תעודה</button></div>
 ${lia()?'':`<div class="card"><h3>התקדמות</h3><p>קליקים: <b>${d.clicks}</b> · אימונים שהושלמו: <b>${d.sessions}</b> · הקשבות: <b>${d.translations}</b></p></div>`}`};

V.parent=()=>{
  if(!S.parentOK){
    if(!S.gate){const a=3+Math.floor(Math.random()*6),b=4+Math.floor(Math.random()*6),r=a+b,o=new Set([r]);while(o.size<3)o.add(r+Math.floor(Math.random()*7)-3);S.gate={a,b,r,o:[...o].sort(()=>Math.random()-.5)}}
    const g=S.gate;
    return `<div class="top"><button class="back" data-act="login">→ חזרה</button><div class="who">להורים</div></div>
    <div class="card"><h2>שאלה קצרה למבוגרים</h2><p>כמה זה ${g.a} + ${g.b}?</p><div class="grid2">${g.o.map(v=>`<button class="btn ghost" data-act="gate" data-v="${v}">${v}</button>`).join('')}</div></div>`;
  }
  const hv=!!curVoice()||!!NTTS();
  const du=S.delId&&S.users.find(u=>u.id===S.delId);
  return `<div class="top"><button class="back" data-act="login">→ יציאה</button><div class="who">פינת ההורים</div></div>
  <div class="card" id="users"><h3>👥 משתמשים</h3>
   ${du?`<div class="note">להסיר את ${esc(du.name)}? יימחקו הכוכבים, הבגדים, הכלב והתקדמות. זמן המשחק יישמר בסך הכול המשותף. אי אפשר לבטל.</div><div class="grid2"><button class="btn warn" data-act="delYes">כן, להסיר</button><button class="btn ghost" data-act="delNo">ביטול</button></div>`:''}
   ${S.users.map(u=>`<div class="urow"><span class="big-dot sm" style="background:${u.color};color:#fff">${esc(INI(u))}</span><span><b>${esc(u.name)}</b><br><span class="muted">גיל ${u.age} · ${simpleOf(u)?'מצב פשוט':'מצב מתקדם'}${u.mode==='auto'?' (לפי גיל)':''}</span></span><button class="btn ghost" data-act="delAsk" data-id="${u.id}">הסרה</button></div>`).join('')||'<p class="muted">אין משתמשים עדיין.</p>'}
   <button class="btn ghost" data-act="newu">➕ משתמש חדש</button></div>
  <div class="card"><h3>פרטיות ובטיחות</h3><p class="muted">אין פרסומות, קניות או קישורים החוצה במסכי הילדים. הקלטות לא נשמרות ולא נשלחות. נשמרים בתוך המכשיר בלבד: ההתקדמות, הכוכבים, זמן המשחק, ותמונות שבחרתם לשמור באלבום או בכרטיס הכלב שלנו.</p></div>
  <div class="card"><h3>⏱️ זמן משחק</h3><p class="muted">זמן פעילות בפועל בלבד. השעון רץ רק כשהאפליקציה פתוחה ומישהי נוגעת במסך, ונעצר אחרי 30 שניות בלי נגיעה.</p>
   <div class="ptg">${S.users.map(u=>{const k=u.id,n=esc(u.name),p=pBox(k);return `<div class="pt"><b>${n}</b><div class="clk" dir="ltr">${clk(p.total)}</div><span>סך הכול מצטבר</span><div class="clk sm" dir="ltr">${clk(p.days[dayKey()]||0)}</div><span>היום</span></div>`}).join('')}</div>
   <div class="pt all"><span>ביחד, מצטבר</span><div class="clk" dir="ltr">${clk(S.users.reduce((t,u)=>t+pBox(u.id).total,0)+S.playGone)}</div>${S.playGone?'<span>כולל משתמשים שהוסרו</span>':''}</div></div>
  <div class="card"><h3>כיול קול הכלב</h3><p class="muted">קול גבוה אצל גזע קטן הוא רגיל. כיול מול קול רגוע של הפודל משפר את הניתוח. מקליטים כמה שניות כשהוא רגוע ומשמיע קול.</p>
   <div class="bar" style="grid-template-columns:1fr auto"><span>גובה קול רגוע</span><b id="bv">${Math.round(S.baseline||Engine.DEFAULT_F0.dog)} הרץ ${S.baseline?'':'(ברירת מחדל)'}</b></div>
   <input type="range" id="bl" min="250" max="1100" step="10" value="${Math.round(S.baseline||Engine.DEFAULT_F0.dog)}" aria-label="גובה קול רגוע בהרץ">
   <button class="btn" data-act="calib">🎤 כיול בהקלטה (8 שניות)</button>
   <label class="btn ghost" for="calf">📁 כיול מקובץ</label><input class="file" id="calf" type="file" accept="audio/*">
   <button class="btn ghost" data-act="calReset">איפוס כיול</button><p class="muted" id="calMsg"></p></div>
  <div class="card"><h3>הגדרות</h3>
   ${langSeg()}
   <button class="btn ghost" data-act="snd">${S.sound?'🔊 קול פועל':'🔇 קול כבוי'}</button>
   <button class="btn ghost" data-act="voiceTest">🔈 בדיקת קול</button><p class="muted" id="vt"></p>
   ${S.lang==='en'?'':`<button class="btn ghost" data-act="nkT">${S.nk?'ניקוד על המסך: פועל':'ניקוד על המסך: כבוי'}</button>
   <button class="btn ghost" data-act="nkS">${S.nkSp?'ניקוד בהקראה: פועל':'ניקוד בהקראה: כבוי'}</button>
   <button class="btn ghost" data-act="stest">🗣️ בדיקת הקראה ותיקון הגייה</button>`}
   <button class="btn ghost" data-act="puppyT">${S.puppy?'🐶 קול כלבלבי פועל':'🙂 קול רגיל'}</button>
   <p class="muted">לכל משתמש יש כלב משלו: שם, גזע, צבע פרווה, בגדים וכוכבים. את הגזע, הגיל והמצב משנים בפרופיל, ואת הצבע בארון הבגדים.</p>
   <p class="muted">לחיצה על כל טקסט במסך מקריאה אותו, כדי שגם ילדים שעוד לא קוראים יוכלו להשתמש לבד.</p>
   <p class="muted">${S.lang==='en'?'English':'קול דיבור בעברית'}: ${hv?'זמין במכשיר הזה':'לא נמצא במכשיר. הדמות תדבר בבועות טקסט ובתנועת פה.'}</p>
   <button class="btn ghost" data-act="resetAll">איפוס כוכבים והתקדמות</button><p class="muted">זמן המשחק לא מתאפס באיפוס.</p></div>
  <div class="grid2"><button class="btn" data-act="go" data-s="pstats">📊 סטטיסטיקות</button><button class="btn" data-act="go" data-s="played">🎉 כמה שיחקנו</button></div>
  ${homeCard()}
  <div class="card" id="backup"><h3>💾 גיבוי ושחזור</h3><p class="muted">מעבירים את הפרופילים, הכוכבים והבגדים לטלפון אחר. הגיבוי כולל שמות ילדים, אז שומרים אותו במקום בטוח.</p>
   <button class="btn ghost" data-act="bkOut">📤 יצירת גיבוי (העתקה)</button><textarea id="bkTxt" class="bk" rows="4" readonly hidden aria-label="טקסט הגיבוי"></textarea>
   <textarea id="bkIn" class="bk" rows="3" placeholder="מדביקים כאן גיבוי לשחזור" aria-label="הדבקת גיבוי"></textarea>
   <button class="btn ghost" data-act="bkIn">📥 שחזור מגיבוי</button><p class="muted" id="bkMsg" role="status"></p></div>
  <div class="card"><h3>מה האפליקציה עושה, ומה לא</h3>
   <p class="muted">האפליקציה לא מתרגמת לשפה אנושית, כי אין תרגום כזה. היא מודדת רמת התרגשות (עוצמה, מהירות, גובה, גרגוריות) ומציעה רגש כנראה, עם רמת ביטחון. המשפטים של הדמות הם משחק. יש ארבעה גזעי כלבים: פודל מיני, לברדור, גולדן רטריבר ושיצו. הרמה המדעית של הפרשנות מוגבלת, במיוחד לגבי רגש חיובי מול שלילי.</p></div>
  <div class="card"><h3>iPhone</h3><p class="muted">המיקרופון עובד ב-Safari בכתובת מאובטחת (https) אחרי לחיצה על המיקרופון. אפשר להוסיף למסך הבית דרך כפתור השיתוף. אם הדפדפן חוסם את המיקרופון, עובדות הדוגמאות והעלאת הקלטה.</p></div>
  <div class="card"><h3>מקורות</h3><ul class="src">
   <li>Morton, E. (1977). Occurrence and significance of motivation-structural rules in some bird and mammal sounds. American Naturalist.</li>
   <li>Yin, S., McCowan, B. (2004). Barking in domestic dogs: context specificity and individual identification. Animal Behaviour.</li>
   <li>Pongrácz, P. et al. (2005). Human listeners are able to classify dog barks recorded in different situations. Journal of Comparative Psychology.</li>
   <li>Briefer, E. (2012, 2020). Vocal expression of emotions in mammals. Journal of Zoology; Animal Behaviour.</li>
   <li>McComb, K. et al. (2009). The cry embedded within the purr. Current Biology.</li>
   <li>אילוף: AKC, PDSA, Nylabone, Purina, Whole Dog Journal ו-SF SPCA (חיזוק חיובי, קליקר, הדרכת ילדים).</li></ul></div>`;
};


let SPH=[];
function phrases(){SPH=[];const out=[];
  const add=(t,arr)=>{const l=[];arr.forEach(x=>{if(!x||typeof x!=='string')return;SPH.push(x);l.push({i:SPH.length-1,s:x})});if(l.length)out.push({t,l})};
  const say=[];Object.keys(SAY).forEach(a=>Object.keys(SAY[a]).forEach(e=>[].concat(SAY[a][e]).forEach(x=>say.push(x))));
  add('משפטי הדמות',say);add('הודעות הטיפול',Object.values(LOWMSG));add('מידע על טיפול בכלב',Object.values(FACTS));
  add('טריקים',TRICKS.flatMap(t=>[t.n,t.why].concat(t.steps||[],[t.tip])));
  add('פינת הבטיחות',SLV.flatMap(L=>[L.n].concat(L.qs.flatMap(q=>[q.q,q.x]))));
  return out}
V.stest=()=>{const ph=phrases(),fx=Object.keys(S.pron||{});
  return `<div class="top"><button class="back" data-act="parent">→ חזרה</button><div class="who">בדיקת הקראה</div></div>
  <div class="card"><h3>תיקון הגייה</h3><p class="muted">אם מילה מוקראת לא נכון, מקלידים אותה ואת האופן שבו רוצים שתישמע (למשל באיות אחר או עם ניקוד), ולוחצים הוספה. התיקון נשמר במכשיר ופועל בכל האפליקציה.</p>
   <form id="pronForm" class="pf"><input id="pw" placeholder="המילה" aria-label="המילה" autocomplete="off"><input id="pv" placeholder="איך להקריא" aria-label="איך להקריא" autocomplete="off"><button class="btn" type="submit">הוספה</button></form>
   ${fx.map(k=>`<div class="pfix"><span>${esc(k)} ← ${esc(S.pron[k])}</span><button class="btn ghost" data-act="pronDel" data-k="${esc(k)}">מחיקה</button></div>`).join('')}</div>
  ${ph.map(g=>`<div class="card"><h3>${g.t}</h3>${g.l.map(x=>`<div class="spk"><button class="btn ghost" data-act="spk" data-i="${x.i}" aria-label="השמעה">🔊</button><span>${esc(x.s)}</span></div>`).join('')}</div>`).join('')}`};

/* ---------- אירועים ---------- */
const A={
 pick:e=>{S.mm=null;S.ob=null;S.who=e.dataset.who;S.nu=null;S.trick=null;go('home');setTimeout(()=>speak(greet(),'yip'),150)},
 login:()=>{S.mm=null;S.ob=null;S.who=null;S.parentOK=false;S.gate=null;S.delId=null;S.nu=null;go('login')},
 parent:()=>{S.who=null;S.delId=null;go('parent')},
 gate:e=>{if(+e.dataset.v===S.gate.r){S.parentOK=true;render()}else{S.gate=null;toast('נסו שוב');render()}},
 home:()=>{S.trick=null;go('home')},
 go:e=>go(e.dataset.s),
 hello:()=>speak(greet(),'yip'),
 nameEdit:()=>{S.editName=true;render();const i=$('#dogName');if(i){i.focus();i.select()}},
 nameCancel:()=>{S.editName=false;render()},
 nkT:()=>{S.nk=!S.nk;save();render()},
 nkS:()=>{S.nkSp=!S.nkSp;save();render();speak('שלום, אני '+DN()+'. ככה אני נשמע.',null,true)},
 stest:()=>go('stest'),
 spk:e=>speak(SPH[+e.dataset.i]||'',null,true),
 pronDel:e=>{delete S.pron[e.dataset.k];save();render()},
 voiceTest:()=>{const vs=window.speechSynthesis?speechSynthesis.getVoices():[];const he=vs.filter(v=>/^he/i.test(v.lang));speak('שלום, אני '+DN()+'. ככה אני נשמע.','yip');const m=$('#vt');if(m)m.textContent=!window.speechSynthesis?'הדפדפן לא תומך בהקראה.':he.length?'קול עברי: '+he.map(v=>v.name).join(', '):'לא נמצא קול עברי במכשיר ('+vs.length+' קולות אחרים). אפשר להוסיף קול עברי בהגדרות הטלפון: שפה וקלט, המרת טקסט לדיבור.'},
 puppyT:()=>{S.puppy=!S.puppy;save();render();if(S.puppy)speak('ככה אני מדבר!','yip')},
 animal:e=>{S.animal=e.dataset.a;S.res=null;render()},
 sample:e=>{const s=Engine.SAMPLES[S.animal].find(x=>x.id===e.dataset.id);S.sampleId=s.id;S.last=s;const x=s.make();S.lastX=x;playSamples(x,Engine.SR);setTimeout(()=>analyzeAndShow(x,Engine.SR,s.label),Math.min(3500,x.length/Engine.SR*1000+300))},
 again:()=>{if(S.lastX)playSamples(S.lastX,S.lastSR||Engine.SR);if(S.res&&S.res.emotion!=='none')speak(SAY[S.animal][S.res.emotion][lia()?0:1],KIND[S.res.emotion])},
 mic:async()=>{if(S.busy)return;unlock();S.busy=true;render();
   try{const r=await recordMic(6,s=>{const c=$('#cd');if(c)c.textContent=s});S.busy=false;S.lastX=r.x;S.lastSR=r.sr;analyzeAndShow(r.x,r.sr,'מיקרופון')}
   catch(err){S.busy=false;MIC='native';render();toast('המיקרופון חסום כאן. לחצו שוב על 🎤 כדי להקליט עם מקליט הטלפון')}},
 trick:e=>{S.trick=e.dataset.id;S.sessClicks=0;render()},
 trickBack:()=>{S.trick=null;if(S.timer.h){clearInterval(S.timer.h);S.timer.h=null;S.timer.run=false}render()},
 readSteps:()=>{const t=TRICKS.find(x=>x.id===S.trick);speak(lia()&&t.pics?t.pics.join('. '):t.n+'. '+t.steps.join('. '),null,true)},
 click:()=>{click();if(navigator.vibrate)try{navigator.vibrate(15)}catch(e){}S.sessClicks++;D().clicks++;save();const c=$('#clk');if(c)c.innerHTML='<b>'+S.sessClicks+'</b> קליקים באימון הזה';award()},
 treat:()=>{toast('כל הכבוד! 🍖');speak('כל הכבוד!')},
 dur:e=>{const T=S.timer;if(T.run)return;T.total=T.left=+e.dataset.m*60;render()},
 timer:()=>{const T=S.timer;if(T.run){clearInterval(T.h);T.h=null;T.run=false;render();return}
   if(T.left<=0)T.left=T.total;T.run=true;
   T.h=setInterval(()=>{T.left--;const tm=$('#tm'),arc=$('#arc');if(tm)tm.textContent=Math.floor(T.left/60)+':'+String(T.left%60).padStart(2,'0');if(arc)arc.setAttribute('stroke-dashoffset',2*Math.PI*64*(1-T.left/T.total));
     if(T.left<=0){clearInterval(T.h);T.h=null;T.run=false;D().sessions++;save();chime();speak('כל הכבוד! סיימנו. הכלב צריך לנוח.');toast('האימון הסתיים. הכלב צריך מנוחה.');award();T.left=T.total;render()}},1000);render()},
 level:e=>{const d=D();d.tricks[e.dataset.id]=((d.tricks[e.dataset.id]||0)+1)%4;save();award();render()},
 ans:e=>{const q=S.quiz;if(q.ans!==null)return;const c=SLV[q.lv-1].qs[q.i],v=e.dataset.v,ok=c.o?+v===c.a:(v==='1')===c.a;q.ans=v;q.res[q.i]=ok;if(ok)q.ok++;render();speak((ok?'נכון! ':'לא בדיוק. ')+c.x,ok?'yip':'whine')},
 next:()=>{const q=S.quiz,L=SLV[q.lv-1];q.i++;q.ans=null;
   if(q.i>=L.qs.length){const d=D(),B=SB().best,was=B[q.lv]||0;d.quiz++;q.got=0;if(q.ok>was)B[q.lv]=q.ok;if(q.ok>=4&&was<4){d.game.stars+=L.stars;q.got=L.stars;chime()}save();award();render();speak(q.ok>=4?'כל הכבוד! עברת את השלב!':'כמעט! ננסה שוב.',q.ok>=4?'yip':null)}
   else{render();if(lia())speak(L.qs[q.i].q,null,true)}},
 slv:e=>{const n=+e.dataset.n;if(!sOpen(n)||n>sMax()){toast(lia()?'קודם מסיימים את השלב הקודם':'השלב נפתח אחרי 4 תשובות נכונות בשלב הקודם');return}S.quiz={lv:n,i:0,ok:0,ans:null,res:[]};render();speak(SLV[n-1].qs[0].q,null,true)},
 smap:()=>{S.quiz={lv:null,i:0,ok:0,ans:null};render()},
 quizAgain:()=>{S.quiz={lv:null,i:0,ok:0,ans:null};render()},
 snd:()=>{S.sound=!S.sound;save();render()},
 resetAll:()=>{S.users.forEach(u=>{const keep=pBox(u.id),old=S.data[u.id]||{},d=blank();d.play=keep;if(old.breed)d.breed=old.breed;if(old.fur)d.fur=old.fur;if(old.dogName)d.dogName=old.dogName;S.data[u.id]=d});save();toast('האיפוס בוצע')},
 calReset:()=>{S.baseline=null;save();render()},
 calib:async()=>{const m=$('#calMsg');try{m.textContent='מקליטים... תנו לכלב להשמיע קול רגוע.';const r=await recordMic(8);setCal(Engine.analyze(r.x,r.sr))}catch(e){m.textContent='אין גישה למיקרופון. אפשר להעלות קובץ הקלטה או לקבוע את הערך ידנית.'}}
};
function setCal(f){const m=$('#calMsg');if(f&&f.f0>0&&f.calls>=2){S.baseline=f.f0;save();render();toast('הכיול נשמר: '+Math.round(f.f0)+' הרץ')}else if(m)m.textContent='לא נמדד מספיק קול. נסו שוב קרוב יותר לכלב.'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');
  if(!b){if(e.target.closest('input,label,summary,form,a'))return;
    const el=e.target.closest('.bubble,p,h1,h2,h3,li,.note,.face,.tag,.badge,.sample,.bar,.sci');
    if(el&&app.contains(el)){el.classList.add('reading');setTimeout(()=>el.classList.remove('reading'),900);speak(el.innerText,null,true)}return}
  const f=A[b.dataset.act];if(f)f(b);
  if(lia()&&['go','trick','animal','home','trickBack'].includes(b.dataset.act))setTimeout(()=>speak(b.innerText||b.getAttribute('aria-label')||'',null,true),60)});
document.addEventListener('submit',e=>{if(e.target.id==='pronForm'){e.preventDefault();const k=nkStrip($('#pw').value||'').trim(),v=($('#pv').value||'').trim();if(k&&v&&k.length<30&&v.length<60){S.pron[k]=v;save();render();speak(v,null,true)}return}if(e.target.id!=='nameForm')return;e.preventDefault();const v=($('#dogName').value||'').trim().slice(0,24);
  if(v){if(S.who)D().dogName=v;else S.dogName=v;save()}S.editName=false;render();speak('יש לי שם! אני '+DN()+'!','yip')});
document.addEventListener('change',async e=>{
  const t=e.target;
  if((t.id==='photo'||t.id==='photo2')&&t.files[0]){avatarFromPhoto(t.files[0]);t.value=''}
  if((t.id==='upl'||t.id==='cap')&&t.files[0]){try{unlock();const r=await fromFile(t.files[0]);S.lastX=r.x;S.lastSR=r.sr;analyzeAndShow(r.x,r.sr,'קובץ')}catch(err){toast('לא הצלחנו לקרוא את ההקלטה. נסו לשמור אותה כ-m4a או mp3')}t.value=''}
  if(t.id==='calf'&&t.files[0]){try{unlock();const r=await fromFile(t.files[0]);setCal(Engine.analyze(r.x,r.sr))}catch(err){toast('לא הצלחנו לקרוא את הקובץ')}}
});
document.addEventListener('input',e=>{if(e.target.id==='bl'){S.baseline=+e.target.value;const b=$('#bv');if(b)b.textContent=S.baseline+' הרץ';save()}});

function avatarFromPhoto(file,msg){
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=40;const g=c.getContext('2d');
    const s=Math.min(img.width,img.height)*.5,sx=(img.width-s)/2,sy=(img.height-s)/2;g.drawImage(img,sx,sy,s,s,0,0,40,40);
    const d=g.getImageData(0,0,40,40).data;let r=0,gg=0,b=0,n=0;
    for(let i=0;i<d.length;i+=4){r+=d[i];gg+=d[i+1];b+=d[i+2];n++}
    r/=n;gg/=n;b/=n;const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
    // להחזיר גוון בטוח ונעים: לא כהה מדי ולא בהיר מדי
    const k=Math.min(1.3,Math.max(.75,170/((r+gg+b)/3||1)));const cl=v=>Math.round(Math.max(60,Math.min(245,v*k)));
    const R=cl(r),G=cl(gg),B=cl(b);
    if(S.who)D().fur=`rgb(${R},${G},${B})`;else S.fur=`rgb(${R},${G},${B})`;save();setFur();URL.revokeObjectURL(url);toast(msg||'הפרווה של '+DN()+' עודכנה. התמונה לא נשמרה.');speak('וואו, ככה אני נראה!')};
  img.onerror=()=>toast('לא הצלחנו לקרוא את התמונה');img.src=url;
}
function setFur(){const f0=FUR(),tri=f0.startsWith('tri:'),f=f0.replace(/^tri:/,''),m=f.match(/\d+/g).map(Number),dk=m.map(v=>Math.round(v*.82)),lt=m.map(v=>Math.round(v+(255-v)*.7));
  if(GL.ok)GL.setFur(m,tri);const r=document.documentElement.style;r.setProperty('--fur',f);r.setProperty('--furd',`rgb(${dk})`);r.setProperty('--muzzle',`rgb(${lt})`)}
if(!S.fur.startsWith('rgb'))S.fur='rgb(162,106,70)';setFur();

/* ---------- משחק אילוף על האווטאר: יד עושה סימן, הכלב מבצע, קליק וחטיף בזמן ---------- */
const GSIGNS=[
 {id:'sit',n:'שב',cue:'שב!',hand:'🫴',fx:'up'},
 {id:'down',n:'שכב',cue:'שכב!',hand:'🫳',fx:'down'},
 {id:'paw',n:'תן כף',cue:'כף!',hand:'🫴',fx:'push'},
 {id:'spin',n:'סיבוב',cue:'סובב!',hand:'☝️',fx:'circle'},
 {id:'touch',n:'נגיעה באף',cue:'גע!',hand:'🖐️',fx:'push'},
 {id:'bow',n:'קידה',cue:'קידה!',hand:'🫳',fx:'sweep'},
 {id:'hi5',n:'היי פייב',cue:'פייב!',hand:'✋',fx:'high'},
 {id:'roll',n:'התגלגל',cue:'התגלגל!',hand:'☝️',fx:'bigcircle'},
 {id:'bang',n:'מת!',cue:'באנג!',hand:'👉',fx:'bang'},
 {id:'jump',n:'קפיצה',cue:'הופ!',hand:'👋',fx:'arc'},
 {id:'dance',n:'ריקוד',cue:'רקוד!',hand:'💃',fx:'circle'},
 {id:'beg',n:'בקשה',cue:'בבקשה!',hand:'🙏',fx:'up'},
 {id:'shake',n:'ניעור',cue:'נער!',hand:'🫨',fx:'sweep'},
 {id:'howl',n:'יללה',cue:'יללה!',hand:'☝️',fx:'up'}];
const GLIA=['sit','down','spin','paw','touch','jump','dance'];
const G={phase:'idle',sign:null,did:null,correct:true,winAt:0,clickAt:0,to:0,tm:[]};
const gK=id=>(D().game.k[id]||0);
function gClear(){G.tm.forEach(clearTimeout);G.tm=[];}
function gLater(ms,f){G.tm.push(setTimeout(f,ms))}
function gSay(t,cls){const b=$('#gMsg');if(b){b.innerHTML=t;b.className='bubble'+(lia()?' lia':'')+(cls?' '+cls:'')}}
function gButtons(){const on=G.phase==='window';
  document.querySelectorAll('.gsign').forEach(b=>b.disabled=G.phase!=='idle');
  const n=$('#gNo');if(n)n.hidden=lia()||!on;
  const tr=$('#gTreat');if(tr)tr.classList.toggle('ready',on)}
V.game=()=>{const d=D();const list=GSIGNS.filter(s=>(!lia()||GLIA.includes(s.id))&&(!petCat()||!['bang','howl'].includes(s.id)));
 return `${header(lia()?'משחק אילוף':'משחק: מאלפים את '+esc(DN()))}
 <div class="stage" id="stage">${avatar('dog','happy')}<div class="ghand" id="gHand" aria-hidden="true"></div><div class="gtimer" id="gTimer" hidden><i></i></div><div class="gstars" id="gStars" aria-live="polite"></div></div>
 <div class="bubble ${lia()?'lia':''}" id="gMsg">${lia()?'בחרי סימן, ואחרי ש'+esc(DN())+' עושה אותו, תני לו חטיף!':'בחרו סימן. כש'+esc(DN())+' מבצע: קליק, ואז גוררים חטיף לפה. יש לכם '+(GW()>1?3:2)+' שניות!'}</div>
 <div class="gtray">
   <button class="clicker small" data-act="gClick" aria-label="קליק">קליק</button>
   <div class="treat" id="gTreat" role="button" tabindex="0" aria-label="חטיף. גוררים אל הכלב או לוחצים">🍖</div>
   <button class="btn warn" id="gNo" data-act="gNo" hidden>✋ לא הפעם</button>
 </div>
 <div class="gsigns">${list.map(s=>`<button class="gsign" data-act="gSign" data-id="${s.id}"><span class="h">${s.hand}</span><b>${s.n}</b>${lia()?'':`<span class="lvl">${[1,2,3,4,5].map(i=>`<i class="${gK(s.id)>=i?'on':''}"></i>`).join('')}</span>`}</button>`).join('')}</div>
 <div class="row" style="justify-content:space-between"><span class="tag">⭐ ${d.game.stars} כוכבי אילוף</span>${lia()?'':'<span class="muted">הנקודות: כמה טוב '+esc(DN())+' מכיר כל סימן</span>'}</div>
 ${lia()?'':`<details class="card"><summary>איך זה עובד?</summary><p>כמו באילוף אמיתי: הקליק אומר לכלב "בדיוק את זה!", והחטיף צריך להגיע מהר. כלבים מחברים בין מעשה לפרס רק בשנייה או שתיים. סימן ש${esc(DN())} עוד לא מכיר טוב, הוא לפעמים מתבלבל ועושה משהו אחר. אז לא נותנים חטיף, לוחצים "לא הפעם" ומנסים שוב.</p></details>`}`};
function gHand(sign){const h=$('#gHand');if(!h)return;const m=GL.ok&&GL.mouth?GL.mouth():null;
  h.style.left=Math.round(((m?m.x:.7)-.02)*100)+'%';h.style.top=Math.max(2,Math.round(((m?m.y:.3)-.32)*100))+'%';
  h.textContent=sign.hand;h.className='ghand fx-'+sign.fx;void h.offsetWidth;h.classList.add('go');gLater(1300,()=>{h.className='ghand'})}
function gStart(id){
  if(G.phase!=='idle')return;gClear();
  const s=GSIGNS.find(x=>x.id===id);G.sign=s;G.clickAt=0;
  const k=gK(id);G.correct=lia()||Math.random()<.55+.09*k;
  G.did=G.correct?id:(Math.random()<.5?'confused':['sit','down','spin'].filter(x=>x!==id)[Math.floor(Math.random()*2)]);
  G.phase='cue';gButtons();gSay('👀 '+s.n+'...');
  speak(s.cue,null,true);gHand(s);
  gLater(1000,()=>{G.phase='doing';const ms=GL.ok?GL.play(G.did):500;
    gLater(ms,()=>{G.phase='window';G.winAt=performance.now();gButtons();
      gSay(lia()?'עכשיו! תני לו חטיף 🍖':'עכשיו! קליק וחטיף');
      if(!lia()){const t=$('#gTimer');if(t){t.hidden=false;const i=t.firstElementChild;i.style.transition='none';i.style.width='100%';void i.offsetWidth;i.style.transition='width '+(2*GW())+'s linear';i.style.width='0%'}
        gLater(4000*GW(),gTimeout)}})})}
function gEnd(msg,stars,cls){
  G.phase='feedback';gButtons();const t=$('#gTimer');if(t)t.hidden=true;
  gSay(msg,cls);
  if(stars>0){D().game.stars+=stars;save();const st=$('#gStars');if(st){st.textContent='⭐'.repeat(stars);st.classList.remove('pop');void st.offsetWidth;st.classList.add('pop')}chime();award()}
  gLater(1500,()=>{if(GL.ok)GL.stand();gLater(700,()=>{G.phase='idle';gButtons();const tag=$('#gStarsTag');if(tag)tag.textContent='⭐ '+D().game.stars+' כוכבי אילוף';
    document.querySelectorAll('.gsign').forEach(b=>{const dots=b.querySelectorAll('.lvl i');dots.forEach((d,i)=>d.classList.toggle('on',gK(b.dataset.id)>i))})})})}
function gTimeout(){if(G.phase!=='window')return;
  if(!G.correct)gEnd('צדקת שלא נתת חטיף. '+esc(DN())+' עשה משהו אחר. ננסה שוב!',1);
  else gEnd('פספסנו את הרגע. חטיף צריך להגיע תוך שנייה-שתיים, אחרת הכלב לא יודע על מה הוא.',0,'warnb')}
function gNo(){if(G.phase!=='window')return;
  if(!G.correct){gEnd('נכון! '+esc(DN())+' עשה משהו אחר, ולא נותנים חטיף על טעות. עכשיו ננסה שוב.',1);speak('בפעם הבאה אני אצליח!','yip')}
  else gSay('דווקא הצליח! מגיע לו קליק וחטיף. מהר!')}
function gClickBtn(){click();if(navigator.vibrate)try{navigator.vibrate(15)}catch(e){}
  if(G.phase==='window'&&!G.clickAt){G.clickAt=performance.now();gSay('קליק! עכשיו חטיף 🍖')}
  else if(G.phase==='idle')gSay('קודם בוחרים סימן. את הקליק לוחצים כשהכלב עושה את הטריק.')}
function gFeed(){if(G.phase!=='window'&&!(lia()&&G.phase==='window'))return;
  const now=performance.now();G.phase='eating';gButtons();
  const m=GL.ok&&GL.mouth?GL.mouth():{x:.7,y:.35};const st=$('#stage').getBoundingClientRect();
  const tr=$('#gTreat').getBoundingClientRect();const f=document.createElement('div');f.className='flytreat';f.textContent='🍖';
  f.style.left=tr.left+'px';f.style.top=tr.top+'px';document.body.appendChild(f);
  requestAnimationFrame(()=>{f.style.left=(st.left+m.x*st.width-20)+'px';f.style.top=(st.top+m.y*st.height-20)+'px';f.style.transform='scale(.5)'});
  setTimeout(()=>f.remove(),480);
  setTimeout(()=>{if(GL.ok){GL.eat();GL.setMood('happy')}bark('yip')},420);
  const name=esc(DN()),k=G.sign.id,d=D().game;
  if(lia()){d.k[k]=Math.min(5,(d.k[k]||0)+1);gEnd('כל הכבוד '+UNAME()+'! '+name+' אוהב את החטיף!',1);gLater(500,()=>speak('יאמי! תודה '+UNAME()+'!','yip'));return}
  if(!G.correct){d.k[k]=Math.max(0,(d.k[k]||0)-1);save();gEnd('אופס! '+name+' לא עשה '+G.sign.n+'. כשנותנים חטיף על טעות, הכלב לומד את הטעות.',0,'warnb');return}
  const cDt=G.clickAt?G.clickAt-G.winAt:null,tDt=now-(G.clickAt||G.winAt);let stars=0,msg;
  if(cDt!==null&&cDt<=2000*GW()){stars=1;if(tDt<=2000*GW())stars++;if(cDt<=1000*GW()&&tDt<=1500*GW())stars++;
    msg=stars===3?'מושלם! קליק מהיר וחטיף בזמן.':stars===2?'יפה מאוד! קליק בזמן וחטיף בזמן.':'הקליק היה בזמן, אבל החטיף הגיע לאט. מהר יותר בפעם הבאה!'}
  else if(cDt===null&&now-G.winAt<=2000*GW()){stars=1;msg='חטיף בזמן! בפעם הבאה גם קליק, כדי ש'+name+' ידע בדיוק על מה החטיף.'}
  else msg='החטיף הגיע מאוחר מדי. כלבים מחברים בין מעשה לפרס רק בשנייה או שתיים.';
  if(stars>=2)d.k[k]=Math.min(5,(d.k[k]||0)+1);save();gEnd(msg,stars,stars?'':'warnb')}
A.gSign=b=>gStart(b.dataset.id);A.gClick=gClickBtn;A.gNo=gNo;
/* גרירת החטיף אל הכלב, או לחיצה שמעיפה אותו */
document.addEventListener('pointerdown',e=>{const t=e.target.closest('#gTreat');if(!t)return;e.preventDefault();
  const sx=e.clientX,sy=e.clientY;let ghost=null,moved=false;
  const mv=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(!moved&&Math.hypot(dx,dy)>10){moved=true;ghost=document.createElement('div');ghost.className='flytreat drag';ghost.textContent='🍖';document.body.appendChild(ghost)}
    if(ghost){ghost.style.left=(ev.clientX-24)+'px';ghost.style.top=(ev.clientY-24)+'px'}};
  const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
    if(ghost)ghost.remove();
    if(!moved){gFeed();return}
    const r=$('#stage').getBoundingClientRect();if(ev.clientX>r.left&&ev.clientX<r.right&&ev.clientY>r.top&&ev.clientY<r.bottom)gFeed();
    else if(G.phase==='window')gSay('גררו את החטיף אל '+esc(DN())+'.')};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)});
document.addEventListener('keydown',e=>{if(e.target.id==='gTreat'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();gFeed()}});


/* ---------- טיפול בכלב וארון בגדים ---------- */
function newPet(){return{food:70,water:70,clean:70,fun:70,rest:70,play:70,t:Date.now(),spent:0,own:['collarR'],wear:{},day:'',perfect:0}}
const NEEDS=[{k:'food',ic:'🍖',n:'אוכל'},{k:'water',ic:'💧',n:'מים'},{k:'clean',ic:'🪥',n:'מברשת'},{k:'fun',ic:'🦮',n:'טיול'},{k:'rest',ic:'😴',n:'שינה'},{k:'play',ic:'🎾',n:'משחק'}];
const RATE={food:9,water:9,clean:5,fun:7,rest:5,play:8};
const LOWMSG={food:'אני רעב! אפשר ארוחה?',water:'אני צמא. אפשר מים?',clean:'הפרווה שלי מסתבכת. אפשר לברש אותי?',fun:'משעמם לי. בא לי טיול!',rest:'אני עייף. אפשר לישון קצת?',play:'משעמם לי! תזרקו לי כדור?'};
const FACTS={
 food:'כלב קטן אוכל בדרך כלל פעמיים ביום, לפי הכמות שרשומה על השקית. אסור לתת לכלב שוקולד, ענבים, צימוקים או בצל. הם מסוכנים לו.',
 water:'לכלב צריכים להיות מים טריים כל היום. מחליפים את המים בקערה כל יום.',
 clean:'לפודל יש פרווה מתולתלת שמסתבכת בקלות, אז מברשים אותה כמה פעמים בשבוע ומגזזים אצל מספרה לכלבים.',
 fun:'כלבים צריכים לצאת לטיול כל יום. הולכים עם רצועה ועם מבוגר, וגם נותנים לכלב להריח.',
 rest:'כלבים ישנים הרבה, בערך 12 עד 14 שעות ביממה. כשכלב ישן משאירים אותו בשקט.',
 play:'משחק הבאה נותן לכלב תנועה ושמחה. משחקים עם צעצוע של כלבים, ולא עם הידיים, ומפסיקים כשהוא מתנשף.'};
const CB={busy:false,tm:[],brush:null};
function pet(){const d=D();if(!d.pet)d.pet=newPet();if(d.pet.play==null)d.pet.play=70;const p=d.pet,now=Date.now(),h=Math.max(0,Math.min(48,(now-(p.t||now))/36e5));
  if(h>0){NEEDS.forEach(n=>{p[n.k]=Math.max(15,p[n.k]-RATE[n.k]*h)});p.t=now}return p}
const hearts=v=>Math.max(1,Math.min(5,Math.ceil(v/20)));
const lowNeed=p=>NEEDS.find(n=>p[n.k]<35)||null;
const wallet=()=>D().game.stars-pet().spent;
function cLater(ms,f){CB.tm.push(setTimeout(f,ms))}
function cClear(){CB.tm.forEach(clearTimeout);CB.tm=[];CB.busy=false;CB.brush=null;if(GL.ok&&GL.walk)GL.walk(false)}
function cSay(t,kind){const b=$('#cMsg');if(b)b.textContent=t;speak(t,kind||'yip')}
function cFact(k){const f=$('#cFact');if(f)f.textContent='💡 '+((petCat()&&FACTS_CAT[k])||FACTS[k])}
function cRefresh(){const p=pet();document.querySelectorAll('.need').forEach(b=>{const v=p[b.dataset.k];b.querySelectorAll('.hr i').forEach((i,j)=>i.classList.toggle('on',j<hearts(v)))});
  const w=$('#cWal');if(w)w.textContent='⭐ '+wallet()+' כוכבים';if(GL.ok)GL.setMood(lowNeed(p)?'sad':'happy')}
function cDone(){const p=pet(),today=new Date().toDateString();
  if(NEEDS.every(n=>p[n.k]>=70)&&p.day!==today){p.day=today;p.perfect=(p.perfect||0)+1;D().game.stars++;save();chime();toast('יום מושלם! קיבלת כוכב ⭐');if(GL.ok)GL.play('jump');award()}
  cRefresh()}
function cFly(emoji,from){const av=$('.avatar');if(!av||!from)return;const m=GL.ok&&GL.mouth?GL.mouth():{x:.7,y:.4};const r=av.getBoundingClientRect(),t=from.getBoundingClientRect();
  const f=document.createElement('div');f.className='flytreat';f.textContent=emoji;f.style.left=(t.left+t.width/2-20)+'px';f.style.top=t.top+'px';document.body.appendChild(f);
  requestAnimationFrame(()=>{f.style.left=(r.left+m.x*r.width-20)+'px';f.style.top=(r.top+m.y*r.height-20)+'px';f.style.transform='scale(.5)'});setTimeout(()=>f.remove(),480)}
function spark(x,y){const s=document.createElement('div');s.className='spark';s.textContent=['✨','🫧','⭐'][Math.floor(Math.random()*3)];s.style.left=(x-12)+'px';s.style.top=(y-12)+'px';document.body.appendChild(s);setTimeout(()=>s.remove(),700)}

V.care=()=>{
  const p=pet(),low=lowNeed(p),dn=esc(DN());
  const msg=low?LM(low.k):(lia()?'אני מרגיש מצוין! תודה '+UNAME()+'!':'אני מרגיש מצוין. תודה שאת דואגת לי!');
  const strip='🌳 🌷 🏡 🌳 🌼 🌲 ⛲ 🌷 '.repeat(2);
  return `${header('לטפל ב'+DN())}
  <div class="stage care" id="cstage"><div class="bgwalk" aria-hidden="true"><div class="track"><span>${strip}</span><span>${strip}</span></div></div>
   <div class="night" aria-hidden="true"><span class="moon">🌙</span></div>${avatar('dog',low?'sad':'happy')}<div class="zzz" aria-hidden="true">💤</div></div>
  <div class="bubble ${lia()?'lia':''}" id="cMsg">${msg}</div>
  <div class="meter" id="bprog" hidden><i></i></div>
  <div class="needs">${NEEDS.map(NI).map(n=>`<button class="need" data-act="care" data-k="${n.k}" aria-label="${n.n}"><span class="ic">${n.ic}</span><span class="hr" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<hearts(p[n.k])?'on':''}"></i>`).join('')}</span><span class="nm">${n.n}</span></button>`).join('')}</div>
  <div class="toyrow"><div class="toy" id="toy" role="button" tabindex="0" aria-label="זורקים כדור">${petCat()?'🧶':'🎾'}</div><p class="muted">${lia()?'מחליקים את הכדור למעלה וזורקים!':'מחליקים את הכדור למעלה כדי לזרוק. החלקה ארוכה זורקת רחוק יותר.'}</p></div>
  ${lia()?'':`<div class="note" id="cFact">💡 כל פעולה מלמדת משהו על טיפול אמיתי בכלב. לוחצים ובודקים.</div>`}
  <div class="row" style="justify-content:space-between"><span class="tag" id="cWal">⭐ ${wallet()} כוכבים</span><button class="btn sun" data-act="go" data-s="dress">👕 ארון הבגדים</button></div>
  ${lia()?'':`<p class="muted">יום מושלם: כשכל הלבבות כמעט מלאים (ארבעה מתוך חמישה), מקבלים כוכב אחד פעם ביום. הכוכבים משמשים לקניית בגדים.</p>`}`};

A.care=e=>{unlock();const k=e.dataset.k,p=pet();
  if(CB.brush&&k!=='clean'){CB.brush=null;const a=$('.avatar');if(a)a.classList.remove('brushing');const b=$('#bprog');if(b)b.hidden=true}
  if(CB.busy)return;
  const st=$('#cstage'),face=(t,kind)=>cSay(t,kind);
  if(k==='food'||k==='water'){
    cFact(k);
    if(p[k]>=90){face(k==='food'?'אני שבע, תודה! אסור להאכיל כלב יותר מדי.':'שתיתי מספיק, תודה!');return}
    face(k==='food'?'ממממ, טעים! תודה!':'גלופ גלופ, תודה!');CB.busy=true;cFly(k==='food'?'🍖':'💧',e);
    cLater(420,()=>{if(GL.ok){GL.eat();GL.setMood('happy')}});
    p[k]=Math.min(100,p[k]+45);save();cLater(700,cRefresh);cLater(1700,()=>{CB.busy=false;cDone()});return}
  if(k==='clean'){
    cFact(k);
    if(p.clean>=90){face('אני נקי ויפה, תודה!');return}
    if(CB.brush){CB.brush=null;const a=$('.avatar');if(a)a.classList.remove('brushing');$('#bprog').hidden=true;return}
    CB.brush={acc:0,down:false};const a=$('.avatar');if(a)a.classList.add('brushing');const b=$('#bprog');b.hidden=false;b.firstElementChild.style.width='0%';
    face(lia()?'מברשים! מחליקים את האצבע על '+DN()+'.':'בואו נברש! מחליקים את האצבע על '+DN()+' כמה פעמים.');return}
  if(k==='fun'&&petCat()){cFact(k);
    if(p.fun>=90){face('כבר שיחקנו בנוצה. עכשיו אני רגוע.');return}
    CB.busy=true;face('צדים את הנוצה! קפיצה!');const ms=GL.ok?GL.play('jump'):800;cLater(ms+200,()=>{if(GL.ok)GL.play('spin')});
    cLater(3200,()=>{if(GL.ok)GL.stand();p.fun=Math.min(100,p.fun+55);p.rest=Math.max(15,p.rest-8);save();cRefresh();cSay('תפסתי! איזה כיף!');CB.busy=false;cLater(1200,cDone)});return}
  if(k==='fun'){
    cFact(k);
    if(p.fun>=90){face('כבר טיילנו היום. עכשיו אני רגוע.');return}
    CB.busy=true;face(lia()?'יוצאים לטיול עם מבוגר!':'יוצאים לטיול! בטיול אמיתי הולכים עם רצועה ועם מבוגר.');
    if(st)st.classList.add('walking');if(GL.ok){GL.walk(true);GL.setMood('happy')}
    cLater(6500,()=>{if(st)st.classList.remove('walking');if(GL.ok)GL.walk(false);p.fun=Math.min(100,p.fun+55);p.water=Math.max(15,p.water-10);p.rest=Math.max(15,p.rest-10);save();cRefresh();
      cSay('איזה כיף! הרחתי פרחים!');CB.busy=false;cLater(1500,cDone)});return}
  if(k==='play'){cThrow(1);return}
  if(k==='rest'){
    cFact(k);
    if(p.rest>=90){face('אני לא עייף עכשיו. בא לי לשחק!');return}
    CB.busy=true;face('לילה טוב... ששש, '+DN()+' ישן.','whine');
    if(st)st.classList.add('sleeping');if(GL.ok){GL.play('sleep');GL.setMood('calm')}
    cLater(5500,()=>{if(st)st.classList.remove('sleeping');if(GL.ok){GL.stand();GL.setMood('happy')}p.rest=Math.min(100,p.rest+60);save();cRefresh();
      cSay('בוקר טוב! נחתי מצוין.');CB.busy=false;cLater(1200,cDone)});return}
};

function cThrow(pw){if(S.screen!=='care')return;unlock();if(CB.brush)return;if(CB.busy)return;const p=pet();cFact('play');
  if(p.play>=92){cSay('שיחקנו הרבה. אני צריך הפסקה קטנה!');return}
  CB.busy=true;cSay(pw>1.1?'וואו, רחוק! אני רץ!':'יש! אני רץ להביא!');const t=$('#toy');if(t)t.classList.add('gone');
  let d=petCat()&&!(GL.ok&&GL.catFetch&&GL.catFetch())?(GL.ok?GL.play('dance')+200:1200):(GL.ok&&GL.fetch?GL.fetch(pw):0);if(!d)d=1200;
  cLater(d,()=>{p.play=Math.min(100,p.play+45);p.fun=Math.min(100,p.fun+8);p.water=Math.max(15,p.water-6);save();cRefresh();const tt=$('#toy');if(tt)tt.classList.remove('gone');
    if(GL.ok&&petCat())GL.stand();cSay(petCat()?'תפסתי את הצמר! עוד פעם?':lia()?'הבאתי! עוד פעם?':'הבאתי את הכדור! עוד פעם?');CB.busy=false;cLater(1200,cDone)})}
document.addEventListener('pointerdown',e=>{const t=e.target.closest('#toy');if(!t)return;e.preventDefault();const sx=e.clientX,sy=e.clientY,t0=performance.now();t.classList.add('hold');
  const mv=ev=>{t.style.transform='translate('+((ev.clientX-sx)*.5)+'px,'+(Math.min(0,ev.clientY-sy)*.6)+'px)'};
  const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);t.classList.remove('hold');t.style.transform='';
    const dy=sy-ev.clientY,dt=Math.max(60,performance.now()-t0);if(dy>25)cThrow(Math.max(.55,Math.min(1.35,dy/220+120/dt*.3)));else cThrow(1)};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)});
document.addEventListener('keydown',e=>{if(e.target.id==='toy'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();cThrow(1)}});
function needBubble(){const av=$('.avatar');if(!av||!S.who||S.screen==='care'||(av.dataset.animal==='cat'&&!petCat()))return;const p=pet();let m=null;
  NEEDS.forEach(n=>{if(p[n.k]<35&&(!m||p[n.k]<p[m.k]))m=n});if(!m)return;
  const b=document.createElement('button');b.className='nb';b.dataset.act='needgo';b.dataset.k=m.k;b.setAttribute('aria-label',LM(m.k));b.innerHTML='<span>'+m.ic+'</span>';av.appendChild(b)}
A.needgo=e=>{speak(LM(e.dataset.k),'whine');setTimeout(()=>go('care'),60)};

/* מברשת: מחליקים אצבע על הכלב */
document.addEventListener('pointerdown',e=>{const b=CB.brush;if(!b||!e.target.closest('.avatar'))return;b.down=true;b.lx=e.clientX;b.ly=e.clientY;b.sp=0});
addEventListener('pointermove',e=>{const b=CB.brush;if(!b||!b.down)return;
  b.acc+=Math.hypot(e.clientX-b.lx,e.clientY-b.ly);b.lx=e.clientX;b.ly=e.clientY;
  const now=performance.now();if(now-b.sp>90){b.sp=now;spark(e.clientX,e.clientY)}
  const bar=$('#bprog i');if(bar)bar.style.width=Math.min(100,b.acc/12)+'%';
  if(b.acc>=1200){CB.brush=null;const a=$('.avatar');if(a)a.classList.remove('brushing');const pb=$('#bprog');if(pb)pb.hidden=true;
    const p=pet();p.clean=100;save();cRefresh();if(GL.ok){GL.play('spin');GL.setMood('happy')}cSay('איזה כיף! עכשיו אני נקי ויפה!');CB.busy=true;cLater(1700,()=>{CB.busy=false;cDone()})}});
addEventListener('pointerup',()=>{if(CB.brush)CB.brush.down=false});
addEventListener('pointercancel',()=>{if(CB.brush)CB.brush.down=false});

/* ---------- ארון בגדים ---------- */
const BREEDS=[['poodle','פודל מיני','🐩','תלתלים רכים, לא נושר'],['lab','לברדור','🦮','פרווה קצרה וחלקה, אוהב לשחות'],['beagle','ביגל','🐕','שלושה צבעים, אוזניים ארוכות ואף מעולה'],['golden','גולדן רטריבר','🐕','פרווה זהובה עם נוצות ארוכות'],['dachshund','תחש','🌭','גוף ארוך ורגליים קצרות'],['shihtzu','שיצו','🐶','שיער ארוך עד הרצפה וקוקו עם סרט']];
const SLOTS=[{k:'hat',n:'כובעים',e:'🎩'},{k:'hair',n:'קשתות',e:'🦋'},{k:'neck',n:'צוואר',e:'🎀'},{k:'face',n:'משקפיים',e:'😎'},{k:'top',n:'חולצות ומעילים',e:'👕'},{k:'costume',n:'תחפושות',e:'🦸'},{k:'fur',n:'צבע פרווה',e:'🎨'}];
const FURS=[['משמש','rgb(162,106,70)'],['קרם','rgb(226,200,160)'],['לבן','rgb(240,236,228)'],['זהוב','rgb(214,160,80)'],['שוקולד','rgb(92,58,40)'],['שחור','rgb(44,40,40)'],['כסוף','rgb(150,150,156)'],['אדום','rgb(150,62,36)'],['טריקולור','tri:rgb(170,104,52)']];
const ITEMS=[
 {id:'party',slot:'hat',n:'כובע מסיבה',e:'🥳',c:'#ffd6ea',p:2},
 {id:'top',slot:'hat',n:'צילינדר',e:'🎩',c:'#d9dbe6',p:3},
 {id:'crown',slot:'hat',n:'כתר',e:'👑',c:'#ffe9a6',p:5},
 {id:'bfly',slot:'hair',n:'קשת פרפר',e:'🦋',c:'#ffd6ea',p:4},
 {id:'flower',slot:'hair',n:'קשת פרחים',e:'🌸',c:'#e6d6ff',p:3},
 {id:'hstar',slot:'hair',n:'קשת כוכבים',e:'⭐',c:'#fff1b8',p:3},
 {id:'bunny',slot:'hair',n:'אוזני ארנב',e:'🐰',c:'#ffe0ea',p:4},
 {id:'catears',slot:'hair',n:'אוזני חתול',e:'🐱',c:'#d9dbe6',p:4},
 {id:'unicorn',slot:'hair',n:'קרן חד-קרן',e:'🦄',c:'#ffe0f2',p:5},
 {id:'rainbow',slot:'hair',n:'קשת בענן',e:'🌈',c:'#d6ecff',p:5},
 {id:'wreath',slot:'hair',n:'זר פרחים',e:'💐',c:'#e2f6dc',p:4},
 {id:'tiara',slot:'hair',n:'כתר נסיכה',e:'👸',c:'#ffe9a6',p:6},
 {id:'collarR',slot:'neck',n:'קולר אדום',e:'⭕',c:'#ffc2c9',p:0},
 {id:'collarB',slot:'neck',n:'קולר כחול',e:'🔵',c:'#c2dcff',p:1},
 {id:'bowR',slot:'neck',n:'פפיון אדום',e:'🎀',c:'#ffc2c9',p:2},
 {id:'bowB',slot:'neck',n:'פפיון כחול',e:'🦋',c:'#c2dcff',p:3},
 {id:'sun',slot:'face',n:'משקפי שמש',e:'😎',c:'#d9dbe6',p:3},
 {id:'heart',slot:'face',n:'משקפי לב',e:'😍',c:'#ffd6ea',p:4},
 {id:'stripe',slot:'top',n:'חולצת פסים',e:'👕',c:'#c2dcff',p:3},
 {id:'starshirt',slot:'top',n:'חולצה עם כוכב',e:'👚',c:'#ffd6ea',p:3},
 {id:'hoodie',slot:'top',n:"קפוצ'ון צהוב",e:'🧶',c:'#fff1b8',p:5},
 {id:'rain',slot:'top',n:'מעיל גשם',e:'🌧️',c:'#fff1b8',p:6},
 {id:'winter',slot:'top',n:'מעיל חורף',e:'🧥',c:'#c2dcff',p:7},
 {id:'ninja',slot:'costume',n:"תחפושת נינג'ה",e:'🥷',c:'#d9dbe6',p:6},
 {id:'hero',slot:'costume',n:'תחפושת גיבור',e:'🦸',c:'#ffc2c9',p:7},
 {id:'dino',slot:'costume',n:'תחפושת דינוזאור',e:'🦖',c:'#c9f0d0',p:6},
 {id:'bflyc',slot:'costume',n:'תחפושת פרפר',e:'🦋',c:'#e6d6ff',p:8}];
V.dress=()=>{
  const p=pet();let sl=S.dressTab||'hat';if(petCat()&&!['hat','neck','face','fur'].includes(sl))sl='hat';
  const worn=Object.values(p.wear).map(id=>{const i=ITEMS.find(x=>x.id===id);return i?i.e:''}).join(' ');
  return `${header('ארון הבגדים')}
  <div class="avatarWrap">${avatar('dog','happy')}${GL.ok?`<div class="row" style="justify-content:space-between;width:100%"><span class="muted">${lia()?'אצבע אחת מסובבת. שתיים מקרבות.':'👆 אצבע אחת מסובבת ומטה · ✌️ שתי אצבעות מקרבות ומזיזות · הקשה כפולה מאפסת'}</span><button class="back" data-act="vreset">↺ איפוס</button></div>`:`<p class="muted" style="text-align:center">לובש: ${worn||'כלום'}</p>`}</div>
  <div class="row" style="justify-content:space-between"><span class="tag" id="cWal">⭐ ${wallet()} כוכבים</span><span class="muted">${lia()?'':'כוכבים מקבלים במשחק האילוף ובטיפול היומי'}</span></div>
  <button class="btn ghost" data-act="petShot">📸 צילום לאלבום</button>
  <div class="seg wrap" role="group" aria-label="סוג פריט">${SLOTS.filter(s=>!petCat()||['hat','neck','face','fur'].includes(s.k)).map(s=>`<button data-act="dtab" data-s="${s.k}" aria-pressed="${s.k===sl}">${s.e} ${s.n}</button>`).join('')}</div>
  ${sl==='breed'?`<div class="items">${BREEDS.map(([id,n,e,d])=>{const on=(D().breed||'poodle')===id;return `<button class="item ${on?'worn':''}" data-act="breed" data-id="${id}" data-n="${n}"><span class="sw">${e}</span><b>${n}</b><span class="price">${on?'עכשיו ✓':d}</span></button>`}).join('')}</div><p class="muted">הבגדים מתאימים את עצמם לכל גזע. את צבע הפרווה אפשר לשנות בלשונית צבע פרווה.</p>`:sl==='fur'&&petCat()?catBreedPick(D().catBreed||'tabby','catCoat')+'<p class="muted">לחתול בוחרים גזע וצבע יחד. גזעים נעולים נפתחים בכוכבים.</p>':sl==='fur'?`<div class="items">${FURS.map(([n,c])=>`<button class="item ${FUR()===c?'worn':''}" data-act="furc" data-c="${c}" data-n="${n}"><span class="sw" style="background:${c.startsWith('tri:')?'linear-gradient(135deg,#1c1612 0 38%,#aa6834 38% 68%,#f4efe6 68%)':c};border:3px solid var(--line)"></span><b>${n}</b><span class="price">${FUR()===c?'עכשיו ✓':'חינם'}</span></button>`).join('')}
   <label class="item" for="photo2"><span class="sw">📷</span><b>מתמונה</b><span class="price">צבע מהכלב שלכם</span></label></div><input class="file" id="photo2" type="file" accept="image/*" aria-label="צבע פרווה מתמונה">`:`<div class="items">
   <button class="item ${p.wear[sl]?'':'worn'}" data-act="wear" data-id="none" data-s="${sl}"><span class="sw">🚫</span><b>בלי</b></button>
   ${ITEMS.filter(i=>i.slot===sl&&(!petCat()||CATOK.includes(i.id))).map(i=>{const own=p.own.includes(i.id),on=p.wear[sl]===i.id;
     return `<button class="item ${on?'worn':''} ${own?'':'locked'}" data-act="wear" data-id="${i.id}"><span class="sw" style="background:${i.c}">${i.e}</span><b>${i.n}</b><span class="price">${on?'לובש ✓':own?'שלך':'⭐ '+i.p}</span></button>`}).join('')}
  </div>`}
  <button class="btn sun" data-act="go" data-s="game">🎮 לצבור כוכבים במשחק</button>`};
Object.assign(A,{
 vreset:()=>{if(GL.ok&&GL.resetView)GL.resetView()},
 dtab:e=>{S.dressTab=e.dataset.s;render()},
 breed:e=>{const id=e.dataset.id;if((D().breed||'poodle')===id)return;{const x=X();if(!x.unl.includes(x.breed||'poodle'))x.unl.push(x.breed||'poodle')}D().breed=id;const c=GL.ok&&GL.breedColor?GL.breedColor(id):null;D().fur=c||'rgb(162,106,70)';save();render();speak('עכשיו אני '+e.dataset.n+'!','yip')},
 furc:e=>{D().fur=e.dataset.c;save();render();speak('ככה אני '+e.dataset.n+'!','yip')},
 wear:e=>{const p=pet(),id=e.dataset.id,it=ITEMS.find(x=>x.id===id);let bought=false,said=null;
   if(!it){delete p.wear[e.dataset.s||S.dressTab||'hat'];said='בלי'}
   else if(p.own.includes(id)){if(p.wear[it.slot]===id){delete p.wear[it.slot];said='בלי '+it.n}else{p.wear[it.slot]=id;said=it.n}}
   else if(wallet()>=it.p){p.spent+=it.p;p.own.push(id);p.wear[it.slot]=id;bought=true;said='וואו, תודה! '+it.n}
   else{const n=it.p-wallet();toast('חסרים עוד '+n+' כוכבים. משחקים באילוף וצוברים!');speak('חסרים עוד '+n+' כוכבים.',null,true);return}
   save();render();if(bought){chime();if(GL.ok)GL.play('jump');award()}
   speak(said,bought?'yip':null,!bought)}
});

/* בכל מסך: אצבע אחת מסובבת (ימינה-שמאלה) ומטה (למעלה-למטה, מבט מלמעלה). שתיים מקרבות ומזיזות. הקשה כפולה מאפסת */
const PT=new Map();let pinch=null,lastTap=0;
document.addEventListener('pointerdown',e=>{if(!GL.ok||CB.brush)return;const a=e.target.closest('.avatar');if(!a||e.target.closest('.nb'))return;
  PT.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()});try{a.setPointerCapture(e.pointerId)}catch(_){}
  if(PT.size===2){const [p,q]=[...PT.values()];pinch={d:Math.hypot(p.x-q.x,p.y-q.y)||1,mx:(p.x+q.x)/2,my:(p.y+q.y)/2}}});
addEventListener('pointermove',e=>{const p=PT.get(e.pointerId);if(!p||!GL.ok)return;const a=$('.avatar'),w=a?a.getBoundingClientRect().width:300;
  if(PT.size===1){GL.rotate((e.clientX-p.x)*.012);if(GL.tilt)GL.tilt((e.clientY-p.y)*.008)}
  p.x=e.clientX;p.y=e.clientY;
  if(PT.size===2&&pinch){const [u,v]=[...PT.values()],d=Math.hypot(u.x-v.x,u.y-v.y)||1,mx=(u.x+v.x)/2,my=(u.y+v.y)/2;
    GL.zoomBy(d/pinch.d);GL.pan((mx-pinch.mx)/w,(my-pinch.my)/w);pinch={d,mx,my}}});
const pEnd=e=>{const p=PT.get(e.pointerId);PT.delete(e.pointerId);if(PT.size<2)pinch=null;
  if(p&&PT.size===0&&Math.hypot(e.clientX-p.sx,e.clientY-p.sy)<8&&performance.now()-p.t<300){const now=performance.now();if(now-lastTap<350&&GL.ok){GL.resetView();lastTap=0}else lastTap=now}};
addEventListener('pointerup',pEnd);addEventListener('pointercancel',pEnd);
addEventListener('wheel',e=>{if(GL.ok&&e.target.closest&&e.target.closest('.avatar')){e.preventDefault();GL.zoomBy(e.deltaY<0?1.1:.91)}},{passive:false});

/* ---------- משתמשים: פתיחה, פרופיל והסרה ---------- */
/* ניקוד לשמות ילדים נפוצים. נוסף למילון הניקוד הכללי רק כשהמילה לא קיימת בו. */
const KIDN={'נועם':'נוֹעַם','נועה':'נוֹעָה','מאיה':'מָאיָה','תמר':'תָּמָר','יעל':'יָעֵל','שירה':'שִׁירָה','אביגיל':'אֲבִיגַיִל','רוני':'רוֹנִי','הילה':'הִילָה','הדר':'הָדָר','מיכל':'מִיכַל','שקד':'שָׁקֵד','ליאור':'לִיאוֹר','אגם':'אֲגַם','עמית':'עָמִית','גל':'גַּל','רון':'רוֹן','בן':'בֶּן','אדם':'אָדָם','נדב':'נָדָב','ים':'יָם','אופיר':'אוֹפִיר','אופק':'אוֹפֶק','רז':'רָז','רועי':'רוֹעִי','שי':'שַׁי','טל':'טַל','עדי':'עֲדִי','עדן':'עֵדֶן','שחר':'שַׁחַר','עלמה':'עַלְמָה','אלמה':'אַלְמָה','מיה':'מִיָּה','עומר':'עוֹמֶר','איתי':'אִיתַי','עידו':'עִידוֹ','יונתן':'יוֹנָתָן','דניאל':'דָּנִיֵּאל','אריאל':'אֲרִיאֵל','איתן':'אֵיתָן','דוד':'דָּוִד','יוסף':'יוֹסֵף','משה':'מֹשֶׁה','אברהם':'אַבְרָהָם','יצחק':'יִצְחָק','יעקב':'יַעֲקֹב','שרה':'שָׂרָה','רבקה':'רִבְקָה','רחל':'רָחֵל','לאה':'לֵאָה','אסתר':'אֶסְתֵּר','נוגה':'נֹגַהּ','תהילה':'תְּהִלָּה','ליאל':'לִיאֵל','לירון':'לִירוֹן','ליאם':'לִיאָם','אביב':'אָבִיב','יהלי':'יַהֲלִי','הלל':'הִלֵּל','נהוראי':'נְהוֹרַאי','אריה':'אַרְיֵה','זיו':'זִיו','עמרי':'עָמְרִי','יואב':'יוֹאָב','נוי':'נוֹי','שני':'שָׁנִי','מעיין':'מַעְיָן','מור':'מוֹר','ענבל':'עִנְבָּל','קורל':'קוֹרַל','ספיר':'סַפִּיר','דנה':'דָּנָה','גאיה':'גַּאיָה','אייל':'אַיָּל','תומר':'תּוֹמֶר','גיא':'גַּיְא','עידן':'עִידָן','נתנאל':'נְתַנְאֵל','עוז':'עוֹז','ארבל':'אַרְבֵּל'};
const DOGN=['פּוּדִי','שׁוֹקוֹ','לוּנָה','מָקְס','דּוּבִּי','לוּקִי','רֶקְסִי','בּוּבּוּ','טוֹפִי','מִילוֹ','גִ\'ינְגִ\'י','סֶנְדִי','פִּיצִי','טִיטוֹ','לָאקִי','הָנִי','קִינָמוֹן','פּוֹפְּקוֹרְן','בּוֹטֶן','וָפֶל','מַרְשְׁמֶלוֹ','שׁוֹקוֹלָד','זִיגִי','צָ\'רְלִי','בֶּנְגִ\'י','מוֹקָה','בִּיסְלִי','בַּמְבָּה','רוֹקִי','גֶ\'לִי','טֶדִי','אוֹסְקָר','קוּקִי','צִימּוּקִי','כּוֹכָבִי','נָמֵר'];
const CATN=['מִיצִי','לוּסִי','קִיטִי','פְּתִית','מִימִי','נוּנוּ','שַׁמֶּנֶת','קָרָמֶל','טִיגְרִיס','לוּלִי','צֶמֶר','כָּרִית','תּוּתִּי','מַנְגּוֹ','סִימְבָּה','זְהָבָה','פְּנִינָה','מוּצִי','גּוּמִי','פּוּצִי','קוֹקוֹס','וָנִיל','פִּיסְטוּק','קְטִיפָה','כַּפִּית','מִשְׁמֵשׁ','עָנָן','שֶׁלֶג','פִּלְפֵּל','סוּכָּרִיָּה'];
[KIDN].concat([DOGN,CATN].map(l=>{const o={};l.forEach(w=>{o[nkStrip(w)]=w});return o})).forEach(o=>{for(const k in o)if(!NK[k])NK[k]=o[k]});
Object.assign(NK,Object.fromEntries(Object.entries({'הפרופיל':'הַפְּרוֹפִיל','פרופיל':'פְּרוֹפִיל','ניקוד':'נִקּוּד','אוטומטי':'אוֹטוֹמָטִי','בקרוב':'בְּקָרוֹב','גזע':'גֶּזַע','גיל':'גִּיל','מתקדם':'מִתְקַדֵּם','להסיר':'לְהָסִיר','הסרה':'הֲסָרָה','משתמשים':'מִשְׁתַּמְּשִׁים','יוצאים':'יוֹצְאִים','לדרך':'לַדֶּרֶךְ'}).filter(([k])=>!NK[k])));

function autoNk(v){v=String(v||'').trim();if(!v)return null;if(NKM.test(v))return v;let hit=false;const o=v.replace(NKR,w=>{if(NK[w]){hit=true;return NK[w]}return w});return hit?o:null}
const DOGE=['Buddy','Max','Bella','Luna','Charlie','Daisy','Cooper','Milo','Coco','Teddy','Rosie','Bailey','Lucky','Poppy','Ginger','Biscuit','Mochi','Waffles','Pickles','Peanut','Oreo','Zoey','Rocky','Lily','Bear','Penny','Toby','Sunny','Maple','Nala','Scout','Pepper','Cookie','Ziggy','Honey','Jack'];
const CATE=['Whiskers','Luna','Oliver','Cleo','Simba','Mittens','Smokey','Pumpkin','Tiger','Willow','Bella','Shadow','Misty','Nala','Felix','Coco','Pepper','Peaches','Socks','Ginger','Mochi','Biscuit','Kiwi','Lily','Mango','Oreo','Pixel','Snowball','Maple','Zoe'];
const nameList=a=>S.lang==='en'?(a==='cat'?CATE:DOGE):(a==='cat'?CATN:DOGN);
const sugOf=(a,off)=>{const l=nameList(a);return [0,1,2,3,4,5].map(i=>l[(off+i)%l.length])};
const AGES=[3,4,5,6,7,8,9,10,11,12,13,14];
const MODES=[['auto','לפי גיל'],['simple','פשוט'],['full','מתקדם']];
const modeNote=`<p class="muted">פשוט: הקראה של כל טקסט, פחות מילים ושלבים קלים. מתקדם: כל הטריקים, השלבים והפרטים. "לפי גיל" בוחר פשוט עד גיל 6.</p>`;
function breedPick(cur,act){return `<div class="items">${BREEDS.map(([id,n,e,d])=>{const lk=act==='breed'&&!bOpen(X(),id),need=act==='breed'?Math.max(0,(BTHR[id]||0)-D().game.stars):0;return `<button class="item ${cur===id?'worn':''} ${lk?'locked':''}" data-act="${lk?'collLock':act}" data-id="${id}" data-n="${n}" data-need="${need}"><span class="sw">${lk?'🔒':e}</span><b>${n}</b><span class="price">${cur===id?'נבחר ✓':lk?'עוד '+need+' כוכבים':d}</span></button>`}).join('')}</div>`}
function petNames(cur,animal,off,act){return `<div class="chips">${sugOf(animal,off).map(n=>`<button class="chip ${nkStrip(cur)===nkStrip(n)?'on':''}" data-act="${act}" data-v="${esc(n)}">${n}</button>`).join('')}<button class="chip more" data-act="${act==='nuPick'?'nuMore':'pfMore'}">🔄 עוד שמות</button></div>`}

V.newu=()=>{const n=S.nu||(S.nu={g:'f',name:'',age:null,mode:'auto',animal:'dog',breed:'poodle',pet:'',off:Math.floor(Math.random()*36)});
  const sim=n.mode==='simple'||(n.mode==='auto'&&n.age!=null&&n.age<6);
  return `<div class="top"><button class="back" data-act="login">→ ביטול</button><div class="who"><span>משתמש חדש</span></div></div>
  <div class="card nu"><h3>1. איך קוראים לך?</h3>
   <div class="nm"><input id="nuName" maxlength="24" value="${esc(n.name)}" placeholder="כותבים כאן" autocomplete="off" aria-label="השם">${nkBtn("nuNk","name")}</div></div>
  <div class="card nu"><h3>2. בן או בת כמה?</h3><div class="seg" role="group" aria-label="מגדר"><button data-act="nuG" data-v="f" aria-pressed="${n.g!=='m'}">👧 בת</button><button data-act="nuG" data-v="m" aria-pressed="${n.g==='m'}">👦 בן</button></div><div class="chips">${AGES.map(a=>`<button class="chip ${n.age===a?'on':''}" data-act="nuAge" data-v="${a}">${a}</button>`).join('')}</div></div>
  <div class="card nu"><h3>3. איזה מצב?</h3><div class="seg" role="group" aria-label="מצב">${MODES.map(([k,t])=>`<button data-act="nuMode" data-v="${k}" aria-pressed="${n.mode===k}">${t}</button>`).join('')}</div>${n.age!=null?`<p class="tag">יהיה ${sim?'מצב פשוט':'מצב מתקדם'}</p>`:''}${modeNote}</div>
  <div class="card nu"><h3>4. איזו חיה?</h3>${animalPick(n.animal,'nuAni')}</div>
  <div class="card nu"><h3>5. איזה גזע?</h3>${n.animal==='cat'?catBreedPick(n.cbreed||'tabby','nuCatBr'):breedPick(n.breed,'nuBreed')}</div>
  <div class="card nu"><h3>${n.animal==='cat'?'6. איך קוראים לחתול?':'6. איך קוראים לכלב?'}</h3>
   <div class="nm"><input id="nuPet" maxlength="24" value="${esc(n.pet)}" placeholder="בוחרים או כותבים" autocomplete="off" aria-label="שם הכלב">${nkBtn("nuNk","pet")}</div>
   ${petNames(n.pet,n.animal,n.off,'nuPick')}</div>
  <button class="btn sun big" data-act="nuSave">🐾 יוצאים לדרך!</button>`};

V.prof=()=>{const u=U();if(!u){S.screen='login';return V.login()}const d=D();S.pfOff=S.pfOff||0;
  return `${header('הפרופיל שלי')}
  <div class="card nu"><h3>השם שלי</h3>
   <div class="nm"><input id="pfName" maxlength="24" value="${esc(u.name)}" autocomplete="off" aria-label="השם">${nkBtn("pfNk","name")}</div></div>
  <div class="card nu"><h3>גיל ומגדר</h3><div class="seg" role="group" aria-label="מגדר"><button data-act="pfG" data-v="f" aria-pressed="${u.g!=='m'}">👧 בת</button><button data-act="pfG" data-v="m" aria-pressed="${u.g==='m'}">👦 בן</button></div><div class="chips">${AGES.map(a=>`<button class="chip ${u.age===a?'on':''}" data-act="pfAge" data-v="${a}">${a}</button>`).join('')}</div></div>
  <div class="card nu"><h3>מצב</h3><div class="seg" role="group" aria-label="מצב">${MODES.map(([k,t])=>`<button data-act="pfMode" data-v="${k}" aria-pressed="${u.mode===k}">${t}</button>`).join('')}</div><p class="tag">עכשיו: ${lia()?'מצב פשוט':'מצב מתקדם'}</p><p class="tag">רמת קושי לפי גיל: ${BANDN[ageBand()]}</p>${modeNote}</div>
  <div class="card nu"><h3>החיה שלי</h3>${animalPick(u.animal,'pfAni')}</div>
  <div class="card nu"><h3>הגזע</h3>${u.animal==='cat'?catBreedPick(d.catBreed||'tabby','pfCatBr'):breedPick(d.breed||'poodle','breed')}<p class="muted">החלפת גזע מחזירה את צבע הפרווה לצבע של הגזע. הבגדים נשארים.</p></div>
  <div class="card nu"><h3>שם הכלב</h3>
   <div class="nm"><input id="pfPet" maxlength="24" value="${esc(DN())}" autocomplete="off" aria-label="שם הכלב">${nkBtn("pfNk","pet")}</div>
   ${petNames(DN(),u.animal,S.pfOff,'pfPick')}</div>
  <button class="btn ghost" data-act="delAsk" data-id="${u.id}">🔒 הסרת המשתמש (רק הורים)</button>`};

const nkBtn=(act,f)=>S.lang==='en'?'':`<button class="btn ghost" type="button" data-act="${act}" data-f="${f}">✨ ניקוד</button>`;
function nkInto(id,set){const el=$('#'+id);if(!el)return;const v=autoNk(el.value);if(!v){toast('לא מצאתי ניקוד לשם הזה. אפשר להשאיר כך, או להקליד עם ניקוד.');return}el.value=v;set(v);speak(v,null,true)}
Object.assign(A,{
 noop:()=>{},
 lang:e=>{const l=e.dataset.v==='en'?'en':'he';if(l===S.lang)return;S.lang=l;save();TRRE=null;render();setTimeout(()=>speak(S.who?greet():(l==='en'?'Hello! Welcome to Little Trainers.':'שלום! ברוכים הבאים למאלפים קטנים.'),'yip'),200)},
 newu:()=>{S.who=null;S.nu=null;go('newu')},
 nuNk:e=>{const f=e.dataset.f;nkInto(f==='name'?'nuName':'nuPet',v=>{S.nu[f]=v})},
 nuAge:e=>{S.nu.age=+e.dataset.v;render()},
 nuMode:e=>{S.nu.mode=e.dataset.v;render()},
 nuBreed:e=>{S.nu.breed=e.dataset.id;render();if(GL.ok&&GL.setBreed)GL.setBreed(S.nu.breed)},
 nuPick:e=>{S.nu.pet=e.dataset.v;render();speak(e.dataset.v,'yip')},
 nuMore:()=>{S.nu.off=(S.nu.off+6)%nameList(S.nu.animal).length;render()},
 nuSave:()=>{const n=S.nu;n.name=String(n.name||'').trim();
   if(!n.name){toast('כותבים קודם את השם');const i=$('#nuName');if(i)i.focus();return}
   if(n.age==null){toast('בוחרים גיל');return}
   const id='u'+Date.now().toString(36),used=S.users.map(u=>u.color),color=UCOL.find(c=>!used.includes(c))||UCOL[S.users.length%UCOL.length];
   S.users.push({id,name:n.name.slice(0,24),age:n.age,color,animal:n.animal==='cat'?'cat':'dog',mode:n.mode,g:n.g==='m'?'m':'f'});
   const d=blank();d.breed=n.breed;if(n.animal==='cat')d.catBreed=n.cbreed||'tabby';const c=GL.ok&&GL.breedColor?GL.breedColor(n.breed):null;d.fur=c||'rgb(162,106,70)';
   d.dogName=(String(n.pet||'').trim()||sugOf(n.animal,n.off)[0]).slice(0,24);S.data[id]=d;save();
   S.nu=null;S.who=id;S.trick=null;go('home');setTimeout(()=>speak(greet(),'yip'),150)},
 pfNk:e=>{const f=e.dataset.f;nkInto(f==='name'?'pfName':'pfPet',v=>{if(f==='name')U().name=v.slice(0,24);else D().dogName=v.slice(0,24);save()})},
 pfAge:e=>{U().age=+e.dataset.v;save();render()},
 pfG:e=>{U().g=e.dataset.v==='m'?'m':'f';save();render()},
 nuG:e=>{S.nu.g=e.dataset.v==='m'?'m':'f';render()},
 pfMode:e=>{U().mode=e.dataset.v;save();render()},
 pfPick:e=>{D().dogName=e.dataset.v;save();render();speak('יש לי שם! אני '+e.dataset.v+'!','yip')},
 pfMore:()=>{S.pfOff=((S.pfOff||0)+6)%nameList(U().animal).length;render()},
 delAsk:e=>{S.delId=e.dataset.id;if(S.who){S.who=null;S.parentOK=false;S.gate=null}go('parent');setTimeout(()=>{const c=$('#users');if(c)c.scrollIntoView({block:'start'})},30)},
 delNo:()=>{S.delId=null;render()},
 delYes:()=>{const id=S.delId;if(!id)return;const u=S.users.find(x=>x.id===id);S.playGone+=pBox(id).total;S.users=S.users.filter(x=>x.id!==id);delete S.data[id];S.delId=null;save();render();toast((u?u.name:'המשתמש')+' הוסר')}
});
document.addEventListener('input',e=>{const t=e.target,v=t.value;
  if(t.id==='nuName'&&S.nu)S.nu.name=v;else if(t.id==='nuPet'&&S.nu)S.nu.pet=v;
  else if(t.id==='pfName'&&U()&&v.trim()){U().name=v.trim().slice(0,24);save()}
  else if(t.id==='pfPet'&&U()&&v.trim()){D().dogName=v.trim().slice(0,24);save()}});

/* ======== גרסה 15: משחק זיכרון, מסלול מכשולים, אתגר יומי, אוסף גזעים, גיבוי, תעודה, פנייה לפי מגדר ======== */
function X(){const d=D();if(!d.mem)d.mem={w:{e:0,m:0,h:0}};if(!d.obs)d.obs={runs:0,best:0};if(!d.daily)d.daily={day:'',base:null,done:false,streak:0,last:''};if(!Array.isArray(d.unl))d.unl=[];return d}
function addStars(n){if(n>0){D().game.stars+=n;save();chime();award()}}
const gw=(m,f)=>(U()&&U().g==='m')?m:f; /* מילה לפי מגדר: בן, בת */
const GNM=[['ומישהי נוגעת','ומישהו נוגע'],['תני לו חטיף','תן לו חטיף'],['בחרי סימן','בחר סימן'],['בחרי טריק','בחר טריק'],['שאת דואגת','שאתה דואג'],['בחרי שלב','בחר שלב'],['רץ אלייך','רץ אליך']];
function gnd(t){if(S.lang!=='he'||!U()||U().g!=='m')return t;let s=String(t);GNM.forEach(([f,m])=>{if(s.indexOf(f)>=0)s=s.split(f).join(m)});return s}

/* ---------- משחק זיכרון ---------- */
const MMEM=['🐶','🐱','🦴','🐾','🎾','🥣','🏠','🧸','🐩','🐕','🍖','🦮','🪀','🐈','⭐','❤️'];
const MML={e:{n:3,c:3,t:'קל',ic:'🙂'},m:{n:6,c:4,t:'בינוני',ic:'😎'},h:{n:8,c:4,t:'מאתגר',ic:'🏆'}};
function mmStart(lv){const n=MML[lv].n,p=MMEM.slice().sort(()=>Math.random()-.5).slice(0,n);
  S.mm={lv,cards:p.concat(p).sort(()=>Math.random()-.5).map((e,i)=>({i,e,f:false,d:false})),open:[],moves:0,lock:false,done:false,got:0}}
function mmGrid(){const m=S.mm;return m.cards.map(c=>`<button class="mc ${c.f||c.d?'up':''} ${c.d?'ok':''}" data-act="mmFlip" data-i="${c.i}" aria-label="${c.f||c.d?'קלף '+c.e:'קלף הפוך'}">${c.f||c.d?c.e:'❓'}</button>`).join('')}
V.mem=()=>{const m=S.mm,w=X().mem.w;
  if(!m)return `${header('משחק זיכרון')}
  <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">מוצאים זוגות של קלפים. איזו רמה?</div></div>
  <div class="card nu"><div class="grid2">${Object.keys(MML).filter(k=>!lia()||k!=='h').map(k=>`<button class="item" data-act="mmLv" data-v="${k}"><span class="sw">${MML[k].ic}</span><b>${MML[k].t}</b><span class="price">${MML[k].n} זוגות${REC[ageBand()]===k?' · מומלץ':''}${w[k]?' · ניצחונות: '+w[k]:''}</span></button>`).join('')}</div></div>`;
  return `${header('משחק זיכרון')}
  <div class="row" style="justify-content:space-between"><span class="tag">${MML[m.lv].ic} ${MML[m.lv].t}</span><span class="tag">מהלכים: <b id="mmMoves">${m.moves}</b></span></div>
  <div class="mgrid c${MML[m.lv].c}" id="mmGrid">${mmGrid()}</div>
  <div class="bubble ${lia()?'lia':''}" id="mmMsg">${m.done?'':'פותחים שני קלפים. אם הם זהים, הם נשארים פתוחים.'}</div>
  <div class="grid2"><button class="btn ghost" data-act="mmAgain">🔁 משחק חדש</button><button class="btn ghost" data-act="mmMenu">🎚️ שינוי רמה</button></div>`};
function mmFinish(){const m=S.mm;m.done=true;const n=MML[m.lv].n;let st=m.lv==='e'?1:2;if(m.lv==='h'&&m.moves<=Math.ceil(n*1.6))st++;if(m.lv==='m'&&m.moves<=Math.ceil(n*1.5))st++;
  if(lia())st=Math.min(st,2);X().mem.w[m.lv]=(X().mem.w[m.lv]||0)+1;addStars(st);
  const b=$('#mmMsg');if(b)b.innerHTML='🎉 כל הכבוד! מצאתם את כל הזוגות בתוך '+m.moves+' מהלכים. קיבלתם '+'⭐'.repeat(st);
  speak('כל הכבוד! מצאנו את כל הזוגות!','yip');const a=$('.avatar');if(a){a.classList.add('bounce');setTimeout(()=>a.classList.remove('bounce'),1300)}}
Object.assign(A,{
 mmLv:e=>{mmStart(e.dataset.v);render()},
 mmAgain:()=>{if(S.mm){mmStart(S.mm.lv);render()}},
 mmMenu:()=>{S.mm=null;render()},
 mmFlip:e=>{const m=S.mm;if(!m||m.lock||m.done)return;const c=m.cards[+e.dataset.i];if(!c||c.f||c.d)return;click();c.f=true;m.open.push(c);
  if(m.open.length===2){m.moves++;const [a,b]=m.open;
   if(a.e===b.e){a.d=b.d=true;a.f=b.f=false;m.open=[];if(m.cards.every(x=>x.d)){mmGrid&&($('#mmGrid').innerHTML=mmGrid());setTimeout(mmFinish,250)}else chime()}
   else{m.lock=true;setTimeout(()=>{a.f=b.f=false;m.open=[];m.lock=false;const g=$('#mmGrid');if(g)g.innerHTML=mmGrid()},850)}}
  const g=$('#mmGrid');if(g)g.innerHTML=mmGrid();const mv=$('#mmMoves');if(mv)mv.textContent=m.moves}});

/* ---------- מסלול מכשולים ---------- */
const OBS=[{k:'hurdle',e:'🚧',n:'משוכה',sg:'jump'},{k:'poles',e:'🎋',n:'מוטות',sg:'spin'},{k:'tunnel',e:'🕳️',n:'מנהרה',sg:'down'},{k:'table',e:'🪑',n:'שולחן עצירה',sg:'sit'},{k:'bell',e:'🔔',n:'פעמון',sg:'touch'},{k:'hoop',e:'⭕',n:'חישוק',sg:'jump'}];
const OBSG=['jump','spin','down','sit','touch'];
function obStart(){const L={little:3,mid:4,big:5}[ageBand()],pool=OBS.slice().sort(()=>Math.random()-.5);const list=[];for(let i=0;i<L;i++)list.push(pool[i%pool.length]);
  S.ob={list,i:0,err:0,busy:false,hint:ageBand()!=='big',done:false,got:0}}
const sgn=id=>GSIGNS.find(s=>s.id===id);
function obTrack(){const o=S.ob;return o.list.map((x,i)=>`<span class="ob ${i<o.i?'done':i===o.i&&!o.done?'now':''}"><i>${i<o.i||o.done?'✅':x.e}</i>${o.hint||i<o.i?'<small>'+x.n+'</small>':''}</span>`).join('')+`<span class="ob fin"><i>🏁</i></span>`}
function obPrompt(){const o=S.ob,x=o.list[o.i];return o.done?'':('הגענו ל'+x.e+' '+x.n+'! איזו פקודה נותנים?')}
V.course=()=>{const o=S.ob;
  if(!o)return `${header('מסלול מכשולים')}
  <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">${esc(DN())} רץ במסלול! בכל מכשול נותנים פקודה אחרת.</div></div>
  <div class="card"><h3>הפקודות במסלול</h3><ul class="rules">${OBS.slice(0,5).map(x=>`<li><span style="font-size:1.6rem">${x.e}</span>${x.n}: ${sgn(x.sg).n}</li>`).join('')}</ul></div>
  <button class="btn sun big" data-act="obGo">🏁 מתחילים!</button>`;
  return `${header('מסלול מכשולים')}
  <div class="stage" id="stage">${avatar('dog','happy')}</div>
  <div class="otrack" id="obTrack">${obTrack()}</div>
  <div class="bubble ${lia()?'lia':''}" id="obMsg">${obPrompt()}</div>
  <div class="gsigns" id="obCmds">${OBSG.map(id=>{const s=sgn(id);return `<button class="gsign" data-act="obCmd" data-id="${id}"><span class="h">${s.hand}</span><b>${s.n}</b></button>`}).join('')}</div>
  <div class="grid2">${lia()?'':`<button class="btn ghost" data-act="obHint">💡 רמז</button>`}<button class="btn ghost" data-act="obQuit">${o.done?'🔁 מסלול חדש':'↩ יציאה'}</button></div>`};
function obRefresh(){const t=$('#obTrack');if(t)t.innerHTML=obTrack();const m=$('#obMsg');if(m)m.innerHTML=S.ob.msg||obPrompt();
  document.querySelectorAll('#obCmds .gsign').forEach(b=>b.disabled=S.ob.busy||S.ob.done)}
Object.assign(A,{
 obGo:()=>{obStart();render()},
 obHint:()=>{if(S.ob){S.ob.hint=!S.ob.hint;obRefresh()}},
 obQuit:()=>{const d=S.ob&&S.ob.done;S.ob=null;if(GL.ok)GL.stand();if(d){obStart();render()}else go('home')},
 obCmd:e=>{const o=S.ob;if(!o||o.busy||o.done)return;const id=e.dataset.id,x=o.list[o.i],s=sgn(id);o.busy=true;o.msg=null;
  speak(s.cue,null,true);gHand(s);
  if(id===x.sg){const ms=GL.ok?GL.play(id):600;setTimeout(()=>{o.i++;
    if(o.i>=o.list.length){o.done=true;o.busy=false;let st=1+(o.err===0?1:0)+(lia()?0:1);X().obs.runs++;X().obs.best=Math.max(X().obs.best,st);addStars(st);
      o.msg='🏆 מסלול הושלם'+(o.err?' עם '+o.err+' טעויות':' בלי טעויות')+'! קיבלתם '+'⭐'.repeat(st);
      if(GL.ok){GL.stand();setTimeout(()=>GL.play('jump'),500)}speak('כל הכבוד! סיימנו את המסלול!','yip');obRefresh();document.querySelectorAll('#obCmds .gsign').forEach(b=>b.disabled=true)}
    else{if(GL.ok){GL.stand();GL.walk(true);setTimeout(()=>GL.walk(false),900)}o.msg='✅ יופי! ממשיכים...';obRefresh();setTimeout(()=>{o.busy=false;o.msg=null;obRefresh()},1100)}},ms+150);obRefresh()}
  else{o.err++;const ms=GL.ok?GL.play('confused'):600;o.msg='🤔 '+esc(DN())+' לא הבין. ל'+x.e+' '+x.n+' נותנים פקודה אחרת. נסו שוב!';obRefresh();setTimeout(()=>{o.busy=false;if(GL.ok)GL.stand();o.msg=null;obRefresh()},ms+700)}}});

/* ---------- אתגר יומי ---------- */
const trSum=d=>Object.values(d.tricks||{}).reduce((a,b)=>a+(+b||0),0);
const memW=d=>d.mem?(d.mem.w.e||0)+(d.mem.w.m||0)+(d.mem.w.h||0):0;
const snap=d=>({st:d.game.stars,tr:d.translations,q:d.quiz,mw:memW(d),ob:d.obs?d.obs.runs:0,tk:trSum(d),cl:d.clicks});
const DCH=[
 {id:'stars',t:'לצבור 3 כוכבים במשחקים',n:3,v:(d,b)=>d.game.stars-b.st},
 {id:'listen',t:'להקשיב לשני קולות של הכלב',n:2,v:(d,b)=>d.translations-b.tr},
 {id:'mem',t:'לנצח במשחק זיכרון אחד',n:1,v:(d,b)=>memW(d)-b.mw},
 {id:'course',t:'לסיים מסלול מכשולים אחד',n:1,v:(d,b)=>(d.obs?d.obs.runs:0)-b.ob},
 {id:'quiz',t:'להשלים חידון בטיחות אחד',n:1,v:(d,b)=>d.quiz-b.q},
 {id:'trick',t:'לתרגל טריק אחד באילוף',n:1,v:(d,b)=>trSum(d)-b.tk},
 {id:'click',t:'ללחוץ 10 פעמים על הקליקר',n:10,v:(d,b)=>d.clicks-b.cl}];
const dayAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function dailyOf(){const d=X(),k=dayKey();
  if(d.daily.day!==k){d.daily.day=k;d.daily.base=snap(d);d.daily.done=false;save()}
  let h=0;(k+(U()?U().id:'')).split('').forEach(c=>h=(h*31+c.charCodeAt(0))>>>0);const ch=DCH[h%DCH.length];
  const val=Math.min(ch.n,Math.max(0,ch.v(d,d.daily.base)));return {ch,val}}
function dailyCheck(){const d=X(),{ch,val}=dailyOf();if(!d.daily.done&&val>=ch.n){d.daily.done=true;d.daily.streak=(d.daily.last===dayAgo(1))?(d.daily.streak||0)+1:1;d.daily.last=dayKey();addStars(2);toast('🏅 האתגר היומי הושלם! קיבלתם 2 כוכבים')}}
function dailyCard(){const d=X();dailyCheck();const {ch,val}=dailyOf();
  return `<div class="card daily ${d.daily.done?'ok':''}"><h3>📅 האתגר היומי</h3><p>${ch.t}</p>${d.daily.done?`<p class="tag">✅ הושלם! רצף ימים: ${d.daily.streak}</p>`:`<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${ch.n}" aria-valuenow="${val}"><i style="width:${Math.round(val/ch.n*100)}%"></i></div><p class="muted">${val} מתוך ${ch.n}. הפרס: ⭐⭐</p>`}</div>`}

/* ---------- אוסף גזעים שנפתחים בכוכבים ---------- */
const BTHR={poodle:0,lab:10,beagle:18,golden:25,dachshund:35,shihtzu:45};
function bOpen(d,id){return (BTHR[id]||0)<=d.game.stars||(d.unl||[]).includes(id)||(d.breed||'poodle')===id}
V.coll=()=>{const d=X(),cur=d.breed||'poodle',n=BREEDS.filter(b=>bOpen(d,b[0])).length;
  return `${header('אוסף הגזעים')}
  <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">${n} מתוך ${BREEDS.length} גזעים פתוחים. כוכבים פותחים עוד!</div></div>
  <div class="items">${BREEDS.map(([id,nm,em,ds])=>{const op=bOpen(d,id),need=(BTHR[id]||0)-d.game.stars;
   return `<button class="item ${cur===id?'worn':''} ${op?'':'locked'}" data-act="${op?'collPick':'collLock'}" data-id="${id}" data-n="${nm}" data-need="${Math.max(0,need)}"><span class="sw">${op?em:'🔒'}</span><b>${nm}</b><span class="price">${cur===id?'הגזע שלי ✓':op?'פתוח, לחצו כדי לבחור':'עוד '+need+' כוכבים'}</span></button>`}).join('')}</div>
  <p class="muted">כוכבים מרוויחים במשחק האילוף, בזיכרון, במסלול, בחידונים ובאתגר היומי.</p>`};
Object.assign(A,{
 collPick:e=>{const id=e.dataset.id,d=X();if((d.breed||'poodle')===id)return;if(!d.unl.includes(d.breed||'poodle'))d.unl.push(d.breed||'poodle');A.breed(e);},
 collLock:e=>{toast('🔒 עוד '+e.dataset.need+' כוכבים כדי לפתוח את '+e.dataset.n)}});

/* ---------- גיבוי ושחזור ---------- */
function bkText(){save();return JSON.stringify({app:'little-trainers',v:1,at:new Date().toISOString(),state:JSON.parse(localStorage.getItem(KEY)||'{}')})}
Object.assign(A,{
 bkOut:()=>{const t=bkText(),el=$('#bkTxt');if(el){el.value=t;el.hidden=false;el.select()}const m=$('#bkMsg');
  try{navigator.clipboard.writeText(t).then(()=>{if(m)m.textContent='הועתק. אפשר להדביק בהודעה לעצמכם או בקובץ.'},()=>{if(m)m.textContent='סימנו את הטקסט. אפשר להעתיק אותו ידנית.'})}catch(e){if(m)m.textContent='סימנו את הטקסט. אפשר להעתיק אותו ידנית.'}},
 bkIn:()=>{const el=$('#bkIn'),m=$('#bkMsg');let j;try{j=JSON.parse((el&&el.value||'').trim())}catch(e){j=null}
  if(!j||j.app!=='little-trainers'||!j.state||!Array.isArray(j.state.users)||!j.state.data){if(m)m.textContent='הטקסט לא נראה כמו גיבוי של האפליקציה.';return}
  if(!S.bkAsk){S.bkAsk=true;if(m)m.textContent='שחזור מחליף את כל הנתונים במכשיר הזה. ללחוץ שוב כדי לאשר.';return}
  try{localStorage.setItem(KEY,JSON.stringify(j.state))}catch(e){if(m)m.textContent='לא הצלחנו לשמור במכשיר.';return}
  S.bkAsk=false;S.who=null;load();S.parentOK=false;go('login');toast('הנתונים שוחזרו')}});

/* ---------- תעודת הצטיינות ---------- */
const TIERS=[[50,'אלוף האילוף','אלופת האילוף'],[20,'מאלף מומחה','מאלפת מומחית'],[5,'מאלף מנוסה','מאלפת מנוסה'],[0,'מאלף מתחיל','מאלפת מתחילה']];
function certInfo(){const d=D(),st=d.game.stars,t=TIERS.find(x=>st>=x[0]);const date=new Date().toLocaleDateString(S.lang==='en'?'en-GB':'he-IL',{day:'numeric',month:'long',year:'numeric'});
  return {name:UNAME(),dog:DN(),st,title:gw(t[1],t[2]),date,badges:d.badges.length}}
V.cert=()=>{const c=certInfo();return `${header('תעודה')}
  <div class="cert" id="cert"><div class="cr1">🏅</div><h2>תעודת הצטיינות</h2><p>מוענקת ל</p><div class="cn">${esc(c.name)}</div><p class="cs">${c.title}</p><p>על אילוף ${esc(c.dog)} · ⭐ ${c.st} כוכבי אילוף</p><p class="muted">${c.date}</p><div class="cr1">🐶🐱</div><small>מאלפים קטנים</small></div>
  <div class="grid2"><button class="btn good" data-act="certSave">📸 שמירה כתמונה</button><button class="btn ghost" data-act="home">🏠 חזרה</button></div>
  <div id="certOut"></div><p class="muted">אפשר גם לצלם מסך ולשלוח לסבא וסבתא.</p>`};
A.certSave=()=>{const c=certInfo(),W=900,H=1200,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),col=(U()&&U().color)||'#2e7cf6';
  x.fillStyle='#fffdf7';x.fillRect(0,0,W,H);x.lineWidth=18;x.strokeStyle=col;x.strokeRect(30,30,W-60,H-60);x.lineWidth=4;x.strokeStyle='#f5b800';x.strokeRect(62,62,W-124,H-124);
  x.direction=S.lang==='en'?'ltr':'rtl';x.textAlign='center';x.fillStyle='#1b2a4e';const T=t=>tr(nkStrip(t));
  x.font='120px serif';x.fillText('🏅',W/2,230);x.font='bold 74px sans-serif';x.fillText(T('תעודת הצטיינות'),W/2,360);
  x.font='44px sans-serif';x.fillText(T('מוענקת ל'),W/2,450);x.fillStyle=col;x.font='bold 96px sans-serif';x.fillText(nkStrip(tr(c.name)),W/2,580);
  x.fillStyle='#1b2a4e';x.font='bold 54px sans-serif';x.fillText(T(c.title),W/2,690);x.font='42px sans-serif';x.fillText(T('על אילוף ')+nkStrip(tr(c.dog)),W/2,790);x.fillText('⭐ '+c.st+' '+T('כוכבי אילוף'),W/2,860);
  x.fillStyle='#5b6b8c';x.font='36px sans-serif';x.fillText(c.date,W/2,940);x.font='110px serif';x.fillText('🐶🐱',W/2,1070);x.font='bold 36px sans-serif';x.fillText(S.lang==='en'?'Little Trainers':'מאלפים קטנים',W/2,1130);
  let url='';try{url=cv.toDataURL('image/png')}catch(e){}const o=$('#certOut');
  if(o&&url){o.innerHTML='<img class="certimg" alt="" src="'+url+'"><p class="muted" data-notr="1"></p>';const p=o.querySelector('p');p.textContent=S.lang==='en'?'Press and hold the picture to save it.':'לחיצה ארוכה על התמונה שומרת אותה.'}
  try{if(navigator.canShare){cv.toBlob(b=>{const f=new File([b],'certificate.png',{type:'image/png'});if(navigator.canShare({files:[f]}))navigator.share({files:[f]}).catch(()=>{})})}}catch(e){}};

/* ======== גרסה 16: כרטיסיות לימוד, גזעי חתולים, צביעה, אלבום, הכלב שלנו, סטטיסטיקות, כמה שיחקנו, אודות, מסך הבית ======== */
function Y(){const d=D();if(!d.learn)d.learn={seen:{},best:{}};if(!Array.isArray(d.album))d.album=[];return d}

/* ---------- גזעי חתולים ---------- */
const CATBR=[['tabby','ג׳ינג׳י מפוספס','🐈','פרווה כתומה עם פסים, הכי נפוץ בשכונה'],['siamese','סיאמי','🐈','גוף בהיר, פנים ורגליים כהים, עיניים כחולות'],['black','חתול שחור','🐈‍⬛','שחור מבריק, עיניים צהובות'],['grey','בריטי קצר שיער','🐱','אפור-כחלחל, עגלגל ורגוע, עיניים כתומות'],['persian','פרסי','🐱','פרווה לבנה וארוכה, אוהב שקט'],['tuxedo','טוקסידו','🐈‍⬛','שחור עם חזה ורגליים לבנים, כמו חליפה'],['calico','קליקו','🐱','שלושה צבעים: לבן, כתום ושחור'],['mainecoon','מיין קון','🦁','ענק ושעיר, עם ציציות באוזניים']];
function catPick(){return `<div class="chips">${CATBR.map(([id,n,e])=>`<button class="chip ${(S.catBreed||'tabby')===id?'on':''}" data-act="catBr" data-id="${id}">${e} ${n}</button>`).join('')}</div>`}
A.catBr=e=>{S.catBreed=e.dataset.id;save();if(GL.ok&&GL.setCatBreed)GL.setCatBreed(S.catBreed);document.querySelectorAll('[data-act=catBr]').forEach(b=>b.classList.toggle('on',b.dataset.id===S.catBreed));const c=CATBR.find(x=>x[0]===S.catBreed);if(c)speak(c[1]+'. '+c[3],null,true)};

/* ---------- כרטיסיות לימוד ---------- */
const LCAT=[['dogs','🐕','כלבים'],['cats','🐈','חתולים'],['sounds','🔊','צלילים'],['body','🐾','שפת גוף']];
const LC=[
 {c:'dogs',id:'poodle',br:'poodle',e:'🐩',t:'פודל',s:'לפודל יש תלתלים רכים. הוא חכם מאוד.',l:'הפודל הוא אחד הכלבים החכמים בעולם. הפרווה שלו מתולתלת וכמעט לא נושרת, ולכן מסתפרים אצל מספרה לכלבים. פודל מיני שוקל בערך 5 קילו.',q:['למה מסתפרים פודל?','כי הפרווה שלו מתולתלת וגדלה כל הזמן','כי הוא לא אוהב מים']},
 {c:'dogs',id:'lab',br:'lab',e:'🦮',t:'לברדור',s:'הלברדור אוהב לשחות ולשחק בכדור.',l:'לברדור הוא כלב חברותי ושמח שאוהב מים וכדורים. בגלל שהוא רגוע ולומד מהר, הרבה כלבי נחייה לעיוורים הם לברדורים.',q:['מה הרבה לברדורים עושים?','עוזרים לעיוורים ללכת בבטחה','שומרים על כבשים בהרים']},
 {c:'dogs',id:'golden',br:'golden',e:'🐕',t:'גולדן רטריבר',s:'לגולדן יש פרווה זהובה וארוכה.',l:'גולדן רטריבר נקרא כך כי הוא "מחזיר" דברים, כמו כדור או מקל. יש לו פרווה זהובה עם נוצות ארוכות, וצריך לברש אותה הרבה.',q:['למה קוראים לו רטריבר?','כי הוא אוהב להחזיר דברים','כי הוא ישן הרבה']},
 {c:'dogs',id:'beagle',br:'beagle',e:'🐕',t:'ביגל',s:'לביגל יש אוזניים ארוכות ואף חזק.',l:'ביגל הוא כלב ציד קטן עם אף מצוין. בשדות תעופה יש ביגלים שמריחים מזוודות ומוצאים אוכל שאסור להכניס. לרוב יש לו שלושה צבעים: לבן, חום ושחור, וקצה הזנב לבן.',q:['במה הביגל טוב במיוחד?','להריח','לשחות מתחת למים']},
 {c:'dogs',id:'dachshund',br:'dachshund',e:'🌭',t:'תחש',s:'לתחש יש גוף ארוך ורגליים קצרות.',l:'התחש נולד בגרמניה כדי להיכנס למחילות של גיריות. בגלל הגוף הארוך קוראים לו גם "כלב נקניקייה". עוזרים לו לא לקפוץ מגבוה, כדי לשמור על הגב.',q:['למה הגוף של התחש ארוך?','כדי להיכנס למחילות','כדי לשחות מהר']},
 {c:'dogs',id:'shihtzu',br:'shihtzu',e:'🐶',t:'שיצו',s:'לשיצו יש שיער ארוך וקוקו.',l:'שיצו הוא כלב קטן מסין. השיער שלו ארוך עד הרצפה, ולכן אוספים לו קוקו כדי שיראה. הוא אוהב לשבת על הברכיים.',q:['מאיפה מגיע השיצו?','מסין','מאוסטרליה']},
 {c:'dogs',id:'nose',e:'👃',t:'האף של הכלב',s:'כלב מריח הרבה יותר טוב מאיתנו.',l:'האף של הכלב חזק פי אלפי מונים מהאף שלנו. דרך הריח הוא יודע מי עבר כאן, מה אכלו ואפילו אם אנחנו שמחים.',q:['מה החוש הכי חזק של הכלב?','ריח','טעם']},
 {c:'cats',id:'tabby',cat:'tabby',e:'🐈',t:'ג׳ינג׳י מפוספס',s:'חתול כתום עם פסים.',l:'רוב החתולים הג׳ינג׳ים המפוספסים הם זכרים. לכל אחד יש סימן שנראה כמו האות M על המצח.',q:['איזה סימן יש על המצח של חתול מפוספס?','צורה של האות M','כוכב']},
 {c:'cats',id:'siamese',cat:'siamese',e:'🐈',t:'סיאמי',s:'חתול בהיר עם פנים כהים ועיניים כחולות.',l:'גורים סיאמים נולדים לבנים לגמרי. הצבע הכהה מופיע אחר כך באוזניים, בפנים, ברגליים ובזנב, במקומות הקרים של הגוף. הם מדברים הרבה ביללות.',q:['איך נראה גור סיאמי כשהוא נולד?','לבן לגמרי','שחור לגמרי']},
 {c:'cats',id:'black',cat:'black',e:'🐈‍⬛',t:'חתול שחור',s:'חתול שחור עם עיניים צהובות.',l:'יש אנשים שחושבים שחתול שחור מביא מזל רע, אבל זו רק אמונה. בהרבה מקומות דווקא חושבים שהוא מביא מזל טוב.',q:['חתול שחור מביא מזל רע?','לא, זו רק אמונה','כן, תמיד']},
 {c:'cats',id:'grey',cat:'grey',e:'🐱',t:'בריטי קצר שיער',s:'חתול אפור, עגלגל ורגוע.',l:'הבריטי קצר השיער נראה כמו דובי. הוא רגוע ולא אוהב שמרימים אותו הרבה. מעדיף לשבת לידכם.',q:['מה הבריטי מעדיף?','לשבת לידכם בשקט','שירימו אותו כל הזמן']},
 {c:'cats',id:'persian',cat:'persian',e:'🐱',t:'פרסי',s:'חתול עם פרווה לבנה וארוכה.',l:'לחתול הפרסי יש פרווה ארוכה מאוד ופנים שטוחים. צריך לברש אותו כל יום, אחרת הפרווה מסתבכת.',q:['כל כמה זמן מברשים חתול פרסי?','כל יום','פעם בשנה']},
 {c:'cats',id:'tuxedo',cat:'tuxedo',e:'🐈‍⬛',t:'טוקסידו',s:'חתול שחור עם חזה לבן, כמו חליפה.',l:'טוקסידו הוא לא גזע אלא צבע: שחור עם חזה, רגליים ולפעמים שפם לבנים. נראה כמו מישהו בחליפה חגיגית.',q:['טוקסידו הוא גזע?','לא, זה צבע פרווה','כן, גזע מיפן']},
 {c:'cats',id:'calico',cat:'calico',e:'🐱',t:'קליקו',s:'חתולה בשלושה צבעים: לבן, כתום ושחור.',l:'קליקו הוא צבע ולא גזע. כמעט כל חתולי הקליקו הם נקבות, כי הצבעים הכתום והשחור עוברים בתורשה בצורה מיוחדת. לכל קליקו יש כתמים אחרים.',q:['רוב חתולי הקליקו הם...','נקבות','זכרים']},
 {c:'cats',id:'mainecoon',cat:'mainecoon',e:'🦁',t:'מיין קון',s:'אחד מגזעי החתולים הכי גדולים.',l:'מיין קון הגיע ממדינת מיין בארצות הברית. יש לו פרווה עבה שמגינה מקור ומים, זנב שעיר וציציות שיער בקצות האוזניים. למרות הגודל, הוא חתול עדין ורגוע.',q:['מה מיוחד באוזניים של מיין קון?','יש להן ציציות שיער בקצה','הן נופלות למטה']},
 {c:'sounds',id:'bark',e:'🗣️',t:'נביחה',s:'כלב נובח כדי להגיד משהו.',l:'נביחה יכולה להגיד הרבה דברים: "מישהו בדלת!", "בואו נשחק!" או "אני לבד". נביחות מהירות וגבוהות הן בדרך כלל התרגשות.',q:['מה נביחה מהירה וגבוהה אומרת בדרך כלל?','התרגשות','שהכלב ישן']},
 {c:'sounds',id:'growl',e:'😠',t:'נהמה',s:'נהמה אומרת: תתרחקו ממני.',l:'נהמה היא אזהרה. הכלב אומר "לא נוח לי". כששומעים נהמה מתרחקים לאט ולא נוגעים בכלב.',q:['מה עושים כשכלב נוהם?','מתרחקים לאט','מחבקים אותו חזק']},
 {c:'sounds',id:'whine',e:'🥺',t:'יבבה',s:'יבבה אומרת: אני צריך משהו.',l:'כלב מייבב כשהוא רוצה משהו: לצאת, לאכול, או כשהוא מתגעגע. לפעמים גם כשכואב לו, ואז מספרים למבוגר.',q:['למי מספרים אם הכלב מייבב הרבה?','למבוגר','לאף אחד']},
 {c:'sounds',id:'purr',e:'😺',t:'גרגור',s:'חתול מגרגר כשהוא נהנה.',l:'גרגור הוא רעש רוטט ונעים. בדרך כלל החתול רגוע ונהנה, למשל כשמלטפים אותו בעדינות.',q:['מה גרגור אומר בדרך כלל?','החתול רגוע ונהנה','החתול כועס']},
 {c:'sounds',id:'hiss',e:'🙀',t:'נשיפה',s:'נשיפה אומרת: אני מפחד, אל תתקרבו.',l:'כשחתול נושף ומראה שיניים הוא מפחד או כועס. נותנים לו מקום ולא מנסים להרים אותו.',q:['חתול נושף. מה עושים?','נותנים לו מקום','מרימים אותו']},
 {c:'sounds',id:'meow',e:'🐱',t:'מיאו',s:'חתולים אומרים מיאו בעיקר לבני אדם.',l:'חתולים בוגרים כמעט לא מייללים מיאו זה לזה. את המיאו הם שומרים בשבילנו, כדי לבקש אוכל, ליטוף או פתיחת דלת.',q:['למי חתולים אומרים בעיקר מיאו?','לבני אדם','לחתולים אחרים']},
 {c:'body',id:'wag',e:'🐕',t:'כשכוש זנב',s:'זנב מכשכש רחב ורך הוא כלב שמח.',l:'כשכוש רחב ורך עם גוף רגוע הוא שמחה. אבל זנב גבוה ונוקשה שזז מהר יכול להיות התרגשות או מתח, אז מסתכלים על כל הגוף.',q:['על מה מסתכלים חוץ מהזנב?','על כל הגוף','רק על הצבע']},
 {c:'body',id:'tuck',e:'😨',t:'זנב בין הרגליים',s:'זנב בין הרגליים הוא כלב מפוחד.',l:'כלב שמכניס את הזנב בין הרגליים, מוריד אוזניים ומתכווץ מפחד. מדברים בשקט ונותנים לו מרחק.',q:['כלב עם זנב בין הרגליים מרגיש...','פחד','שמחה']},
 {c:'body',id:'bow',e:'🙇',t:'קידת משחק',s:'כלב מוריד את החזה ומרים את הטוסיק: בוא נשחק!',l:'קידת משחק היא הזמנה. הכלב מוריד את הרגליים הקדמיות, משאיר את הטוסיק למעלה ומכשכש. הוא אומר: זה רק משחק!',q:['מה אומרת קידת משחק?','בוא נשחק','אני רעב']},
 {c:'body',id:'yawn',e:'🥱',t:'פיהוק',s:'כלב מפהק גם כשהוא לחוץ, לא רק עייף.',l:'כלבים מפהקים כדי להירגע. אם הכלב מפהק כשמחבקים אותו או כשיש רעש, אולי לא נוח לו.',q:['למה כלבים מפהקים?','גם כדי להירגע כשלחוץ','רק כשהם רעבים']},
 {c:'body',id:'blink',e:'😌',t:'מצמוץ איטי של חתול',s:'חתול שעוצם עיניים לאט אומר: אני סומך עליך.',l:'מצמוץ איטי הוא כמו חיוך של חתולים. אפשר למצמץ לאט בחזרה, ולפעמים החתול עונה.',q:['מה אומר מצמוץ איטי של חתול?','אני סומך עליך','אני רוצה לברוח']},
 {c:'body',id:'puff',e:'🙀',t:'זנב מנופח',s:'זנב מנופח כמו מברשת הוא חתול מבוהל.',l:'כשחתול נבהל השיער שלו נעמד, והזנב נראה כמו מברשת. כך הוא נראה גדול יותר. משאירים אותו להירגע.',q:['זנב מנופח אומר שהחתול...','נבהל','רוצה לאכול']}];
const lcs=c=>LC.filter(x=>x.c===c);
function learnCard(){const L=S.lr,list=lcs(L.c),k=list[L.i];return k}
V.learn=()=>{const L=S.lr||(S.lr={c:'dogs',i:0,quiz:null});const d=Y();
  if(L.quiz)return learnQuiz();
  const list=lcs(L.c),k=list[L.i],is3=!!(k.br||k.cat);d.learn.seen[k.id]=1;save();
  return `${header('כרטיסיות לימוד')}
  <div class="seg wrap" role="group" aria-label="נושא">${LCAT.map(([id,e,n])=>`<button data-act="lrCat" data-v="${id}" aria-pressed="${L.c===id}">${e} ${n}</button>`).join('')}</div>
  <div class="card lcard">${is3?`<div class="avatarWrap">${avatar(k.cat?'cat':'dog','happy')}</div>`:`<div class="lemo">${k.e}</div>`}
   <h2>${k.t}</h2><p>${ageBand()==='little'?k.s:k.l}</p></div>
  <div class="row" style="justify-content:space-between"><button class="btn ghost" data-act="lrNav" data-v="-1" ${L.i===0?'disabled':''}>→ הקודם</button><span class="tag">${L.i+1} / ${list.length}</span><button class="btn ghost" data-act="lrNav" data-v="1" ${L.i===list.length-1?'disabled':''}>הבא ←</button></div>
  <button class="btn sun big" data-act="lrQuiz">🧠 חידון על ${LCAT.find(x=>x[0]===L.c)[2]}</button>
  ${d.learn.best[L.c]!=null?`<p class="muted" style="text-align:center">השיא שלך בחידון הזה: ${d.learn.best[L.c]}</p>`:''}`};
function learnQuiz(){const Q=S.lr.quiz,q=Q.qs[Q.i];
  if(Q.i>=Q.qs.length)return `${header('חידון')}
  <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">ענית נכון על ${Q.ok} מתוך ${Q.qs.length}. ${Q.got?'קיבלת '+'⭐'.repeat(Q.got):'אפשר לנסות שוב!'}</div></div>
  <div class="grid2"><button class="btn" data-act="lrQuiz">🔁 עוד חידון</button><button class="btn ghost" data-act="lrBack">📚 לכרטיסיות</button></div>`;
  return `${header('חידון')}
  <div class="qdots">${Q.qs.map((x,i)=>`<i class="${i<Q.i?'on':''}"></i>`).join('')}</div>
  <div class="card"><div class="lemo sm">${q.e}</div><h3>${q.q}</h3><div class="opts">${q.o.map((o,i)=>`<button class="btn ${Q.ans==null?'ghost':o===q.r?'good':Q.ans===i?'warn':'ghost'}" data-act="lrAns" data-i="${i}" ${Q.ans!=null?'disabled':''}>${o}</button>`).join('')}</div>
  ${Q.ans!=null?`<p>${q.o[Q.ans]===q.r?'✅ נכון!':'❌ התשובה הנכונה: '+q.r}</p><button class="btn sun" data-act="lrNext">הבא ←</button>`:''}</div>`}
Object.assign(A,{
 lrCat:e=>{S.lr={c:e.dataset.v,i:0,quiz:null};render();const k=learnCard();if(lia())setTimeout(()=>speak(k.t+'. '+k.s,null,true),200)},
 lrNav:e=>{const L=S.lr,n=lcs(L.c).length;L.i=Math.max(0,Math.min(n-1,L.i+(+e.dataset.v)));render();const k=learnCard();if(lia())setTimeout(()=>speak(k.t+'. '+k.s,null,true),200)},
 lrQuiz:()=>{const L=S.lr,n={little:3,mid:4,big:5}[ageBand()],pool=lcs(L.c).slice().sort(()=>Math.random()-.5).slice(0,n);
  L.quiz={i:0,ok:0,ans:null,got:0,qs:pool.map(k=>{const o=lia()?[k.q[1],k.q[2]]:[k.q[1],k.q[2],(LC.filter(x=>x.c!==L.c)[Math.floor(Math.random()*8)]||k).q[1]];return {e:k.e,q:k.q[0],r:k.q[1],o:o.sort(()=>Math.random()-.5)}})};render();speak(L.quiz.qs[0].q,null,true)},
 lrAns:e=>{const Q=S.lr.quiz;if(!Q||Q.ans!=null)return;Q.ans=+e.dataset.i;const q=Q.qs[Q.i],ok=q.o[Q.ans]===q.r;if(ok){Q.ok++;chime()}render();speak(ok?'נכון!':'התשובה הנכונה: '+q.r,ok?'yip':null,!ok)},
 lrNext:()=>{const Q=S.lr.quiz;Q.i++;Q.ans=null;if(Q.i>=Q.qs.length){const d=Y(),c=S.lr.c,n=Q.qs.length;d.learn.best[c]=Math.max(d.learn.best[c]||0,Q.ok);Q.got=Q.ok===n?2:Q.ok>=Math.ceil(n/2)?1:0;addStars(Q.got);save();render();speak(Q.got?'כל הכבוד!':'כמעט! ננסה שוב?','yip');return}render();speak(Q.qs[Q.i].q,null,true)},
 lrBack:()=>{S.lr.quiz=null;render()}});

/* ---------- מצב צביעה ---------- */
const PAL=['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#a855f7','#ec4899','#8b5a2b','#111827','#9ca3af','#ffffff'];
const PICS={
 dog:{n:'כלב',vb:'0 0 320 260',r:[['sky','rect x="0" y="0" width="320" height="190"'],['ground','rect x="0" y="190" width="320" height="70"'],['sun','circle cx="270" cy="45" r="26"'],
  ['tail','path d="M70 120 Q35 95 45 60 Q60 90 82 108 Z"'],['legb1','rect x="88" y="150" width="22" height="60" rx="10"'],['legb2','rect x="190" y="150" width="22" height="60" rx="10"'],
  ['body','ellipse cx="150" cy="135" rx="85" ry="45"'],['spot','ellipse cx="125" cy="120" rx="25" ry="16"'],['leg1','rect x="105" y="158" width="24" height="62" rx="11"'],['leg2','rect x="205" y="158" width="24" height="62" rx="11"'],
  ['collar','rect x="208" y="98" width="40" height="14" rx="6" transform="rotate(-20 228 105)"'],['head','circle cx="245" cy="78" r="42"'],['ear','path d="M222 52 Q200 60 205 110 Q228 100 235 62 Z"'],
  ['muzzle','ellipse cx="275" cy="92" rx="22" ry="16"'],['nose','ellipse cx="292" cy="86" rx="8" ry="6"'],['bone','path d="M30 215 h60 a8 8 0 1 1 6 12 a8 8 0 1 1 -6 12 h-60 a8 8 0 1 1 -6 -12 a8 8 0 1 1 6 -12 Z"']],
  x:'<circle cx="252" cy="70" r="5" fill="#111"/><path d="M262 104 q10 6 20 0" fill="none" stroke="#111" stroke-width="3"/>'},
 cat:{n:'חתול',vb:'0 0 320 260',r:[['sky','rect x="0" y="0" width="320" height="190"'],['ground','rect x="0" y="190" width="320" height="70"'],['moon','circle cx="50" cy="45" r="24"'],
  ['tail','path d="M90 170 Q40 160 50 100 Q60 70 75 85 Q65 110 75 135 Q85 150 105 150 Z"'],['body','ellipse cx="150" cy="160" rx="70" ry="48"'],['belly','ellipse cx="170" cy="172" rx="30" ry="26"'],
  ['leg1','rect x="118" y="185" width="22" height="40" rx="10"'],['leg2','rect x="172" y="185" width="22" height="40" rx="10"'],['ear1','path d="M175 60 L185 18 L208 52 Z"'],['ear2','path d="M228 52 L250 18 L258 62 Z"'],
  ['head','circle cx="216" cy="88" r="44"'],['collar','rect x="190" y="125" width="52" height="12" rx="6"'],['nose','path d="M210 96 h12 l-6 8 Z"'],['yarn','circle cx="270" cy="210" r="24"']],
  x:'<circle cx="200" cy="82" r="6" fill="#111"/><circle cx="232" cy="82" r="6" fill="#111"/><path d="M216 104 q-8 8 -16 2 M216 104 q8 8 16 2 M190 100 h-28 M190 106 l-26 6 M242 100 h28 M242 106 l26 6" fill="none" stroke="#111" stroke-width="2.5"/>'}};
function colSVG(){const C=S.col,P=PICS[C.pic],f=C.f[C.pic]||(C.f[C.pic]={});
  return `<svg class="csvg" viewBox="${P.vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="דף צביעה">${P.r.map(([k,sh])=>{const t=sh.split(' ')[0];return `<${sh} fill="${f[k]||'#ffffff'}" stroke="#1f2937" stroke-width="3" stroke-linejoin="round" data-rg="${k}"/>`}).join('')}${P.x}</svg>`}
V.color=()=>{const C=S.col||(S.col={pic:'dog',c:PAL[0],f:{}});
  return `${header('מצב צביעה')}
  <div class="seg" role="group" aria-label="תמונה"><button data-act="colPic" data-v="dog" aria-pressed="${C.pic==='dog'}">🐕 כלב</button><button data-act="colPic" data-v="cat" aria-pressed="${C.pic==='cat'}">🐈 חתול</button></div>
  <div class="card cwrap" id="colWrap">${colSVG()}</div>
  <div class="pal" role="group" aria-label="צבעים">${PAL.map(c=>`<button class="pc ${C.c===c?'on':''}" data-act="colC" data-c="${c}" style="background:${c}" aria-label="צבע ${c}"></button>`).join('')}</div>
  <p class="muted" style="text-align:center">בוחרים צבע ולוחצים על חלק בציור.</p>
  <div class="grid2"><button class="btn ghost" data-act="colClear">🧽 מתחילים מחדש</button><button class="btn good" data-act="colSave">🖼️ לאלבום</button></div>`};
document.addEventListener('click',e=>{const r=e.target.closest&&e.target.closest('[data-rg]');if(!r||!S.col||S.screen!=='color')return;const f=S.col.f[S.col.pic]||(S.col.f[S.col.pic]={});f[r.dataset.rg]=S.col.c;r.setAttribute('fill',S.col.c);click()});
Object.assign(A,{
 colPic:e=>{S.col.pic=e.dataset.v;render()},
 colC:e=>{S.col.c=e.dataset.c;document.querySelectorAll('.pc').forEach(b=>b.classList.toggle('on',b.dataset.c===S.col.c))},
 colClear:()=>{S.col.f[S.col.pic]={};render()},
 colSave:()=>{const svg=$('.csvg');if(!svg)return;const x=new XMLSerializer().serializeToString(svg),img=new Image();
  img.onload=()=>{const c=document.createElement('canvas');c.width=640;c.height=520;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,640,520);g.drawImage(img,0,0,640,520);albumAdd(c,'color')};
  img.onerror=()=>toast('לא הצלחנו לשמור את הציור');img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(x)}});

/* ---------- אלבום תמונות ---------- */
function shrink(src,max){const c=document.createElement('canvas'),s=Math.min(1,max/Math.max(src.width,src.height));c.width=Math.round(src.width*s);c.height=Math.round(src.height*s);c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c}
function albumAdd(canvas,kind){const d=Y();let url='';try{url=shrink(canvas,360).toDataURL('image/jpeg',.78)}catch(e){}if(!url){toast('לא הצלחנו לשמור את התמונה');return}
  d.album.unshift({img:url,d:dayKey(),k:kind});let cut=false;if(d.album.length>12){d.album.length=12;cut=true}
  if(!save()){d.album.shift();toast('אין מספיק מקום במכשיר. מחקו תמונה ישנה מהאלבום.');return}
  chime();toast(cut?'נשמר באלבום. התמונה הישנה ביותר נמחקה, יש מקום ל־12.':'נשמר באלבום 🖼️')}
function petShot(){const raw=GL.ok&&GL.snap?GL.snap():null;if(!raw){toast('הצילום לא זמין במכשיר הזה');return}
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=420;const g=c.getContext('2d'),col=(U()&&U().color)||'#2e7cf6';
   const gr=g.createLinearGradient(0,0,0,420);gr.addColorStop(0,'#fff7e6');gr.addColorStop(1,'#e3efff');g.fillStyle=gr;g.fillRect(0,0,420,420);
   g.drawImage(img,10,0,400,400);g.lineWidth=14;g.strokeStyle=col;g.strokeRect(7,7,406,406);
   g.fillStyle='#1b2a4e';g.font='bold 22px sans-serif';g.textAlign='center';g.direction=S.lang==='en'?'ltr':'rtl';g.fillText(nkStrip(tr(DN()))+' · '+new Date().toLocaleDateString(S.lang==='en'?'en-GB':'he-IL'),210,398);
   albumAdd(c,'pet');const a=$('.avatar');if(a){a.classList.add('bounce');setTimeout(()=>a.classList.remove('bounce'),900)}};img.src=raw}
V.album=()=>{const d=Y(),v=S.albV;
  return `${header('האלבום שלי')}
  <div class="avatarWrap">${avatar('dog','happy')}</div>
  <button class="btn sun big" data-act="petShot">📸 צילום של ${esc(DN())}</button>
  ${v!=null&&d.album[v]?`<div class="card"><img class="certimg" alt="תמונה מהאלבום" src="${d.album[v].img}"><p class="muted">${d.album[v].d}</p><div class="grid2"><button class="btn ghost" data-act="albClose">סגירה</button><button class="btn warn" data-act="albDel">🗑️ מחיקה</button></div></div>`:''}
  ${d.album.length?`<div class="agrid">${d.album.map((p,i)=>`<button class="athumb" data-act="albView" data-i="${i}" aria-label="תמונה ${i+1}"><img alt="" src="${p.img}"></button>`).join('')}</div><p class="muted">${d.album.length} מתוך 12 תמונות. התמונות נשמרות רק במכשיר הזה. לחיצה ארוכה על תמונה גדולה שומרת אותה.</p>`:`<p class="muted" style="text-align:center">האלבום ריק. מלבישים את ${esc(DN())} בארון הבגדים ומצלמים!</p>`}`};
Object.assign(A,{petShot,albView:e=>{S.albV=+e.dataset.i;render()},albClose:()=>{S.albV=null;render()},albDel:()=>{const d=Y();if(S.albV!=null){d.album.splice(S.albV,1);S.albV=null;save();render()}}});

/* ---------- הכלב האמיתי שלנו ---------- */
function realOf(){if(!S.real||typeof S.real!=='object')S.real={name:'',photo:'',breed:'',bday:'',toy:'',treat:'',fact:''};return S.real}
const RF=[['name','איך קוראים לו?','למשל: שוקו'],['breed','איזה גזע?','למשל: פודל מיני'],['bday','מתי יום ההולדת?','למשל: 5 במאי'],['toy','הצעצוע האהוב','למשל: כדור טניס'],['treat','החטיף האהוב','למשל: גזר'],['fact','משהו מצחיק עליו','למשל: נובח על שואב האבק']];
V.real=()=>{const R=realOf();
  return `${header('הכלב האמיתי שלנו')}
  <div class="card real">${R.photo?`<img class="rphoto" alt="${esc(R.name||'הכלב שלנו')}" src="${R.photo}">`:`<div class="lemo">🐶</div>`}
   <label class="btn ghost" for="realPh">📷 ${R.photo?'החלפת תמונה':'הוספת תמונה'}</label><input class="file" id="realPh" type="file" accept="image/*" aria-label="תמונה של הכלב שלנו">
   ${R.photo?`<button class="btn ghost" data-act="realFur">🎨 צבע הדמות לפי התמונה</button>`:''}</div>
  <div class="card">${RF.map(([k,l,ph])=>`<label class="rf"><b>${l}</b><input id="rf_${k}" data-rf="${k}" maxlength="40" value="${esc(R[k]||'')}" placeholder="${ph}" autocomplete="off"></label>`).join('')}
   <p class="muted">הכרטיס משותף לכל המשפחה ונשמר רק במכשיר הזה.</p></div>`};
document.addEventListener('input',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.rf;if(!k)return;realOf()[k]=String(e.target.value||'').slice(0,40);clearTimeout(V.real.t);V.real.t=setTimeout(save,400)});
document.addEventListener('change',e=>{const t=e.target;if(t.id!=='realPh'||!t.files[0])return;const f=t.files[0],img=new Image(),u=URL.createObjectURL(f);
  img.onload=()=>{const s=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=360;c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,360,360);
   const R=realOf(),old=R.photo;R.photo=c.toDataURL('image/jpeg',.8);URL.revokeObjectURL(u);if(!save()){R.photo=old;toast('אין מספיק מקום במכשיר לתמונה');return}render();toast('התמונה נשמרה במכשיר')};
  img.onerror=()=>toast('לא הצלחנו לקרוא את התמונה');img.src=u;t.value=''});
A.realFur=()=>{const R=realOf();if(!R.photo)return;try{const b=atob(R.photo.split(',')[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);avatarFromPhoto(new Blob([a],{type:'image/jpeg'}),'🎨 הפרווה של הדמות עודכנה לפי התמונה')}catch(e){toast('לא הצלחנו לקרוא את התמונה')}};

/* ---------- סטטיסטיקות להורים ---------- */
function weekBars(u){const p=pBox(u.id),ds=[...Array(7)].map((_,i)=>dayAgo(6-i)),v=ds.map(k=>p.days[k]||0),mx=Math.max(60000,...v);
  return `<div class="wbars" role="img" aria-label="זמן משחק בשבוע האחרון">${ds.map((k,i)=>`<div class="wb"><i style="height:${Math.round(v[i]/mx*100)}%;background:${u.color}"></i><small>${Math.round(v[i]/60000)}</small><span>${k.slice(8)}/${k.slice(5,7)}</span></div>`).join('')}</div><p class="muted">דקות משחק בכל יום, שבוע אחרון</p>`}
function statsOf(u){const d=S.data[u.id]||blank(),k=d.game.k||{},kn=GSIGNS.filter(s=>(k[s.id]||0)>=3),weak=GSIGNS.filter(s=>(k[s.id]||0)>0&&(k[s.id]||0)<3),best=(d.safe&&d.safe.best)||{};
  const learnSeen=d.learn?Object.keys(d.learn.seen).length:0;
  return `<div class="card"><h3><span class="big-dot sm" style="background:${u.color}">${esc(INI(u))}</span> ${esc(u.name)}</h3>${weekBars(u)}
   <div class="sgrid"><div><b>${d.game.stars}</b><span>כוכבים</span></div><div><b>${d.badges.length}</b><span>תגים</span></div><div><b>${kn.length}</b><span>סימנים שנלמדו</span></div><div><b>${d.translations}</b><span>הקשבות</span></div>
    <div><b>${d.mem?(d.mem.w.e||0)+(d.mem.w.m||0)+(d.mem.w.h||0):0}</b><span>ניצחונות בזיכרון</span></div><div><b>${d.obs?d.obs.runs:0}</b><span>מסלולים</span></div><div><b>${learnSeen}</b><span>כרטיסיות שנקראו</span></div><div><b>${d.daily?d.daily.streak||0:0}</b><span>רצף אתגרים</span></div></div>
   ${kn.length?`<p>✅ יודעים: ${kn.map(s=>s.n).join(', ')}</p>`:''}${weak.length?`<p>💡 כדאי לתרגל: ${weak.map(s=>s.n).join(', ')}</p>`:''}
   ${Object.keys(best).length?`<p>🛡️ חידוני בטיחות (שיא מתוך 5): ${Object.keys(best).sort().map(l=>'שלב '+l+': '+best[l]).join(' · ')}</p>`:''}</div>`}
V.pstats=()=>{if(!S.parentOK){S.screen='parent';return V.parent()}
  return `<div class="top"><button class="back" data-act="go" data-s="parent">→ חזרה</button><div class="who">📊 סטטיסטיקות</div></div>${S.users.map(statsOf).join('')}<p class="muted">הנתונים נשמרים רק במכשיר הזה.</p>`};

/* ---------- כמה שיחקנו + אודות ---------- */
V.played=()=>{const tot=S.users.reduce((t,u)=>t+pBox(u.id).total,0)+S.playGone,days=new Set();S.users.forEach(u=>Object.entries(pBox(u.id).days).forEach(([k,v])=>{if(v>60000)days.add(k)}));
  const stars=S.users.reduce((t,u)=>t+((S.data[u.id]||{game:{stars:0}}).game.stars||0),0);
  return `<div class="top"><button class="back" data-act="${S.parentOK?'go':'login'}" data-s="parent">→ חזרה</button><div class="who">🎉 כמה שיחקנו</div></div>
  <div class="card played"><div class="lemo">🐶🐱</div><h2>מאלפים קטנים</h2><p>זמן משחק נטו של כל המשפחה</p><div class="clk big" dir="ltr">${clk(tot)}</div>
   <div class="sgrid"><div><b>${days.size}</b><span>ימים עם משחק</span></div><div><b>${stars}</b><span>כוכבים שנאספו</span></div><div><b>${S.users.length}</b><span>מאלפים</span></div></div>
   <div class="ptg">${S.users.map(u=>`<div class="pt"><b>${esc(u.name)}</b><div class="clk sm" dir="ltr" style="color:${u.color}">${clk(pBox(u.id).total)}</div></div>`).join('')}</div>
   <p class="muted">נספר רק זמן של פעילות אמיתית על המסך. אפשר לצלם את המסך ולשתף.</p></div>
  <button class="btn ghost" data-act="go" data-s="about">ℹ️ על האפליקציה</button>`};
V.about=()=>`<div class="top"><button class="back" data-act="${S.parentOK?'go':'login'}" data-s="${S.parentOK?'parent':'login'}">→ חזרה</button><div class="who">ℹ️ על האפליקציה</div></div>
  <div class="card"><div class="lemo">🐶🐱</div><h2>מאלפים קטנים</h2>
   <p>אפליקציה שאבא בנה בשביל הבנות שלו, כדי ללמוד לאלף כלב, להבין מה כלבים וחתולים מרגישים, ולשמור על בטיחות ליד בעלי חיים.</p>
   <p>מה יש בה: תרגום קולות לרגש משוער, אילוף עם קליקר, משחקים, כרטיסיות לימוד, טיפול בכלב, ארון בגדים, ופינת בטיחות.</p>
   <p>בלי פרסומות, בלי קניות ובלי הרשמה. הנתונים נשמרים רק במכשיר. ההקראה נעשית במנוע הדיבור של המכשיר.</p>
   <p class="muted">האפליקציה לא באמת מתרגמת שפה של בעלי חיים. היא מעריכה התרגשות ורגש לפי הצליל, למטרות משחק ולמידה. תמיד עם מבוגר, ולא ניגשים לכלב בלי אישור של הבעלים.</p></div>`;

/* ---------- שמירה כאפליקציה במסך הבית ---------- */
A.fullScr=()=>{const el=document.documentElement;try{const p=(el.requestFullscreen||el.webkitRequestFullscreen).call(el);if(p&&p.catch)p.catch(()=>toast('מסך מלא לא זמין כאן'))}catch(e){toast('מסך מלא לא זמין כאן')}};
const homeCard=()=>`<div class="card"><h3>📱 הוספה למסך הבית</h3>
  <p><b>אנדרואיד (Chrome):</b> פותחים את הקישור בדפדפן, לוחצים על ⋮ למעלה, ואז "הוספה למסך הבית".</p>
  <p><b>iPhone (Safari):</b> לוחצים על כפתור השיתוף ⬆️ ואז "הוספה למסך הבית".</p>
  <p class="muted">כשהאפליקציה פתוחה דרך הקישור של Claude, הקיצור יפתח את הדף של Claude. אפליקציה מלאה עם אייקון משלה תהיה זמינה כשהיא תעלה לכתובת משלה או לחנות.</p>
  <button class="btn ghost" data-act="fullScr">⛶ מסך מלא</button></div>`;

function afterMount(){if(!GL.ok)return;let cb=(petCat()&&S.screen!=='translate')?(D().catBreed||'tabby'):(S.screen==='newu'&&S.nu&&S.nu.animal==='cat'?(S.nu.cbreed||'tabby'):(S.catBreed||'tabby'));
  if(S.screen==='learn'&&S.lr&&!S.lr.quiz){const k=learnCard();if(k&&k.cat)cb=k.cat;if(k&&k.br){GL.setBreed(k.br);const c=(GL.breedColor&&GL.breedColor(k.br))||'rgb(162,106,70)',m=String(c).match(/\d+/g);if(m&&m.length>=3)GL.setFur(m.slice(0,3).map(Number),false)}}
  if(GL.setCatBreed)GL.setCatBreed(cb)}

/* ניקוד בלשון נקבה לפעלי עבר בגוף שני, כשהמשתמשת היא בת */
const GNF=[['עָנִיתָ','עָנִית'],['קִיבַּלְתָּ','קִיבַּלְתְּ'],['צָדַקְתָּ','צָדַקְתְּ'],['עָבַרְתָּ','עָבַרְתְּ'],['נָפַלְתָּ','נָפַלְתְּ'],['נָתַתָּ','נָתַתְּ'],['עָשִׂיתָ','עָשִׂית']];
function gndNk(t){if(S.lang!=='he'||!U()||U().g==='m')return t;let s=String(t);GNF.forEach(([m,f])=>{if(s.indexOf(m)>=0)s=s.split(m).join(f)});return s}

/* ======== גרסה 17: חתול כחיית מחמד, רמות קושי לפי גיל, סיפור יומי ======== */
function petCat(){const u=U();return !!(u&&u.animal==='cat')}
const CATSKIP=/^(learn|translate|safety|about|parent|pstats|played|real|stest|login|newu)$/;
let NOCAT=false;
function catW(t){if(NOCAT||!petCat()||CATSKIP.test(S.screen))return t;let s=String(t);
  if(S.lang==='en')return s.replace(/\b(D|d)ogs\b/g,(m,c)=>c==='D'?'Cats':'cats').replace(/\b(D|d)og\b/g,(m,c)=>c==='D'?'Cat':'cat');
  return s.replace(/(^|[^א-תְ-ׇ])((?:[והלמשכב][ְ-ׇ]*){0,3})כ[ְ-ׇ]*ל[ְ-ׇ]*ב[ְ-ׇ]*(?![א-ת])/g,(m,a,b)=>a+b+'חתול')}
/* חתול: צרכים, הודעות ועובדות */
function NI(n){if(!petCat())return n;if(n.k==='fun')return {...n,ic:'🪶',n:'נוצה'};if(n.k==='play')return {...n,ic:'🧶',n:'צמר'};return n}
const LOWMSG_CAT={food:'מיאו! אני רעב. אפשר ארוחה?',water:'אני צמא. אפשר מים טריים?',clean:'הפרווה שלי מסתבכת. אפשר לברש אותי?',fun:'משעמם לי. בא לי לצוד נוצה!',rest:'אני עייף. אפשר לנמנם קצת?',play:'בא לי לרדוף אחרי כדור צמר!'};
function LM(k){return petCat()?LOWMSG_CAT[k]:LM(k)}
const FACTS_CAT={
 food:'חתול אוכל כמה ארוחות קטנות ביום. אסור לתת לחתול שוקולד, בצל או חלב רגיל, הם עושים לו רע.',
 water:'חתולים לא שותים הרבה, אז מחליפים להם מים כל יום, ואפשר לשים את הקערה רחוק מהאוכל.',
 clean:'חתולים מנקים את עצמם עם הלשון. מברשת עוזרת להוציא שיער ישן, במיוחד לחתול עם פרווה ארוכה.',
 fun:'חתולים אוהבים לצוד. משחקים איתם בחכה עם נוצה, ולא עם הידיים, כדי שלא ילמדו לשרוט.',
 rest:'חתולים ישנים 12 עד 16 שעות ביום. כשהחתול ישן, משאירים אותו בשקט.',
 play:'כדור צמר, קופסה ריקה ומגדל גירוד הם צעצועים שחתולים אוהבים. משחקים כמה דקות כמה פעמים ביום.'};
const CATOK=['party','top','crown','collarR','collarB','bowR','bowB','sun','heart'];
const CBTHR={tabby:0,siamese:10,black:20,grey:30,calico:38,persian:45,tuxedo:60,mainecoon:75};
function cOpen(d,id){return (CBTHR[id]||0)<=d.game.stars||(d.unlC||[]).includes(id)||(d.catBreed||'tabby')===id}
function catBreedPick(cur,act){const lock=act!=='nuCatBr',d=lock?D():null;
  return `<div class="items">${CATBR.map(([id,n,e,ds])=>{const lk=lock&&!cOpen(d,id),need=lock?Math.max(0,(CBTHR[id]||0)-d.game.stars):0;
   return `<button class="item ${cur===id?'worn':''} ${lk?'locked':''}" data-act="${lk?'collLock':act}" data-id="${id}" data-n="${n}" data-need="${need}"><span class="sw">${lk?'🔒':e}</span><b>${n}</b><span class="price">${cur===id?'נבחר ✓':lk?'עוד '+need+' כוכבים':ds}</span></button>`}).join('')}</div>`}
function setCatBreed(id,n){const d=D();if(!Array.isArray(d.unlC))d.unlC=[];const old=d.catBreed||'tabby';if(!d.unlC.includes(old))d.unlC.push(old);d.catBreed=id;save();render();speak('עכשיו אני '+n+'!','yip')}
Object.assign(A,{
 nuAni:e=>{S.nu.animal=e.dataset.v==='cat'?'cat':'dog';S.nu.pet='';render()},
 pfAni:e=>{const u=U(),v=e.dataset.v==='cat'?'cat':'dog';if(u.animal===v)return;u.animal=v;if(v==='cat'&&!D().catBreed)D().catBreed='tabby';save();render();setTimeout(()=>speak(greet(),'yip'),200)},
 nuCatBr:e=>{S.nu.cbreed=e.dataset.id;render();if(GL.ok&&GL.setCatBreed)GL.setCatBreed(S.nu.cbreed)},
 pfCatBr:e=>setCatBreed(e.dataset.id,e.dataset.n),
 catCoat:e=>setCatBreed(e.dataset.id,e.dataset.n)});
function animalPick(cur,act){const c=cur==='cat';return `<div class="grid2"><button class="item ${!c?'worn':''}" data-act="${act}" data-v="dog" aria-pressed="${!c}"><span class="sw">🐕</span><b>כלב</b><span class="price">${!c?'נבחר ✓':''}</span></button><button class="item ${c?'worn':''}" data-act="${act}" data-v="cat" aria-pressed="${c}"><span class="sw">🐈</span><b>חתול</b><span class="price">${c?'נבחר ✓':''}</span></button></div>`}
const collDog=V.coll;
V.coll=()=>{if(!petCat())return collDog();const d=D(),cur=d.catBreed||'tabby',n=CATBR.filter(b=>cOpen(d,b[0])).length;
  return `${header('אוסף הגזעים')}
  <div class="avatarWrap">${avatar('cat','happy')}<div class="bubble ${lia()?'lia':''}">${n} מתוך ${CATBR.length} גזעים פתוחים. כוכבים פותחים עוד!</div></div>
  ${catBreedPick(cur,'catCoat')}
  <p class="muted">כוכבים מרוויחים במשחק האילוף, בזיכרון, במסלול, בחידונים ובאתגר היומי.</p>`};

/* ---------- רמות קושי לפי גיל ---------- */
function ageBand(){const u=U();if(!u)return 'big';if(simpleOf(u))return 'little';return (+u.age||0)<=8?'mid':'big'}
const BANDN={little:'קטנים (עד 5 או מצב פשוט)',mid:'אמצע (6 עד 8)',big:'גדולים (9 ומעלה)'};
const GW=()=>ageBand()==='mid'?1.5:1;
const REC={little:'e',mid:'m',big:'h'};

/* ---------- הסיפור היומי ---------- */
const STORIES=[
 {e:'🎾',t:'הכדור שנעלם',p:['בוקר אחד {n} התעורר וחיפש את הכדור האהוב עליו.','הוא חיפש מתחת לספה, מאחורי הווילון ואפילו בתוך הנעל.','פתאום הוא הריח משהו מוכר. האף שלו הוביל אותו לגינה.','שם, ליד העץ, חיכה הכדור, מלא בבוץ.','{n} קפץ משמחה והביא אותו בגאווה הביתה.','מה למדנו? לכלב יש אף חזק מאוד, והוא מוצא דברים לפי הריח.']},
 {e:'🛁',t:'יום האמבטיה',p:['היום יום אמבטיה, ו{n} לא בטוח שהוא אוהב מים.','הוא התחבא מאחורי הדלת והציץ החוצה.','אמרו לו בקול רך: "אתה בטוח, אנחנו פה איתך".','המים היו פושרים ונעימים, והסבון הריח כמו תפוח.','אחרי האמבטיה {n} התנער, ריסס את כולם, וכולם צחקו.','מה למדנו? מדברים בשקט ובעדינות כשבעל חיים מפחד.']},
 {e:'🦴',t:'הטריק החדש',p:['{n} רצה ללמוד טריק חדש: לתת כף.','בפעם הראשונה הוא רק הריח את היד.','בפעם השנייה הוא הרים כף קטנה, ומיד שמע קליק וקיבל חטיף.','בפעם השלישית הכף עלתה מהר יותר.','בסוף היום {n} נתן כף לכל המשפחה, אפילו לסבתא.','מה למדנו? קליק וחטיף מהר עוזרים ללמוד, ומתרגלים קצת בכל פעם.']},
 {e:'🌧️',t:'סערה בלילה',p:['בלילה התחיל רעם חזק, ו{n} נבהל מאוד.','הוא רעד והתחבא מתחת למיטה.','לא משכו אותו החוצה. רק ישבו לידו בשקט ושמו לו שמיכה רכה.','לאט לאט הרעמים התרחקו, והוא יצא להתכרבל.','בבוקר השמש זרחה, ו{n} רץ לשחק כאילו כלום לא קרה.','מה למדנו? כשבעל חיים מפחד נותנים לו מקום בטוח ולא מכריחים אותו.']},
 {e:'🐕',t:'חבר חדש בפארק',p:['בפארק {n} פגש כלב גדול ושמח.','לפני שהתקרבו, הילדים שאלו את הבעלים אם מותר.','הבעלים אמר שכן, ושניהם הריחו זה את זה בסקרנות.','אחרי רגע שניהם התחילו לרוץ במעגלים.','בסוף היום {n} חזר הביתה עייף ומרוצה.','מה למדנו? תמיד שואלים את הבעלים לפני שמתקרבים לכלב שלא מכירים.']},
 {e:'🎂',t:'יום ההולדת',p:['היום יום ההולדת של {n}!','הכינו לו עוגה מיוחדת מגזר ובננה, בלי שוקולד, כי שוקולד מסוכן לבעלי חיים.','כל המשפחה שרה לו שיר, והוא קפץ פעמיים כמו בשיר.','הוא קיבל צעצוע חדש ושיחק בו כל הערב.','בלילה {n} נרדם מחובק עם הצעצוע החדש.','מה למדנו? לא כל אוכל של בני אדם מתאים לבעלי חיים.']},
 {e:'🏃',t:'המרוץ הגדול',p:['במסלול המכשולים {n} רצה לנצח.','הוא קפץ מעל המשוכה, זחל במנהרה והסתובב בין המוטות.','בשולחן העצירה הוא היה צריך לחכות, וזה היה הכי קשה.','הוא חיכה בסבלנות, ואז רץ לקו הסיום.','כולם מחאו כפיים, ו{n} קיבל חטיף וליטוף.','מה למדנו? גם לחכות בסבלנות זה כישרון.']},
 {e:'🌙',t:'לילה טוב',p:['הגיע הלילה ו{n} מפהק פיהוק גדול.','הוא מסתובב שלוש פעמים במיטה שלו ומתכרבל.','בחוץ הירח מאיר, והבית שקט.','{n} חולם על כדורים, חטיפים והרבה ליטופים.','מחר מחכה לו עוד יום של משחק ולמידה.','לילה טוב, {n}.']}];
function storyIdx(){return Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5)%STORIES.length}
V.story=()=>{const i=S.stI==null?storyIdx():S.stI,st=STORIES[(i+STORIES.length)%STORIES.length],d=D(),today=storyIdx()===((i+STORIES.length)%STORIES.length);
  const dn=esc(DN()),ps=st.p.map(x=>x.split('{n}').join(dn)),show=ageBand()==='little'?ps.slice(0,4).concat(ps.slice(-1)):ps;
  const got=d.story&&d.story.day===dayKey();
  return `${header('הסיפור של היום')}
  <div class="card story"><div class="lemo">${st.e}</div><h2>${st.t}</h2>${show.map(x=>`<p>${x}</p>`).join('')}</div>
  <button class="btn sun big" data-act="stRead">🔊 הקראת הסיפור</button>
  ${today?(got?`<p class="tag" style="align-self:center">⭐ קיבלת כוכב על הסיפור של היום</p>`:`<button class="btn good" data-act="stDone">✅ סיימתי לקרוא ⭐</button>`):''}
  <div class="row" style="justify-content:space-between"><button class="btn ghost" data-act="stNav" data-v="-1">→ סיפור קודם</button><button class="btn ghost" data-act="stNav" data-v="1">סיפור הבא ←</button></div>`};
Object.assign(A,{
 stRead:()=>{const ps=[...document.querySelectorAll('.story h2,.story p')].map(x=>x.innerText).join(' ');speak(ps,null,true)},
 stNav:e=>{S.stI=(S.stI==null?storyIdx():S.stI)+(+e.dataset.v);render()},
 stDone:()=>{const d=D();if(d.story&&d.story.day===dayKey())return;d.story={day:dayKey()};addStars(1);render();speak('כל הכבוד! קראנו סיפור.','yip')}});

/* ======== גרסה 18: כל משחק במסך אחד, סרגל לשוניות, מידע במגירה ======== */
const HUBS={home:1,play:1,learnhub:1,me:1};
const HUBOF={game:'play',mem:'play',course:'play',care:'play',dress:'play',color:'play',translate:'learnhub',train:'learnhub',safety:'learnhub',learn:'learnhub',story:'learnhub',stars:'me',coll:'me',album:'me',cert:'me',real:'me',prof:'me'};
const FIT=/^(home|play|learnhub|me|game|care|dress|mem|course|color|learn|album|coll|login|translate)$/;
const isFit=()=>FIT.test(S.screen)&&!(S.screen==='translate'&&S.res)&&!(S.screen==='home'&&S.editName)&&!(S.screen==='album'&&S.albV!=null);
function tabbar(){const cur=HUBS[S.screen]?S.screen:(HUBOF[S.screen]||'home');
  return `<nav class="tabbar" aria-label="ניווט">${[['home','🏠','בית'],['play','🎮','משחקים'],['learnhub','📚','לומדים'],['me','⭐','שלי']].map(([k,e,n])=>`<button data-act="go" data-s="${k}" aria-current="${cur===k?'page':'false'}"><span aria-hidden="true">${e}</span><b>${n}</b></button>`).join('')}</nav>`}
function header(title,info){const hub=HUBOF[S.screen]||'home';
  return `<div class="top"><button class="back" data-act="go" data-s="${hub}" aria-label="חזרה">→ חזרה</button><div class="who"><span class="ttl">${esc(title||'')}</span>${info?`<button class="back sm" data-act="info" aria-label="מידע">ℹ️</button>`:''}<span class="dot">${esc(INI(U()))}</span></div></div>`+
   (info?`<div class="sheet" id="sheet" hidden><div class="sheetc" role="dialog" aria-label="מידע">${info}<button class="btn ghost" data-act="sheetX">סגירה</button></div></div>`:'')}
A.info=()=>{const s=$('#sheet');if(s)s.hidden=false};
A.sheetX=()=>{const s=$('#sheet');if(s)s.hidden=true};
document.addEventListener('click',e=>{if(e.target&&e.target.id==='sheet')e.target.hidden=true});
const hubTop=t=>`<div class="top"><div class="who"><span class="ttl">${t}</span></div><div class="who"><button class="back sm" data-act="login" aria-label="החלפת משתמש">⇄</button><span class="dot">${esc(INI(U()))}</span></div></div>`;
function dailyPill(){const d=X();dailyCheck();const {ch,val}=dailyOf();
  return `<div class="dpill ${d.daily.done?'ok':''}" role="status"><span aria-hidden="true">📅</span><span class="t">${ch.t}</span><b>${d.daily.done?'✅':val+'/'+ch.n}</b></div>`}

/* ---------- מסכי הבית ---------- */
V.home=()=>{const g=greet();
  return `<div class="top"><button class="back" data-act="login">→ החלפת משתמש</button><div class="who"><span class="dot">${esc(INI(U()))}</span></div></div>
  <div class="avatarWrap">${avatar('dog','happy')}
   ${S.editName?`<form class="card namebox" id="nameForm"><label for="dogName"><b>איך קוראים לכלב?</b></label><input id="dogName" maxlength="24" value="${esc(DN())}" autocomplete="off" enterkeyhint="done"><div class="grid2"><button class="btn good" type="submit">שמירה</button><button class="btn ghost" type="button" data-act="nameCancel">ביטול</button></div></form>`
   :`<div class="row nmrow"><h2>${esc(DN())}</h2><button class="back sm" data-act="nameEdit" aria-label="שינוי שם הכלב">✏️</button></div>`}
   <button class="bubble ${lia()?'lia':''}" data-act="hello" style="border:0;color:inherit;font:inherit">${g}</button></div>
  ${dailyPill()}
  <button class="btn sun big" data-act="go" data-s="game">🎮 משחק: מאלפים את ${esc(DN())}</button>`};
const tile=(s,e,n,cls,x)=>`<button class="tile ${cls||''}" data-act="go" data-s="${s}" ${x||''}><span class="ic">${e}</span>${n}</button>`;
V.play=()=>`${hubTop('🎮 משחקים')}<div class="hub">
  ${tile('game','🎮','משחק אילוף','t2')}${tile('mem','🧩','משחק זיכרון')}${tile('course','🚧','מסלול מכשולים')}
  ${tile('care','🐾','לטפל ב'+esc(DN()),'care '+(lowNeed(pet())?'alert':''))}${tile('dress','👕','ארון בגדים')}${tile('color','🖍️','מצב צביעה')}</div>`;
V.learnhub=()=>`${hubTop('📚 לומדים')}<div class="hub">
  ${tile('translate','👂','מה הכלב אומר?','t1')}${tile('train','🦴','אילוף','t2')}${tile('learn','📚','כרטיסיות לימוד')}
  ${tile('safety','🛡️','פינת הבטיחות')}${tile('story','📖','הסיפור של היום')}</div>`;
V.me=()=>`${hubTop('⭐ שלי')}<div class="hub">
  ${tile('stars','⭐','הכוכבים שלי','t2')}${tile('coll','🏆','אוסף הגזעים')}${tile('album','🖼️','האלבום שלי')}
  ${tile('cert','🏅','תעודה')}${tile('real','🐶','הכלב שלנו','','data-nocat="1"')}${tile('prof','👤','הפרופיל שלי')}</div>`;

/* ---------- כניסה ---------- */
V.login=()=>`
<div class="avatarWrap">${avatar('dog','happy')}<h1><span class="logo" aria-hidden="true">🐶🐱</span> מאלפים קטנים</h1><p class="muted">${S.users.length?'מי משחק היום?':'בואו נפתח משתמש ראשון!'}</p></div>
<div class="ulist">${S.users.map(u=>`<button class="card who-card" data-act="pick" data-who="${u.id}" style="border-color:${u.color}"><span class="big-dot" style="background:${u.color};color:#fff">${esc(INI(u))}</span><span><h2>${esc(u.name)}</h2><span class="muted">${u.animal==='cat'?'🐱':'🐕'} ${esc((S.data[u.id]&&S.data[u.id].dogName)||'')} · ${simpleOf(u)?'מצב פשוט':'מצב מתקדם'}</span></span></button>`).join('')}</div>
<div class="grid2"><button class="btn" data-act="newu">➕ משתמש חדש</button><button class="btn ghost" data-act="parent">🔒 להורים</button></div>
${langSeg()}`;

/* ---------- משחק אילוף ---------- */
V.game=()=>{const d=D();const list=GSIGNS.filter(s=>(!lia()||GLIA.includes(s.id))&&(!petCat()||!['bang','howl'].includes(s.id)));
 const info=`<h3>איך זה עובד?</h3><p>כמו באילוף אמיתי: הקליק אומר לכלב "בדיוק את זה!", והחטיף צריך להגיע מהר. כלבים מחברים בין מעשה לפרס רק בשנייה או שתיים. סימן ש${esc(DN())} עוד לא מכיר טוב, הוא לפעמים מתבלבל ועושה משהו אחר. אז לא נותנים חטיף, לוחצים "לא הפעם" ומנסים שוב.</p>${lia()?'':'<p class="muted">הנקודות: כמה טוב '+esc(DN())+' מכיר כל סימן</p>'}`;
 return `${header(lia()?'משחק אילוף':'משחק: מאלפים את '+esc(DN()),info)}
 <div class="stage" id="stage">${avatar('dog','happy')}<div class="ghand" id="gHand" aria-hidden="true"></div><div class="gtimer" id="gTimer" hidden><i></i></div><div class="gstars" id="gStars" aria-live="polite"></div><span class="tag ovtag" id="gStarsTag">⭐ ${d.game.stars} כוכבי אילוף</span></div>
 <div class="bubble ${lia()?'lia':''}" id="gMsg">${lia()?'בחרי סימן, ואחרי ש'+esc(DN())+' עושה אותו, תני לו חטיף!':'בחרו סימן. כש'+esc(DN())+' מבצע: קליק, ואז גוררים חטיף לפה. יש לכם '+(GW()>1?3:2)+' שניות!'}</div>
 <div class="gsigns hrow">${list.map(s=>`<button class="gsign" data-act="gSign" data-id="${s.id}"><span class="h">${s.hand}</span><b>${s.n}</b>${lia()?'':`<span class="lvl">${[1,2,3,4,5].map(i=>`<i class="${gK(s.id)>=i?'on':''}"></i>`).join('')}</span>`}</button>`).join('')}</div>
 <div class="gtray dock">
   <button class="clicker small" data-act="gClick" aria-label="קליק">קליק</button>
   <div class="treat" id="gTreat" role="button" tabindex="0" aria-label="חטיף. גוררים אל הכלב או לוחצים">🍖</div>
   <button class="btn warn" id="gNo" data-act="gNo" hidden>✋ לא הפעם</button>
 </div>`};

/* ---------- טיפול ---------- */
V.care=()=>{const p=pet(),low=lowNeed(p);
  const msg=low?LM(low.k):(lia()?'אני מרגיש מצוין! תודה '+UNAME()+'!':'אני מרגיש מצוין. תודה שאת דואגת לי!');
  const strip='🌳 🌷 🏡 🌳 🌼 🌲 ⛲ 🌷 '.repeat(2);
  const info=`<div class="note" id="cFact">💡 כל פעולה מלמדת משהו על טיפול אמיתי בכלב. לוחצים ובודקים.</div><p class="muted">יום מושלם: כשכל הלבבות כמעט מלאים (ארבעה מתוך חמישה), מקבלים כוכב אחד פעם ביום. הכוכבים משמשים לקניית בגדים.</p><p class="muted">${lia()?'מחליקים את הכדור למעלה וזורקים!':'מחליקים את הכדור למעלה כדי לזרוק. החלקה ארוכה זורקת רחוק יותר.'}</p>`;
  return `${header('לטפל ב'+DN(),info)}
  <div class="stage care" id="cstage"><div class="bgwalk" aria-hidden="true"><div class="track"><span>${strip}</span><span>${strip}</span></div></div>
   <div class="night" aria-hidden="true"><span class="moon">🌙</span></div>${avatar('dog',low?'sad':'happy')}<div class="zzz" aria-hidden="true">💤</div><span class="tag ovtag" id="cWal">⭐ ${wallet()} כוכבים</span></div>
  <div class="bubble ${lia()?'lia':''}" id="cMsg">${msg}</div>
  <div class="meter" id="bprog" hidden><i></i></div>
  <div class="needs six">${NEEDS.map(NI).map(n=>`<button class="need" data-act="care" data-k="${n.k}" aria-label="${n.n}"><span class="ic">${n.ic}</span><span class="hr" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<hearts(p[n.k])?'on':''}"></i>`).join('')}</span><span class="nm">${n.n}</span></button>`).join('')}</div>
  <div class="dock toyrow"><div class="toy" id="toy" role="button" tabindex="0" aria-label="זורקים כדור">${petCat()?'🧶':'🎾'}</div><span class="muted">${lia()?'מחליקים את הכדור למעלה וזורקים!':'מחליקים את הכדור למעלה כדי לזרוק.'}</span><button class="btn sun" data-act="go" data-s="dress">👕</button></div>`};

/* ---------- ארון בגדים ---------- */
const dressOld=V.dress;
V.dress=()=>{const h=dressOld(),a=h.indexOf('<div class="seg wrap"'),b=h.lastIndexOf('<button class="btn sun" data-act="go" data-s="game">');
  const help=`<p class="muted">${lia()?'אצבע אחת מסובבת. שתיים מקרבות.':'👆 אצבע אחת מסובבת ומטה · ✌️ שתי אצבעות מקרבות ומזיזות · הקשה כפולה מאפסת'}</p><p class="muted">כוכבים מקבלים במשחק האילוף ובטיפול היומי</p><button class="btn sun" data-act="go" data-s="game">🎮 לצבור כוכבים במשחק</button>`;
  return `${header('ארון הבגדים',help)}
  <div class="stage">${avatar('dog','happy')}<span class="tag ovtag" id="cWal">⭐ ${wallet()} כוכבים</span>
   <div class="ovbtns"><button class="back sm" data-act="petShot" aria-label="צילום לאלבום">📸</button>${GL.ok?'<button class="back sm" data-act="vreset" aria-label="איפוס">↺</button>':''}</div></div>
  ${a>=0&&b>a?h.slice(a,b):''}`};

/* ---------- זיכרון ---------- */
const memOld=V.mem;
V.mem=()=>{const m=S.mm;if(!m)return memOld();const L=MML[m.lv],n=L.n*2,rows=Math.ceil(n/L.c);
  return `${header('משחק זיכרון')}
  <div class="row" style="justify-content:space-between"><span class="tag">${L.ic} ${L.t}</span><span class="tag">מהלכים: <b id="mmMoves">${m.moves}</b></span></div>
  <div class="mbox"><div class="mgrid c${L.c}" id="mmGrid" style="--ar:${L.c}/${rows};grid-template-rows:repeat(${rows},minmax(0,1fr))">${mmGrid()}</div></div>
  <div class="bubble ${lia()?'lia':''}" id="mmMsg">${m.done?'':'פותחים שני קלפים. אם הם זהים, הם נשארים פתוחים.'}</div>
  <div class="grid2 dock"><button class="btn ghost" data-act="mmAgain">🔁 משחק חדש</button><button class="btn ghost" data-act="mmMenu">🎚️ שינוי רמה</button></div>`};

/* ---------- מסלול מכשולים ---------- */
const courseOld=V.course;
V.course=()=>{const o=S.ob;
  const rules=`<h3>הפקודות במסלול</h3><ul class="rules">${OBS.slice(0,5).map(x=>`<li><span style="font-size:1.6rem">${x.e}</span>${x.n}: ${sgn(x.sg).n}</li>`).join('')}</ul>`;
  if(!o)return `${header('מסלול מכשולים',rules)}
  <div class="avatarWrap">${avatar('dog','happy')}<div class="bubble ${lia()?'lia':''}">${esc(DN())} רץ במסלול! בכל מכשול נותנים פקודה אחרת.</div></div>
  <button class="btn ghost" data-act="info">💡 הפקודות במסלול</button>
  <button class="btn sun big" data-act="obGo">🏁 מתחילים!</button>`;
  return `${header('מסלול מכשולים',rules)}
  <div class="stage" id="stage">${avatar('dog','happy')}</div>
  <div class="otrack" id="obTrack">${obTrack()}</div>
  <div class="bubble ${lia()?'lia':''}" id="obMsg">${obPrompt()}</div>
  <div class="gsigns hrow" id="obCmds">${OBSG.map(id=>{const s=sgn(id);return `<button class="gsign" data-act="obCmd" data-id="${id}"><span class="h">${s.hand}</span><b>${s.n}</b></button>`}).join('')}</div>
  <div class="grid2 dock">${ageBand()==='big'?`<button class="btn ghost" data-act="obHint">💡 רמז</button>`:''}<button class="btn ghost" data-act="obQuit">${o.done?'🔁 מסלול חדש':'↩ יציאה'}</button></div>`};

/* ---------- מה הכלב אומר ---------- */
const trOld=V.translate;
V.translate=()=>{if(S.res)return trOld();const sm=Engine.SAMPLES[S.animal];
  const info=`<p class="muted">${MIC==='native'?'נפתח מקליט הקול של הטלפון. מקליטים כמה שניות את הכלב, לוחצים סיום, והניתוח מתחיל. ההקלטה לא נשמרת באפליקציה.':'ההקלטה נשארת במכשיר ונמחקת מיד אחרי הניתוח.'}</p>
   ${lia()?'':`<label class="btn ghost" for="upl">📁 העלאת הקלטה מהמכשיר</label><input class="file" id="upl" type="file" accept="audio/*" aria-label="העלאת קובץ שמע">`}
   ${S.animal==='cat'?`<p class="note">אין חתול בבית, אז החתול מדגים בצלילי דוגמה.</p>`:''}`;
  return `${header(lia()?'מה הוא אומר?':'מתרגמים קולות',info)}
  <div class="seg" role="group" aria-label="בחירת חיה"><button data-act="animal" data-a="dog" aria-pressed="${S.animal==='dog'}">🐕 כלב</button><button data-act="animal" data-a="cat" aria-pressed="${S.animal==='cat'}">🐈 חתול</button></div>
  <div class="avatarWrap">${avatar(S.animal,'happy')}</div>${S.animal==='cat'?catPick().replace('class="chips"','class="chips hrow"'):''}
  <div class="bubble ${lia()?'lia':''}">${lia()?'לחצו והקשיבו!':'לחצו על המיקרופון ליד '+(S.animal==='dog'?'הכלב':'החתול')+', או בחרו דוגמה.'}</div>
  <div class="dock microw">
   ${MIC==='native'?`<label class="mic" for="cap" aria-label="הקלטה בטלפון">🎤</label><input class="file" id="cap" type="file" accept="audio/*" capture>`
    :`<button class="mic ${S.busy?'rec':''}" data-act="mic" aria-label="הקלטה של 6 שניות">${S.busy?'<span id="cd" style="font-size:2rem;font-family:var(--f-display)">6</span>':'🎤'}</button>`}
   <div class="samples hrow">${sm.map(s=>`<button class="sample" data-act="sample" data-id="${s.id}"><span class="pic">${s.pic}</span>${esc(s.label)}</button>`).join('')}</div></div>
  <p class="muted mmsg" id="micMsg"></p>`};

/* ---------- כרטיסיות, אלבום, אוסף ---------- */
const learnOld=V.learn;
V.learn=()=>{let h=learnOld();if(S.lr&&!S.lr.quiz)h=h.replace('<div class="seg wrap" role="group" aria-label="נושא">','<div class="seg hrow" role="group" aria-label="נושא">');return h};
const albumOld=V.album;
V.album=()=>{let h=albumOld();return h.replace('<div class="agrid">','<div class="agrid hrow">')};

render();
})();
