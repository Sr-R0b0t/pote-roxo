/* Pote Roxo — Monte sua marmita (animação dos ingredientes caindo no pote)
   Usa as globais do script principal: pushItem(), brl(), toast() */
(function(){
  /* ========= CONFIGURAÇÃO — edite aqui ========= */
  const MARMITA = {
    precos: { 300: 18, 500: 25 },            // TODO: valores provisórios — trocar pelos preços reais
    bases: ["Açaí", "Cupuaçu", "Açaí e cupuaçu"],
    frutas: ["Banana", "Morango"],
    complementos: ["Leite condensado","Paçoca","Amendoim","Sucrilhos","Granola","Ovomaltine","Chocoball mesclado","Confete de chocolate","Leite Ninho"],
    inclusos: { frutas: 1, complementos: 4 }, // já vêm no preço da marmita
    adicional: 2.50,                           // cada fruta ou complemento a mais
    adicionalEspecial: { "Nutella": 4.50 }     // complementos com preço de adicional diferente
  };

  /* ========= Como cada ingrediente é desenhado =========
     cel: tamanho da "célula" (quanto menor, mais pedacinhos) · fundo: cor de cobertura da faixa · ponto: cor do ícone */
  const R = (a,b,r) => a + (b-a)*r();
  const pick = (arr,r) => arr[Math.floor(r()*arr.length)];
  // foto recortada; aceita várias versões (sorteia uma para cada pedaço)
  const FOTO = (src, w, h) => r => { const s = Array.isArray(src) ? pick(src, r) : src;
    // a imagem já tem a sombra embutida (borda de ~8%), por isso é desenhada um pouco maior
    const W = w*1.16, H = h*1.16;
    return `<image href="${s}" x="${-W/2}" y="${-H/2}" width="${W}" height="${H}"/>`; };
  const img = (nome, ...v) => v.map(x=>`img/mm-${nome}-${x}.webp`);
  const TIPOS = {
    "Banana":   { cel:21, foto:FOTO("img/mm-banana.webp", 28, 27), ponto:"#F3DC8B", forma:r=>`<circle r="11" fill="#F7E8B4" stroke="#E6CC7F" stroke-width="1.5"/><circle r="5.5" fill="none" stroke="#D9BC6A" stroke-dasharray="1.5 2.5" stroke-width="1.4"/><circle r="1.6" fill="#C9A653"/>` },
    "Morango":  { cel:21, foto:FOTO("img/mm-morango.webp", 30, 26), ponto:"#E0303F", forma:r=>`<path d="M0 -12 C9 -12 13 -4 11 3 C8 10 3 13 0 13 C-3 13 -8 10 -11 3 C-13 -4 -9 -12 0 -12z" fill="#D7263D"/><path d="M0 -7 C5 -7 7 -2 6 2 C4 6 2 8 0 8 C-2 8 -4 6 -6 2 C-7 -2 -5 -7 0 -7z" fill="#F07A86"/>${[[-5,-4],[4,-5],[-3,4],[5,3],[0,-1]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.4" fill="#FFE7A8"/>`).join("")}` },
    "Leite condensado": { calda:true, ponto:"#F3E6BE" },
    "Paçoca":   { textura:"url(#texPacoca)", ponto:"#B8863E" },
    "Amendoim": { textura:"url(#texAmendoim)", ponto:"#D9B27A" },
    "Sucrilhos": { cel:15, foto:FOTO(img("sucrilhos",1,2,3), 24, 20), ponto:"#E9B24C", forma:r=>`<path d="M${R(-9,-6,r)} ${R(-3,0,r)} Q-2 ${R(-9,-6,r)} ${R(6,9,r)} ${R(-4,-1,r)} Q${R(4,8,r)} 5 0 ${R(6,8,r)} Q${R(-8,-5,r)} 5 -7 0z" fill="${pick(["#EDB64E","#E3A13B","#F2C46A"],r)}" stroke="#C98A2A" stroke-width=".8"/>` },
    "Granola":  { cel:14, fundo:"#B87A3A", foto:FOTO(img("granola",1,2,3), 25, 25), ponto:"#B9813F", forma:r=>[0,1,2,3].map(()=>`<path transform="translate(${R(-5,5,r)} ${R(-5,5,r)}) rotate(${R(0,360,r)})" d="M-3 -2 L3 -3 L4 2 L-2 3z" fill="${pick(["#B9813F","#8A5A2B","#E0B86A","#A36F35"],r)}"/>`).join("") },
    "Ovomaltine": { textura:"url(#texOvomaltine)", ponto:"#8A4A2A" },
    "Chocoball mesclado": { cel:12, foto:FOTO(img("chocoball","marrom","branco","marrom2","branco"), 14, 14), ponto:"#7A4A2E", forma:r=>{ const c = r()<.5 ? ["#5A2E1E","#8A5236"] : ["#EFE3CF","#FFFFFF"]; return `<circle r="6.4" fill="${c[0]}"/><circle cx="-2" cy="-2.2" r="2.4" fill="${c[1]}" opacity=".55"/>`; } },
    "Confete de chocolate": { cel:13, foto:FOTO(img("confete","vermelho","laranja","amarelo","verde","azul","marrom"), 15, 14), ponto:"#1E88E5", forma:r=>`<ellipse rx="7" ry="6.2" fill="${pick(["#E53935","#FDD835","#43A047","#1E88E5","#8E24AA","#FB8C00"],r)}"/><ellipse cx="-2.2" cy="-2.4" rx="2.6" ry="1.5" fill="#fff" opacity=".5"/>` },
    "Leite Ninho": { textura:"url(#texNinho)", ponto:"#F4EBCF" },
    "Mousse de maracujá": { textura:"#F6CD55", borda:"rgba(150,90,0,.35)", cel:13, ponto:"#F6CD55",
      forma:r=>`<ellipse rx="${R(1.6,2.4,r)}" ry="${R(1.1,1.6,r)}" fill="#2A1A10"/><ellipse cx="-.6" cy="-.5" rx=".6" ry=".4" fill="#fff" opacity=".5"/>` },
    "Mousse de morango": { textura:"#F4A6B8", borda:"rgba(160,30,60,.3)", cel:14, ponto:"#F4A6B8",
      forma:r=>`<path d="M${R(-3,-2,r)} -2 L${R(1,3,r)} ${R(-3,-1,r)} L${R(2,3,r)} 2 L-1 ${R(2,3,r)}z" fill="${pick(["#D7263D","#E8475C","#C21F35"],r)}" opacity=".85"/>` },
    "Nutella": { calda:true, cor:"#4A2312", brilho:"#9A6A48", espessura:12, ponto:"#5A2E1A" }
  };

  // true = banana e morango com as fotos recortadas · false = desenhos vetoriais
  const USAR_FOTOS = true;

  /* ========= Estado ========= */
  const st = { tam:300, base:"Açaí", frutas:[], comps:[] };

  /* ========= Preço: inclusos + adicionais =========
     Os adicionais são os itens além dos inclusos. Se a Nutella estiver entre os complementos
     e houver adicionais, ela conta como adicional (R$ 4,50); os demais, R$ 2,50. */
  function calcula(){
    const extrasFruta = st.frutas.slice(MARMITA.inclusos.frutas);
    const nExtra = Math.max(0, st.comps.length - MARMITA.inclusos.complementos);
    const especiais = st.comps.filter(c=>MARMITA.adicionalEspecial[c]);
    const comuns = st.comps.filter(c=>!MARMITA.adicionalEspecial[c]);
    const extrasComp = [...especiais, ...comuns.slice().reverse()].slice(0, nExtra);
    const preco = c => MARMITA.adicionalEspecial[c] || MARMITA.adicional;
    const valorExtras = extrasFruta.length*MARMITA.adicional + extrasComp.reduce((s,c)=>s+preco(c),0);
    return { extrasFruta, extrasComp, valorExtras, total: MARMITA.precos[st.tam] + valorExtras, preco };
  }

  /* ========= Monta a interface ========= */
  const $ = id => document.getElementById(id);
  const opcoes = (box, lista, ativo, tipo, etiqueta=()=>"") => {
    $(box).innerHTML = lista.map(v=>{
      const t = TIPOS[v];
      const dot = t ? `<i style="background:${t.ponto}"></i>` : "";
      const tag = etiqueta(v);
      return `<button type="button" data-v="${v}" data-tipo="${tipo}" class="${ativo(v)?"on":""}">${dot}${v}${tag?`<em class="mm-extra">${tag}</em>`:""}</button>`;
    }).join("");
  };
  const mais = v => "+" + brl(v).replace(/\s/g," ");
  function pintaOpcoes(){
    $("mmTam").innerHTML = Object.keys(MARMITA.precos).map(t=>`<button type="button" data-v="${t}" data-tipo="tam" class="${+t===st.tam?"on":""}"><b>${t}ml</b><small>${brl(MARMITA.precos[t])}</small></button>`).join("");
    opcoes("mmBase", MARMITA.bases, v=>v===st.base, "base");
    const c = calcula(), inc = MARMITA.inclusos;
    // etiqueta de preço: nos itens que já são adicionais e nos que viriam a ser adicionais se o cliente escolher
    opcoes("mmFruta", MARMITA.frutas, v=>st.frutas.includes(v), "fruta",
      v => c.extrasFruta.includes(v) || (!st.frutas.includes(v) && st.frutas.length >= inc.frutas) ? mais(MARMITA.adicional) : "");
    opcoes("mmComp", MARMITA.complementos, v=>st.comps.includes(v), "comp",
      v => c.extrasComp.includes(v) ? mais(c.preco(v)) : (!st.comps.includes(v) && st.comps.length >= inc.complementos) ? mais(c.preco(v)) : "");
    $("mmPreco").textContent = brl(c.total);
    const n = st.comps.length, ex = c.extrasComp.length + c.extrasFruta.length;
    $("mmCount").textContent = `${Math.min(n, inc.complementos)} de ${inc.complementos} inclusos` + (ex ? ` · ${ex} ${ex>1?"adicionais":"adicional"} (${brl(c.valorExtras)})` : "");
    $("mmFrutaInfo").textContent = st.frutas.length ? (st.frutas.length > inc.frutas ? `1 grátis · ${st.frutas.length-inc.frutas} adicional` : "1 grátis ✓") : "1 grátis";
    const lista = [...st.frutas, ...st.comps];
    $("mmResumo").innerHTML = `<b>${st.tam}ml · ${st.base}</b>${lista.length ? " + " + lista.join(", ") : ""}${c.valorExtras ? ` <span class="mm-ad">adicionais ${mais(c.valorExtras)}</span>` : ""}`;
  }
  document.querySelector("#marmita .mm-opts").addEventListener("click", e=>{
    const b = e.target.closest("button[data-tipo]"); if(!b) return;
    const v = b.dataset.v;
    switch(b.dataset.tipo){
      case "tam":   st.tam = +v; break;
      case "base":  st.base = v; break;
      case "fruta": st.frutas = st.frutas.includes(v) ? st.frutas.filter(x=>x!==v) : [...st.frutas, v]; break;
      case "comp":  st.comps = st.comps.includes(v) ? st.comps.filter(x=>x!==v) : [...st.comps, v]; break;
    }
    pintaOpcoes(); desenha(b.dataset.tipo);
  });
  $("mmLimpar").onclick = ()=>{ st.frutas = []; st.comps = []; pintaOpcoes(); desenha("comp"); };
  $("mmAdd").onclick = ()=>{
    pushItem({
      id:"marmita",
      nome:`Marmita de Açaí ${st.tam}ml`,
      base: st.base,
      comp: (()=>{ const c = calcula();
        return [
          ...st.frutas.map(f => c.extrasFruta.includes(f) ? `${f} (fruta adicional ${mais(MARMITA.adicional)})` : `${f} (fruta)`),
          ...st.comps.map(x => c.extrasComp.includes(x) ? `${x} (adicional ${mais(c.preco(x))})` : x)
        ]; })(),
      preco: calcula().total
    });
    // "vira" o pote e começa de novo
    const g = $("mmPote"); g.classList.remove("vai"); void g.getBoundingClientRect(); g.classList.add("vai");
  };

  /* ========= Desenho do pote (SVG) ========= */
  const NS = "http://www.w3.org/2000/svg";
  const CX = 200, CY = 200, RI = 166;           // centro e raio de dentro do pote
  const camada = $("mmCamadas");
  const faixas = new Map();                     // nome do ingrediente → {g, fundo, pontos[], calda}
  const el = (tag, attrs={}) => { const e = document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  // aleatório com semente: o mesmo ingrediente sempre sai igual (e se move suave ao reorganizar)
  const semente = s => { let h = 2166136261; for(const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ()=>{ h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h>>>0) % 10000) / 10000; }; };

  function pontosDaFaixa(nome, x0, w, cel){
    const r = semente(nome), cols = Math.max(1, Math.round(w/cel)), cw = w/cols, rows = Math.floor(2*RI/cel), ch = 2*RI/rows, out = [];
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++){
      const jx = (r()-.5)*cw*.55, jy = (r()-.5)*ch*.55, rot = r()*360;
      const x = x0 + (i+.5)*cw + jx, y = CY - RI + (j+.5)*ch + jy;
      if((x-CX)**2 + (y-CY)**2 < (RI-5)**2) out.push({x, y, rot});
    }
    return out;
  }
  function caminhoCalda(x0, w){
    const meio = x0 + w/2, amp = Math.min(w*.32, 16), passo = 15;
    let d = `M${meio} ${CY-RI+8}`;
    for(let y = CY-RI+8, k=0; y < CY+RI-8; y += passo, k++) d += ` Q${meio + (k%2?-amp:amp)*1.6} ${y+passo/2} ${meio} ${y+passo}`;
    return d;
  }
  // faixa com borda irregular (farelo espalhado)
  function caminhoTextura(nome, x0, w){
    const r = semente(nome + "#borda"), top = CY-RI-4, bot = CY+RI+4, passo = 7;
    const esq = [], dir = [];
    for(let y = top; y <= bot; y += passo){ esq.push([x0 + (r()-.3)*7, y]); dir.push([x0 + w - (r()-.3)*7, y]); }
    return "M" + esq.map(p=>p.map(v=>v.toFixed(1)).join(" ")).join(" L") + " L" + dir.reverse().map(p=>p.map(v=>v.toFixed(1)).join(" ")).join(" L") + "Z";
  }
  const solta = (e, delay) => { e.style.transitionDelay = delay+"ms"; };

  function desenha(origem){
    // base: açaí, cupuaçu ou meio a meio
    $("mmAcai").style.opacity = st.base==="Cupuaçu" ? 0 : 1;
    $("mmCupu").style.opacity = st.base==="Cupuaçu" ? 1 : 0;
    $("mmMeio").style.opacity = st.base==="Açaí e cupuaçu" ? 1 : 0;
    $("mmPoteEscala").style.transform = `scale(${st.tam===300?.86:1})`;
    $("mmTamTag").textContent = st.tam + "ml";

    const lista = [...st.frutas, ...st.comps];
    const n = lista.length;
    const W = Math.min(n*80, 2*RI - 14), x0 = CX - W/2, w = n ? W/n : 0;

    // tira o que saiu
    for(const [nome, f] of faixas) if(!lista.includes(nome)){
      faixas.delete(nome);
      f.g.classList.add("sai");
      setTimeout(()=>f.g.remove(), 500);
    }
    // coloca / reorganiza
    lista.forEach((nome, idx)=>{
      const t = TIPOS[nome], xi = x0 + idx*w;
      let f = faixas.get(nome), novo = false;
      if(!f){
        novo = true;
        const g = el("g", {class:"faixa"});
        f = { g, pontos:[], fundo:null, calda:null };
        if(t.fundo){ f.fundo = el("rect", {x:0, y:0, width:1, height:2*RI, fill:t.fundo, class:"fundo"}); g.appendChild(f.fundo); }
        if(t.textura){
          // baixa a foto da textura só na primeira vez que o ingrediente é escolhido
          if(t.textura.startsWith("url(")){
            const imgTex = document.querySelector(`${t.textura.slice(4,-1)} image[data-href]`);
            if(imgTex){ imgTex.setAttribute("href", imgTex.dataset.href); imgTex.removeAttribute("data-href"); }
          }
          f.tex = el("path", {fill:t.textura, class:"tex"});
          f.texBorda = el("path", {fill:"none", stroke:t.borda || "rgba(60,30,5,.35)", "stroke-width":1.2, class:"tex"});
          g.append(f.tex, f.texBorda);
        }
        if(t.calda){
          f.calda = el("path", {fill:"none", stroke:t.cor || "#F3E6BE", "stroke-width":t.espessura || 9, "stroke-linecap":"round", "stroke-linejoin":"round", class:"calda"});
          f.brilho = el("path", {fill:"none", stroke:t.brilho || "#FFFBEA", "stroke-width":2.5, "stroke-linecap":"round", opacity:.8, class:"calda"});
          g.append(f.calda, f.brilho);
        }
        camada.appendChild(g);
        faixas.set(nome, f);
      }
      camada.appendChild(f.g); // mantém a ordem das faixas

      if(f.fundo){
        const alvo = `translate(${xi}px, ${CY-RI}px) scale(${w}, 1)`;
        if(novo){ f.fundo.style.transform = `translate(${xi}px, ${CY-RI}px) scale(${w}, 0)`; f.fundo.getBoundingClientRect(); }
        f.fundo.style.transform = alvo;
      }
      if(f.tex){
        const d = caminhoTextura(nome, xi, w);
        [f.tex, f.texBorda].forEach(p=>{
          p.setAttribute("d", d);
          p.style.transformOrigin = `0px ${CY-RI}px`;
          if(novo){ p.style.transform = "scaleY(0)"; p.getBoundingClientRect(); }
          p.style.transform = "scaleY(1)";
        });
      }
      if(f.calda){
        const d = caminhoCalda(xi, w);
        [f.calda, f.brilho].forEach(p=>{
          p.setAttribute("d", d);
          if(novo){ const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.strokeDashoffset = 0; }
        });
      }
      if(t.forma){
        const alvos = pontosDaFaixa(nome, xi, w, t.cel);
        // ajusta a quantidade de pedacinhos à largura da faixa
        while(f.pontos.length > alvos.length){ const p = f.pontos.pop(); p.style.opacity = 0; setTimeout(()=>p.remove(), 400); }
        const r = semente(nome + "#forma");
        alvos.forEach((a, k)=>{
          let p = f.pontos[k];
          const pos = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) rotate(${a.rot.toFixed(0)}deg)`;
          if(!p){
            p = el("g", {class:"pt"});
            p.innerHTML = (USAR_FOTOS && t.foto) ? t.foto(r) : t.forma(r);
            // nasce acima do pote e cai
            p.style.transform = `translate(${a.x.toFixed(1)}px, ${(a.y - 260 - Math.random()*120).toFixed(1)}px) rotate(${(a.rot - 90).toFixed(0)}deg)`;
            p.style.opacity = 0;
            f.g.appendChild(p); f.pontos.push(p);
            p.getBoundingClientRect();
            solta(p, Math.round(Math.random()*450 + (a.y-CY+RI)*0.6));
            p.style.opacity = 1;
          } else {
            solta(p, 0);
          }
          p.style.transform = pos;
        });
      }
    });
    // "pulinho" do pote a cada ingrediente
    if(origem==="comp" || origem==="fruta"){ const g = $("mmPulo"); g.classList.remove("pula"); void g.getBoundingClientRect(); g.classList.add("pula"); }
    $("mmVazio").style.opacity = n ? 0 : 1;
  }

  pintaOpcoes();
  desenha();
})();
