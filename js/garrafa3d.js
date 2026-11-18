/* Pote Roxo — garrafinha 3D (Three.js)
   Usa as globais do script principal: PRODUTOS, add(), base, setBase(), brl() */
import * as THREE from "three";
import { RoomEnvironment } from "../lib/RoomEnvironment.js";

const box = document.getElementById("stage3d");
const sec = document.getElementById("exp3d");

/* Visual de cada sabor: cor do recheio (swirl), cor do pano, cor da faixa do rótulo, subtítulo */
const SABORES = {
  vitamina:    { swirl:"#F3E3C3", pano:"#7E2DB8", faixa:"#4E8F2A", sub:["Monte do seu jeito!"] },
  tradicional: { swirl:"#F7EFDF", pano:"#8E3FC4", faixa:"#7A35B5", sub:["Leite condensado","+ leite em pó"] },
  morango:     { swirl:"#F59AB0", pano:"#D81B7A", faixa:"#E3236B", sub:["Açaí premium","Mousse de morango"] },
  maracuja:    { swirl:"#F8CF5C", pano:"#F2B705", faixa:"#F2A900", sub:["Açaí premium","Mousse de maracujá"] },
  nutella:     { swirl:"#6B2F1C", pano:"#7A1846", faixa:"#D3242C", sub:["Açaí premium","Nutella + Ninho"] },
  pistache:    { swirl:"#E6DA86", pano:"#7DC22E", faixa:"#5AA51E", sub:["Açaí premium","Pistache + Ninho"] }
};
const ACAI = "#5C0E44", CUPU = "#ECDDB8";

function init(){
  /* ---------- renderer / cena ---------- */
  let renderer;
  try{
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:"high-performance" });
  }catch(e){ sec.classList.add("no3d"); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  box.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 2.6, 12.5);
  camera.lookAt(0, 2.45, 0);

  scene.add(new THREE.HemisphereLight(0xf3e6ff, 0x2a0845, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 7, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb06bff, 2.2); rim.position.set(-5, 3, -4); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffc21a, 0.8); rim2.position.set(5, 1, -3); scene.add(rim2);

  const garrafa = new THREE.Group();
  scene.add(garrafa);

  /* ---------- formas ---------- */
  const v = (a) => a.map(([x,y]) => new THREE.Vector2(x,y));
  const SEG = 72;

  // vidro
  const vidroPerfil = v([[0,0],[0.86,0],[0.98,0.05],[1.02,0.2],[1.02,2.95],[0.99,3.22],[0.86,3.46],[0.66,3.64],[0.53,3.78],[0.5,4.2],[0.54,4.26],[0.5,4.3]]);
  const vidro = new THREE.Mesh(
    new THREE.LatheGeometry(vidroPerfil, SEG),
    new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:0.04, metalness:0, transparent:true, opacity:0.16, clearcoat:1, clearcoatRoughness:0.03, envMapIntensity:2.2, depthWrite:false, specularIntensity:1 })
  );
  vidro.renderOrder = 2;
  garrafa.add(vidro);

  // recheio (açaí + camadas)
  const liqPerfil = v([[0,0.04],[0.84,0.04],[0.95,0.1],[0.97,0.22],[0.97,2.93],[0.93,3.2],[0.8,3.42],[0.6,3.58],[0.3,3.63],[0,3.64]]);
  const liqTex = new THREE.CanvasTexture(document.createElement("canvas"));
  liqTex.colorSpace = THREE.SRGBColorSpace;
  liqTex.wrapS = THREE.RepeatWrapping;
  const liqGeo = new THREE.LatheGeometry(liqPerfil, SEG);
  { // UV vertical proporcional à altura (senão as camadas esticam)
    const pos = liqGeo.attributes.position, uv = liqGeo.attributes.uv;
    for(let i=0;i<pos.count;i++) uv.setY(i, pos.getY(i)/3.64);
  }
  const recheio = new THREE.Mesh(
    liqGeo,
    new THREE.MeshPhysicalMaterial({ map:liqTex, roughness:0.55, clearcoat:0.5, clearcoatRoughness:0.25, envMapIntensity:0.55 })
  );
  garrafa.add(recheio);

  // rótulo (faixa curva na frente)
  const labTex = new THREE.CanvasTexture(document.createElement("canvas"));
  labTex.colorSpace = THREE.SRGBColorSpace;
  labTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const ARCO = 1.55;
  const rotulo = new THREE.Mesh(
    new THREE.CylinderGeometry(1.035, 1.035, 2.25, 64, 1, true, -ARCO/2, ARCO),
    new THREE.MeshStandardMaterial({ map:labTex, roughness:0.35, metalness:0, transparent:true, envMapIntensity:0.5 })
  );
  rotulo.position.y = 1.62;
  garrafa.add(rotulo);

  // pano (tampa de tecido com babado)
  const panoPerfil = v([[0,4.62],[0.3,4.6],[0.5,4.52],[0.6,4.36],[0.62,4.16],[0.6,4.0],[0.585,3.93],[0.68,3.84],[0.88,3.62],[1.04,3.4],[1.13,3.18],[1.16,3.04]]);
  const panoGeo = new THREE.LatheGeometry(panoPerfil, 160);
  {
    const p = panoGeo.attributes.position, tmp = new THREE.Vector3();
    for(let i=0;i<p.count;i++){
      tmp.fromBufferAttribute(p,i);
      const th = Math.atan2(tmp.x,tmp.z), r = Math.hypot(tmp.x,tmp.z);
      const f = THREE.MathUtils.clamp((3.92 - tmp.y)/0.9, 0, 1);   // 0 no topo → 1 na barra
      const g = THREE.MathUtils.clamp((tmp.y - 3.95)/0.6, 0, 1);    // rugas em cima
      const onda = Math.sin(th*7 + 0.6) * 0.5 + Math.sin(th*13 + 2.1) * 0.25;
      const nr = r * (1 + onda*0.09*f + Math.sin(th*11)*0.02*g);
      const ny = tmp.y + (Math.sin(th*9 + 1.3)*0.09 + Math.sin(th*5)*0.05) * f*f;
      p.setXYZ(i, Math.sin(th)*nr, ny, Math.cos(th)*nr);
    }
    panoGeo.computeVertexNormals();
  }
  const panoMat = new THREE.MeshStandardMaterial({ color:0x7e2db8, roughness:0.95, side:THREE.DoubleSide, map:tecidoTex(), envMapIntensity:0.35 });
  const pano = new THREE.Mesh(panoGeo, panoMat);
  garrafa.add(pano);

  // corda + laço
  const cordaMat = new THREE.MeshStandardMaterial({ color:0xc48a4a, roughness:0.9, map:cordaTex(), envMapIntensity:0.4 });
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.055, 14, 90), cordaMat);
  anel.rotation.x = Math.PI/2; anel.position.y = 3.93; garrafa.add(anel);
  const no = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), cordaMat);
  no.position.set(0, 3.93, 0.62); garrafa.add(no);
  const tubo = (pts, r=0.048) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a))), 48, r, 10, false), cordaMat);
  // alças do laço
  [-1,1].forEach(s=>{
    garrafa.add(tubo([[0,3.95,0.64],[0.22*s,4.12,0.7],[0.5*s,4.12,0.66],[0.55*s,3.92,0.6],[0.3*s,3.86,0.66],[0,3.92,0.66]]));
    garrafa.add(tubo([[0.02*s,3.9,0.66],[0.18*s,3.65,0.8],[0.35*s,3.38,0.92],[0.42*s,3.18,0.95]], 0.042));
  });

  // canudo
  const canudo = new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,1.5,24), new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.35 }));
  canudo.position.set(0.12, 5.05, -0.05); canudo.rotation.z = -0.08; garrafa.add(canudo);

  // sombra de contato
  const sc = document.createElement("canvas"); sc.width = sc.height = 256;
  const sx = sc.getContext("2d"), gr = sx.createRadialGradient(128,128,0,128,128,128);
  gr.addColorStop(0,"rgba(0,0,0,.6)"); gr.addColorStop(1,"rgba(0,0,0,0)");
  sx.fillStyle = gr; sx.fillRect(0,0,256,256);
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(3.6,3.6), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(sc), transparent:true, depthWrite:false }));
  sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.01; scene.add(sombra);

  /* ---------- texturas geradas ---------- */
  function tecidoTex(){
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0,0,256,256);
    for(let i=0;i<256;i+=3){ x.fillStyle = `rgba(0,0,0,${0.05+Math.random()*0.05})`; x.fillRect(i,0,1,256); x.fillRect(0,i,256,1); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10,4); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function cordaTex(){
    const c = document.createElement("canvas"); c.width = 64; c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0,0,64,64);
    x.strokeStyle = "rgba(90,50,10,.35)"; x.lineWidth = 6;
    for(let i=-64;i<128;i+=16){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+64,64); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30,1); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function desenhaRecheio(swirl, b){
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d");
    const baseCor = b==="Cupuaçu" ? CUPU : ACAI;
    x.fillStyle = baseCor; x.fillRect(0,0,1024,512);
    if(b==="Meio a meio"){ // metade de baixo cupuaçu, com borda ondulada
      x.fillStyle = CUPU; x.beginPath(); x.moveTo(0,512);
      for(let i=0;i<=1024;i+=8) x.lineTo(i, 270 + Math.sin(i/1024*Math.PI*6)*22);
      x.lineTo(1024,512); x.fill();
    }
    // faixas onduladas do sabor (como nas fotos)
    x.fillStyle = swirl;
    for(let k=0;k<6;k++){
      const y0 = 30 + k*88, amp = 28 + (k%2)*16, ph = k*1.7;
      for(let i=0;i<=1024;i+=3){
        const y = y0 + Math.sin(i/1024*Math.PI*2*3 + ph)*amp;
        x.beginPath(); x.arc(i, y, 20 + Math.sin(i*0.07+k)*7, 0, Math.PI*2); x.fill();
      }
    }
    // pontinhos de textura
    for(let i=0;i<5000;i++){
      x.fillStyle = Math.random()<.6 ? "rgba(40,0,30,.28)" : "rgba(255,255,255,.18)";
      x.fillRect(Math.random()*1024, Math.random()*512, 2, 2);
    }
    return c;
  }
  const logo = new Image(); logo.src = "img/logo.png";
  function rrect(x,X,Y,W,H,R){ x.beginPath(); x.moveTo(X+R,Y); x.arcTo(X+W,Y,X+W,Y+H,R); x.arcTo(X+W,Y+H,X,Y+H,R); x.arcTo(X,Y+H,X,Y,R); x.arcTo(X,Y,X+W,Y,R); x.closePath(); }
  function desenhaRotulo(p, s){
    const W = 560, H = 812, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    const g = x.createLinearGradient(0,0,0,H); g.addColorStop(0,"#2C0F72"); g.addColorStop(1,"#1D0950");
    x.fillStyle = g; rrect(x,6,6,W-12,H-12,34); x.fill();
    if(logo.complete && logo.naturalWidth){ x.save(); x.beginPath(); x.arc(W/2,250,180,0,Math.PI*2); x.clip(); x.drawImage(logo, W/2-180, 70, 360, 360); x.restore(); }
    // faixa do sabor
    x.fillStyle = s.faixa; rrect(x,60,470,W-120,128,20); x.fill();
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    const nome = p.nome.toUpperCase();
    const partes = nome.length > 11 ? nome.split(" ").reduce((acc,w)=>{ const l=acc[acc.length-1]; (l+" "+w).trim().length<=13 ? acc[acc.length-1]=(l+" "+w).trim() : acc.push(w); return acc; },[""]) : [nome];
    x.font = `700 ${partes.length>1?46:52}px Fredoka, Inter, sans-serif`;
    partes.slice(0,2).forEach((t,i)=>x.fillText(t, W/2, 534 + (i-(partes.length-1)/2)*50));
    x.font = "500 32px Inter, sans-serif"; x.fillStyle = "#EDE3FF";
    s.sub.forEach((t,i)=>x.fillText(t, W/2, 650 + i*40));
    x.font = "700 48px Inter, sans-serif"; x.fillStyle = "#fff";
    x.fillText("300ml", W/2, 752 - (s.sub.length<2?20:0));
    return c;
  }

  /* ---------- estado ---------- */
  let atual = "vitamina";
  function aplica(id, b){
    const p = PRODUTOS.find(q=>q.id===id), s = SABORES[id];
    liqTex.image = desenhaRecheio(s.swirl, b); liqTex.needsUpdate = true;
    labTex.image = desenhaRotulo(p, s); labTex.needsUpdate = true;
    panoMat.color.set(s.pano);
    document.getElementById("e3Nome").textContent = p.nome;
    document.getElementById("e3Desc").textContent = p.desc;
    document.getElementById("e3Preco").textContent = brl(p.preco);
  }

  // troca com giro
  let giro = null;
  function troca(id){
    if(id===atual && !giro) { return; }
    atual = id;
    document.querySelectorAll("#e3Sabores button").forEach(b=>b.classList.toggle("on", b.dataset.id===id));
    giro = { t0: performance.now(), dur: 750, from: garrafa.rotation.y, trocou:false };
  }
  document.getElementById("e3Sabores").innerHTML = PRODUTOS.map(p=>`<button data-id="${p.id}" class="${p.id===atual?"on":""}"><i style="background:${SABORES[p.id].pano}"></i>${p.nome.replace("Vitamina de Açaí","Vitamina").replace("Explosão de ","")}</button>`).join("");
  document.querySelectorAll("#e3Sabores button").forEach(b=>b.onclick=()=>troca(b.dataset.id));
  document.getElementById("e3Add").onclick = ()=>add(atual);
  window.on3DBase = (b)=>{ liqTex.image = desenhaRecheio(SABORES[atual].swirl, b); liqTex.needsUpdate = true; };

  const pronto = () => aplica(atual, base);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(()=>{ if(logo.complete) pronto(); else logo.onload = pronto; });
  pronto();

  /* ---------- interação: arrastar para girar ---------- */
  let arrastando = false, lx = 0, ly = 0, vel = 0, inclX = 0, alvoX = 0, ociosoDesde = 0;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", e=>{ arrastando = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); box.classList.add("grab"); });
  el.addEventListener("pointermove", e=>{
    if(!arrastando) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    vel = dx * 0.012; garrafa.rotation.y += vel;
    alvoX = THREE.MathUtils.clamp(alvoX + dy*0.004, -0.35, 0.35);
  });
  const solta = ()=>{ arrastando = false; ociosoDesde = performance.now(); box.classList.remove("grab"); };
  el.addEventListener("pointerup", solta); el.addEventListener("pointercancel", solta);

  /* ---------- tamanho / visibilidade ---------- */
  function resize(){
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w/h;
    camera.position.z = w < 420 ? 14.5 : 12.5;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(box); resize();
  let visivel = true;
  new IntersectionObserver(([en])=>{ visivel = en.isIntersecting; if(visivel) loop(); }, { rootMargin:"100px" }).observe(box);

  const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  let rodando = false;
  function loop(){
    if(rodando) return; rodando = true;
    const tick = (now)=>{
      if(!visivel){ rodando = false; return; }
      if(giro){
        const t = Math.min(1, (now - giro.t0)/giro.dur);
        garrafa.rotation.y = giro.from + ease(t)*Math.PI*2;
        const pulse = Math.sin(t*Math.PI);
        garrafa.scale.setScalar(1 - pulse*0.06);
        if(t>.5 && !giro.trocou){ giro.trocou = true; aplica(atual, base); }
        if(t>=1){ giro = null; garrafa.scale.setScalar(1); }
      } else if(!arrastando){
        vel *= 0.94;
        const auto = now - ociosoDesde > 1200 ? 0.005 : 0;
        garrafa.rotation.y += vel + auto;
        alvoX *= 0.96;
      }
      inclX += (alvoX - inclX)*0.12;
      garrafa.rotation.x = inclX;
      garrafa.position.y = Math.sin(now*0.0015)*0.06;
      sombra.scale.setScalar(1 - Math.sin(now*0.0015)*0.04);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  loop();
  sec.classList.add("ready");
}

try{ init(); }catch(e){ console.error(e); sec.classList.add("no3d"); }
