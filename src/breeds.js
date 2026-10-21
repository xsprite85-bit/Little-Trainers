    /* ================= גזעים מפורטים: לברדור, גולדן רטריבר, שיצו =================
       כל חלק גוף נבנה כמשטח חלק אחד מצורות אנטומיות (SDF + Surface Nets),
       ועליו פרווה: שכבות "קליפה" לפרווה קצרה, ותלתלי שיער מדומים לפרווה ארוכה. */
    const BR=(function(){
      /* ---- טריקולור: אוכף שחור על הגב, לבן בחזה, בלוע וברגליים, והשאר חום ---- */
      function triPat(p,k){let w=0,s=0;const n=k.n;
        if(n==='trunk'){s=Math.max(0,Math.min(1,(p[1]-.68)/.08))*(p[0]<.26?1:0);if((p[0]>.28&&p[1]<.74)||p[1]<.5)w=1}
        else if(n==='leg')w=p[1]<.2?1:0;
        else if(n==='head'){const muz=p[0]>.57&&p[1]<1.02,bl=Math.abs(p[2])<.03&&p[0]>.5&&p[1]>1.02;w=(muz||bl)?1:0}
        else if(n==='jaw')w=1;else if(n==='ear')s=.85;else if(n==='tail'){s=.9;if(p[1]>1.0){s=0;w=1}}
        return[w,s]}
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      const smin=(a,b,k)=>{if(!k)return Math.min(a,b);const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25};
      /* ---- צורות בסיס: אליפסואיד, קפסולה עם רדיוס משתנה, השטחה ---- */
      const E=(c,r)=>({f:(x,y,z)=>{const px=(x-c[0])/r[0],py=(y-c[1])/r[1],pz=(z-c[2])/r[2],k0=Math.sqrt(px*px+py*py+pz*pz),k1=Math.sqrt(px*px/(r[0]*r[0])+py*py/(r[1]*r[1])+pz*pz/(r[2]*r[2]));return k1<1e-9?-Math.min(r[0],r[1],r[2]):k0*(k0-1)/k1},
        b:[c[0]-r[0],c[1]-r[1],c[2]-r[2],c[0]+r[0],c[1]+r[1],c[2]+r[2]]});
      const C=(a,b,r1,r2)=>{const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],L2=ab[0]*ab[0]+ab[1]*ab[1]+ab[2]*ab[2],R=Math.max(r1,r2);
        return{f:(x,y,z)=>{const px=x-a[0],py=y-a[1],pz=z-a[2],t=clamp((px*ab[0]+py*ab[1]+pz*ab[2])/L2,0,1),dx=px-ab[0]*t,dy=py-ab[1]*t,dz=pz-ab[2]*t;return Math.sqrt(dx*dx+dy*dy+dz*dz)-(r1+(r2-r1)*t)},
          b:[Math.min(a[0],b[0])-R,Math.min(a[1],b[1])-R,Math.min(a[2],b[2])-R,Math.max(a[0],b[0])+R,Math.max(a[1],b[1])+R,Math.max(a[2],b[2])+R]}};
      // השטחה לאורך ציר z סביב cz (לאוזניים)
      const flatZ=(p,cz,s)=>({f:(x,y,z)=>p.f(x,y,cz+(z-cz)*s)/s,b:[p.b[0],p.b[1],cz+(p.b[2]-cz)/s,p.b[3],p.b[4],cz+(p.b[5]-cz)/s]});
      const flatX=(p,cx,s)=>({f:(x,y,z)=>p.f(cx+(x-cx)*s,y,z)/s,b:[cx+(p.b[0]-cx)/s,p.b[1],p.b[2],cx+(p.b[3]-cx)/s,p.b[4],p.b[5]]});
      // רשימת צורות -> פונקציית מרחק אחת. איבר: [צורה, ריכוך, 's' לחיתוך]
      function field(list){const fs=list.map(it=>it[0].f),ks=list.map(it=>it[1]||0),ops=list.map(it=>it[2]==='s');
        const F=(x,y,z)=>{let d=fs[0](x,y,z);for(let i=1;i<fs.length;i++){const v=fs[i](x,y,z);d=ops[i]?-smin(-d,v,ks[i]):smin(d,v,ks[i])}return d};
        const bb=[1e9,1e9,1e9,-1e9,-1e9,-1e9];list.forEach(it=>{if(it[2]==='s')return;const b=it[0].b;for(let i=0;i<3;i++){bb[i]=Math.min(bb[i],b[i]);bb[i+3]=Math.max(bb[i+3],b[i+3])}});
        F.bb=bb;return F}
      const grad=(F,x,y,z,e)=>{e=e||.002;const gx=F(x+e,y,z)-F(x-e,y,z),gy=F(x,y+e,z)-F(x,y-e,z),gz=F(x,y,z+e)-F(x,y,z-e),l=Math.sqrt(gx*gx+gy*gy+gz*gz)||1;return[gx/l,gy/l,gz/l]};

      /* ---- Surface Nets: רשת חלקה מתוך פונקציית המרחק ---- */
      function mesh(F,h){const p=2.5*h,bb=F.bb,x0=bb[0]-p,y0=bb[1]-p,z0=bb[2]-p;
        const nx=Math.ceil((bb[3]+p-x0)/h)+1,ny=Math.ceil((bb[4]+p-y0)/h)+1,nz=Math.ceil((bb[5]+p-z0)/h)+1;
        const val=new Float32Array(nx*ny*nz),I=(i,j,k)=>i+nx*(j+ny*k);
        for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)val[I(i,j,k)]=F(x0+i*h,y0+j*h,z0+k*h);
        const cx=nx-1,cy=ny-1,CI=(i,j,k)=>i+cx*(j+cy*k),vid=new Int32Array(cx*cy*(nz-1)).fill(-1),P=[];
        const CO=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]],ED=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
        const cv=new Float32Array(8);
        for(let k=0;k<nz-1;k++)for(let j=0;j<cy;j++)for(let i=0;i<cx;i++){let neg=0;
          for(let c=0;c<8;c++){const o=CO[c];cv[c]=val[I(i+o[0],j+o[1],k+o[2])];if(cv[c]<0)neg++}
          if(neg===0||neg===8)continue;let sx=0,sy=0,sz=0,n=0;
          for(const [a,b] of ED){const va=cv[a],vb=cv[b];if((va<0)===(vb<0))continue;const t=va/(va-vb),A=CO[a],B=CO[b];sx+=A[0]+(B[0]-A[0])*t;sy+=A[1]+(B[1]-A[1])*t;sz+=A[2]+(B[2]-A[2])*t;n++}
          vid[CI(i,j,k)]=P.length/3;P.push(x0+(i+sx/n)*h,y0+(j+sy/n)*h,z0+(k+sz/n)*h)}
        const idx=[],quad=(a,b,c,d)=>{if(a<0||b<0||c<0||d<0)return;idx.push(a,b,c,a,c,d)};
        for(let k=1;k<nz-1;k++)for(let j=1;j<cy;j++)for(let i=1;i<cx;i++){const v0=val[I(i,j,k)]<0;
          if(i<cx&&(val[I(i+1,j,k)]<0)!==v0)quad(vid[CI(i,j-1,k-1)],vid[CI(i,j,k-1)],vid[CI(i,j,k)],vid[CI(i,j-1,k)]);
          if(j<cy&&(val[I(i,j+1,k)]<0)!==v0)quad(vid[CI(i-1,j,k-1)],vid[CI(i,j,k-1)],vid[CI(i,j,k)],vid[CI(i-1,j,k)]);
          if(k<nz-1&&(val[I(i,j,k+1)]<0)!==v0)quad(vid[CI(i-1,j-1,k)],vid[CI(i,j-1,k)],vid[CI(i,j,k)],vid[CI(i-1,j,k)])}
        // הצמדה למשטח ונורמלים מהגרדיאנט
        const N=new Float32Array(P.length);
        for(let v=0;v<P.length;v+=3){let x=P[v],y=P[v+1],z=P[v+2];for(let it=0;it<2;it++){const d=F(x,y,z),g=grad(F,x,y,z,h*.5);x-=g[0]*d;y-=g[1]*d;z-=g[2]*d}
          P[v]=x;P[v+1]=y;P[v+2]=z;const g=grad(F,x,y,z,h*.5);N[v]=g[0];N[v+1]=g[1];N[v+2]=g[2]}
        // כיוון המשולשים לפי הנורמל
        for(let t=0;t<idx.length;t+=3){const a=idx[t]*3,b=idx[t+1]*3,c=idx[t+2]*3;
          const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],wx=P[c]-P[a],wy=P[c+1]-P[a+1],wz=P[c+2]-P[a+2];
          const fx=uy*wz-uz*wy,fy=uz*wx-ux*wz,fz=ux*wy-uy*wx;if(fx*(N[a]+N[b]+N[c])+fy*(N[a+1]+N[b+1]+N[c+1])+fz*(N[a+2]+N[b+2]+N[c+2])<0){const s=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=s}}
        return{P,N,idx}}

      /* ---- חומרי פרווה: שכבות קליפה, תלתלי שיער, והסתרה מתחת לבגדים ---- */
      const COVU=()=>({uCov:{value:0},uX0:{value:0},uX1:{value:0},uTilt:{value:0},uYC:{value:.6},uSB:{value:-1},uHood:{value:0},uHC:{value:new THREE.Vector3()},uHR:{value:new THREE.Vector3(1,1,1)}});
      function furMat(o){// o: {layer,len,grav,freq,kind,abs,lock,tex,rough}
        const U=Object.assign(COVU(),{uL:{value:o.layer||0},uLen:{value:o.len||0},uGrav:{value:o.grav||0},uFreq:{value:o.freq||150},uAbs:{value:o.abs.clone()},uKind:{value:o.kind},uShell:{value:o.layer>0?1:0},uLyr:{value:(o.layer>0||o.lock)?1:0},uLock:{value:o.lock?1:0},uRot:{value:new THREE.Matrix3()},uInvM:{value:new THREE.Matrix4()},uFloor:{value:.004}});
        const m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:o.rough||.82,side:o.lock?THREE.DoubleSide:THREE.FrontSide,map:o.tex?o.tex.m:null,alphaMap:o.tex?o.tex.a:null,alphaTest:o.lock?.42:0});
        m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
          sh.vertexShader='uniform float uL,uLen,uGrav;uniform vec3 uAbs;varying vec3 vR;varying vec3 vB;\n'+(o.lock?'attribute vec3 aRoot;uniform mat3 uRot;uniform mat4 uInvM;uniform float uFloor;\n':'')+sh.vertexShader.replace('#include <begin_vertex>',
            '#include <begin_vertex>\nvB=position;'+(o.lock?'vR=aRoot;vec3 rl=aRoot-uAbs,dd=transformed-rl;transformed=rl+mix(dd,uRot*dd,clamp(length(dd)/.06,0.,1.));vec4 wq=modelMatrix*vec4(transformed,1.);if(wq.y<uFloor){wq.y=uFloor;transformed=(uInvM*wq).xyz;}':'vR=position+uAbs;')+'transformed+=normal*uLen*uL;transformed.y-=uGrav*uL*uL;');
          sh.fragmentShader='uniform float uL,uFreq,uKind,uShell,uLyr,uLock,uCov,uX0,uX1,uTilt,uYC,uSB,uHood;uniform vec3 uHC,uHR;varying vec3 vR;varying vec3 vB;\nfloat hh(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+
            sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
            if(uCov>.5&&uLyr>.5){
              if(uLock>.5&&(uKind<.5||(uKind>1.5&&uKind<2.5&&vR.y<.97&&vR.x<.5)))discard;
              if(uKind<.5){float c=(vR.y-uYC)/max(1e-4,length(vec2(vR.y-uYC,vR.z)));if(vR.x>uX0-uTilt*c+.012&&vR.x<uX1-uTilt*c-.012)discard;}
              else if(uKind<1.5){if(uSB>0.&&vR.y>uSB+.006)discard;}
              else if(uKind<2.5&&uHood>.5){vec3 u=(vR-uHC)/uHR;if(dot(u,u)<1.05&&!((u.x>.3&&u.y<.5)||u.y<-.3))discard;}
            }
            if(uShell>.5){vec3 q=vB*uFreq,ci=floor(q),f=fract(q);float h1=hh(ci);vec3 j=vec3(hh(ci+1.3),hh(ci+2.7),hh(ci+5.1))*.6+.2;
              if(length(f-j)>(.5+.3*h1)*(1.-uL*.82))discard;diffuseColor.rgb*=.66+.34*uL+.08*(h1-.5);}`);
          sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a=1.0;');
          if(o.lock)sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>',THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0','1.0'))};
        m.userData.U=U;return m}
      // מרקם שיער לתלתלים: קווים דקים לאורך, שמתדלדלים בקצה
      let HT=null;const hairTex=()=>HT||(HT=(()=>{const mk=()=>{const c=document.createElement('canvas');c.width=64;c.height=256;return c};
        const cc=mk(),ca=mk(),x=cc.getContext('2d'),y=ca.getContext('2d');x.fillStyle='rgb(200,200,200)';x.fillRect(0,0,64,256);y.fillStyle='#000';y.fillRect(0,0,64,256);
        for(let i=0;i<110;i++){const px=32+(Math.random()-.5)*Math.random()*58,end=256*(.8+Math.random()*.2),b=185+Math.random()*70|0,w=1+Math.random()*1.8,c1=(Math.random()-.5)*8,c2=(Math.random()-.5)*10,c3=(Math.random()-.5)*12;
          const path=t=>{t.beginPath();t.moveTo(px,0);t.bezierCurveTo(px+c1,end*.35,px+c2,end*.7,px+c3,end)};
          x.strokeStyle=`rgb(${b},${b},${b})`;x.lineWidth=w;path(x);x.stroke();
          const g=y.createLinearGradient(0,0,0,end);g.addColorStop(0,'rgb(0,0,0)');g.addColorStop(.12,'rgb(255,255,255)');g.addColorStop(.85,'rgb(235,235,235)');g.addColorStop(1,'rgb(0,0,0)');
          y.strokeStyle=g;y.lineWidth=w;path(y);y.stroke()}
        const m=new THREE.CanvasTexture(cc),a=new THREE.CanvasTexture(ca);m.anisotropy=a.anisotropy=4;return{m,a}})());
      let LT=null;const leatherTex=()=>LT||(LT=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,128,128);
        for(let i=0;i<260;i++){x.beginPath();x.arc(Math.random()*128,Math.random()*128,2+Math.random()*3,0,6.283);x.fillStyle=`rgba(${Math.random()<.5?255:0},${Math.random()<.5?255:0},${Math.random()<.5?255:0},.18)`;x.fill()}
        x.strokeStyle='rgba(0,0,0,.5)';for(let i=0;i<90;i++){x.beginPath();const a=Math.random()*128,b=Math.random()*128;x.arc(a,b,3+Math.random()*3,0,6.283);x.stroke()}return new THREE.CanvasTexture(c)})());

      /* ---- בניית חלק גוף עם עור, פרווה ונתוני צבע ---- */
      function bodyPart(rig,g,F,h,kind,coat,pat){const M=mesh(F,h),abs=g.userData.abs,n=M.P.length/3;
        const pos=new Float32Array(M.P.length);for(let i=0;i<n;i++){pos[i*3]=M.P[i*3]-abs.x;pos[i*3+1]=M.P[i*3+1]-abs.y;pos[i*3+2]=M.P[i*3+2]-abs.z}
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(M.N),3));
        const col=new Float32Array(n*3);geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setIndex(M.idx);
        const bk=new Float32Array(n),w=new Float32Array(n),t=new Float32Array(n),w2=new Float32Array(n),s2=new Float32Array(n);for(let i=0;i<n;i++){const P=[M.P[i*3],M.P[i*3+1],M.P[i*3+2]];const q=pat(P,kind);w[i]=q[0];t[i]=q[1];bk[i]=q[2]||0;const r3=triPat(P,kind);w2[i]=r3[0];s2[i]=r3[1]}
        rig.paints.push({a:geo.attributes.color,w,t,w2,s:s2,b:bk});
        const base=new THREE.Mesh(geo,furMat({layer:0,abs,kind:kind.k}));g.add(base);rig.mats.push(base.material);
        const S=coat.shell;if(S&&!(coat.noShell&&coat.noShell(kind.n)))for(let l=1;l<=S.n;l++){const m=new THREE.Mesh(geo,furMat({layer:l/S.n,len:S.len*(kind.sl||1),grav:S.grav,freq:S.freq,abs,kind:kind.k}));m.renderOrder=l;g.add(m);rig.mats.push(m.material);if(l%2&&l<S.n)(rig.shellOdd=rig.shellOdd||[]).push(m)}
        return{F,M,g,kind}}

      /* ---- תלתלי שיער: כל תלתל "נופל" עם כובד ומחליק על הגוף ---- */
      function locks(rig,part,spec,pat){const {F,M,g,kind}=part,abs=g.userData.abs,n=M.P.length/3,S=spec.seg||7,R=[];let guard=0;
        const rnd=spec.rnd;while(R.length<spec.n&&guard++<spec.n*40){const i=(rnd()*n)|0,p=[M.P[i*3],M.P[i*3+1],M.P[i*3+2]],nn=[M.N[i*3],M.N[i*3+1],M.N[i*3+2]];if(spec.sel(p,nn,rnd))R.push([p,nn])}
        const pos=[],nor=[],uv=[],root=[],idx=[],W=[],T=[],W2=[],S2=[];
        R.forEach(([p,nn])=>{const len=spec.len(p,rnd),wid=spec.wid*(.75+rnd()*.5),fl=spec.flow(p,nn,rnd),gr=spec.grav==null?1:spec.grav,off=spec.off||.004;
          let v=[nn[0]*fl[3]+fl[0],nn[1]*fl[3]+fl[1],nn[2]*fl[3]+fl[2]];let l=Math.hypot(v[0],v[1],v[2])||1;v=v.map(a=>a/l);
          let q=[p[0]+nn[0]*off,p[1]+nn[1]*off,p[2]+nn[2]*off];const pts=[q.slice()],step=len/S,tw=(rnd()-.5)*.6;
          for(let s=1;s<=S;s++){v[1]-=.22*gr;l=Math.hypot(v[0],v[1],v[2]);v=v.map(a=>a/l);let q2=[q[0]+v[0]*step,q[1]+v[1]*step,q[2]+v[2]*step];
            const d=F(q2[0],q2[1],q2[2]),cl=(spec.clear||.008)*(1+s*.04);if(d<cl){const gg=grad(F,q2[0],q2[1],q2[2]);q2=[q2[0]+gg[0]*(cl-d),q2[1]+gg[1]*(cl-d),q2[2]+gg[2]*(cl-d)]}
            if(spec.floor!=null&&q2[1]<spec.floor+.01*rnd())q2[1]=spec.floor+.004;
            v=[q2[0]-q[0],q2[1]-q[1],q2[2]-q[2]];l=Math.hypot(v[0],v[1],v[2])||1;v=v.map(a=>a/l);q=q2;pts.push(q.slice())}
          const q0=pat(p,kind),q3=triPat(p,kind),b=pos.length/3;
          pts.forEach((c,i)=>{const t=i<S?[pts[i+1][0]-c[0],pts[i+1][1]-c[1],pts[i+1][2]-c[2]]:[c[0]-pts[i-1][0],c[1]-pts[i-1][1],c[2]-pts[i-1][2]];
            const o=grad(F,c[0],c[1],c[2],.004);let sd=[t[1]*o[2]-t[2]*o[1],t[2]*o[0]-t[0]*o[2],t[0]*o[1]-t[1]*o[0]];l=Math.hypot(sd[0],sd[1],sd[2]);if(l<1e-6){sd=[0,0,1];l=1}
            const ca=Math.cos(tw*i/S),sa=Math.sin(tw*i/S);sd=sd.map((a,k)=>a/l*ca+o[k]*sa);
            const ww=wid*(1-.45*Math.pow(i/S,1.6))*.5;
            for(const sg of [-1,1]){pos.push(c[0]+sd[0]*ww*sg-abs.x,c[1]+sd[1]*ww*sg-abs.y,c[2]+sd[2]*ww*sg-abs.z);nor.push(o[0]*.8+nn[0]*.2,o[1]*.8+nn[1]*.2,o[2]*.8+nn[2]*.2);uv.push(sg<0?0:1,i/S);root.push(p[0],p[1],p[2]);
              W2.push(q3[0]);S2.push(q3[1]);W.push(Math.min(1,q0[0]+(spec.lw||0)));T.push(q0[1]*(.62+.38*Math.min(1,i/S*1.5))*(spec.tone||.9))}
            if(i<S){const a=b+i*2;idx.push(a,a+1,a+3,a,a+3,a+2)}})});
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
        geo.setAttribute('aRoot',new THREE.Float32BufferAttribute(root,3));const col=new Float32Array(pos.length);geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setIndex(idx);geo.computeBoundingSphere();
        rig.paints.push({a:geo.attributes.color,w:new Float32Array(W),t:new Float32Array(T),w2:new Float32Array(W2),s:new Float32Array(S2)});
        const m=new THREE.Mesh(geo,furMat({lock:true,tex:hairTex(),abs,kind:kind.k,rough:.85}));m.frustumCulled=false;g.add(m);rig.mats.push(m.material);(rig.lockMeshes=rig.lockMeshes||[]).push(m);rig.lockCount=(rig.lockCount||0)+R.length;return m}

      /* ---- עיניים, אף, ציפורניים ---- */
      const SP2=new THREE.SphereGeometry(1,20,14);
      function eye2(g,at,rad,dir,lidCol,o){o=o||{};const e=new THREE.Group();e.position.copy(V(at)).sub(g.userData.abs);g.add(e);
        const d=V(dir).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),d);
        const iris=new THREE.Mesh(SP2,new THREE.MeshStandardMaterial({color:lin(o.iris||0x3b200f),roughness:.35}));iris.scale.setScalar(rad);e.add(iris);
        const pup=new THREE.Mesh(SP2,new THREE.MeshStandardMaterial({color:0x040303,roughness:.2}));if(o.slit)pup.scale.set(rad*.16,rad*.68,rad*.3);else pup.scale.set(rad*.55,rad*.55,rad*.3);pup.position.copy(d).multiplyScalar(rad*.82);pup.quaternion.copy(q);e.add(pup);
        const cor=new THREE.Mesh(SP2,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.03,metalness:.1,transparent:true,opacity:.16}));cor.scale.setScalar(rad*1.06);e.add(cor);
        const gl=new THREE.Mesh(SP2,new THREE.MeshBasicMaterial({color:0xffffff}));gl.scale.setScalar(rad*.2);gl.position.copy(d).multiplyScalar(rad*.92).add(new THREE.Vector3(rad*.25,rad*.38,0));e.add(gl);
        const gl2=new THREE.Mesh(SP2,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7}));gl2.scale.setScalar(rad*.09);gl2.position.copy(d).multiplyScalar(rad*.95).add(new THREE.Vector3(-rad*.22,-rad*.3,0));e.add(gl2);
        const lid=new THREE.Mesh(new THREE.TorusGeometry(rad*1.04,rad*.2,10,36),new THREE.MeshStandardMaterial({color:lin(lidCol||0x241712),roughness:.55}));lid.quaternion.copy(q);lid.scale.set(1.12,1,1);lid.position.copy(d).multiplyScalar(rad*.28);e.add(lid);
        e.userData.iris=iris;return e}
      function nose3(g,at,r,col){const n=new THREE.Group();n.position.copy(V(at)).sub(g.userData.abs);g.add(n);const lt=leatherTex();
        const m=new THREE.MeshStandardMaterial({color:lin(col||0x16110f),roughness:.42,bumpMap:lt,bumpScale:.6});
        const b=new THREE.Mesh(SPH,m);b.scale.set(r[0],r[1],r[2]);n.add(b);
        const top=new THREE.Mesh(SPH,m);top.scale.set(r[0]*.8,r[1]*.55,r[2]*.92);top.position.set(-r[0]*.15,r[1]*.45,0);n.add(top);
        const dk=new THREE.MeshStandardMaterial({color:0x050404,roughness:.8});
        [1,-1].forEach(s=>{const h=new THREE.Mesh(SPH,dk);h.scale.set(r[0]*.32,r[1]*.3,r[2]*.24);h.position.set(r[0]*.72,-r[1]*.05,s*r[2]*.42);h.rotation.y=s*.5;n.add(h)});
        const ph=new THREE.Mesh(new THREE.BoxGeometry(r[0]*.3,r[1]*1.2,r[2]*.06),dk);ph.position.set(r[0]*.82,-r[1]*.6,0);n.add(ph);return n}
      function nails(g,pts,col){const m=new THREE.MeshStandardMaterial({color:lin(col||0x2a2420),roughness:.35}),geo=new THREE.ConeGeometry(.007,.022,8);
        pts.forEach(p=>{const c=new THREE.Mesh(geo,m);c.position.copy(V(p)).sub(g.userData.abs);c.rotation.z=-1.9;g.add(c)})}

      /* ---- פלטת צבע: ערבוב בין צבע ראשי ללבן, וגוון לכל נקודה ---- */
      const WHITE=lin(0xf4efe6);
      const BLK=lin(0x1b1512);
      function paintRig(rig,main,tri){const r=main.r,g=main.g,b=main.b;
        rig.paints.forEach(P=>{const a=P.a.array,n=P.w.length,T3=tri&&P.s;for(let i=0;i<n;i++){let w=P.w[i],t=P.t[i],R=r,G=g,B=b;
          if(T3){const s=P.s[i];R=r+(BLK.r-r)*s;G=g+(BLK.g-g)*s;B=b+(BLK.b-b)*s;w=P.w2[i]}else if(P.b&&P.b[i]){const k=P.b[i],D=rig.dark||BLK;R=r+(D.r-r)*k;G=g+(D.g-g)*k;B=b+(D.b-b)*k}
          a[i*3]=(R+(WHITE.r-R)*w)*t;a[i*3+1]=(G+(WHITE.g-G)*w)*t;a[i*3+2]=(B+(WHITE.b-B)*w)*t}P.a.needsUpdate=true})}

      /* ---- מפרט הגזעים ---- */
      const L=(z,a)=>a.map(p=>[p[0],p[1],p[2]*z]);
      function legSpec(front,z,o){// רגל בקואורדינטות מוחלטות; z = צד
        const s=z>0?1:-1,x=front?.27:-.32,q=o||{};
        if(front)return[[E([x-.01,.5,z],[q.ua||.076,.13,q.uz||.066])],[C([x-.005,.42,z],[x+.005,.12,z],q.fa||.048,q.fb||.04),.04],[C([x+.005,.12,z],[x+.025,.048,z],q.fb||.04,.036),.03],
          [E([x+.04,.033,z],[q.px||.058,.033,q.pz||.048]),.025],[E([x+.085,.028,z+.016*s],[.021,.02,.019]),.012],[E([x+.085,.028,z-.016*s],[.021,.02,.019]),.012],[E([x+.072,.026,z+.04*s],[.019,.018,.017]),.012],[E([x+.072,.026,z-.038*s],[.019,.018,.017]),.012]];
        return[[E([x+.015,.53,z],[q.tx||.13,.16,q.tz||.082])],[C([x-.01,.4,z],[x-.075,.19,z],q.ga||.062,q.gb||.042),.05],[C([x-.075,.19,z],[x-.055,.05,z],q.gb||.042,.036),.03],
          [E([x-.04,.033,z],[q.px||.056,.032,q.pz||.047]),.025],[E([x+.005,.028,z+.016*s],[.02,.019,.018]),.012],[E([x+.005,.028,z-.016*s],[.02,.019,.018]),.012],[E([x-.008,.026,z+.038*s],[.018,.017,.016]),.012],[E([x-.008,.026,z-.037*s],[.018,.017,.016]),.012]]}
      const nailPts=(front,z)=>{const s=z>0?1:-1,x=front?.27:-.32,b=front?x+.105:x+.025,b2=front?x+.09:x+.012;return[[b,.022,z+.016*s],[b,.022,z-.016*s],[b2,.02,z+.04*s],[b2,.02,z-.038*s]]};

      const SPEC={
        lab:{name:'לברדור',color:'rgb(222,186,132)',coat:{shell:{n:3,len:.0065,grav:.001,freq:230}},
          trunk:[[E([.08,.64,0],[.3,.215,.19])],[E([.27,.6,0],[.18,.25,.188]),.08],[E([.2,.75,0],[.16,.1,.15]),.06],[C([-.12,.67,0],[-.33,.66,0],.155,.17),.08],[E([-.35,.665,0],[.2,.19,.195]),.07],[E([.4,.66,0],[.06,.09,.09]),.05],[E([-.5,.72,0],[.065,.065,.065]),.05],[C([.26,.7,0],[.4,.86,0],.15,.125),.1]],
          neck:[C([.24,.7,0],[.47,.96,0],.155,.11),.0],
          head:[[E([.5,1.055,0],[.17,.135,.152])],[E([.41,1.07,0],[.09,.09,.11]),.06],[E([.59,1.105,.058],[.052,.038,.048]),.04],[E([.59,1.105,-.058],[.052,.038,.048]),.04],
            [E([.575,1.0,.078],[.085,.07,.066]),.05],[E([.575,1.0,-.078],[.085,.07,.066]),.05],[C([.6,1.008,0],[.775,.992,0],.082,.066),.05],
            [E([.715,.955,.04],[.075,.042,.04]),.03],[E([.715,.955,-.04],[.075,.042,.04]),.03],[E([.505,1.095,.135],[.045,.03,.03]),.03],[E([.505,1.095,-.135],[.045,.03,.03]),.03],[E([.618,1.077,.088],[.03,.03,.03]),.012,'s'],[E([.618,1.077,-.088],[.03,.03,.03]),.012,'s']],
          jaw:[[E([.68,.935,0],[.085,.026,.052])]],
          ear:s=>[[flatZ(C([.505,1.09,s*.142],[.55,.955,s*.16],.056,.024),s*.15,3.4)],[flatZ(E([.522,1.04,s*.15],[.058,.068,.04]),s*.15,3.4),.03]],
          tail:[[C([-.5,.735,0],[-.66,.64,0],.058,.046)],[C([-.66,.64,0],[-.8,.47,0],.046,.02),.03]],tailPivot:[-.5,.74,0],
          eyes:{at:[.616,1.077,.087],r:.024,dir:[.55,.06,.83]},nose:{at:[.832,1.01,0],r:[.03,.028,.045]},
          leg:{tx:.115,tz:.07},earPivot:[.51,1.1,.14],tz:.6,
          fit:{H:{c:[.5,1.1,0],o:[.01,-.075,0],s:[.9,.86,.86]},F:{c:[.628,1.07,0],o:[-.01,.008,0],s:[1,1,1.08]},N:{c:[.37,.79,0],o:[0,0,0],s:[.92,.92,.92]}},
          legR:.07,mouth:[.38,.13,0],cam:{y:.72,z:4.15,look:.72}},
        golden:{name:'גולדן רטריבר',color:'rgb(206,146,70)',coat:{shell:{n:4,len:.014,grav:.005,freq:200}},
          trunk:[[E([.08,.645,0],[.3,.21,.182])],[E([.27,.605,0],[.18,.245,.18]),.08],[E([.2,.75,0],[.16,.1,.145]),.06],[C([-.12,.67,0],[-.33,.66,0],.15,.165),.08],[E([-.34,.665,0],[.19,.182,.182]),.07],[E([.42,.66,0],[.075,.1,.1]),.05],[E([-.5,.72,0],[.055,.055,.055]),.05],[C([.26,.7,0],[.4,.86,0],.145,.12),.1]],
          neck:[C([.29,.73,0],[.47,.95,0],.135,.104),.0],
          head:[[E([.5,1.055,0],[.155,.135,.132])],[E([.41,1.08,0],[.085,.085,.095]),.06],[E([.585,1.1,.052],[.048,.035,.043]),.04],[E([.585,1.1,-.052],[.048,.035,.043]),.04],
            [E([.57,1.005,.07],[.075,.062,.058]),.05],[E([.57,1.005,-.07],[.075,.062,.058]),.05],[C([.6,1.008,0],[.78,.99,0],.07,.056),.05],
            [E([.72,.958,.036],[.07,.038,.036]),.03],[E([.72,.958,-.036],[.07,.038,.036]),.03],[E([.616,1.08,.084],[.03,.03,.03]),.012,'s'],[E([.616,1.08,-.084],[.03,.03,.03]),.012,'s']],
          jaw:[[E([.69,.94,0],[.085,.024,.048])]],
          ear:s=>[[flatZ(C([.5,1.11,s*.13],[.525,.99,s*.152],.046,.034),s*.145,2.5)],[flatZ(E([.51,1.06,s*.142],[.052,.058,.04]),s*.145,2.5),.03]],
          tail:[[C([-.5,.735,0],[-.66,.66,0],.045,.035)],[C([-.66,.66,0],[-.8,.56,0],.035,.016),.02]],tailPivot:[-.5,.74,0],
          eyes:{at:[.614,1.08,.083],r:.024,dir:[.58,.06,.81]},nose:{at:[.832,1.0,0],r:[.029,.027,.042]},
          leg:{ua:.07,uz:.062,fa:.044,fb:.037,tx:.12,tz:.078,ga:.058,gb:.039,px:.054,pz:.045},earPivot:[.5,1.11,.135],tz:.6,
          fit:{H:{c:[.5,1.1,0],o:[.01,-.06,0],s:[.92,.9,.9]},F:{c:[.628,1.07,0],o:[-.012,.01,0],s:[1,1,1.04]},N:{c:[.37,.79,0],o:[0,0,0],s:[.95,.95,.95]}},
          legR:.07,mouth:[.38,.13,0],cam:{y:.72,z:4.15,look:.72}},
        beagle:{name:'ביגל',color:'tri:rgb(178,110,54)',coat:{shell:{n:3,len:.006,grav:.001,freq:240}},legK:.86,
          trunk:[[E([.08,.64,0],[.29,.2,.18])],[E([.27,.6,0],[.17,.24,.178]),.08],[E([.2,.75,0],[.15,.095,.14]),.06],[C([-.12,.67,0],[-.33,.66,0],.148,.16),.08],[E([-.35,.665,0],[.19,.18,.185]),.07],[E([.4,.66,0],[.06,.085,.085]),.05],[C([.26,.7,0],[.4,.86,0],.145,.12),.1]],
          neck:[C([.25,.7,0],[.47,.96,0],.15,.11),.0],
          head:[[E([.49,1.065,0],[.165,.145,.15])],[E([.41,1.085,0],[.095,.095,.11]),.06],[E([.585,1.11,.056],[.05,.036,.046]),.04],[E([.585,1.11,-.056],[.05,.036,.046]),.04],
            [E([.57,1.0,.074],[.08,.068,.064]),.05],[E([.57,1.0,-.074],[.08,.068,.064]),.05],[C([.6,1.008,0],[.76,.99,0],.084,.07),.05],
            [E([.7,.952,.042],[.072,.045,.042]),.03],[E([.7,.952,-.042],[.072,.045,.042]),.03],[E([.616,1.08,.088],[.031,.031,.031]),.012,'s'],[E([.616,1.08,-.088],[.031,.031,.031]),.012,'s']],
          jaw:[[E([.665,.932,0],[.082,.026,.052])]],
          ear:s=>[[flatZ(C([.5,1.09,s*.146],[.56,.87,s*.168],.062,.034),s*.152,3.6)],[flatZ(E([.53,.99,s*.158],[.066,.095,.04]),s*.152,3.6),.035]],
          tail:[[C([-.5,.74,0],[-.6,.93,0],.05,.04)],[C([-.6,.93,0],[-.63,1.09,0],.04,.022),.03]],tailPivot:[-.5,.74,0],
          eyes:{at:[.614,1.08,.089],r:.026,dir:[.55,.06,.83]},nose:{at:[.812,1.006,0],r:[.032,.03,.047]},
          leg:{tx:.11,tz:.068},earPivot:[.51,1.1,.145],tz:.6,
          fit:{H:{c:[.5,1.1,0],o:[0,-.07,0],s:[.92,.88,.88]},F:{c:[.628,1.07,0],o:[-.012,.01,0],s:[1,1,1.08]},N:{c:[.37,.79,0],o:[0,0,0],s:[.92,.92,.92]}},
          legR:.068,mouth:[.36,.13,0],cam:{y:.66,z:3.95,look:.66}},
        dachshund:{name:'תחש',color:'rgb(132,62,30)',coat:{shell:{n:3,len:.005,grav:.001,freq:250}},legK:.36,
          trunk:[[E([-.02,.63,0],[.46,.17,.15])],[E([.26,.58,0],[.16,.19,.15]),.08],[E([.13,.49,0],[.22,.1,.125]),.08],[E([-.12,.54,0],[.26,.09,.12]),.08],[C([-.12,.655,0],[-.44,.665,0],.135,.14),.08],[E([-.46,.67,0],[.14,.15,.15]),.07],[E([.4,.62,0],[.06,.075,.075]),.05],[C([.3,.67,0],[.4,.78,0],.11,.1),.08]],
          neck:[C([.32,.68,0],[.48,.88,0],.11,.09),.0],
          head:[[E([.5,.945,0],[.15,.125,.13])],[E([.42,.965,0],[.085,.085,.1]),.06],[E([.575,.99,.048],[.044,.03,.04]),.04],[E([.575,.99,-.048],[.044,.03,.04]),.04],
            [E([.565,.895,.06],[.07,.055,.05]),.05],[E([.565,.895,-.06],[.07,.055,.05]),.05],[C([.59,.9,0],[.83,.875,0],.068,.044),.05],
            [E([.74,.848,.03],[.085,.032,.03]),.03],[E([.74,.848,-.03],[.085,.032,.03]),.03],[E([.6,.965,.074],[.026,.026,.026]),.012,'s'],[E([.6,.965,-.074],[.026,.026,.026]),.012,'s']],
          jaw:[[E([.715,.828,0],[.1,.02,.04])]],
          ear:s=>[[flatZ(C([.49,.98,s*.12],[.52,.82,s*.14],.06,.042),s*.13,3.2)],[flatZ(E([.51,.89,s*.13],[.066,.082,.035]),s*.13,3.2),.035]],
          tail:[[C([-.56,.72,0],[-.76,.68,0],.04,.026)],[C([-.76,.68,0],[-.9,.6,0],.026,.012),.025]],tailPivot:[-.56,.72,0],
          eyes:{at:[.6,.967,.074],r:.022,dir:[.55,.06,.83]},nose:{at:[.858,.88,0],r:[.026,.025,.036]},
          leg:{ua:.068,uz:.06,fa:.05,fb:.044,tx:.11,tz:.07,ga:.06,gb:.045,px:.062,pz:.05},earPivot:[.5,.99,.12],tz:.6,
          fit:{H:{c:[.5,1.1,0],o:[0,-.18,0],s:[.84,.8,.8]},F:{c:[.628,1.07,0],o:[-.02,-.104,0],s:[.96,.96,.98]},N:{c:[.37,.79,0],o:[0,-.01,0],s:[.85,.85,.85]}},
          legR:.06,mouth:[.42,.06,0],cam:{y:.5,z:3.9,look:.48}},
        shihtzu:{name:'שיצו',color:'rgb(186,128,66)',coat:{shell:{n:3,len:.012,grav:.003,freq:200},noShell:n=>n!=='head'&&n!=='jaw'},legK:.66,
          trunk:[[E([.05,.625,0],[.32,.19,.18])],[E([.27,.6,0],[.17,.21,.18]),.08],[E([.2,.73,0],[.15,.09,.14]),.06],[E([-.32,.635,0],[.18,.18,.18]),.08],[E([-.47,.7,0],[.05,.05,.05]),.04],[C([.28,.7,0],[.38,.84,0],.13,.12),.1]],
          neck:[C([.3,.72,0],[.43,.9,0],.125,.115),.0],
          head:[[E([.48,1.02,0],[.165,.158,.16])],[E([.42,1.08,0],[.1,.09,.12]),.06],[E([.6,1.07,.06],[.045,.035,.045]),.035],[E([.6,1.07,-.06],[.045,.035,.045]),.035],
            [E([.6,.99,.06],[.06,.055,.06]),.04],[E([.6,.99,-.06],[.06,.055,.06]),.04],[E([.635,.975,0],[.055,.052,.07]),.04],[E([.618,1.045,.072],[.036,.036,.036]),.012,'s'],[E([.618,1.045,-.072],[.036,.036,.036]),.012,'s']],
          jaw:[[E([.655,.938,0],[.045,.022,.055])]],
          ear:s=>[[flatZ(C([.43,1.1,s*.15],[.46,.94,s*.178],.042,.036),s*.16,2.4)]],
          tail:[[C([-.48,.74,0],[-.53,.92,0],.042,.036)],[C([-.53,.92,0],[-.43,1.02,0],.036,.024),.02]],tailPivot:[-.48,.76,0],
          eyes:{at:[.626,1.046,.071],r:.03,dir:[.8,.05,.6]},nose:{at:[.703,.992,0],r:[.022,.021,.032]},
          leg:{ua:.062,uz:.056,fa:.042,fb:.036,tx:.11,tz:.075,ga:.054,gb:.038,px:.052,pz:.044},earPivot:[.43,1.1,.15],tz:.8,
          fit:{H:{c:[.5,1.1,0],o:[-.01,-.05,0],s:[1.02,.98,1.02]},F:{c:[.628,1.07,0],o:[0,-.024,0],s:[1,1,.92]},N:{c:[.37,.79,0],o:[-.005,0,0],s:[.98,.98,.98]}},
          legR:.062,mouth:[.3,.15,0],cam:{y:.62,z:3.6,look:.6}}
      };


      /* ---- חתולים: אותה מערכת כמו הכלבים, בקנה מידה של כלב (המצלמה מתקרבת) ---- */
      function catSpec(o){const k=o.chub||1,eK=o.earK||1,tl=o.tailR||1,DX=-.05,DY=-.08,h=q=>[q[0]+DX,q[1]+DY,q[2]];
        return{cat:1,legK:.74,headC:h([.64,1.02,0]),name:o.name,color:o.color,dark:o.dark,iris:o.iris,lid:o.lid||0x2a2220,noseCol:o.nose||0xd98a95,whisk:o.whisk,earK:eK,coat:o.coat,
          trunk:[[E([0,.66,0],[.42,.17*k,.16*k])],[E([.28,.64,0],[.15,.19*k,.15*k]),.08],[E([-.3,.665,0],[.18,.18*k,.165*k]),.08],[E([0,.77,0],[.3,.075,.12*k]),.06],[E([.02,.56,0],[.24,.07,.11*k]),.07],[C([.3,.72,0],[.44,.86,0],.12,.1),.08]],
          neck:[C([.34,.72,0],[.5,.88,0],.12*k,.105*k),.0],
          head:[[E(h([.64,1.02,0]),[.165*k,.15,.175*k])],[E(h([.6,1.1,0]),[.12,.075,.13*k]),.05],[E(h([.7,.955,.075]),[.1,.08,.085*k]),.05],[E(h([.7,.955,-.075]),[.1,.08,.085*k]),.05],
            [E(h([.795,.952,.032]),[.05,.04,.045]),.03],[E(h([.795,.952,-.032]),[.05,.04,.045]),.03],[E(h([.775,.905,0]),[.045,.028,.04]),.03],[E(h([.78,1.035,.074]),[.03,.03,.03]),.012,'s'],[E(h([.78,1.035,-.074]),[.03,.03,.03]),.012,'s']],
          jaw:[[E(h([.77,.9,0]),[.046,.015,.04])]],
          ear:s=>[[flatX(C(h([.6,1.1,s*.1]),h([.6,1.1+.16*eK,s*(.15+.03*eK)]),.08*eK,.006),.6+DX,2.6)]],
          tail:[[C([-.58,.74,0],[-.76,.9,0],.042*tl,.04*tl)],[C([-.76,.9,0],[-.8,1.2,0],.04*tl,.03*tl),.03]],tailPivot:[-.58,.74,0],
          eyes:{at:h([.772,1.035,.074]),r:.031,dir:[.78,.05,.62]},nose:{at:h([.835,.975,0]),r:[.016,.013,.022]},
          leg:{ua:.058,uz:.05,fa:.036,fb:.03,tx:.1,tz:.06,ga:.05,gb:.033,px:.042,pz:.036},earPivot:h([.6,1.12,.1]),tz:.8,
          fit:{H:{c:[.5,1.1,0],o:[0,0,0],s:[1,1,1]},F:{c:[.628,1.07,0],o:[0,0,0],s:[1,1,1]},N:{c:[.37,.79,0],o:[0,0,0],s:[1,1,1]}},
          legR:.045,mouth:[.37,.03,0],cam:{y:.56,z:3.3,look:.5},pat:o.pat}}
      const SH=(n,len,grav)=>({shell:{n,len,grav:grav||.001,freq:260}});
      const CATS={
        tabby:{name:'ג׳ינג׳י מפוספס',color:'rgb(222,140,62)',dark:0x9a4a18,iris:0xc9b23a,coat:SH(3,.006),pat:'tabby'},
        siamese:{name:'סיאמי',color:'rgb(236,224,204)',dark:0x3e2a20,iris:0x4f93e0,coat:SH(3,.004),pat:'point'},
        black:{name:'חתול שחור',color:'rgb(30,28,32)',iris:0xd8b83a,coat:SH(3,.005),pat:'solid',whisk:0x3a3638},
        grey:{name:'בריטי קצר שיער',color:'rgb(128,136,148)',iris:0xd88a26,coat:SH(4,.008),pat:'solid',chub:1.13,nose:0x5e6672},
        persian:{name:'פרסי',color:'rgb(244,240,233)',iris:0x4a8fd8,coat:SH(6,.026,.012),pat:'solid',chub:1.12,earK:.8,tailR:1.5},
        tuxedo:{name:'טוקסידו',color:'rgb(30,28,32)',iris:0x9ccf3a,coat:SH(3,.005),pat:'tux'},
        calico:{name:'קליקו',color:'rgb(226,150,74)',dark:0x1c1818,iris:0xd1a03a,coat:SH(3,.006),pat:'calico'},
        mainecoon:{name:'מיין קון',color:'rgb(150,108,70)',dark:0x2e2018,iris:0x9cae3a,coat:SH(6,.022,.008),pat:'tabby',chub:1.1,earK:1.25,tailR:1.6}};
      for(const k in CATS)SPEC['cat_'+k]=catSpec(CATS[k]);
      function catPat(kind0){const nz=(x,y,z)=>.5+.5*Math.sin(x*37+3)*Math.sin(y*29+5)*Math.sin(z*31+1),lo=(x,y,z)=>Math.sin(x*7.3+1.2)*Math.sin(y*6.1+.4)+Math.sin(z*9.7+x*3.1);
        const cl=(v)=>Math.max(0,Math.min(1,v)),sm=(a,b,v)=>{const t=cl((v-a)/(b-a));return t*t*(3-2*t)};
        const whiteBits=(p,n)=>{if(n==='jaw')return 1;if(n==='head')return (p[0]>.76&&p[1]<.975)?1:0;if(n==='trunk')return (p[0]>.3&&p[1]<.68)||p[1]<.52?1:0;if(n==='leg')return p[1]<.09?1:0;return 0};
        return(p0,k)=>{const n=k.n,p=(n==='head'||n==='jaw'||n==='ear')?[p0[0]+.05,p0[1]+.08,p0[2]]:p0;let w=0,t=.95+.08*nz(p[0],p[1],p[2]),b=0;
          if(kind0==='tabby'){w=whiteBits(p,n)*.85;let st=0;
            if(n==='trunk'){st=sm(.25,.6,Math.sin(p[0]*34+Math.sin(p[1]*12)*1.2))*sm(.55,.75,p[1])}
            else if(n==='leg'){st=sm(.3,.65,Math.sin(p[1]*46))*.8}
            else if(n==='tail'){st=sm(.2,.6,Math.sin((p[1]-p[0])*30))}
            else if(n==='head'){if(p[1]>1.07&&p[0]<.72)st=sm(.3,.7,Math.sin(p[2]*70+1.6))*.9;if(p[0]>.68&&p[1]<1.0&&Math.abs(p[2])>.06)st=Math.max(st,sm(.4,.8,Math.sin(p[1]*80))*.7)}
            b=st*(1-w)*.85}
          else if(kind0==='point'){if(n==='head')b=sm(.66,.8,p[0])*.92;else if(n==='ear'||n==='jaw')b=.95;else if(n==='leg')b=sm(.48,.2,p[1])*.9;else if(n==='tail')b=sm(.82,1.05,p[1]-(p[0]+.58)*.2)*.95+.2;else if(n==='trunk')b=sm(.7,.85,p[1])*.12;b=cl(b)}
          else if(kind0==='tux'){w=whiteBits(p,n);if(n==='trunk'&&p[0]>.2&&p[1]<.74)w=1;if(n==='leg'&&p[1]<.2)w=1}
          else if(kind0==='calico'){const l=lo(p[0],p[1],p[2]);w=whiteBits(p,n);if(n==='trunk'&&(p[1]<.6||p[0]>.32))w=1;if(n==='leg')w=p[1]<.35?1:0;
            if(!w){w=sm(.45,.75,l);b=sm(-.2,-.5,l)}if(n==='ear')b=k.k===5&&p[2]>0?1:0}
          return[w,t,b]}}

      /* ---- דפוסי צבע ---- */
      function patOf(id,seed){if(SPEC[id]&&SPEC[id].pat)return catPat(SPEC[id].pat);const nz=(x,y,z)=>.5+.5*Math.sin(x*37+seed)*Math.sin(y*29+seed*2)*Math.sin(z*31+1);
        if(id==='lab')return(p,k)=>[0,(k.n==='nose'?.5:1)*(.96+.06*nz(p[0],p[1],p[2]))*(p[1]<.5&&k.n==='trunk'?1.04:1)];
        if(id==='beagle')return(p,k)=>{const q=triPat(p,k);let w=q[0];if(k.n==='tail'&&p[1]>1.0)w=1;return[w,.96+.06*nz(p[0],p[1],p[2])]};
        if(id==='dachshund')return(p,k)=>{let t=.95+.07*nz(p[0],p[1],p[2]);if(k.n==='ear')t*=.85;if(k.n==='trunk'&&p[1]>.76)t*=.9;if(k.n==='head'&&p[0]>.7)t*=.9;return[0,t]};
        if(id==='golden')return(p,k)=>{let w=0,t=.95+.08*nz(p[0],p[1],p[2]);if(k.n==='trunk'){if(p[1]<.5)w=.22;t*=p[1]>.78?.9:1}if(k.n==='head'&&p[0]>.62)t*=1.04;if(k.n==='ear')t*=.88;if(k.n==='tail')w=.1;return[w,t]};
        // שיצו: לבן בפנים, זקן, חזה, בטן ורגליים; צבע על האוזניים, הגב וסביב העיניים
        return(p,k)=>{let w=0,t=.97+.05*nz(p[0],p[1],p[2]);
          if(k.n==='head'){const blaze=Math.abs(p[2])<.03+.4*Math.max(0,1.12-p[1])*.2&&p[0]>.52,muz=p[0]>.585&&p[1]<1.015,eyeP=Math.hypot(p[0]-.618,p[1]-1.05,Math.abs(p[2])-.075)<.06;
            w=(blaze||muz)&&!eyeP?1:0;if(p[1]<.93)w=1}
          else if(k.n==='jaw')w=1;else if(k.n==='ear')w=0;
          else if(k.n==='trunk'){w=(p[0]>.3&&p[1]<.78)||p[1]<.52?1:0;if(p[0]<-.42)w=.6}
          else if(k.n==='leg')w=1;else if(k.n==='tail')w=p[1]>.98?.2:.85;
          return[w,t]}}

      /* ---- בניית כלב מגזע ---- */
      function build(id){const sp=SPEC[id],rig={breed:id,paints:[],mats:[]},root=root0();rig.root=root;let sd=7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
        const pat=patOf(id,id.length*1.7),coat=sp.coat;
        const trunk=grp(root,[-.32,.52,0]);rig.trunk=trunk;
        const TF=field(sp.trunk);rig.trunkF=TF;const tp=bodyPart(rig,trunk,TF,.023,{n:'trunk',k:0},coat,pat);
        const legs={},lparts={};
        [['fn',1,.11],['ff',1,-.11],['rn',0,.11],['rf',0,-.11]].forEach(([k,front,z])=>{const x=front?.27:-.32,Lg=grp(front?trunk:root,[x,.52,z]);
          const LF=field(legSpec(front,z,sp.leg));lparts[k]=bodyPart(rig,Lg,LF,.018,{n:'leg',k:front?1:3,sl:.8},coat,pat);if(!sp.cat)nails(Lg,nailPts(front,z));legs[k]=Lg});
        rig.legs=legs;
        const head=grp(trunk,[.36,.8,0]);rig.head=head;
        const HF=field([[sp.neck[0]],...sp.head.map((it,i)=>i===0?[it[0],.06]:it)]);const hp=bodyPart(rig,head,HF,.0135,{n:'head',k:2,sl:.85},coat,pat);
        rig.eyes=[1,-1].map(s=>{const e=sp.eyes;return eye2(head,[e.at[0],e.at[1],e.at[2]*s],e.r,[e.dir[0],e.dir[1],e.dir[2]*s],sp.lid,{iris:sp.iris,slit:sp.cat})});
        nose3(head,sp.nose.at,sp.nose.r,sp.noseCol);if(sp.dark)rig.dark=lin(sp.dark);
        const inside=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0x3a1418),roughness:.8}));const jx=sp.jaw[0][0].b,jc=[(jx[0]+jx[3])/2,(jx[1]+jx[4])/2+.012,0];
        inside.position.copy(V(jc)).sub(head.userData.abs);inside.scale.set((jx[3]-jx[0])*.45,.022,(jx[5]-jx[2])*.4);head.add(inside);
        const jaw=grp(head,[jc[0]-.09,jc[1]+.004,0]);rig.jaw=jaw;const JF=field(sp.jaw);bodyPart(rig,jaw,JF,.009,{n:'jaw',k:4},{shell:coat.shell&&{...coat.shell,n:2}},pat);
        // שפה כהה לאורך הפה
        const lipM=new THREE.MeshStandardMaterial({color:lin(0x2a1d18),roughness:.6});const lip=new THREE.Mesh(new THREE.TorusGeometry(1,.09,6,28,Math.PI),lipM);
        lip.position.copy(V([jc[0]+.005,jc[1]+.006,0])).sub(jaw.userData.abs);lip.rotation.x=Math.PI/2;lip.rotation.z=-Math.PI/2;lip.scale.set((jx[5]-jx[2])*.47,(jx[3]-jx[0])*.52,.08);jaw.add(lip);
        const tongue=new THREE.Mesh(SPH,new THREE.MeshStandardMaterial({color:lin(0xe2707f),roughness:.45}));tongue.position.copy(V([jc[0]+.02,jc[1]-.004,0])).sub(jaw.userData.abs);tongue.scale.set(.055,.012,.034);jaw.add(tongue);rig.tongue=tongue;
        const ears=[1,-1].map(s=>{const ep=sp.earPivot,e=grp(head,[ep[0],ep[1],ep[2]*s]);const EF=field(sp.ear(s));const pp=bodyPart(rig,e,EF,.0085,{n:'ear',k:5,sl:.8},coat,pat);e.userData.part=pp;
          if(sp.cat){const ea=e.userData.abs,pk=new THREE.Mesh(new THREE.ConeGeometry(.052*(sp.earK||1),.15*(sp.earK||1),14),new THREE.MeshStandardMaterial({color:lin(0xe7a3ad),roughness:.75}));pk.scale.set(.3,1,1);pk.position.set(.024,.062*(sp.earK||1),s*.028);pk.rotation.x=s*.3;e.add(pk)}
          return e});rig.ears=ears;
        if(sp.cat){const wm=new THREE.MeshStandardMaterial({color:lin(sp.whisk||0xf4f0ea),roughness:.4}),hb=head.userData.abs;
          [1,-1].forEach(s=>[[.02,.18],[-.004,.2],[-.026,.17]].forEach(([dy,dz])=>{const a=V([sp.nose.at[0]-.035,sp.nose.at[1]-.03+dy*.6,s*.04]),b=V([sp.nose.at[0]-.07,sp.nose.at[1]-.03+dy*2.4,s*(.04+dz)]),L=a.distanceTo(b);
            const c=new THREE.Mesh(new THREE.CylinderGeometry(.0016,.0028,L,5),wm);c.position.copy(a).add(b).multiplyScalar(.5).sub(hb);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());head.add(c)}))}
        const tail=grp(trunk,sp.tailPivot);rig.tail=tail;const TLF=field(sp.tail);const tlp=bodyPart(rig,tail,TLF,.012,{n:'tail',k:6},coat,pat);
        const parts={trunk:tp,head:hp,tail:tlp,ears:ears.map(e=>e.userData.part),legs:lparts};
        hairFor(id,rig,parts,pat,rnd);
        // התאמות לאביזרים: ראש, פנים, צוואר
        const hb=head.userData.abs;const fitG=f=>{const g=new THREE.Group(),c=V(f.c).sub(hb),s=V(f.s);g.position.copy(c).add(V(f.o)).sub(c.clone().multiply(s));g.scale.copy(s);head.add(g);return g};
        rig.HW=fitG(sp.fit.H);rig.FW=fitG(sp.fit.F);rig.NW=fitG(sp.fit.N);
        const HC0=[.45,1.12,0],HR0=[.24,.21,.225],f=sp.fit.H;rig.HCabs=HC0.map((v,i)=>f.c[i]+f.o[i]+f.s[i]*(v-f.c[i]));rig.HRabs=HR0.map((v,i)=>v*f.s[i]);
        rig.legR=sp.legR;rig.headC=sp.headC;rig.mouthP=sp.mouth;rig.cam=sp.cam;rig.tz=sp.tz;rig.defColor=sp.color;
        // שיצו: רגליים קצרות. כל הגוף יורד, והרגליים מתכווצות לגובה
        if(sp.legK){const k=sp.legK,dy=-.52*(1-k);rig.dy=dy;['fn','ff','rn','rf'].forEach(n=>{legs[n].scale.y=k;if(n[0]==='r')legs[n].position.y+=dy});trunk.position.y+=dy}
        shadow(root,1.75,.95);
        const _q=new THREE.Quaternion(),_d=new THREE.Vector3(),_r=new THREE.Quaternion(),_m4=new THREE.Matrix4(),DN=new THREE.Vector3(0,-1,0);
        rig.hair=()=>{if(!rig.lockMeshes||!root.visible)return;root.updateMatrixWorld(true);rig.lockMeshes.forEach(m=>{if(!m.visible)return;const U=m.material.userData.U;
          m.getWorldQuaternion(_q);_d.copy(DN).applyQuaternion(_q.invert());_r.setFromUnitVectors(DN,_d.normalize());U.uRot.value.setFromMatrix4(_m4.makeRotationFromQuaternion(_r));U.uInvM.value.copy(m.matrixWorld).invert()})};
        rig.degrade=()=>{(rig.shellOdd||[]).forEach(m=>m.visible=false)};
        rig.paint=(c,tri)=>paintRig(rig,c,tri);{const tc=sp.color.startsWith('tri:');rig.paint(lin(new THREE.Color(sp.color.replace(/^tri:/,'')).getHex()),tc)}
        rig.shellCover=cv=>{rig.mats.forEach(m=>{const U=m.userData.U;if(!U)return;U.uCov.value=cv?1:0;if(!cv)return;U.uX0.value=cv.b0;U.uX1.value=cv.f0;U.uTilt.value=cv.tilt;U.uSB.value=cv.sb==null?-1:cv.sb;U.uHood.value=cv.headHood?1:0;U.uHC.value.set(...rig.HCabs);U.uHR.value.set(...rig.HRabs)})};
        return rig}

      /* ---- שיער ארוך לפי גזע ---- */
      function hairFor(id,rig,P,pat,rnd){
        const dirTo=(p,v,a)=>[v[0],v[1],v[2],a];
        if(id==='golden'){
          // נוצות: אוזניים, חזה, מאחורי הרגליים, "מכנסיים", בטן וזנב
          P.ears.forEach(pp=>locks(rig,pp,{n:390,rnd,wid:.026,sel:(p,n)=>p[1]<1.09,len:(p,r)=>.045+r()*.05,flow:(p,n)=>[0,-.7,0,.45],grav:.9,lw:.04,tone:.95},pat));
          locks(rig,P.trunk,{n:965,rnd,wid:.026,sel:(p,n)=>p[0]>.22&&n[1]<.25&&p[1]<.74,len:(p,r)=>.06+r()*.07,flow:(p,n)=>[.15,-.6,0,.5],grav:.9,lw:.08,tone:.95},pat);
          locks(rig,P.trunk,{n:873,rnd,wid:.026,sel:(p,n)=>n[1]<-.45&&p[0]>-.28&&p[0]<.25,len:(p,r)=>.05+r()*.045,flow:(p,n)=>[-.1,-.7,0,.35],grav:.9,lw:.1,tone:.95},pat);
          locks(rig,P.trunk,{n:598,rnd,wid:.026,sel:(p,n)=>p[0]<-.36&&n[0]<-.2&&p[1]<.72,len:(p,r)=>.05+r()*.05,flow:(p,n)=>[-.4,-.6,0,.4],grav:.9,lw:.06,tone:.95},pat);
          ['fn','ff'].forEach(k=>locks(rig,P.legs[k],{n:299,rnd,wid:.026,sel:(p,n)=>n[0]<-.25&&p[1]>.15&&p[1]<.47,len:(p,r)=>.04+r()*.035,flow:(p,n)=>[-.5,-.45,0,.45],grav:.7,lw:.06,tone:.95},pat));
          ['rn','rf'].forEach(k=>locks(rig,P.legs[k],{n:390,rnd,wid:.026,sel:(p,n)=>n[0]<-.2&&p[1]>.22&&p[1]<.64,len:(p,r)=>.055+r()*.05,flow:(p,n)=>[-.5,-.55,0,.45],grav:.8,lw:.06,tone:.95},pat));
          locks(rig,P.tail,{n:736,rnd,wid:.026,sel:(p,n)=>n[1]<.35,len:(p,r)=>(.06+r()*.07)*(1-.55*Math.min(1,Math.max(0,(-p[0]-.52)*3.5))),flow:(p,n)=>[-.25,-.65,0,.45],grav:.9,lw:.06,tone:.95},pat);
          locks(rig,P.head,{n:459,rnd,wid:.026,sel:(p,n)=>p[0]<.46&&p[1]<.98&&n[1]<.6,len:(p,r)=>.045+r()*.04,flow:(p,n)=>[.05,-.65,0,.4],grav:.8,lw:.05,tone:.95},pat);
        }
        if(id==='shihtzu'){
          // שיער הגוף: מתחלק על השדרה ונופל עד הרצפה
          locks(rig,P.trunk,{n:2300,rnd,wid:.05,seg:10,sel:(p,n)=>n[1]>-.6,len:(p,r)=>Math.max(.12,(p[1]-.19))*(1.05+r()*.1),flow:(p,n)=>[0,-.3,Math.sign(p[2]||1)*.2,.45],grav:1.3,clear:.012,floor:.19,lw:0},pat);
          locks(rig,P.trunk,{n:380,rnd,wid:.05,seg:8,sel:(p,n)=>p[0]>.28,len:(p,r)=>Math.max(.1,p[1]-.2),flow:(p,n)=>[.25,-.5,0,.45],grav:1.3,clear:.012,floor:.19},pat);
          ['fn','ff','rn','rf'].forEach(k=>locks(rig,P.legs[k],{n:180,rnd,wid:.038,seg:6,sel:(p,n)=>p[1]>.08,len:(p,r)=>Math.max(.04,p[1]-.01)*(1+r()*.08),flow:(p,n)=>[0,-.5,0,.5],grav:1.2,clear:.01,floor:.0},pat));
          // אוזניים מכוסות שיער ארוך
          P.ears.forEach(pp=>locks(rig,pp,{n:300,rnd,wid:.045,seg:9,sel:()=>true,len:(p,r)=>.17+r()*.1,flow:(p,n)=>[0,-.6,Math.sign(p[2])*.12,.45],grav:1.2,clear:.01},pat));
          // שפם וזקן
          locks(rig,P.head,{n:380,rnd,wid:.036,seg:8,sel:(p,n)=>p[0]>.6&&p[1]<1.0&&n[0]>.1,len:(p,r)=>.08+r()*.07,flow:(p,n)=>[.3,-.45,Math.sign(p[2])*.35,.5],grav:.85,clear:.008,lw:.05},pat);
          locks(rig,P.head,{n:240,rnd,wid:.036,seg:7,sel:(p,n)=>p[0]<.55&&p[1]<1.0&&n[1]<.3,len:(p,r)=>.1+r()*.08,flow:(p,n)=>[0,-.6,0,.45],grav:1.1,clear:.01},pat);
          // קוקו על הראש עם סרט
          const tie=[.475,1.215,0],hb=rig.head.userData.abs;
          const tk1=locks(rig,P.head,{n:220,rnd,wid:.034,seg:7,sel:(p,n)=>n[1]>.5&&p[0]>.4&&p[0]<.62,len:(p,r)=>.05+r()*.03,flow:(p,n)=>[tie[0]-p[0],1,tie[2]-p[2],.1],grav:-.4,clear:.006},pat);
          const TF=(x,y,z)=>Math.hypot(x-tie[0],y-tie[1],z-tie[2])-.012;
          const topk={F:TF,M:{P:[],N:[]},g:rig.head,kind:{n:'head',k:2}};for(let i=0;i<160;i++){const a=rnd()*6.283,b=rnd()*.9;const n=[Math.sin(b)*Math.cos(a)-.25,Math.cos(b),Math.sin(b)*Math.sin(a)];const l=Math.hypot(...n);topk.M.P.push(tie[0]+n[0]/l*.012,tie[1]+n[1]/l*.012,tie[2]+n[2]/l*.012);topk.M.N.push(n[0]/l,n[1]/l,n[2]/l)}
          topk.F=(x,y,z)=>Math.min(TF(x,y,z),P.head.F(x,y,z));
          const tk2=locks(rig,topk,{n:300,rnd,wid:.055,seg:9,sel:()=>true,len:(p,r)=>.11+r()*.07,flow:(p,n)=>[-.15,1.2,0,.9],grav:1.35,clear:.008},pat);
          const bow=new THREE.Group();bow.position.copy(V(tie)).sub(hb).add(new THREE.Vector3(.012,.012,0));rig.head.add(bow);const pk=new THREE.MeshStandardMaterial({color:lin(0xff4f98),roughness:.4});
          [1,-1].forEach(s=>{const c=new THREE.Mesh(new THREE.ConeGeometry(.034,.06,18),pk);c.position.set(0,0,s*.03);c.rotation.x=s*Math.PI/2;c.scale.set(1,1,.55);bow.add(c)});const kn=new THREE.Mesh(SPH,pk);kn.scale.setScalar(.018);bow.add(kn);rig.bow=bow;
          rig.onDress=w=>{const hide=!!(w.hat||w.costume==='ninja'||w.costume==='dino');[tk2,bow].forEach(m=>m.visible=!hide)};
          // זנב עם נוצה ארוכה שנופלת על הגב
          locks(rig,P.tail,{n:320,rnd,wid:.045,seg:9,sel:()=>true,len:(p,r)=>.14+r()*.08,flow:(p,n)=>[.05,-.3,Math.sign(p[2]||rnd()-.5)*.45,.55],grav:1,clear:.01},pat);
        }
      }
      return{build,SPEC,triPat,BLK,WHITE,CATS};
    })();
