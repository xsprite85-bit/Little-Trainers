/* ===== אווטאר תלת-ממדי ריאליסטי: גוף בפרופורציות אמיתיות ופרווה של אלפי תלתלים (InstancedMesh) ===== */
const GL=(()=>{
  const out={ok:false};
  try{
    if(typeof THREE==='undefined')return out;
    const canvas=document.createElement('canvas');
    const r=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    r.setClearColor(0,0);r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;
    const scene=new THREE.Scene();
    const cam=new THREE.PerspectiveCamera(28,1,.05,20);
    scene.add(new THREE.HemisphereLight(0xfff3e4,0x5b4a3c,.75));
    const key=new THREE.DirectionalLight(0xfff0dc,1.35);key.position.set(2,3,2.6);scene.add(key);
    const rim=new THREE.DirectionalLight(0xcfe2ff,.7);rim.position.set(-2.5,2,-2);scene.add(rim);
    const fill=new THREE.DirectionalLight(0xffffff,.35);fill.position.set(-1,.5,3);scene.add(fill);

    const LOW=(navigator.hardwareConcurrency||4)<=4?.65:1;
    let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const V=a=>new THREE.Vector3(a[0],a[1],a[2]);
    const lin=hex=>new THREE.Color(hex).convertSRGBToLinear();
    const SPH=new THREE.SphereGeometry(1,32,24);
    const UP=new THREE.Vector3(0,1,0);
    const ANIM=[];

    function grp(parent,pivot){const g=new THREE.Group();g.userData.abs=V(pivot);g.position.copy(g.userData.abs).sub(parent.userData.abs);parent.add(g);return g}
    function ellArea(q){const p=1.6;return 4*Math.PI*Math.pow((Math.pow(q[0]*q[1],p)+Math.pow(q[0]*q[2],p)+Math.pow(q[1]*q[2],p))/3,1/p)}
    /* חלק גוף: "עור" חלק מתחת + שכבת תלתלים מעליו */
    function part(g,sh,o){
      const abs=g.userData.abs;let A,B,L,ax;
      if(sh.t==='e'){const m=new THREE.Mesh(SPH,o.skin);m.position.copy(V(sh.c)).sub(abs);if(o.alongX){m.rotation.z=Math.PI/2;m.scale.set(sh.r[1],sh.r[0],sh.r[2])}else m.scale.set(sh.r[0],sh.r[1],sh.r[2]);m.scale.multiplyScalar(o.fur?.97:1);g.add(m)}
      else{A=V(sh.a);B=V(sh.b);L=A.distanceTo(B);ax=B.clone().sub(A).normalize();
        const cy=new THREE.Mesh(new THREE.CylinderGeometry(sh.r,sh.r,L,20,1,true),o.skin);cy.position.copy(A).add(B).multiplyScalar(.5).sub(abs);cy.quaternion.setFromUnitVectors(UP,ax);g.add(cy);
        [A,B].forEach(P=>{const s=new THREE.Mesh(SPH,o.skin);s.position.copy(P).sub(abs);s.scale.setScalar(sh.r);g.add(s)})}
      if(!o.fur)return;
      const area=sh.t==='e'?ellArea(sh.r):(2*Math.PI*sh.r*L+4*Math.PI*sh.r*sh.r);
      const n=Math.max(8,Math.round(area/(o.size*o.size)*o.dens*LOW));
      const im=new THREE.InstancedMesh(o.geo,o.fur,n);im.frustumCulled=false;
      const M=new THREE.Matrix4(),q=new THREE.Quaternion(),q2=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),nn=new THREE.Vector3(),u=new THREE.Vector3(),col=new THREE.Color();
      let k=0,guard=0;
      while(k<n&&guard++<n*6){
        u.set(rnd()*2-1,rnd()*2-1,rnd()*2-1);const l2=u.lengthSq();if(l2>1||l2<1e-4)continue;u.normalize();
        if(sh.t==='e'){p.set(sh.c[0]+u.x*sh.r[0],sh.c[1]+u.y*sh.r[1],sh.c[2]+u.z*sh.r[2]);nn.set(u.x/sh.r[0],u.y/sh.r[1],u.z/sh.r[2]).normalize()}
        else{const t=rnd()*(L+2*sh.r)-sh.r,tc=Math.max(0,Math.min(L,t));
          if(t>=0&&t<=L){u.addScaledVector(ax,-u.dot(ax));if(u.lengthSq()<1e-4)continue;u.normalize()}
          else{const side=t<0?-1:1;if(u.dot(ax)*side<0)u.addScaledVector(ax,-2*u.dot(ax))}
          p.copy(A).addScaledVector(ax,tc).addScaledVector(u,sh.r);nn.copy(u)}
        if(o.skip&&o.skip(p))continue;
        const sz=o.size*(.7+rnd()*.6);
        if(o.ring){q.setFromEuler(new THREE.Euler(rnd()*6.283,rnd()*6.283,rnd()*6.283))}else{q.setFromUnitVectors(UP,nn);q2.setFromAxisAngle(UP,rnd()*6.283);q.multiply(q2)}
        s.set(sz*(.85+rnd()*.5),sz*o.flat,sz*(.85+rnd()*.5));
        M.compose(p.clone().addScaledVector(nn,sz*o.lift).sub(abs),q,s);im.setMatrixAt(k,M);
        const f=o.tone?o.tone(p):(.74+rnd()*.42);col.setRGB(f,f,f);im.setColorAt(k,col);k++;
      }
      im.count=k;out.inst=(out.inst||0)+k;out.tris=(out.tris||0)+k*(o.geo.index?o.geo.index.count/3:o.geo.attributes.position.count/3);im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;out.meshes=out.meshes||[];out.meshes.push([im,k]);g.add(im);
    }
    function eye(g,at,rad,irisHex){
      const e=new THREE.Group();e.position.copy(V(at)).sub(g.userData.abs);g.add(e);
      const ball=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(irisHex),roughness:.12,metalness:.1}));ball.scale.setScalar(rad);e.add(ball);
      const glint=new THREE.Mesh(SPH,new THREE.MeshBasicMaterial({color:0xffffff}));glint.scale.setScalar(rad*.28);glint.position.set(rad*.55,rad*.5,(at[2]>0?1:-1)*rad*.45+rad*.3);e.add(glint);
      return e;
    }
    function shadow(root,w,d){
      const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
      const gr=x.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,'rgba(20,25,40,.42)');gr.addColorStop(1,'rgba(20,25,40,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
      m.rotation.x=-Math.PI/2;m.position.y=.002;root.add(m);
    }
    const root0=()=>{const g=new THREE.Group();g.userData.abs=new THREE.Vector3();return g};

    /* ---------- פודל ---------- */
    function buildDog(){
      const root=root0();
      const furM=new THREE.MeshStandardMaterial({color:lin(0xb7784a),roughness:.9});
      const skinM=new THREE.MeshStandardMaterial({color:lin(0x6e4126),roughness:1});
      const curl=new THREE.TorusGeometry(1,.55,4,7);
      const F={fur:furM,skin:skinM,geo:curl,size:.03,dens:1.45,flat:.75,lift:.3,ring:true};
      // גזע (trunk) שמסתובב סביב הירך, ורגליים נפרדות, כדי שהכלב יוכל לשבת, לשכב ולתת כף
      const trunk=grp(root,[-.32,.52,0]);
      part(trunk,{t:'e',c:[0,.62,0],r:[.4,.22,.2]},F);
      part(trunk,{t:'e',c:[.26,.6,0],r:[.2,.25,.2]},F);
      part(trunk,{t:'e',c:[-.3,.64,0],r:[.21,.21,.19]},F);
      const legs={};
      [['fn',.27,.11],['ff',.27,-.11],['rn',-.32,.11],['rf',-.32,-.11]].forEach(([k,x,z])=>{
        const L=grp(x>0?trunk:root,[x,.52,z]);
        part(L,{t:'c',a:[x,.52,z],b:[x+(x<0?.03:0),.08,z],r:.075},F);
        part(L,{t:'e',c:[x+.03,.055,z],r:[.088,.055,.078]},{...F,size:.03});legs[k]=L});
      const head=grp(trunk,[.36,.8,0]);
      const eyeAt=[[.628,1.07,.078],[.628,1.07,-.078]],nose=[.765,.99,0];
      const dist=(p,a)=>Math.hypot(p.x-a[0],p.y-a[1],p.z-a[2]);
      const skip=p=>eyeAt.some(e=>dist(p,e)<.048)||dist(p,nose)<.06;
      part(head,{t:'c',a:[.36,.74,0],b:[.48,.98,0],r:.13},F);
      part(head,{t:'e',c:[.5,1.04,0],r:[.165,.16,.155]},{...F,skip});
      part(head,{t:'e',c:[.47,1.17,0],r:[.15,.11,.14]},F);
      part(head,{t:'e',c:[.655,.99,0],r:[.1,.072,.08]},{...F,size:.022,skip});
      const black=new THREE.MeshStandardMaterial({color:lin(0x121010),roughness:.22});
      const nm=new THREE.Mesh(SPH,black);nm.position.copy(V(nose)).sub(head.userData.abs);nm.scale.set(.036,.031,.044);head.add(nm);
      const eyes=eyeAt.map(a=>eye(head,a,.029,0x1d120b));
      const inside=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0x3a1418),roughness:.8}));inside.position.copy(V([.65,.952,0])).sub(head.userData.abs);inside.scale.set(.08,.026,.05);head.add(inside);
      const jaw=grp(head,[.58,.955,0]);
      part(jaw,{t:'e',c:[.655,.935,0],r:[.085,.032,.064]},{...F,size:.02});
      const tongue=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0xe9788b),roughness:.45}));tongue.position.copy(V([.68,.948,0])).sub(jaw.userData.abs);tongue.scale.set(.055,.012,.034);jaw.add(tongue);
      const ears=[1,-1].map(s=>{const e=grp(head,[.46,1.1,s*.14]);part(e,{t:'e',c:[.47,.95,s*.165],r:[.085,.17,.055]},{...F,size:.03});return e});
      const tail=grp(trunk,[-.48,.78,0]);
      part(tail,{t:'c',a:[-.48,.78,0],b:[-.55,.97,0],r:.058},F);
      part(tail,{t:'e',c:[-.565,1.02,0],r:[.09,.1,.09]},F);
      shadow(root,1.7,.9);
      return{root,trunk,legs,head,jaw,ears,tail,eyes,tongue,furM,skinM,cam:{y:.7,z:3.7,look:.74},tz:1};
    }
    /* ---------- חתולה (פרווה קצרה, פסים) ---------- */
    function buildCat(){
      const root=root0();
      const furM=new THREE.MeshStandardMaterial({color:lin(0xd78a42),roughness:.85});
      const skinM=new THREE.MeshStandardMaterial({color:lin(0xa8642c),roughness:1});
      const whiteM=new THREE.MeshStandardMaterial({color:lin(0xf2e6d8),roughness:.9});
      const sc=document.createElement('canvas');sc.width=16;sc.height=256;const sx=sc.getContext('2d');
      sx.fillStyle='#dc9550';sx.fillRect(0,0,16,256);
      for(let i=0;i<256;i++){const v=Math.sin(i*.23+Math.sin(i*.07)*2)+.4*Math.sin(i*.9+.7);if(v>.7){sx.fillStyle='rgba(165,88,36,'+Math.min(.4,(v-.7)*.8)+')';sx.fillRect(0,i,16,1)}}
      const tex=new THREE.CanvasTexture(sc);tex.encoding=THREE.sRGBEncoding;
      const stripeM=new THREE.MeshStandardMaterial({map:tex,roughness:.8});
      const F={fur:null,skin:stripeM,alongX:true};
      const P={fur:null,skin:furM};
      const W={fur:null,skin:whiteM};
      const body=grp(root,[0,0,0]);
      part(body,{t:'e',c:[0,.42,0],r:[.3,.14,.13]},F);
      part(body,{t:'e',c:[.2,.43,0],r:[.13,.16,.13]},W);
      part(body,{t:'e',c:[-.22,.44,0],r:[.14,.15,.13]},F);
      [[.2,.07],[.2,-.07],[-.22,.075],[-.22,-.075]].forEach(([x,z])=>{part(body,{t:'c',a:[x,.38,z],b:[x,.05,z],r:.04},P);part(body,{t:'e',c:[x+.02,.03,z],r:[.052,.03,.045]},W)});
      const head=grp(root,[.28,.5,0]);
      const eyeAt=[[.522,.668,.052],[.522,.668,-.052]],nose=[.566,.618,0];
      const dist=(p,a)=>Math.hypot(p.x-a[0],p.y-a[1],p.z-a[2]);
      const skip=p=>eyeAt.some(e=>dist(p,e)<.036)||dist(p,nose)<.022;
      part(head,{t:'c',a:[.27,.47,0],b:[.34,.57,0],r:.085},P);
      part(head,{t:'e',c:[.41,.64,0],r:[.12,.108,.122]},{...P,skip});
      part(head,{t:'e',c:[.515,.6,0],r:[.05,.04,.058]},{...W,skip});
      const nm=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0xe58a9b),roughness:.35}));nm.position.copy(V(nose)).sub(head.userData.abs);nm.scale.set(.012,.01,.016);head.add(nm);
      const eyes=eyeAt.map(a=>{const e=eye(head,a,.026,0xc9b23a);const pu=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:0x050505,roughness:.1}));pu.scale.set(.012,.022,.006);pu.position.set(.022,0,a[2]>0?.012:-.012);pu.rotation.y=a[2]>0?.9:-.9;e.add(pu);return e});
      const inside=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0x3a1418),roughness:.8}));inside.position.copy(V([.515,.583,0])).sub(head.userData.abs);inside.scale.set(.04,.012,.03);head.add(inside);
      const jaw=grp(head,[.48,.59,0]);part(jaw,{t:'e',c:[.515,.578,0],r:[.042,.016,.04]},W);
      const tongue=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0xe9788b),roughness:.45}));tongue.position.copy(V([.52,.583,0])).sub(jaw.userData.abs);tongue.scale.set(.025,.006,.018);jaw.add(tongue);
      const pinkM=new THREE.MeshStandardMaterial({color:lin(0xe7a3ad),roughness:.7});
      const ears=[1,-1].map(s=>{const e=grp(head,[.41,.73,s*.07]);
        const c=new THREE.Mesh(new THREE.ConeGeometry(.048,.11,14),furM);c.position.set(0,.04,0);c.rotation.x=s*-.25;e.add(c);
        const ci=new THREE.Mesh(new THREE.ConeGeometry(.032,.08,12),pinkM);ci.position.set(.012,.035,0);ci.rotation.x=s*-.25;e.add(ci);return e});
      const tail=grp(root,[-.32,.48,0]);
      part(tail,{t:'c',a:[-.32,.48,0],b:[-.48,.6,0],r:.032},P);
      part(tail,{t:'c',a:[-.48,.6,0],b:[-.52,.86,0],r:.03},P);
      shadow(root,1.2,.6);
      return{root,head,jaw,ears,tail,eyes,tongue,furM,skinM,whiteM,stripeM,stripeTex:tex,body,cam:{y:.48,z:2.45,look:.42},tz:.8};
    }
/*BREEDS*/
    const rigs={dog:buildDog(),cat:buildCat()};
    scene.add(rigs.dog.root,rigs.cat.root);
    {const P=rigs.dog;P.breed='poodle';['HW','FW','NW'].forEach(k=>{const g=new THREE.Group();P.head.add(g);P[k]=g});P.mouthP=[.32,.12,0]}
    const DOGS={poodle:rigs.dog};
    /* ---- גזעי חתולים: צבע פרווה, נקודות כהות, עיניים ומבנה גוף ---- */
    const CATB={tabby:{fur:0xd78a42,str:true,white:0xf2e6d8,eye:0xc9b23a},siamese:{fur:0x4a3326,body:0xeadcc8,white:0xeadcc8,eye:0x4f93e0},black:{fur:0x1d1b1e,body:0x1d1b1e,white:0x1d1b1e,eye:0xc2c43a},
      grey:{fur:0x7d8590,body:0x7d8590,white:0x8d959f,eye:0xd88a26,chub:1.12},persian:{fur:0xf3efe8,body:0xf3efe8,white:0xffffff,eye:0x4a8fd8,chub:1.15},tuxedo:{fur:0x1f1d1f,body:0x1f1d1f,white:0xf4f1ec,eye:0x9ccf3a}};
    out.catBreeds=()=>Object.keys(CATB);
    /* ---- אביזרים לחתול: כובעים, קולרים, פפיון ומשקפיים ---- */
    const CACC=(()=>{const R=rigs.cat,H=R.head,hb=H.userData.abs,rb=R.root.userData.abs||new THREE.Vector3(),A={};
      const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:lin(c),roughness:.5},o||{}));
      const at=(g,p,par)=>{const b=par===H?hb:(par.userData.abs||new THREE.Vector3());g.position.set(p[0]-b.x,p[1]-b.y,p[2]-b.z);par.add(g);g.visible=false;return g};
      // כובע מסיבה
      {const g=new THREE.Group(),c=new THREE.Mesh(new THREE.ConeGeometry(.055,.14,24),M(0xff5fa2));c.position.y=.07;g.add(c);
        const pom=new THREE.Mesh(new THREE.SphereGeometry(.018,12,10),M(0xfff3a0));pom.position.y=.145;g.add(pom);
        const st=new THREE.Mesh(new THREE.TorusGeometry(.05,.008,8,24),M(0xfff3a0));st.rotation.x=Math.PI/2;st.position.y=.01;g.add(st);g.rotation.z=-.15;A.party=at(g,[.39,.735,0],H)}
      // צילינדר
      {const g=new THREE.Group(),m=M(0x1d1d24,{roughness:.35}),c=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.08,24),m);c.position.y=.05;g.add(c);
        const b=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.008,28),m);g.add(b);const r=new THREE.Mesh(new THREE.CylinderGeometry(.046,.046,.016,24),M(0xd23a4a));r.position.y=.018;g.add(r);g.rotation.z=-.12;A.top=at(g,[.39,.738,0],H)}
      // כתר
      {const g=new THREE.Group(),m=M(0xf2c23a,{metalness:.6,roughness:.3}),c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.03,24,1,true),m);c.material.side=THREE.DoubleSide;g.add(c);
        for(let i=0;i<6;i++){const a=i/6*6.283,sp=new THREE.Mesh(new THREE.ConeGeometry(.012,.035,8),m);sp.position.set(Math.cos(a)*.05,.03,Math.sin(a)*.05);g.add(sp)}g.rotation.z=-.12;A.crown=at(g,[.39,.74,0],H)}
      // קולרים ופפיונים על הצוואר
      const nd=new THREE.Vector3(.07,.1,0).normalize(),nq=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),nd);
      [['collarR',0xd8323f],['collarB',0x2f6fe0]].forEach(([id,c])=>{const g=new THREE.Group(),t=new THREE.Mesh(new THREE.TorusGeometry(.075,.013,10,32),M(c));t.quaternion.copy(nq);g.add(t);
        const bell=new THREE.Mesh(new THREE.SphereGeometry(.016,12,10),M(0xf2c23a,{metalness:.7,roughness:.25}));bell.position.set(.06,-.045,0);g.add(bell);A[id]=at(g,[.315,.53,0],R.body)});
      [['bowR',0xd8323f],['bowB',0x2f6fe0]].forEach(([id,c])=>{const g=new THREE.Group(),m=M(c);[1,-1].forEach(sd=>{const k=new THREE.Mesh(new THREE.ConeGeometry(.028,.05,14),m);k.rotation.x=sd*Math.PI/2;k.position.z=sd*.024;k.scale.set(1,1,.55);g.add(k)});
        const kn=new THREE.Mesh(new THREE.SphereGeometry(.012,10,8),m);g.add(kn);A[id]=at(g,[.37,.5,0],R.body)});
      // משקפיים
      [['sun',0x111318,0x111318],['heart',0xff4f8b,0xff9cc0]].forEach(([id,fr,ln])=>{const g=new THREE.Group(),fm=M(fr,{roughness:.3}),lm=M(ln,{roughness:.15,transparent:true,opacity:.85});
        [1,-1].forEach(sd=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.024,.004,8,24),fm);r.rotation.y=Math.PI/2;r.position.z=sd*.052;g.add(r);const l=new THREE.Mesh(new THREE.CircleGeometry(.022,20),lm);l.rotation.y=Math.PI/2;l.position.set(.001,0,sd*.052);g.add(l)});
        const br=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.05,6),fm);br.rotation.x=Math.PI/2;g.add(br);g.scale.setScalar(1.3);A[id]=at(g,[.556,.672,0],H)});
      return A})();
    out.catItems=()=>Object.keys(CACC);
    out.dressCat=w=>{w=w||{};const on=new Set([w.hat,w.neck,w.face].filter(Boolean));for(const k in CACC)CACC[k].visible=on.has(k)};
    out.setCatBreed=id=>{const b=CATB[id]||CATB.tabby,R=rigs.cat;R.furM.color.copy(lin(b.fur));R.skinM.color.copy(lin(b.fur)).multiplyScalar(.78);R.whiteM.color.copy(lin(b.white));
      if(b.str){R.stripeM.map=R.stripeTex;R.stripeM.color.setRGB(1,1,1)}else{R.stripeM.map=null;R.stripeM.color.copy(lin(b.body))}R.stripeM.needsUpdate=true;
      R.eyes.forEach(e=>{const m=e.children[0]&&e.children[0].material;if(m)m.color.copy(lin(b.eye))});const k=b.chub||1;R.body.scale.set(1,k,k)};
    function makeEQ(DG){

    /* ---------- אביזרים: כובעים, צוואר, משקפיים ---------- */
    const ACC={hat:{},neck:{},face:{},hair:{},top:{},costume:{}};
    (function(){
      const H=DG.HW,hb=DG.head.userData.abs,HN=DG.NW,HF=DG.FW;
      const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:lin(c),roughness:r==null?.5:r,metalness:m||0,side:THREE.DoubleSide});
      const grpAt=(p,rz,par)=>{const g=new THREE.Group();g.position.copy(V(p)).sub(hb);g.rotation.z=rz||0;g.visible=false;(par||H).add(g);return g};
      const add=(g,geo,mat,p,rot,sc)=>{const m=new THREE.Mesh(geo,mat);m.position.set(p[0],p[1],p[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);if(sc)m.scale.set(sc[0],sc[1],sc[2]);g.add(m);return m};
      const gold=std(0xf5c028,.35,.45);
      // כובעים (נקודת העוגן: ראש הפודל)
      {const g=grpAt([.47,1.275,0],-.2);
        add(g,new THREE.ConeGeometry(.085,.27,24),std(0xff5fa2,.6),[0,.135,0]);
        add(g,new THREE.TorusGeometry(.07,.012,8,24),std(0xffe14d,.6),[0,.03,0],[Math.PI/2,0,0]);
        add(g,new THREE.TorusGeometry(.05,.012,8,24),std(0x4dc3ff,.6),[0,.12,0],[Math.PI/2,0,0],[1,1,1]);
        add(g,SPH,std(0xffe14d,.6),[0,.275,0],null,[.03,.03,.03]);ACC.hat.party=g}
      {const g=grpAt([.47,1.275,0],-.08);
        add(g,new THREE.CylinderGeometry(.14,.14,.014,28),std(0x1b1b22,.4),[0,.007,0]);
        add(g,new THREE.CylinderGeometry(.088,.092,.17,28),std(0x1b1b22,.4),[0,.09,0]);
        add(g,new THREE.CylinderGeometry(.0935,.0935,.032,28),std(0xd83b4b,.5),[0,.04,0]);ACC.hat.top=g}
      {const g=grpAt([.47,1.275,0],-.05);
        add(g,new THREE.CylinderGeometry(.1,.095,.065,28,1,true),gold,[0,.035,0]);
        for(let i=0;i<5;i++){const a=i/5*Math.PI*2;add(g,new THREE.ConeGeometry(.026,.075,10),gold,[Math.cos(a)*.098,.1,Math.sin(a)*.098]);
          add(g,SPH,std(i%2?0xe8458f:0x2e9cf6,.3),[Math.cos(a)*.098,.145,Math.sin(a)*.098],null,[.016,.016,.016])}
        ACC.hat.crown=g}
      // צוואר: קולרים ופפיונים. הקבוצה מוטה לאורך הצוואר, וחזית הצוואר היא כיוון x מקומי
      const neck=(key,col,bow)=>{const g=grpAt([.37,.79,0],-.46,HN);const m=std(col,.55);
        add(g,new THREE.TorusGeometry(.168,bow?.011:.02,10,32),m,[0,0,0],[Math.PI/2,0,0]);
        if(bow){add(g,new THREE.ConeGeometry(.075,.14,16),m,[.19,-.01,.07],[-Math.PI/2,0,0]);add(g,new THREE.ConeGeometry(.075,.14,16),m,[.19,-.01,-.07],[Math.PI/2,0,0]);add(g,SPH,m,[.2,-.01,0],null,[.032,.032,.032])}
        else add(g,new THREE.CylinderGeometry(.035,.035,.01,18),gold,[.172,-.025,0],[0,0,Math.PI/2]);
        ACC.neck[key]=g};
      neck('collarR',0xe0344b);neck('collarB',0x2e7cf6);neck('bowR',0xe0344b,true);neck('bowB',0x2e7cf6,true);
      // משקפיים
      const glass=(key,heart)=>{const g=grpAt([0,0,0],0,HF);g.position.set(0,0,0);
        const fm=std(heart?0xe8458f:0x15151b,.3),lens=new THREE.MeshStandardMaterial({color:lin(heart?0xff9ac7:0x101018),roughness:.12,transparent:true,opacity:heart?.8:.88,side:THREE.DoubleSide});
        const hp=V([0,0,0]).sub(hb);
        [1,-1].forEach(s=>{const c=V([.69,1.072,s*.085]).sub(hb);
          if(heart){const sh=new THREE.Shape();sh.moveTo(0,-.6);sh.bezierCurveTo(-1.2,.1,-.7,1,0,.45);sh.bezierCurveTo(.7,1,1.2,.1,0,-.6);
            const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),lens);m.scale.setScalar(.064);m.position.copy(c);m.rotation.y=Math.PI/2;g.add(m);
            const o=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sh.getPoints(40).map(p=>new THREE.Vector3(p.x,p.y,0)),true),48,.12,5,true),fm);o.scale.setScalar(.064);o.position.copy(c);o.rotation.y=Math.PI/2;g.add(o)}
          else{add(g,SPH,lens,[c.x,c.y,c.z],null,[.012,.06,.06]);add(g,new THREE.TorusGeometry(.061,.009,8,26),fm,[c.x,c.y,c.z],[0,Math.PI/2,0])}
          add(g,new THREE.CylinderGeometry(.005,.005,.19,6),fm,[c.x-.095,c.y+.004,c.z*1.55],[0,0,Math.PI/2])});
        const b=V([.69,1.078,0]).sub(hb);add(g,new THREE.CylinderGeometry(.006,.006,.062,6),fm,[b.x,b.y,b.z],[Math.PI/2,0,0]);
        ACC.face[key]=g};
      glass('sun',false);glass('heart',true);
    })();

    /* ---------- בגדים ותחפושות בתלת-ממד: גזרה שנבנית על צורת הגוף, בד עם מרקם, שרוולים ותנועה ---------- */
    const CL=(function(){
      const H=DG.HW,hb=DG.head.userData.abs,Tr=DG.trunk,tb=Tr.userData.abs,TL=DG.tail,tlb=TL.userData.abs,LG=DG.legs;
      const DS=THREE.DoubleSide,PI=Math.PI;
      const std=(c,r,m,ex)=>new THREE.MeshStandardMaterial(Object.assign({color:lin(c),roughness:r==null?.6:r,metalness:m||0,side:DS},ex||{}));
      const mk=(par,geo,mat,p,rot,sc)=>{const m=new THREE.Mesh(geo,mat);if(p)m.position.set(p[0],p[1],p[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);if(sc)m.scale.set(sc[0],sc[1],sc[2]);par.add(m);return m};
      const grpIn=par=>{const g=new THREE.Group();g.visible=false;par.add(g);return g};
      const TV=(p,base)=>new THREE.Vector3(p[0]-base.x,p[1]-base.y,p[2]-base.z);

      /* ---- מרקמים מצוירים ---- */
      const tex=(W,Hh,draw,linear)=>{const c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d');draw(x,W,Hh);
        const t=new THREE.CanvasTexture(c);if(!linear)t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t};
      function knit(x,W,Hh,cell,a,rot){for(let py=0;py<Hh;py+=cell)for(let px=0;px<W;px+=cell){
          x.fillStyle='rgba(255,255,255,'+a+')';
          for(const s of [-1,1]){x.beginPath();
            if(rot)x.ellipse(px+cell*.5,py+cell*(.5+s*.21),cell*.44,cell*.19,s*.5,0,6.283);
            else x.ellipse(px+cell*(.5+s*.21),py+cell*.5,cell*.19,cell*.44,s*.5,0,6.283);x.fill()}
          x.fillStyle='rgba(0,0,0,'+(a*.55)+')';if(rot)x.fillRect(px,py,1,cell);else x.fillRect(px,py,cell,1)}}
      function speck(x,W,Hh,a){for(let i=0;i<W*Hh/5;i++){x.fillStyle=(i&1)?'rgba(255,255,255,'+a+')':'rgba(0,0,0,'+a+')';x.fillRect(Math.random()*W|0,Math.random()*Hh|0,1,1)}}
      function star(x,cx,cy,R,r,fill,up,stroke){x.beginPath();for(let i=0;i<10;i++){const a=i*PI/5+(up?-PI/2:PI/2),d=i%2?r:R;x.lineTo(cx+Math.cos(a)*d,cy+Math.sin(a)*d)}x.closePath();x.fillStyle=fill;x.fill();if(stroke){x.lineWidth=stroke[1];x.strokeStyle=stroke[0];x.stroke()}}
      // o: knit, rot, cell, rough, bs, speck, W, H, bump(x,W,H)
      function fabric(base,o){o=o||{};const W=o.W||256,Hh=o.H||512,cell=o.cell||6;
        const map=tex(W,Hh,x=>{base(x,W,Hh);if(o.knit)knit(x,W,Hh,cell,.12,o.rot);if(o.speck)speck(x,W,Hh,o.speck)});
        const opt={map,roughness:o.rough==null?.92:o.rough,metalness:o.metal||0,side:DS};
        if(o.knit||o.bump){opt.bumpMap=tex(W,Hh,x=>{x.fillStyle='#6a6a6a';x.fillRect(0,0,W,Hh);if(o.knit)knit(x,W,Hh,cell,.8,o.rot);if(o.bump)o.bump(x,W,Hh)},true);opt.bumpScale=o.bs==null?.5:o.bs}
        return new THREE.MeshStandardMaterial(opt)}
      const solid=c=>(x,W,Hh)=>{x.fillStyle=c;x.fillRect(0,0,W,Hh)};
      const rib=c=>fabric(solid(c),{knit:true,rot:true,W:128,H:32,cell:4,bs:.6});

      /* ---- צורת הגוף: איחוד שלושת האליפסואידים של הגזע ---- */
      const YC=.6,ELL=[[0,.62,0,.4,.22,.2],[.26,.6,0,.2,.25,.2],[-.3,.64,0,.21,.21,.19]],TFn=DG.trunkF;
      function bodyR(x,th){if(TFn){const c=Math.cos(th),s=Math.sin(th);let a=0,b=.42;if(TFn(x,YC,0)>0)return .03;for(let i=0;i<22;i++){const m=(a+b)/2;if(TFn(x,YC+m*c,m*s)<0)a=m;else b=m}return a}const c=Math.cos(th),s=Math.sin(th);let best=0;
        for(const e of ELL){const A=(c/e[4])**2+(s/e[5])**2,B=2*(YC-e[1])*c/(e[4]*e[4]),C=((x-e[0])/e[3])**2+((YC-e[1])/e[4])**2-1,d=B*B-4*A*C;
          if(d>=0){const t=(-B+Math.sqrt(d))/(2*A);if(t>best)best=t}}return best}
      const tiltOf=o=>o.tilt==null?.07:o.tilt;
      const xAt=(o,c,u)=>{const T=tiltOf(o),x0=o.b0-T*c,x1=o.f0-T*c;return x0+(x1-x0)*u};
      const bodyPt=(x,th,r)=>new THREE.Vector3(x-tb.x,YC+r*Math.cos(th)-tb.y,r*Math.sin(th)-tb.z);
      // מעטפת הבגד: u לאורך הגוף, v מסביב (התפר בבטן)
      function shell(o){const nu=o.nu||40,nv=o.nv||64,pos=[],uv=[],idx=[];
        for(let i=0;i<=nu;i++){const u=i/nu;for(let j=0;j<=nv;j++){const v=j/nv,th=PI+v*PI*2,c=Math.cos(th),x=xAt(o,c,u);
          const r=bodyR(x,th)+o.off+(o.quilt?o.quilt*Math.pow(Math.abs(Math.sin(u*PI*o.qn)),.6):0)+(o.flare?o.flare*Math.pow(1-u,3):0);
          const p=bodyPt(x,th,r);pos.push(p.x,p.y,p.z);uv.push(u,v)}}
        for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;idx.push(a,a+1,b,b,a+1,b+1)}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
        const n=g.attributes.normal,w=new THREE.Vector3();
        for(let i=0;i<=nu;i++){const a=i*(nv+1),b=a+nv;w.set(n.getX(a)+n.getX(b),n.getY(a)+n.getY(b),n.getZ(a)+n.getZ(b)).normalize();n.setXYZ(a,w.x,w.y,w.z);n.setXYZ(b,w.x,w.y,w.z)}
        return g}
      function ringPts(xf,off,lift){const pts=[];for(let j=0;j<72;j++){const th=j/72*PI*2,c=Math.cos(th),x=xf(c);pts.push(bodyPt(x,th,bodyR(x,th)+off+(lift||0)))}return pts}
      const tubeOn=(pts,tube,mat)=>new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),144,tube,10,true),mat);
      const edgePts=(o,u,lift)=>ringPts(c=>xAt(o,c,u),o.off,lift);
      // פס שטוח סביב הגוף (חגורה, פס זוהר)
      const band=(x,w,off,mat)=>new THREE.Mesh(shell({b0:x-w,f0:x+w,tilt:0,off,nu:3,nv:72}),mat);

      /* ---- פרווה מתחת לבגד: מסתתרת כדי שהבגד ייראה לבוש ולא מרחף ---- */
      const FUR=[],TSK=TL.children.slice();
      (out.meshes||[]).forEach(([im])=>{const p=im.parent;let kind=null;
        if(p===Tr)kind='trunk';else if(p===LG.fn||p===LG.ff)kind='fleg';else if(p===LG.rn||p===LG.rf)kind='rleg';else if(p===H)kind='head';else if(p===TL)kind='tail';
        if(kind)FUR.push({im,kind,abs:p.userData.abs,orig:null})});
      function cover(cv){FUR.forEach(F=>{const a=F.im.instanceMatrix.array;if(!F.orig){if(!cv)return;F.orig=a.slice()}a.set(F.orig);
        if(cv){const n=a.length/16;for(let i=0;i<n;i++){const o=i*16,x=a[o+12]+F.abs.x,y=a[o+13]+F.abs.y,z=a[o+14]+F.abs.z;let hide=false;
          if(F.kind==='tail')hide=!!cv.tail;
          else if(F.kind==='head'&&cv.headHood){const ux=(x-HC[0])/HR[0],uy=(y-HC[1])/HR[1],uz=(z-HC[2])/HR[2];hide=ux*ux+uy*uy+uz*uz<1.02&&!((ux>.3&&uy<.5)||uy<-.3)}
          else{const th=Math.atan2(z,y-YC),c=Math.cos(th),x0=cv.b0-cv.tilt*c,x1=cv.f0-cv.tilt*c;
            if(x>x0+.012&&x<x1-.012){if(F.kind==='trunk')hide=true;else hide=Math.hypot(y-YC,z)<bodyR(x,th)+cv.off+.015}
            if(!hide&&F.kind==='fleg'&&cv.sb!=null&&y>cv.sb+.006)hide=true}
          if(hide)for(const k of [0,1,2,4,5,6,8,9,10])a[o+k]=0}}
        F.im.instanceMatrix.needsUpdate=true});TSK.forEach(m=>{m.visible=!(cv&&cv.tail)});if(DG.shellCover)DG.shellCover(cv)}

      /* ---- שרוולים, קישוטי פרווה, ברדס ---- */
      function sleeve(g,so){const top=.55,bot=so.bot||.25,h=top-bot,r0=(DG.legR||.075)+(so.off||.03);
        mk(g,new THREE.CylinderGeometry(r0*1.05,r0,h,32,1,true),so.mat,[0,(top+bot)/2-.52,0]);
        if(so.cuffMat)mk(g,new THREE.TorusGeometry(r0+.004,so.cuff||.014,10,36),so.cuffMat,[0,bot-.52+.004,0],[PI/2,0,0]);
        if(so.sherpa){const pts=[];for(let j=0;j<40;j++){const a=j/40*PI*2;pts.push(new THREE.Vector3(Math.cos(a)*(r0+.01),bot-.52+.01,Math.sin(a)*(r0+.01)))}sherpa(g,pts,110,.018,.017,0xf6f1e7)}}
      const curlG=new THREE.TorusGeometry(1,.55,4,7);
      function sherpa(par,pts,n,rad,size,col){const m=new THREE.InstancedMesh(curlG,std(col,.95),n),M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),s=new THREE.Vector3(),p=new THREE.Vector3();
        for(let i=0;i<n;i++){const a=pts[(Math.random()*pts.length)|0];p.set(a.x+(Math.random()-.5)*rad*2,a.y+(Math.random()-.5)*rad*2,a.z+(Math.random()-.5)*rad*2);
          q.setFromEuler(e.set(Math.random()*6.3,Math.random()*6.3,Math.random()*6.3));const z=size*(.7+Math.random()*.6);s.set(z,z*.75,z);M.compose(p,q,s);m.setMatrixAt(i,M)}
        m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;par.add(m);return m}
      // ברדס על הראש: קליפה אליפטית עם פתח לפנים ולסנטר
      const HC=[.45,1.12,0],HR=[.24,.21,.225];
      function hood(par,mat){const src=new THREE.SphereGeometry(1,48,36).toNonIndexed(),P=src.attributes.position,U=src.attributes.uv,pos=[],nor=[],uv=[];
        for(let i=0;i<P.count;i+=3){let cx=0,cy=0;for(let k=0;k<3;k++){cx+=P.getX(i+k);cy+=P.getY(i+k)}cx/=3;cy/=3;
          if((cx>.27&&cy<.56)||cy<-.32)continue;
          for(let k=0;k<3;k++){const x=P.getX(i+k),y=P.getY(i+k),z=P.getZ(i+k);
            pos.push(HC[0]+x*HR[0]-hb.x,HC[1]+y*HR[1]-hb.y,HC[2]+z*HR[2]-hb.z);const nv=new THREE.Vector3(x/HR[0],y/HR[1],z/HR[2]).normalize();nor.push(nv.x,nv.y,nv.z);uv.push(U.getX(i+k),U.getY(i+k))}}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
        return mk(par,g,mat)}
      const hoodPt=(ux,uy,uz)=>{const v=new THREE.Vector3(ux,uy,uz).normalize();return{p:TV([HC[0]+v.x*HR[0],HC[1]+v.y*HR[1],HC[2]+v.z*HR[2]],hb),n:new THREE.Vector3(v.x/HR[0],v.y/HR[1],v.z/HR[2]).normalize()}};
      const spikeG=new THREE.ConeGeometry(1,1,12,1);spikeG.translate(0,.5,0);
      function spike(par,pos,dir,size,mat){const m=new THREE.Mesh(spikeG,mat);m.position.copy(pos);m.quaternion.setFromUnitVectors(UP,dir.clone().normalize());m.scale.set(size*.62,size,size*.24);par.add(m);return m}
      // חוטים מתנופפים (קצוות סרט, שרוכים): פס דק שזז ב-ANIM
      function ribbon(par,base,len,w,mat,phase,drift){const geo=new THREE.PlaneGeometry(w,len,1,8);geo.translate(0,-len/2,0);const m=new THREE.Mesh(geo,mat);m.position.copy(base);par.add(m);
        const P=geo.attributes.position,y0=[],x0=[];for(let i=0;i<P.count;i++){y0.push(P.getY(i));x0.push(P.getX(i))}
        ANIM.push(t=>{if(!visibleChain(m))return;for(let i=0;i<P.count;i++){const s=-y0[i]/len;P.setXYZ(i,x0[i]+(drift||-.35)*s*len*.6,y0[i],Math.sin(t*5+phase+s*4)*.03*s)}P.needsUpdate=true;geo.computeVertexNormals()});
        return m}
      const visibleChain=o=>{while(o){if(o.visible===false)return false;o=o.parent}return true};

      /* ---- בגד גוף כללי ---- */
      function garment(o){const parts=[],body=grpIn(Tr);parts.push(body);
        mk(body,shell(o),o.mat);
        if(o.collar)body.add(tubeOn(edgePts(o,1,o.collar.tube*.45),o.collar.tube,o.collar.mat));
        if(o.hem)body.add(tubeOn(edgePts(o,0,o.hem.tube*.45+(o.flare||0)),o.hem.tube,o.hem.mat));
        if(o.sleeves)['fn','ff'].forEach(k=>{const s=grpIn(LG[k]);parts.push(s);sleeve(s,o.sleeves)});
        parts.cover={b0:o.b0,f0:o.f0,tilt:tiltOf(o),off:o.off+(o.quilt||0),sb:o.sleeves?(o.sleeves.bot||.25):null,tail:!!o.tail};
        parts.body=body;parts.o=o;return parts}
      // ברדס מקופל מאחורי הצוואר (קפוצ'ון ומעיל גשם)
      function hoodDown(body,o,mat,inner){const x=xAt(o,1,1)-.05,r=bodyR(x,0)+o.off;
        mk(body,SPH,mat,[x-tb.x,YC+r+.025-tb.y,-tb.z],[0,0,.25],[.12,.06,.17]);
        mk(body,SPH,inner,[x+.012-tb.x,YC+r+.06-tb.y,-tb.z],[0,0,.25],[.085,.022,.12])}

      /* ---- הבגדים עצמם (נבנים רק כשלובשים אותם בפעם הראשונה) ---- */
      const B={top:{},costume:{}};
      B.top.stripe=()=>{const st=(dir)=>(x,W,Hh)=>{const n=dir==='u'?9:4;for(let i=0;i<n;i++){x.fillStyle=i%2?'#f4f1ea':'#1f3a8a';if(dir==='u')x.fillRect(Math.floor(i*W/n),0,Math.ceil(W/n)+1,Hh);else x.fillRect(0,Math.floor(i*Hh/n),W,Math.ceil(Hh/n)+1)}};
        const o={b0:-.2,f0:.33,off:.022,mat:fabric(st('u'),{knit:true}),collar:{tube:.02,mat:rib('#d8283c')},hem:{tube:.014,mat:rib('#1f3a8a')},
          sleeves:{mat:fabric(st('v'),{knit:true,W:256,H:128,rot:true}),cuffMat:rib('#d8283c'),cuff:.014}};return garment(o)};
      B.top.starshirt=()=>{const base=(x,W,Hh)=>{x.fillStyle='#ff7ab6';x.fillRect(0,0,W,Hh);for(let i=0;i<W;i+=26)for(let j=0;j<Hh;j+=26){const ox=(j/26)%2?13:0;star(x,i+ox+6,j+8,4.5,2,'rgba(255,255,255,.85)',true)}
          star(x,W*.6,Hh*.75,38,16,'#ffd23a',true,['#e8458f',3]);star(x,W*.6,Hh*.25,38,16,'#ffd23a',false,['#e8458f',3])};
        const sb=(x,W,Hh)=>{x.fillStyle='#ff7ab6';x.fillRect(0,0,W,Hh);for(let i=0;i<W;i+=26)for(let j=0;j<Hh;j+=26)star(x,i+8,j+8,4.5,2,'rgba(255,255,255,.85)',true)};
        return garment({b0:-.2,f0:.33,off:.022,mat:fabric(base,{knit:true}),collar:{tube:.02,mat:rib('#ffffff')},hem:{tube:.014,mat:rib('#e8458f')},
          sleeves:{mat:fabric(sb,{knit:true,W:256,H:128,rot:true}),cuffMat:rib('#ffffff')}})};
      B.top.hoodie=()=>{const Y='#ffc531',Yd='#e0a400';const o={b0:-.24,f0:.33,off:.03,mat:fabric(solid(Y),{knit:true,cell:5}),collar:{tube:.024,mat:rib(Yd)},hem:{tube:.022,mat:rib(Yd)},
          sleeves:{mat:fabric(solid(Y),{knit:true,W:256,H:128,cell:5}),cuffMat:rib(Yd),cuff:.018}};
        const P=garment(o),cord=std(0xffffff,.6);hoodDown(P.body,o,o.mat,std(0xb88400,.9));
        [-1,1].forEach(s=>{const th=PI+s*.42,c=Math.cos(th),x=xAt(o,c,1)-.01,r=bodyR(x,th)+o.off+.012,p=bodyPt(x,th,r);
          mk(P.body,new THREE.CylinderGeometry(.0055,.0055,.12,6),cord,[p.x+.012,p.y-.06,p.z]);mk(P.body,new THREE.CylinderGeometry(.009,.009,.022,8),std(0xc0c4cc,.3,.6),[p.x+.012,p.y-.125,p.z])});
        return P};
      B.top.rain=()=>{const base=(x,W,Hh)=>{x.fillStyle='#ffd23a';x.fillRect(0,0,W,Hh);x.fillStyle='#e0ad00';x.fillRect(0,Hh/2-3,W,6);
          x.strokeStyle='rgba(120,80,0,.55)';x.setLineDash([5,4]);x.lineWidth=1.5;[Hh/2-9,Hh/2+9].forEach(y=>{x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke()});x.setLineDash([])};
        const mat=fabric(base,{rough:.26,bump:(x,W,Hh)=>speck(x,W,Hh,.25),bs:.08}),pip=std(0xe0ad00,.3);
        const o={b0:-.3,f0:.33,off:.036,flare:.03,mat,collar:{tube:.022,mat:pip},hem:{tube:.016,mat:pip},sleeves:{mat:fabric(solid('#ffd23a'),{rough:.26,W:64,H:64}),cuffMat:pip,off:.034}};
        const P=garment(o);hoodDown(P.body,o,mat,std(0x9a7400,.5));
        P.body.add(band(-.04,.022,o.off+.004,std(0xdfe6ee,.25,.85,{emissive:lin(0x30343a)})));
        [-.33,.33].forEach(a=>{const th=PI+a,c=Math.cos(th),x=xAt(o,c,1)-.04,p=bodyPt(x,th,bodyR(x,th)+o.off+.008);mk(P.body,new THREE.CylinderGeometry(.018,.018,.01,18),std(0x1b1b22,.3),[p.x,p.y,p.z],[0,0,PI/2])});
        return P};
      B.top.winter=()=>{const qn=5,base=(x,W,Hh)=>{x.fillStyle='#2e6fe0';x.fillRect(0,0,W,Hh);x.strokeStyle='rgba(10,30,90,.6)';x.lineWidth=2;
          for(let k=1;k<qn;k++){const px=k/qn*W;x.beginPath();x.moveTo(px,0);x.lineTo(px,Hh);x.stroke()}
          x.strokeStyle='rgba(255,255,255,.35)';x.setLineDash([3,3]);x.lineWidth=1;for(let k=1;k<qn;k++){const px=k/qn*W+3;x.beginPath();x.moveTo(px,0);x.lineTo(px,Hh);x.stroke()}x.setLineDash([])};
        const o={b0:-.3,f0:.33,off:.034,quilt:.02,qn,mat:fabric(base,{rough:.42,bump:(x,W,Hh)=>speck(x,W,Hh,.2),bs:.05}),
          sleeves:{mat:fabric(solid('#2e6fe0'),{rough:.42,W:64,H:64}),off:.04,sherpa:true}};
        const P=garment(o);sherpa(P.body,edgePts(o,1,.02),520,.028,.019,0xf6f1e7);sherpa(P.body,edgePts(o,0,.012),300,.016,.016,0xf6f1e7);
        return P};

      // נינג'ה: חליפה כהה, ברדס, סרט ראש אדום עם קצוות מתנופפים ואבנט
      B.costume.ninja=()=>{const dark=fabric((x,W,Hh)=>{x.fillStyle='#24252f';x.fillRect(0,0,W,Hh);x.strokeStyle='rgba(255,255,255,.05)';for(let i=-Hh;i<W;i+=4){x.beginPath();x.moveTo(i,0);x.lineTo(i+Hh,Hh);x.stroke()}},{rough:.86,speck:.05});
        const red=std(0xd8283c,.55);
        const o={b0:-.34,f0:.34,off:.022,mat:dark,collar:{tube:.016,mat:dark},hem:{tube:.014,mat:dark},sleeves:{mat:dark,cuffMat:red,cuff:.016}};
        const P=garment(o);P.body.add(band(-.04,.03,o.off+.003,red));
        {const th=PI/2-.2,x=-.04,p=bodyPt(x,th,bodyR(x,th)+o.off+.02);mk(P.body,SPH,red,[p.x,p.y,p.z],null,[.03,.026,.024]);
          ribbon(P.body,p.clone().add(new THREE.Vector3(-.01,-.01,.01)),.13,.028,red,0,-.2);ribbon(P.body,p.clone().add(new THREE.Vector3(.012,-.01,.012)),.11,.026,red,1.3,.15)}
        const h=grpIn(H);P.push(h);hood(h,dark);
        const hbnd=new THREE.Mesh(new THREE.TorusGeometry(1,.06,10,48),red);hbnd.position.copy(TV([HC[0],HC[1]+HR[1]*.38,0],hb));hbnd.rotation.x=PI/2;hbnd.scale.set(HR[0]*.95,HR[2]*.95,.5);h.add(hbnd);
        const back=TV([HC[0]-HR[0]*.93,HC[1]+HR[1]*.38,0],hb);mk(h,SPH,red,[back.x,back.y,back.z],null,[.022,.022,.03]);
        ribbon(h,back.clone().add(new THREE.Vector3(-.01,0,.012)),.16,.03,red,.4,-.6);ribbon(h,back.clone().add(new THREE.Vector3(-.01,0,-.012)),.14,.028,red,2,-.4);
        P.cover.headHood=true;return P};

      // גיבור: חליפה כחולה עם סמל, חגורה, גלימה מתנופפת ומסכה
      B.costume.hero=()=>{const emb=(x,cx,cy,up)=>{x.beginPath();x.arc(cx,cy,34,0,6.283);x.fillStyle='#ffd23a';x.fill();x.lineWidth=5;x.strokeStyle='#e0344b';x.stroke();star(x,cx,cy,24,10,'#e0344b',up)};
        const suit=fabric((x,W,Hh)=>{x.fillStyle='#1f5fe0';x.fillRect(0,0,W,Hh);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(0,Hh*.5-1,W,2);emb(x,W*.62,Hh*.75,true);emb(x,W*.62,Hh*.25,false)},{rough:.42,bump:(x,W,Hh)=>speck(x,W,Hh,.15),bs:.04});
        const red=std(0xe0344b,.5),gold=std(0xf5c028,.32,.5);
        const o={b0:-.3,f0:.34,off:.02,mat:suit,collar:{tube:.016,mat:red},hem:{tube:.014,mat:red},sleeves:{mat:fabric(solid('#1f5fe0'),{rough:.42,W:64,H:64}),cuffMat:red,cuff:.02,bot:.27}};
        const P=garment(o);P.body.add(band(-.1,.022,o.off+.004,gold));
        // גלימה
        const ws=14,hs=18,capeTex=tex(256,256,(x,W,Hh)=>{const g=x.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#a50f24');g.addColorStop(1,'#dc2a40');x.fillStyle=g;x.fillRect(0,0,W,Hh);x.beginPath();x.arc(W/2,Hh*.42,34,0,6.283);x.fillStyle='#ffd23a';x.fill();star(x,W/2,Hh*.42,24,10,'#e0344b',true)});
        const geo=new THREE.PlaneGeometry(1,1,ws,hs),cape=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:capeTex,roughness:.7,side:DS}));P.body.add(cape);
        const CP=geo.attributes.position;
        const capeAt=(t)=>{for(let iy=0;iy<=hs;iy++){const s=iy/hs;for(let ix=0;ix<=ws;ix++){const w=ix/ws*2-1,x=.24-s*.6,th=w*(.95+.45*s),wave=Math.sin(t*3.4-s*5+w*1.4)*.022*s;
            const p=bodyPt(x-wave*.6,th,bodyR(x,th)+o.off+.022+.02*s+wave);CP.setXYZ(iy*(ws+1)+ix,p.x,p.y,p.z)}}CP.needsUpdate=true;geo.computeVertexNormals()};
        capeAt(0);ANIM.push(t=>{if(visibleChain(cape))capeAt(t)});
        [-1,1].forEach(s=>{const th=s*.95,p=bodyPt(.24,th,bodyR(.24,th)+o.off+.025);mk(P.body,SPH,gold,[p.x,p.y,p.z],null,[.024,.024,.024])});
        // מסכה
        const h=grpIn(DG.FW);P.push(h);const mm=std(0x0d1640,.75);
        [1,-1].forEach(s=>{const sh=new THREE.Shape();sh.absellipse(0,0,.088,.06,0,PI*2,false,0);const ho=new THREE.Path();ho.absellipse(.004,.003,.038,.032,0,PI*2,true,0);sh.holes.push(ho);
          const m=new THREE.Mesh(new THREE.ShapeGeometry(sh,24),mm),n=new THREE.Vector3(.8,.18,s*.57).normalize();
          m.position.copy(TV([.628,1.07,s*.079],hb)).addScaledVector(n,.046);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);h.add(m)});
        mk(h,SPH,mm,TV([.69,1.095,0],hb).toArray(),null,[.022,.026,.06]);
        return P};

      // דינוזאור: חליפה ירוקה עם בטן בהירה, ברדס עם עיניים ושיניים, קוצים לאורך הגב וזנב
      B.costume.dino=()=>{const base=(x,W,Hh)=>{x.fillStyle='#4cb860';x.fillRect(0,0,W,Hh);const bg=x.createLinearGradient(0,0,0,Hh);
          bg.addColorStop(0,'rgba(214,240,150,1)');bg.addColorStop(.17,'rgba(214,240,150,0)');bg.addColorStop(.83,'rgba(214,240,150,0)');bg.addColorStop(1,'rgba(214,240,150,1)');x.fillStyle=bg;x.fillRect(0,0,W,Hh);
          for(let j=0;j<Hh;j+=16)for(let i=((j/16)%2)*9;i<W;i+=18){x.beginPath();x.arc(i,j,6,0,6.283);x.fillStyle='rgba(30,110,50,.16)';x.fill()}};
        const scl=(x,W,Hh)=>{for(let j=0;j<Hh;j+=10)for(let i=((j/10)%2)*6;i<W;i+=12){x.beginPath();x.arc(i,j,4.5,0,PI);x.fillStyle='#8a8a8a';x.fill()}};
        const green=fabric(base,{rough:.78,speck:.04}),gs=fabric(solid('#4cb860'),{rough:.78,W:64,H:64,speck:.04});
        const org=std(0xff9f1c,.55),wht=std(0xffffff,.4);
        const o={b0:-.38,f0:.35,off:.022,mat:green,collar:{tube:.016,mat:gs},hem:{tube:.014,mat:gs},sleeves:{mat:gs,cuffMat:gs,cuff:.016},tail:true};
        const P=garment(o);P.cover.headHood=true;
        for(let x=-.36;x<=.24;x+=.075){const k=(x+.36)/.6,sz=.06+.05*Math.sin(PI*Math.min(1,k*1.1)),r=bodyR(x,0)+o.off-.006;spike(P.body,bodyPt(x,0,r),new THREE.Vector3(-.25,1,0),sz,org)}
        const h=grpIn(H);P.push(h);hood(h,gs);
        [[-.55,.83],[-.15,.99],[.25,.97],[.65,.76]].forEach(([ax,ay],i)=>{const q=hoodPt(ax,ay,0);spike(h,q.p,q.n,.05+.012*(i%2),org)});
        [1,-1].forEach(s=>{const q=hoodPt(.55,.76,s*.32);const e=mk(h,SPH,wht,q.p.toArray(),null,[.036,.036,.036]);const pp=q.p.clone().addScaledVector(q.n,.026).add(new THREE.Vector3(.008,0,0));mk(h,SPH,std(0x111111,.2),pp.toArray(),null,[.018,.018,.018]);mk(h,SPH,new THREE.MeshBasicMaterial({color:0xffffff}),pp.clone().add(new THREE.Vector3(.008,.008,s*.004)).toArray(),null,[.006,.006,.006])});
        for(const nz of [-.5,-.3,-.1,.1,.3,.5]){const nx=Math.sqrt(Math.max(0,1-.56*.56-nz*nz));const q=hoodPt(nx,.56,nz);const c=new THREE.Mesh(new THREE.ConeGeometry(.014,.034,8),wht);c.position.copy(q.p).add(new THREE.Vector3(0,-.014,0));c.rotation.z=PI;h.add(c)}
        // זנב
        const tg=grpIn(TL);P.push(tg);const A=V([-.48,.78,0]),Bp=V([-.585,1.1,0]),ax=Bp.clone().sub(A),L=ax.length();ax.normalize();
        const cone=new THREE.Mesh(new THREE.CylinderGeometry(.034,.105,L,28,1,true),gs);cone.position.copy(A).add(Bp).multiplyScalar(.5).sub(tlb);cone.quaternion.setFromUnitVectors(UP,ax);tg.add(cone);
        mk(tg,SPH,gs,Bp.clone().sub(tlb).toArray(),null,[.034,.034,.034]);
        const back=new THREE.Vector3(-ax.y,ax.x,0);
        [.25,.5,.75].forEach((f,i)=>{const p=A.clone().addScaledVector(ax,L*f).sub(tlb);const rad=.105+(.034-.105)*f;spike(tg,p.addScaledVector(back,rad-.005),back.clone().add(ax.clone().multiplyScalar(.5)),.055-.012*i,org)});
        return P};

      // פרפר: וסט סגול עם נקודות, כנפיים שמנפנפות ומחושים
      const foreS=new THREE.Shape();foreS.moveTo(0,0);foreS.bezierCurveTo(.12,.55,.5,1,.92,.95);foreS.bezierCurveTo(1.06,.62,.72,.28,0,0);
      const hindS=new THREE.Shape();hindS.moveTo(0,0);hindS.bezierCurveTo(.04,.5,.32,.86,.68,.82);hindS.bezierCurveTo(.95,.76,.88,.34,0,0);
      function wingTex(shape,cols){return tex(256,256,(x,W,Hh)=>{const g=x.createRadialGradient(0,Hh,4,0,Hh,W*1.25);cols.forEach((c,i)=>g.addColorStop(i/(cols.length-1),c));x.fillStyle=g;x.fillRect(0,0,W,Hh);
          x.strokeStyle='rgba(43,22,64,.35)';x.lineWidth=2;for(let a=.15;a<1.45;a+=.22){x.beginPath();x.moveTo(0,Hh);x.lineTo(Math.cos(a)*W*1.3,Hh-Math.sin(a)*Hh*1.3);x.stroke()}
          const pts=shape.getPoints(80);x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p.x*W,(1-p.y)*Hh):x.moveTo(p.x*W,(1-p.y)*Hh));x.closePath();x.lineWidth=16;x.strokeStyle='#2b1640';x.stroke();
          x.fillStyle='rgba(255,255,255,.9)';pts.forEach((p,i)=>{if(i%9===4){const cx=p.x*W*.84,cy=Hh-(p.y*Hh*.84);x.beginPath();x.arc(cx,cy,5,0,6.283);x.fill()}})})}
      let WT=null;const wingMats=()=>WT||(WT={f:new THREE.MeshStandardMaterial({map:wingTex(foreS,['#5b2bd6','#b04ce0','#ff6fb1','#ffb21c']),roughness:.5,side:DS}),h:new THREE.MeshStandardMaterial({map:wingTex(hindS,['#5b2bd6','#c04cd6','#ff8fc0','#ffd23a']),roughness:.5,side:DS})});
      B.costume.bflyc=()=>{const vest=fabric((x,W,Hh)=>{x.fillStyle='#b48cff';x.fillRect(0,0,W,Hh);x.fillStyle='rgba(255,255,255,.9)';for(let j=8;j<Hh;j+=22)for(let i=((j/22|0)%2)*11+6;i<W;i+=22){x.beginPath();x.arc(i,j,4,0,6.283);x.fill()}},{knit:true,cell:5});
        const o={b0:-.18,f0:.33,off:.022,mat:vest,collar:{tube:.018,mat:rib('#7b3fe4')},hem:{tube:.016,mat:rib('#7b3fe4')}};
        const P=garment(o),M=wingMats();
        [1,-1].forEach(s=>{const x=.03,r=bodyR(x,0)+o.off,wg=new THREE.Group();wg.position.copy(bodyPt(x,0,r)).add(new THREE.Vector3(0,.005,s*.025));P.body.add(wg);
          const inner=new THREE.Group();inner.rotation.x=s*PI/2;wg.add(inner);
          const f=new THREE.Mesh(new THREE.ShapeGeometry(foreS,24),M.f);f.scale.set(.46,.46,1);f.rotation.z=.5;inner.add(f);
          const hw=new THREE.Mesh(new THREE.ShapeGeometry(hindS,24),M.h);hw.scale.set(-.38,.38,1);hw.rotation.z=-.5;hw.position.z=-.002*s;inner.add(hw);
          ANIM.push(t=>{if(!visibleChain(wg))return;wg.rotation.x=-s*(1.0+.35*Math.sin(t*6.5))})});
        mk(P.body,SPH,std(0x2b1640,.5),bodyPt(.1,0,bodyR(.1,0)+o.off+.01).toArray(),null,[.09,.022,.022]);
        const h=grpIn(H);P.push(h);const dk=std(0x2b1640,.5),pom=std(0xff6fb1,.35);
        [1,-1].forEach(s=>{const pts=[[.46,1.24,s*.05],[.49,1.34,s*.075],[.55,1.41,s*.1]].map(p=>TV(p,hb));mk(h,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,.0065,6,false),dk);mk(h,SPH,pom,pts[2].toArray(),null,[.026,.026,.026])});
        return P};

      /* ---- קשתות לראש ---- */
      const BX=.46,BYc=1.105,BRr=.235,ph=a=>[BX,BYc+BRr*Math.sin(a),BRr*Math.cos(a)];
      const bandOn=(g,col)=>mk(g,new THREE.TorusGeometry(BRr,.014,10,48,PI),std(col,.4),[0,0,0],[0,PI/2,0]);
      const gHair=()=>{const g=new THREE.Group();g.position.copy(TV([BX,BYc,0],hb));g.visible=false;H.add(g);return g};
      {const g=gHair();bandOn(g,0xff7ab6);const M=wingMats(),q=ph(.95),fly=new THREE.Group();fly.position.set(.012,q[1]-BYc,q[2]+.012);fly.rotation.x=-.45;g.add(fly);
        [[foreS,M.f,.09,1,1],[foreS,M.f,.09,-1,1],[hindS,M.h,.07,1,-1],[hindS,M.h,.07,-1,-1]].forEach(([sh,m,sc,sx,sy])=>{const w=new THREE.Mesh(new THREE.ShapeGeometry(sh,16),m);w.scale.set(sc*sx,sc*sy,1);fly.add(w)});
        mk(fly,SPH,std(0x2b1640,.5),[0,0,.003],null,[.008,.045,.008]);ANIM.push(t=>{if(visibleChain(fly))fly.scale.x=.75+.25*Math.cos(t*5)});
        ACC.hair.bfly=g}
      {const g=gHair();bandOn(g,0xa56bff);
        [1.0,1.571,2.14].forEach((a,i)=>{const q=ph(a),fl=new THREE.Group();fl.position.set(.012,q[1]-BYc+.012,q[2]);g.add(fl);
          for(let k=0;k<6;k++){const t=k/6*PI*2;mk(fl,SPH,std(i%2?0xffffff:0xff9ac7,.5),[0,Math.sin(t)*.027,Math.cos(t)*.027],null,[.018,.018,.012])}
          mk(fl,SPH,std(0xffd23a,.5),[.004,0,0],null,[.015,.015,.015])});ACC.hair.flower=g}
      {const g=gHair();bandOn(g,0xf5c028);const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i*PI/5+PI/2,d=i%2?.45:1;i?sh.lineTo(Math.cos(a)*d,Math.sin(a)*d):sh.moveTo(Math.cos(a)*d,Math.sin(a)*d)}
        const sg=new THREE.ExtrudeGeometry(sh,{depth:.25,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2});
        [1.0,2.14].forEach(a=>{const q=ph(a);mk(g,sg,std(0xffe14d,.35,.2),[.012,q[1]-BYc+.025,q[2]],[0,PI/2,0],[.045,.045,.045])});ACC.hair.hstar=g}

      // אוזני ארנב
      {const g=gHair();bandOn(g,0xffffff);const wt=std(0xffffff,.85),pk=std(0xffb3c7,.7);
        [[1.22,1],[1.92,-1]].forEach(([a,sd],i)=>{const q=ph(a),e=new THREE.Group();e.position.set(0,q[1]-BYc,q[2]);e.rotation.x=-sd*.38;e.rotation.z=i?.22:-.08;g.add(e);
          mk(e,SPH,wt,[0,.1,0],null,[.06,.115,.026]);mk(e,SPH,pk,[.018,.1,0],null,[.036,.085,.014]);if(i){e.children.forEach(c=>{})}});ACC.hair.bunny=g}
      // אוזני חתול
      {const g=gHair();bandOn(g,0x2b2b33);const bk=std(0x2b2b33,.5),pk=std(0xffb3c7,.6),cg=new THREE.ConeGeometry(.065,.095,24,1);
        [[1.2,1],[1.94,-1]].forEach(([a,sd])=>{const q=ph(a),e=new THREE.Group();e.position.set(0,q[1]-BYc+.035,q[2]);e.rotation.x=-sd*.3;g.add(e);
          mk(e,cg,bk,[0,0,0],null,[1,1,.42]);mk(e,cg,pk,[.02,-.006,0],null,[.62,.72,.3])});ACC.hair.catears=g}
      // קרן חד-קרן עם פרחים
      {const g=gHair();bandOn(g,0xffb3d9);const pearl=std(0xfff3d6,.25,.35),gold=std(0xf5c028,.3,.55);
        const hn=new THREE.Group();hn.position.set(.07,BRr-.01,0);hn.rotation.z=-.42;g.add(hn);mk(hn,new THREE.ConeGeometry(.034,.2,28),pearl,[0,.1,0]);
        const hp=[];for(let i=0;i<=60;i++){const k=i/60,r=.034*(1-k)+.002,a=k*PI*7;hp.push(new THREE.Vector3(Math.cos(a)*r,k*.2,Math.sin(a)*r))}mk(hn,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp),120,.0045,6,false),gold);
        [[-.5,0xff9ac7],[0,0xb48cff],[.5,0x9ad7ff]].forEach(([dz,c])=>{const fl=new THREE.Group();fl.position.set(.05,BRr-.005,dz*.09);g.add(fl);for(let k=0;k<5;k++){const t=k/5*PI*2;mk(fl,SPH,std(c,.5),[Math.cos(t)*.018,Math.sin(t)*.018+.005,0],null,[.014,.014,.01])}mk(fl,SPH,std(0xffe14d,.5),[.004,.005,0],null,[.01,.01,.01])});ACC.hair.unicorn=g}
      // קשת בענן קטנה על הראש
      {const g=gHair();bandOn(g,0x9ad7ff);const rb=new THREE.Group();rb.position.set(-.02,BRr+.005,0);g.add(rb);
        ['#e8283c','#ff8a1c','#ffd23a','#3fbf5a','#2e7cf6','#7b3fe4'].forEach((c,i)=>mk(rb,new THREE.TorusGeometry(.115-i*.013,.0075,8,40,PI),std(c,.45),[0,0,0]));
        const cw=std(0xffffff,.9);[-1,1].forEach(sd=>[[0,0,.026],[.022*sd,-.006,.02],[-.02*sd,-.008,.018],[0,.016,.017]].forEach(([dx,dy,r])=>mk(rb,SPH,cw,[sd*.085+dx,dy,0],null,[r,r,r*.9])));ACC.hair.rainbow=g}
      // זר פרחים מסביב לראש
      {const g=gHair();const cols=[0xff7ab6,0xffffff,0xffd23a,0xb48cff,0xff9f1c];const lf=std(0x3fae55,.6);
        for(let i=0;i<14;i++){const a=i/14*PI*2,cx=.03+Math.cos(a)*.17,cz=Math.sin(a)*.185,cy=.13+Math.cos(a)*.03,fl=new THREE.Group();fl.position.set(cx,cy,cz);fl.lookAt(cx*3,cy+.5,cz*3);g.add(fl);
          const c=std(cols[i%5],.5);for(let k=0;k<5;k++){const t=k/5*PI*2;mk(fl,SPH,c,[Math.cos(t)*.025,Math.sin(t)*.025,0],null,[.02,.02,.01])}mk(fl,SPH,std(0xffd23a,.5),[0,0,.005],null,[.012,.012,.01]);
          mk(g,SPH,lf,[.03+Math.cos(a+.22)*.175,cy-.005,Math.sin(a+.22)*.19],[0,-a,0],[.022,.006,.011])}ACC.hair.wreath=g}
      // כתר נסיכה
      {const g=gHair();const gold=std(0xf5c028,.28,.6),gem=[std(0xff5fa2,.15,.1),std(0x4dc3ff,.15,.1)];const T=new THREE.Group();T.position.set(.05,.16,0);T.rotation.z=-.18;g.add(T);
        mk(T,new THREE.CylinderGeometry(.165,.165,.03,40,1,true,-PI*.5,PI),gold,[0,.015,0]);
        for(let i=0;i<7;i++){const a=(i/6-.5)*PI*.9,h=.06+.065*(1-Math.abs(i-3)/3),x=Math.cos(a)*.165,z=Math.sin(a)*.165;
          mk(T,new THREE.ConeGeometry(.02,h,10),gold,[x,.03+h/2,z]);mk(T,SPH,gem[i%2],[x+.006,.03+h+.008,z],null,[.016,.016,.016])}
        mk(T,new THREE.OctahedronGeometry(.03,0),gem[0],[.172,.03,0],null,[.6,1,1]);ACC.hair.tiara=g}

      function get(sl,k){if(!ACC[sl][k]&&B[sl][k])ACC[sl][k]=B[sl][k]();return ACC[sl][k]}
      return{get,cover};
    })();
    return{ACC,CL}}
    const eqOf=DG=>DG.eq||(DG.eq=makeEQ(DG));

    /* ---------- זורקים צעצוע: הכלב רץ, מביא ומחזיר ---------- */
    const ball=new THREE.Group();{const bm=new THREE.Mesh(new THREE.SphereGeometry(.055,28,20),new THREE.MeshStandardMaterial({color:lin(0xc6e43c),roughness:.8}));ball.add(bm);
      const sm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6});[1,-1].forEach(s=>{const t=new THREE.Mesh(new THREE.TorusGeometry(.04,.005,6,32),sm);t.rotation.y=s*.6;t.position.x=s*.02;ball.add(t)})}
    ball.visible=false;scene.add(ball);
    let FT=null,fRun=false;const _m=new THREE.Vector3();
    const angLerp=(a,b,k)=>{let d=((b-a)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;return a+d*k};
    out._dbg=()=>({FT:FT&&{t0:FT.t0},fRun,ball:ball.position.toArray().map(v=>+v.toFixed(2)),root:rigs.dog.root.position.toArray().map(v=>+v.toFixed(2)),ry:+rigs.dog.root.rotation.y.toFixed(2)});
    const FTL=[750,1000,2350,2750,3000,4350,4600,5100,5400];
    out.fetch=pw=>{if(animal!=='dog'||FT||!host)return 0;pw=Math.max(.55,Math.min(1.35,pw||1));anim=null;Object.assign(P,STAND);
      const Pt=new THREE.Vector3(-.72*pw,0,-1.45*pw),dir=Pt.clone().normalize(),stop=Pt.clone().addScaledVector(dir,-.62);
      FT={t0:lastNow,Pt,stop,a1:Math.atan2(-dir.z,dir.x),a2:Math.atan2(dir.z,-dir.x),drop:null};mood='alert';ball.visible=true;return FTL[8]};
    function fetchPose(now,R,t){const e=now-FT.t0,base=-.82+VW.yaw;let yaw=base,pos=_m.set(0,0,0);fRun=false;P.hp=0;
      const k=(a,b)=>ease(Math.min(1,Math.max(0,(e-a)/(b-a))));
      if(e<FTL[0])yaw=base;else if(e<FTL[1])yaw=angLerp(base,FT.a1,k(FTL[0],FTL[1]));
      else if(e<FTL[2]){yaw=FT.a1;pos.copy(FT.stop).multiplyScalar(k(FTL[1],FTL[2]));fRun=true}
      else if(e<FTL[3]){yaw=FT.a1;pos.copy(FT.stop);P.hp=-.35*Math.sin(Math.PI*k(FTL[2],FTL[3]))}
      else if(e<FTL[4]){yaw=angLerp(FT.a1,FT.a2,k(FTL[3],FTL[4]));pos.copy(FT.stop)}
      else if(e<FTL[5]){yaw=FT.a2;pos.copy(FT.stop).multiplyScalar(1-k(FTL[4],FTL[5]));fRun=true}
      else if(e<FTL[6])yaw=angLerp(FT.a2,base,k(FTL[5],FTL[6]));
      else yaw=base;
      if(e>=FTL[2]&&mood==='alert')mood='happy';
      R.root.rotation.y=yaw;R.root.position.x+=pos.x;R.root.position.z+=pos.z;if(fRun)R.root.position.y+=Math.abs(Math.sin(t*13))*.045}
    function fetchBall(now,R){const e=now-FT.t0;
      if(e<FTL[0]){const k=e/FTL[0],S0=_m.set(.35,1.05,2.3);ball.position.set(S0.x+(FT.Pt.x-S0.x)*k,S0.y+(.06-S0.y)*k+Math.sin(Math.PI*k)*.9,S0.z+(FT.Pt.z-S0.z)*k);ball.rotation.x+=.3}
      else if(e<FTL[2]){ball.position.set(FT.Pt.x,.06+Math.abs(Math.sin((e-FTL[0])/120))*.1*Math.max(0,1-(e-FTL[0])/600),FT.Pt.z)}
      else if(e<FTL[3]){R.root.updateMatrixWorld(true);const k=ease((e-FTL[2])/(FTL[3]-FTL[2])),mw=R.head.localToWorld(V(R.mouthP||[.32,.12,0]));ball.position.set(FT.Pt.x+(mw.x-FT.Pt.x)*k,.06+(mw.y-.06)*k,FT.Pt.z+(mw.z-FT.Pt.z)*k)}
      else if(e<FTL[6]+150){R.root.updateMatrixWorld(true);R.head.localToWorld(ball.position.set(...(R.mouthP||[.32,.12,0])))}
      else if(e<FTL[7]){if(!FT.drop)FT.drop=ball.position.clone();const k=(e-FTL[6]-150)/(FTL[7]-FTL[6]-150);ball.position.set(FT.drop.x+k*.15,FT.drop.y+(.06-FT.drop.y)*Math.min(1,k*k*2),FT.drop.z+k*.1)}
      if(e>FTL[8]){FT=null;fRun=false;mood='happy';startAnim(TR.jump)}}
    let lastW=null;out.dress=w=>{w=w||{};lastW=w;const co=w.costume||null;const {ACC,CL}=eqOf(rigs.dog);
      ['hat','hair'].forEach(sl=>{for(const k in ACC[sl])ACC[sl][k].visible=(!co&&w[sl]===k)});
      ['neck','face'].forEach(sl=>{for(const k in ACC[sl])ACC[sl][k].visible=(w[sl]===k)});
      const want=co?['costume',co]:(w.top?['top',w.top]:null);let P=null;
      if(want)try{P=CL.get(want[0],want[1])}catch(e){console.warn('clothes',e)}
      ['top','costume'].forEach(sl=>{for(const k in ACC[sl])ACC[sl][k].forEach(g=>{g.visible=!!(want&&want[0]===sl&&want[1]===k)})});
      CL.cover(P?P.cover:null);if(rigs.dog.onDress)rigs.dog.onDress(w)};
    let walking=false;out.walk=on=>{walking=!!on};
    out._rig=()=>rigs.dog;out._info=()=>({tris:r.info.render.triangles,calls:r.info.render.calls,geo:r.info.memory.geometries});
    out.breeds=()=>['poodle'].concat(Object.keys(BR.SPEC));
    out.breedColor=id=>BR.SPEC[id]?BR.SPEC[id].color:null;
    out.breed=()=>rigs.dog.breed;
    out.setBreed=id=>{if(!id||rigs.dog.breed===id)return;if(!DOGS[id]){if(!BR.SPEC[id])return;try{DOGS[id]=BR.build(id);if(out.lowGfx&&DOGS[id].degrade)DOGS[id].degrade()}catch(e){console.warn('breed',e);return}scene.add(DOGS[id].root)}
      rigs.dog=DOGS[id];for(const k in DOGS)DOGS[k].root.visible=animal==='dog'&&DOGS[k]===rigs.dog;if(lastW)out.dress(lastW);if(lastRGB)out.setFur(lastRGB,lastTri);frame()};

    // hz=גובה ראש, ez/ex=אוזניים, tb=בסיס זנב, wa/ws=כשכוש, ey/es=עיניים, jaw=פה, tg=לשון, cr=כיווץ גוף
    const T={happy:{hz:.06,ez:.12,ex:.1,tb:-.15,wa:.6,ws:14,ey:1,es:1,jaw:.22,tg:1,cr:0},
      calm:{hz:-.12,ez:0,ex:0,tb:.9,wa:.12,ws:3,ey:.3,es:1,jaw:0,tg:0,cr:0},
      alert:{hz:.2,ez:.32,ex:.28,tb:-.35,wa:.05,ws:6,ey:1.15,es:1.12,jaw:0,tg:0,cr:-.03},
      angry:{hz:-.18,ez:-.55,ex:.15,tb:-.2,wa:0,ws:0,ey:.65,es:.9,jaw:.13,tg:0,cr:-.05},
      sad:{hz:-.32,ez:-.15,ex:-.05,tb:1.25,wa:.08,ws:2,ey:.72,es:1,jaw:0,tg:0,cr:.03},
      scared:{hz:-.26,ez:-.72,ex:.05,tb:2.0,wa:.04,ws:22,ey:1.22,es:1.18,jaw:0,tg:0,cr:.1}};
    const cur={};Object.keys(T.happy).forEach(k=>cur[k]=T.happy[k]);
    /* ---------- טריקים: תנוחות ואנימציה בפריימים ---------- */
    const STAND={fo:0,ty:0,tr:0,fn:0,ff:0,rn:0,rf:0,hp:0,ht:0,spin:0,roll:0,jy:0,tg:0,eye:1,pz:0,sq:0};
    const SIT={ty:-.3,tr:.5,fn:0,ff:0,rn:1.35,rf:1.35,hp:-.32};
    const DOWN={ty:-.31,tr:0,fn:1.45,ff:1.45,rn:1.45,rf:1.45,hp:.05};
    const K=(...seg)=>seg; // [משך במילישניות, תנוחה חלקית]
    const TR={
      sit:K([700,SIT]),
      down:K([450,SIT],[650,DOWN]),
      paw:K([600,SIT],[500,{fn:1.3,fo:-.45,ht:.22}]),
      hi5:K([600,SIT],[550,{fn:1.8,fo:-.35,hp:.12,ht:.12}]),
      spin:K([1400,{spin:6.283}]),
      bow:K([650,{ty:-.06,tr:-.42,fn:1.3,ff:1.3,hp:.38}]),
      touch:K([350,{tr:-.1,hp:-.25}],[250,{hp:-.05}],[250,{hp:-.25}]),
      roll:K([450,SIT],[550,DOWN],[1200,{roll:6.283}]),
      bang:K([450,SIT],[500,DOWN],[550,{roll:1.571,eye:.08,tg:1}]),
      jump:K([300,{ty:-.08,rn:.45,rf:.45,tr:.08}],[330,{jy:.5,tr:.22,fn:1,ff:1,rn:-.9,rf:-.9,ty:0}],[330,{jy:0,tr:0,fn:0,ff:0,rn:0,rf:0}]),
      dance:K([260,{jy:.13,tr:.2,hp:.2,fn:.5,ff:-.3}],[260,{jy:0,tr:-.2,hp:-.2,fn:-.3,ff:.5}],[260,{jy:.13,tr:.2,hp:.2,fn:.5,ff:-.3}],[260,{jy:0,tr:-.2,hp:-.2,fn:-.3,ff:.5}],[420,{jy:.16,tr:.1,hp:0,fn:.8,ff:.8,spin:6.283}],[300,{jy:0,tr:0,hp:0,fn:0,ff:0,spin:6.283}]),
      beg:K([600,SIT],[500,{fn:1.75,ff:1.75,fo:-.25,tr:.75,hp:.1}],[300,{fn:1.5,ff:1.5}],[300,{fn:1.8,ff:1.8}],[300,{fn:1.5,ff:1.5}],[300,{fn:1.8,ff:1.8}]),
      shake:K([110,{tr:.16,spin:.4}],[110,{tr:-.16,spin:-.4}],[110,{tr:.16,spin:.4}],[110,{tr:-.16,spin:-.4}],[110,{tr:.16,spin:.4}],[110,{tr:-.16,spin:-.4}],[200,{tr:0,spin:0}]),
      howl:K([600,SIT],[800,{tr:.85,hp:.95,tg:1}],[1100,{tr:.85,hp:1.05,tg:1}],[500,SIT]),
      sleep:K([450,SIT],[700,{...DOWN,eye:.08,ht:.28}]),
      confused:K([400,{ht:.38,hp:.08}],[500,{ht:-.3}],[400,{ht:.3}])
    };
    const P={...STAND};let anim=null,eatUntil=0;
    const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
    function startAnim(segs){
      let from={...P};const frames=[];let t=0;
      segs.forEach(([d,pose])=>{const to={...from,...pose};frames.push({t0:t,t1:t+d,from,to});from=to;t+=d});
      anim={frames,start:performance.now(),total:t};return t;
    }
    /* ---- טריקים לחתול: הגוף כולו נוטה (pz), מתכווץ (sq), קופץ ומסתובב ---- */
    const CSIT={pz:.32,hp:-.18},CDOWN={sq:.28,hp:-.06};
    const CTR={sit:K([600,CSIT]),down:K([550,CDOWN]),paw:K([500,CSIT],[450,{pz:.48,ht:.22}],[350,{pz:.4}]),hi5:K([500,CSIT],[450,{pz:.55,ht:.18,hp:.05}]),
      spin:K([1300,{spin:6.283}]),touch:K([330,{hp:-.32}],[250,{hp:-.08}],[250,{hp:-.32}]),bow:K([600,{pz:-.26,hp:.22,sq:.08}]),
      roll:K([500,CDOWN],[1100,{roll:6.283}]),bang:K([450,CDOWN],[550,{roll:1.571,eye:.08,tg:1}]),
      jump:K([260,{sq:.16}],[330,{jy:.45,sq:-.08}],[330,{jy:0,sq:0}]),
      dance:K([260,{jy:.11,pz:.12,hp:.2}],[260,{jy:0,pz:-.08,hp:-.2}],[260,{jy:.11,pz:.12,hp:.2}],[260,{jy:0,pz:-.08,hp:-.2}],[420,{jy:.14,pz:0,hp:0,spin:6.283}],[300,{jy:0,spin:6.283}]),
      beg:K([600,CSIT],[500,{pz:.62,hp:.15}],[300,{pz:.55}],[300,{pz:.62}]),
      shake:K([110,{pz:.06,spin:.4}],[110,{pz:-.06,spin:-.4}],[110,{pz:.06,spin:.4}],[110,{pz:-.06,spin:-.4}],[200,{pz:0,spin:0}]),
      howl:K([500,CSIT],[900,{hp:.45,tg:1}],[700,{hp:.45,tg:1}],[400,CSIT]),
      sleep:K([700,{...CDOWN,eye:.08,ht:.25}]),confused:K([400,{ht:.38,hp:.08}],[500,{ht:-.3}],[400,{ht:.3}])};
    out.play=name=>{const T2=animal==='cat'?CTR:TR;if(!T2[name])return 600;Object.assign(P,{spin:P.spin%6.283,roll:P.roll%6.283});return startAnim(T2[name])};
    out.stand=()=>{P.spin%=6.283;P.roll%=6.283;if(P.roll>3.14)P.roll-=6.283;return startAnim([[650,STAND]])};
    out.eat=()=>{eatUntil=performance.now()+1300};
    out.mouth=()=>{const R=rigs[animal];if(!host)return null;R.root.updateMatrixWorld(true);
      const v=R.head.localToWorld(animal==='dog'?V(R.mouthP||[.34,.15,0]).add(new THREE.Vector3(.02,.03,0)):new THREE.Vector3(.24,.09,0)).project(cam);return{x:(v.x+1)/2,y:(1-v.y)/2}};
    out.setMood=m=>{mood=m};
    out.snap=()=>{if(!host||!out.ok)return null;try{r.render(scene,cam);return canvas.toDataURL('image/png')}catch(e){return null}};
    let lastRGB=null,lastTri=false;
    function pooTri(on,c){const R=DOGS.poodle;(out.meshes||[]).forEach(([im])=>{if(!im.instanceColor)return;const pr=im.parent;let n=null;
        if(pr===R.trunk)n='trunk';else if(pr===R.head)n='head';else if(pr===R.jaw)n='jaw';else if(pr===R.tail)n='tail';else if(R.ears.includes(pr))n='ear';else if(Object.values(R.legs).includes(pr))n='leg';if(!n)return;
        const ca=im.instanceColor.array;if(!im.userData.c0)im.userData.c0=ca.slice();const c0=im.userData.c0;
        if(!on){ca.set(c0);im.instanceColor.needsUpdate=true;return}
        const a=im.instanceMatrix.array,ab=pr.userData.abs,cnt=a.length/16;
        for(let i=0;i<cnt;i++){const o=i*16,p=[a[o+12]+ab.x,a[o+13]+ab.y,a[o+14]+ab.z],q=BR.triPat(p,{n}),f=c0[i*3],s=q[1],w=q[0];
          let r0=c.r+(BR.BLK.r-c.r)*s,g0=c.g+(BR.BLK.g-c.g)*s,b0=c.b+(BR.BLK.b-c.b)*s;r0+=(BR.WHITE.r-r0)*w;g0+=(BR.WHITE.g-g0)*w;b0+=(BR.WHITE.b-b0)*w;
          ca[i*3]=r0*f;ca[i*3+1]=g0*f;ca[i*3+2]=b0*f}im.instanceColor.needsUpdate=true})}
    out.setFur=(rgb,tri)=>{lastRGB=rgb;if(tri!==undefined)lastTri=!!tri;const c=new THREE.Color(rgb[0]/255,rgb[1]/255,rgb[2]/255).convertSRGBToLinear();if(rigs.dog.paint){rigs.dog.paint(c,lastTri);return}
      if(lastTri){pooTri(true,c);rigs.dog.furM.color.setRGB(1,1,1);rigs.dog.skinM.color.copy(c).multiplyScalar(.5);return}pooTri(false);rigs.dog.furM.color.copy(c);rigs.dog.skinM.color.copy(c).multiplyScalar(.5)};
    let host=null,w=0,animal='dog',mood='happy',t0=performance.now();
    const VW={yaw:0,zoom:1,px:0,py:0,pitch:0},clampv=(v,a,b)=>Math.max(a,Math.min(b,v));
    function frame(){const c=rigs[animal].cam,d=Math.hypot(c.z,c.y+.15-c.look)/VW.zoom,a=Math.atan2(c.y+.15-c.look,c.z)+VW.pitch;cam.position.set(VW.px,c.look+VW.py+d*Math.sin(a),d*Math.cos(a));cam.lookAt(VW.px,c.look+VW.py,0)}
    out.tilt=d=>{VW.pitch=clampv(VW.pitch+d,-.12,1.25);frame()};
    out.rotate=d=>{VW.yaw+=d};
    out.zoomBy=f=>{VW.zoom=clampv(VW.zoom*f,.8,2.8);frame()};
    out.pan=(fx,fy)=>{const c=rigs[animal].cam,W=2*(c.z/VW.zoom)*Math.tan(cam.fov*Math.PI/360);VW.px=clampv(VW.px-fx*W,-1,1);VW.py=clampv(VW.py+fy*W,-1,1);frame()};
    out.resetView=()=>{VW.yaw=0;VW.zoom=1;VW.px=0;VW.py=0;VW.pitch=0;frame()};
    out.mount=()=>{anim=null;Object.assign(P,STAND);FT=null;fRun=false;ball.visible=false;
      const el=document.querySelector('.avatar');if(!el){host=null;return}
      host=el;el.appendChild(canvas);if(window.ResizeObserver){if(!out._ro)out._ro=new ResizeObserver(()=>fit());out._ro.disconnect();out._ro.observe(el)}animal=el.dataset.animal||'dog';mood=el.dataset.mood||'happy';
      for(const k in DOGS)DOGS[k].root.visible=animal==='dog'&&DOGS[k]===rigs.dog;rigs.cat.root.visible=animal==='cat';frame();fit();
    };
    function fit(){if(!host)return;const s=Math.max(140,Math.round(host.getBoundingClientRect().width));
      if(s!==w){w=s;r.setSize(s,s,false);canvas.style.cssText='width:100%;height:100%;display:block';cam.aspect=1;cam.updateProjectionMatrix()}}
    addEventListener('resize',fit);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();out.ok=false});
    let frames=0,slow=0,last=0,degraded=false;
    let lastNow=performance.now();
    function tick(now){if(out._t!=null)now=out._t;lastNow=now;
      requestAnimationFrame(tick);
      if(!out.ok||!host||!document.body.contains(host))return;
      if(last&&!degraded){const dt=now-last;if(dt<500){frames++;if(dt>45)slow++;}
        if(frames>=60){if(slow>30){degraded=true;r.setPixelRatio(1);w=0;fit();out.meshes.forEach(([m,k])=>m.count=Math.floor(k*.55));for(const k in DOGS)if(DOGS[k].degrade)DOGS[k].degrade();out.lowGfx=true}frames=0;slow=0}}
      last=now;
      const t=(now-t0)/1000,R=rigs[animal],tg=T[mood]||T.happy,talk=host.classList.contains('talk');
      for(const k in tg)cur[k]+=(tg[k]-cur[k])*.12;
      if(anim){const e=now-anim.start;for(const f of anim.frames){if(e>=f.t0&&e<f.t1||f===anim.frames[anim.frames.length-1]){const k=ease(Math.min(1,Math.max(0,(e-f.t0)/(f.t1-f.t0))));for(const key in f.to)P[key]=f.from[key]+(f.to[key]-f.from[key])*k;if(e<f.t1)break}}if(e>anim.total)anim=null}
      const eating=now<eatUntil;
      R.root.rotation.y=-.82+Math.sin(t*.45)*.14*(anim?0.3:1)+P.spin+VW.yaw;
      R.root.rotation.z=cur.cr+(P.pz||0);if(animal==='cat'){const q=P.sq||0;R.root.scale.set(1+q*.35,1-q,1+q*.2)}
      R.root.rotation.x=P.roll;
      R.root.position.y=(host.classList.contains('bounce')?Math.abs(Math.sin(t*9))*.12:0)+P.jy+.24*(1-Math.cos(P.roll));
      R.root.rotation.order='YXZ';{const dz=-.24*Math.sin(P.roll),yw=R.root.rotation.y;R.root.position.z=dz*Math.cos(yw);R.root.position.x=(mood==='scared'?Math.sin(t*41)*.004:0)+dz*Math.sin(yw)}
      if(FT&&animal==='dog')fetchPose(now,R,t);
      if(R.trunk){R.trunk.position.y=R.trunk.userData.abs.y+P.ty+(R.dy||0);R.trunk.rotation.z=P.tr;
        R.legs.fn.rotation.z=P.fn-P.tr;R.legs.fn.rotation.x=P.fo;R.legs.ff.rotation.z=P.ff-P.tr;R.legs.rn.rotation.z=P.rn;R.legs.rf.rotation.z=P.rf}
      if(R.trunk&&(walking||fRun)&&!anim){const w=Math.sin(t*(fRun?14:9));R.legs.fn.rotation.z=w*.6;R.legs.ff.rotation.z=-w*.6;R.legs.rn.rotation.z=-w*.6;R.legs.rf.rotation.z=w*.6;R.root.position.y+=Math.abs(Math.sin(t*9))*.03}
      R.head.rotation.z=cur.hz+P.hp+Math.sin(t*1.1)*.03+(talk?Math.sin(t*5)*.03:0)+(eating?Math.sin(t*14)*.05:0);
      R.head.rotation.y=Math.sin(t*.7)*.12+.32;
      R.head.rotation.x=Math.sin(t*.9)*.05+(mood==='sad'?.1:0)+P.ht;
      const open=cur.jaw+(talk?.08+.22*Math.abs(Math.sin(t*10.5)):0)+(mood==='happy'&&!talk?Math.sin(t*7)*.04:0)+(eating?.05+.25*Math.abs(Math.sin(t*13)):0)+P.tg*.12;
      R.jaw.rotation.z=-open;
      R.tongue.scale.x=(animal==='dog'?.055:.025)*(1+cur.tg*.7);R.tongue.position.x=(animal==='dog'?.10:.04)+cur.tg*(animal==='dog'?.035:.01);
      R.eyes.forEach(e=>{const blink=(t%4.2)<.12?.15:1;e.scale.set(cur.es,cur.es*cur.ey*blink*P.eye,cur.es)});
      R.ears.forEach((e,i)=>{const s=i?-1:1;e.rotation.z=cur.ez+Math.sin(t*2.6+i)*.04;e.rotation.x=s*cur.ex});
      R.tail.rotation.z=cur.tb*R.tz;R.tail.rotation.x=eating?Math.sin(t*16)*.8:Math.sin(t*cur.ws)*cur.wa;
      for(const f of ANIM)f(t);
      if(R.hair)R.hair();
      if(FT&&animal==='dog')fetchBall(now,R);
      r.render(scene,cam);
    }
    requestAnimationFrame(tick);
    out.ok=true;return out;
  }catch(e){console.warn('3D avatar failed',e);out.ok=false;return out}
})();
