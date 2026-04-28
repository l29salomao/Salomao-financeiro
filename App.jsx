import { useState, useRef, useCallback } from "react";


const STORAGE_KEY = "luciano_salomao_v2";
const MESES_LISTA = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fmt = (v) => `R$ ${Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const mesAtual = () => { const d=new Date(); return `${MESES_LISTA[d.getMonth()]}/${d.getFullYear()}`; };

const defaultData = {
  config: {
    metaReceita: 8500, metaReserva: 8000, metaCapitalGiro: 2000,
    catsEntrada: ["Consertos/Assistência","Compra e Venda","Uber","Outras Entradas"],
    catsSaida: ["Apartamento","Laboratório","Carro","Mercado","Gasolina","Cigarro","Celular/Assinaturas","Pagamento de Dívida","Outros Gastos"],
    fases: [
      { num:1, label:"FASE 1 — Sobrevivência", sub:"0 a 30 dias", color:"red" },
      { num:2, label:"FASE 2 — Estabilização", sub:"30 a 90 dias", color:"yellow" },
      { num:3, label:"FASE 3 — Crescimento", sub:"90 a 180 dias", color:"green" },
    ],
  },
  lancamentos: [
    { id:1, data:"15/05/2025", mes:"Mai/2025", descricao:"Conserto tela iPhone 12", categoria:"Consertos/Assistência", tipo:"ENTRADA", valor:350 },
    { id:2, data:"15/05/2025", mes:"Mai/2025", descricao:"Aluguel apartamento", categoria:"Apartamento", tipo:"SAÍDA", valor:3000 },
    { id:3, data:"16/05/2025", mes:"Mai/2025", descricao:"Venda iPhone 13 PM", categoria:"Compra e Venda", tipo:"ENTRADA", valor:2800 },
  ],
  dividas: {
    urgentes: [
      { id:1, credor:"Mãe (empréstimo)", total:5000, pago:0, vencimento:"Imediato" },
      { id:2, credor:"Conta de Luz #1", total:200, pago:0, vencimento:"Esta semana" },
      { id:3, credor:"Conta de Luz #2", total:200, pago:0, vencimento:"Esta semana" },
      { id:4, credor:"Conta de Luz #3", total:200, pago:0, vencimento:"Esta semana" },
      { id:5, credor:"Conta Celular atrasada", total:200, pago:0, vencimento:"Esta semana" },
      { id:6, credor:"Prestação Carro atrasada", total:1300, pago:0, vencimento:"Esta semana" },
    ],
    antigas: [
      { id:7, credor:"Cartão Nubank", total:0, pago:0, vencimento:"Negociar no app" },
      { id:8, credor:"Cartão Inter (Pessoal)", total:0, pago:0, vencimento:"Negociar no app" },
      { id:9, credor:"Cartão Inter Empresas", total:0, pago:0, vencimento:"Negociar no app" },
      { id:10, credor:"Cartão Santander", total:0, pago:0, vencimento:"Negociar agência" },
      { id:11, credor:"Fornecedor (boleto mercadorias)", total:0, pago:0, vencimento:"Renegociar prazo" },
      { id:12, credor:"Bruno (boleto mercadorias)", total:0, pago:0, vencimento:"Renegociar prazo" },
      { id:13, credor:"Aluguel sala antiga", total:5000, pago:0, vencimento:"Negociar" },
      { id:14, credor:"DAS MEI atrasado (~2 anos)", total:1700, pago:0, vencimento:"Parcelar gov.br" },
      { id:15, credor:"Luz apto antigo", total:0, pago:0, vencimento:"Verificar valor" },
      { id:16, credor:"Internet sala #1", total:0, pago:0, vencimento:"Verificar valor" },
      { id:17, credor:"Internet sala #2", total:0, pago:0, vencimento:"Verificar valor" },
    ]
  },
  ativos: [
    { id:1, nome:"iPhone 13 Pro Max", preco:2800, status:"À venda" },
    { id:2, nome:"iPhone XR (carcaça 17 Pro)", preco:1100, status:"À venda" },
    { id:3, nome:"Redmi Note 9", preco:300, status:"À venda" },
    { id:4, nome:"Samsung A04e", preco:250, status:"À venda" },
  ],
  caixa: { saldo:60, capitalGiro:0, reserva:0 },
  metas: [
    { id:1, fase:1, acao:"Vender aparelhos parados (4 unidades)", valor:4450, status:"em_andamento", prazo:"Esta semana" },
    { id:2, fase:1, acao:"Ligar Uber — meta R$100/dia", valor:2000, status:"em_andamento", prazo:"30 dias" },
    { id:3, fase:1, acao:"Pagar 3 contas de luz atrasadas", valor:600, status:"pendente", prazo:"Urgente" },
    { id:4, fase:1, acao:"Pagar conta celular atrasada", valor:200, status:"pendente", prazo:"Urgente" },
    { id:5, fase:1, acao:"Pagar prestação carro atrasada", valor:1300, status:"pendente", prazo:"Urgente" },
    { id:6, fase:1, acao:"Pagar mãe — R$2.500 agora + R$2.500 dia 30", valor:5000, status:"pendente", prazo:"30 dias" },
    { id:7, fase:1, acao:"Cortar saídas e roles — 60 dias", valor:0, status:"em_andamento", prazo:"60 dias" },
    { id:8, fase:1, acao:"Revisar e cortar assinaturas desnecessárias", valor:200, status:"pendente", prazo:"Esta semana" },
    { id:9, fase:1, acao:"Levantar valor exato de cada dívida", valor:0, status:"pendente", prazo:"Esta semana" },
    { id:10, fase:2, acao:"Separar financeiro empresa x pessoal", valor:0, status:"pendente", prazo:"Dia 30" },
    { id:11, fase:2, acao:"Anotar entradas/saídas todos os dias", valor:0, status:"pendente", prazo:"Hábito" },
    { id:12, fase:2, acao:"Negociar cartões (Nubank, Inter, Santander)", valor:0, status:"pendente", prazo:"Dia 30" },
    { id:13, fase:2, acao:"Parcelar DAS MEI no gov.br", valor:1700, status:"pendente", prazo:"Dia 30" },
    { id:14, fase:2, acao:"Negociar aluguel sala antiga", valor:5000, status:"pendente", prazo:"Dia 45" },
    { id:15, fase:2, acao:"Montar capital de giro compra/venda", valor:2000, status:"pendente", prazo:"Dia 60" },
    { id:16, fase:2, acao:"Atingir receita mensal de R$8.500", valor:8500, status:"pendente", prazo:"Dia 90" },
    { id:17, fase:3, acao:"Iniciar reserva de emergência (meta R$8k)", valor:8000, status:"pendente", prazo:"Dia 180" },
    { id:18, fase:3, acao:"Pesquisar curso reparo de placa iPhone", valor:0, status:"pendente", prazo:"Dia 90" },
    { id:19, fase:3, acao:"Comprar ferramentas e insumos reparo de placa", valor:0, status:"pendente", prazo:"Dia 100" },
    { id:20, fase:3, acao:"Reforma básica laboratório", valor:0, status:"pendente", prazo:"Dia 120" },
    { id:21, fase:3, acao:"Capital de giro compra/venda: R$5.000", valor:5000, status:"pendente", prazo:"Dia 150" },
    { id:22, fase:3, acao:"Atingir lucro médio de R$10.000/mês", valor:10000, status:"pendente", prazo:"Dia 180" },
  ],
  historico: [],
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0f;--surface:#111118;--card:#16161f;--border:#1e1e2e;
    --green:#00e5a0;--green-dim:#00e5a018;--red:#ff4060;--red-dim:#ff406018;
    --yellow:#ffd60a;--yellow-dim:#ffd60a18;--blue:#4fc3f7;--blue-dim:#4fc3f718;
    --orange:#ff8c00;--orange-dim:#ff8c0018;--purple:#b388ff;--purple-dim:#b388ff18;
    --text:#e8e8f0;--text-dim:#6b6b80;--font:'Space Grotesk',sans-serif;--mono:'JetBrains Mono',monospace;
  }
  body{background:var(--bg);color:var(--text);font-family:var(--font)}
  input,select,button,textarea{font-family:var(--font)}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
  .fi{animation:fi .25s ease}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .mo{position:fixed;inset:0;background:#000c;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
  .mb{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
  input::placeholder,textarea::placeholder{color:var(--text-dim)}
`;

const Card = ({children,style={},cn=""})=>(
  <div className={`fi ${cn}`} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,...style}}>{children}</div>
);
const Badge = ({color="green",children,style={}})=>(
  <span style={{background:`var(--${color}-dim)`,color:`var(--${color})`,border:`1px solid var(--${color})40`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:".5px",textTransform:"uppercase",...style}}>{children}</span>
);
const Btn = ({onClick,color="green",children,style={},sm=false,disabled=false})=>(
  <button disabled={disabled} onClick={onClick}
    style={{background:`var(--${color}-dim)`,color:`var(--${color})`,border:`1px solid var(--${color})40`,borderRadius:8,padding:sm?"5px 12px":"10px 20px",fontSize:sm?12:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:"all .15s",opacity:disabled?.5:1,fontFamily:"var(--font)",...style}}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background=`var(--${color})`;e.currentTarget.style.color="#000"}}}
    onMouseLeave={e=>{if(!disabled){e.currentTarget.style.background=`var(--${color}-dim)`;e.currentTarget.style.color=`var(--${color})`}}}
  >{children}</button>
);
const Inp = ({value,onChange,placeholder,type="text",style={},onKeyDown})=>(
  <input value={value} onChange={onChange} placeholder={placeholder} type={type} onKeyDown={onKeyDown}
    style={{background:"#0d0d14",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--blue)",fontSize:13,width:"100%",outline:"none",fontFamily:"var(--mono)",...style}}/>
);
const Sel = ({value,onChange,options,style={}})=>(
  <select value={value} onChange={onChange} style={{background:"#0d0d14",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",color:"var(--text)",fontSize:13,width:"100%",outline:"none",...style}}>
    {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}
  </select>
);
const Lbl = ({children})=><div style={{fontSize:10,color:"var(--text-dim)",marginBottom:4,textTransform:"uppercase",letterSpacing:1,fontWeight:600}}>{children}</div>;
const Sec = ({children,color="green",icon:Icon})=>(
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
    {Icon&&<Icon size={14} color={`var(--${color})`}/>}
    <span style={{fontSize:11,fontWeight:700,color:`var(--${color})`,textTransform:"uppercase",letterSpacing:1.5}}>{children}</span>
  </div>
);
const Stat = ({label,value,color="green",icon:Icon,sub})=>(
  <Card style={{flex:1,minWidth:120}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
      <span style={{fontSize:10,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,lineHeight:1.3}}>{label}</span>
      {Icon&&<Icon size={13} color={`var(--${color})`}/>}
    </div>
    <div style={{fontSize:17,fontWeight:700,color:`var(--${color})`,fontFamily:"var(--mono)",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:"var(--text-dim)",marginTop:3}}>{sub}</div>}
  </Card>
);
const Modal = ({title,onClose,children,color="green"})=>(
  <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="mb fi">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <span style={{fontWeight:700,fontSize:16,color:`var(--${color})`}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)"}}><span>✕</span></button>
      </div>
      {children}
    </div>
  </div>
);

const TABS=[
  {key:"dashboard",label:"Dashboard",icon: null},
  {key:"lancamentos",label:"Lançamentos",icon: null},
  {key:"dividas",label:"Dívidas",icon: null},
  {key:"historico",label:"Histórico",icon: null},
  {key:"metas",label:"Metas",icon: null},
  {key:"config",label:"Config",icon: null},
];

export default function App() {
  const [tab,setTab]=useState("dashboard");
  const [data,setData]=useState(()=>{
    try{const s=localStorage.getItem(STORAGE_KEY);if(!s)return defaultData;const p=JSON.parse(s);return{...defaultData,...p,config:{...defaultData.config,...(p.config||{})}};}catch{return defaultData;}
  });
  const fileRef=useRef();

  const save=useCallback((nd)=>{setData(nd);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(nd));}catch{}},[]);

  const exportData=()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`luciano-salomao-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
  };
  const importData=(e)=>{
    const file=e.target.files[0];if(!file)return;
    const r=new FileReader();r.onload=(ev)=>{try{const p=JSON.parse(ev.target.result);save({...defaultData,...p,config:{...defaultData.config,...(p.config||{})}});alert("✅ Importado!");}catch{alert("❌ Arquivo inválido.");}};
    r.readAsText(file);e.target.value="";
  };

  const mes=mesAtual();
  const lancMes=data.lancamentos.filter(l=>l.mes===mes);
  const totalE=lancMes.filter(l=>l.tipo==="ENTRADA").reduce((s,l)=>s+l.valor,0);
  const totalS=lancMes.filter(l=>l.tipo==="SAÍDA").reduce((s,l)=>s+l.valor,0);
  const saldo=totalE-totalS;
  const totalDiv=[...data.dividas.urgentes,...data.dividas.antigas].reduce((s,d)=>s+(d.total-d.pago),0);
  const totalAtivos=data.ativos.reduce((s,a)=>s+a.preco,0);

  return(
    <div style={{minHeight:"100vh",background:"var(--bg)",paddingBottom:80}}>
      <style>{css}</style>
      <input type="file" ref={fileRef} accept=".json" style={{display:"none"}} onChange={importData}/>

      <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"13px 20px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span>📱</span>
              <span style={{fontWeight:700,fontSize:14,color:"var(--green)",letterSpacing:".5px"}}>LUCIANO SALOMÃO</span>
            </div>
            <div style={{fontSize:9,color:"var(--text-dim)",marginTop:1,letterSpacing:1.5}}>FINANCEIRO PESSOAL</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{textAlign:"right",marginRight:4}}>
              <div style={{fontSize:9,color:"var(--text-dim)",letterSpacing:1}}>SALDO {mes.toUpperCase()}</div>
              <div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:14,color:saldo>=0?"var(--green)":"var(--red)"}}>{fmt(saldo)}</div>
            </div>
            <Btn sm color="blue" onClick={exportData} style={{display:"flex",alignItems:"center",gap:4}}><span>⬇️</span> Export</Btn>
            <Btn sm color="orange" onClick={()=>fileRef.current.click()} style={{display:"flex",alignItems:"center",gap:4}}><span>⬆️</span> Import</Btn>
          </div>
        </div>
      </div>

      <div style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",overflowX:"auto",position:"sticky",top:55,zIndex:99}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex"}}>
          {TABS.map(t=>{const Icon=t.icon;const active=tab===t.key;return(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{background:"none",border:"none",padding:"10px 13px",color:active?"var(--green)":"var(--text-dim)",borderBottom:active?"2px solid var(--green)":"2px solid transparent",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5,transition:"all .15s",fontFamily:"var(--font)"}}>
              <Icon size={12}/>{t.label}
            </button>
          );})}
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"18px 14px"}}>
        {tab==="dashboard"   &&<Dashboard data={data} mes={mes} totalE={totalE} totalS={totalS} saldo={saldo} totalDiv={totalDiv} totalAtivos={totalAtivos} save={save}/>}
        {tab==="lancamentos" &&<Lancamentos data={data} save={save}/>}
        {tab==="dividas"     &&<Dividas data={data} save={save}/>}
        {tab==="historico"   &&<Historico data={data} save={save}/>}
        {tab==="metas"       &&<Metas data={data} save={save}/>}
        {tab==="config"      &&<Config data={data} save={save}/>}
      </div>
    </div>
  );
}

function Dashboard({data,mes,totalE,totalS,saldo,totalDiv,totalAtivos,save}){
  const [addModal,setAddModal]=useState(false);
  const [novoAtivo,setNovoAtivo]=useState({nome:"",preco:"",status:"À venda"});
  const [editId,setEditId]=useState(null);
  const cfg=data.config;
  const lancMes=data.lancamentos.filter(l=>l.mes===mes);
  const pct=cfg.metaReceita>0?Math.min((totalE/cfg.metaReceita)*100,100):0;
  const eByC=cfg.catsEntrada.map(cat=>({cat,val:lancMes.filter(l=>l.tipo==="ENTRADA"&&l.categoria===cat).reduce((s,l)=>s+l.valor,0)}));
  const sByC=cfg.catsSaida.map(cat=>({cat,val:lancMes.filter(l=>l.tipo==="SAÍDA"&&l.categoria===cat).reduce((s,l)=>s+l.valor,0)}));
  const addA=()=>{if(!novoAtivo.nome)return;save({...data,ativos:[...data.ativos,{...novoAtivo,id:Date.now(),preco:+novoAtivo.preco}]});setNovoAtivo({nome:"",preco:"",status:"À venda"});setAddModal(false);};
  const delA=(id)=>save({...data,ativos:data.ativos.filter(a=>a.id!==id)});
  const updA=(id,f,v)=>save({...data,ativos:data.ativos.map(a=>a.id===id?{...a,[f]:f==="preco"?+v:v}:a)});

  return(
    <div className="fi">
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:18}}>
        <Stat label="Entradas" value={fmt(totalE)} color="green" icon={TrendingUp} sub={mes}/>
        <Stat label="Saídas" value={fmt(totalS)} color="red" icon={TrendingDown} sub={mes}/>
        <Stat label="Dívida Total" value={fmt(totalDiv)} color="orange" icon={AlertTriangle}/>
        <Stat label="Ativos" value={fmt(totalAtivos)} color="blue" icon={Smartphone}/>
      </div>

      <Card style={{marginBottom:18}}>
        <Sec icon={Target} color="yellow">Meta de Receita — {fmt(cfg.metaReceita)}/mês</Sec>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
          <span style={{fontSize:13,color:"var(--text-dim)"}}>{fmt(totalE)} de {fmt(cfg.metaReceita)}</span>
          <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--yellow)"}}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{background:"var(--border)",borderRadius:99,height:8,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,var(--yellow),var(--green))",borderRadius:99,transition:"width .6s ease"}}/>
        </div>
        <div style={{fontSize:10,color:"var(--text-dim)",marginTop:5,textAlign:"right"}}>Altere em Configurações</div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
        <Card>
          <Sec icon={TrendingUp} color="green">Entradas</Sec>
          {eByC.map(({cat,val})=>(<div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:11,color:"var(--text-dim)"}}>{cat}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:11,color:val>0?"var(--green)":"var(--text-dim)",fontWeight:600}}>{fmt(val)}</span>
          </div>))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}><span style={{fontSize:11,fontWeight:700}}>TOTAL</span><span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)",fontSize:12}}>{fmt(totalE)}</span></div>
        </Card>
        <Card>
          <Sec icon={TrendingDown} color="red">Saídas</Sec>
          {sByC.map(({cat,val})=>(<div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:11,color:"var(--text-dim)"}}>{cat}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:11,color:val>0?"var(--red)":"var(--text-dim)",fontWeight:600}}>{fmt(val)}</span>
          </div>))}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}><span style={{fontSize:11,fontWeight:700}}>TOTAL</span><span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--red)",fontSize:12}}>{fmt(totalS)}</span></div>
        </Card>
      </div>

      <Card style={{marginBottom:18}}>
        <Sec icon={Wallet} color="blue">Caixa e Capital</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[{label:"Saldo em Conta",key:"saldo",color:"blue"},{label:"Capital de Giro",key:"capitalGiro",color:"green"},{label:"Reserva Emergência",key:"reserva",color:"yellow"}].map(({label,key,color})=>(
            <div key={key}><Lbl>{label}</Lbl>
              <Inp type="number" value={data.caixa[key]} onChange={e=>save({...data,caixa:{...data.caixa,[key]:+e.target.value}})} style={{color:`var(--${color})`}}/>
              <div style={{fontSize:10,color:`var(--${color})`,marginTop:3,textAlign:"right",fontFamily:"var(--mono)"}}>{fmt(data.caixa[key])}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{l:"Meta Reserva",v:cfg.metaReserva,c:"yellow"},{l:"Meta Capital Giro",v:cfg.metaCapitalGiro,c:"green"}].map(({l,v,c})=>(
            <div key={l} style={{padding:"7px 10px",background:"var(--border)",borderRadius:8,display:"flex",justifyContent:"space-between",fontSize:11}}>
              <span style={{color:"var(--text-dim)"}}>{l}</span>
              <span style={{color:`var(--${c})`,fontFamily:"var(--mono)",fontWeight:700}}>{fmt(v)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <Sec icon={Smartphone} color="blue">Aparelhos à Venda</Sec>
          <Btn sm color="blue" onClick={()=>setAddModal(true)} style={{display:"flex",alignItems:"center",gap:4,marginBottom:14}}><span>＋</span> Adicionar</Btn>
        </div>
        {data.ativos.length===0&&<div style={{textAlign:"center",color:"var(--text-dim)",padding:12,fontSize:12}}>Nenhum aparelho. Adicione acima.</div>}
        {data.ativos.map(a=>(
          <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)",gap:6}}>
            {editId===a.id?(
              <div style={{flex:1,display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:6,alignItems:"center"}}>
                <Inp value={a.nome} onChange={e=>updA(a.id,"nome",e.target.value)} style={{fontSize:11,padding:"5px 8px"}}/>
                <Inp type="number" value={a.preco} onChange={e=>updA(a.id,"preco",e.target.value)} style={{fontSize:11,padding:"5px 8px"}}/>
                <Sel value={a.status} options={["À venda","Reservado","Vendido"]} onChange={e=>updA(a.id,"status",e.target.value)} style={{fontSize:11,padding:"5px 8px"}}/>
                <button onClick={()=>setEditId(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--green)"}}><span>💾</span></button>
              </div>
            ):(
              <>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{a.nome}</div>
                  <Badge color={a.status==="Vendido"?"green":a.status==="Reservado"?"purple":"yellow"} style={{marginTop:3,fontSize:9}}>{a.status}</Badge>
                </div>
                <span style={{fontFamily:"var(--mono)",color:"var(--blue)",fontWeight:600,fontSize:13}}>{fmt(a.preco)}</span>
                <button onClick={()=>setEditId(a.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)"}}><span>✏️</span></button>
                <button onClick={()=>delA(a.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)"}}><span>🗑</span></button>
              </>
            )}
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"7px 10px",background:"var(--blue-dim)",borderRadius:8}}>
          <span style={{fontWeight:700,fontSize:12}}>TOTAL ATIVOS</span>
          <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)",fontSize:13}}>{fmt(totalAtivos)}</span>
        </div>
      </Card>

      {addModal&&(
        <Modal title="➕ Adicionar Aparelho" onClose={()=>setAddModal(false)} color="blue">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Lbl>Nome</Lbl><Inp value={novoAtivo.nome} onChange={e=>setNovoAtivo(f=>({...f,nome:e.target.value}))} placeholder="Ex: iPhone 14 Pro Max"/></div>
            <div><Lbl>Preço (R$)</Lbl><Inp type="number" value={novoAtivo.preco} onChange={e=>setNovoAtivo(f=>({...f,preco:e.target.value}))} placeholder="0.00"/></div>
            <div><Lbl>Status</Lbl><Sel value={novoAtivo.status} options={["À venda","Reservado","Vendido"]} onChange={e=>setNovoAtivo(f=>({...f,status:e.target.value}))}/></div>
            <Btn onClick={addA} color="blue" style={{width:"100%",marginTop:4}}>+ ADICIONAR</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Lancamentos({data,save}){
  const [form,setForm]=useState({data:new Date().toLocaleDateString("pt-BR"),mes:mesAtual(),descricao:"",tipo:"ENTRADA",categoria:data.config.catsEntrada[0],valor:""});
  const [filtro,setFiltro]=useState("Todos");
  const cats=form.tipo==="ENTRADA"?data.config.catsEntrada:data.config.catsSaida;
  const meses=["Todos",...new Set(data.lancamentos.map(l=>l.mes))];
  const lista=filtro==="Todos"?data.lancamentos:data.lancamentos.filter(l=>l.mes===filtro);
  const sorted=[...lista].sort((a,b)=>b.id-a.id);
  const tE=lista.filter(l=>l.tipo==="ENTRADA").reduce((s,l)=>s+l.valor,0);
  const tS=lista.filter(l=>l.tipo==="SAÍDA").reduce((s,l)=>s+l.valor,0);
  const add=()=>{if(!form.descricao||!form.valor)return;save({...data,lancamentos:[...data.lancamentos,{...form,id:Date.now(),valor:+form.valor}]});setForm(f=>({...f,descricao:"",valor:""}));};
  const del=(id)=>save({...data,lancamentos:data.lancamentos.filter(l=>l.id!==id)});
  return(
    <div className="fi">
      <Card style={{marginBottom:18}}>
        <Sec icon={PlusCircle} color="green">Novo Lançamento</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><Lbl>Data</Lbl><Inp value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} placeholder="15/05/2025"/></div>
          <div><Lbl>Mês/Ano</Lbl><Inp value={form.mes} onChange={e=>setForm(f=>({...f,mes:e.target.value}))} placeholder="Mai/2025"/></div>
        </div>
        <div style={{marginBottom:10}}><Lbl>Descrição</Lbl><Inp value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Ex: Conserto tela iPhone 12"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          <div><Lbl>Tipo</Lbl><Sel value={form.tipo} options={["ENTRADA","SAÍDA"]} onChange={e=>{const t=e.target.value;setForm(f=>({...f,tipo:t,categoria:t==="ENTRADA"?data.config.catsEntrada[0]:data.config.catsSaida[0]}));}}/></div>
          <div><Lbl>Categoria</Lbl><Sel value={form.categoria} options={cats} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}/></div>
          <div><Lbl>Valor (R$)</Lbl><Inp type="number" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} placeholder="0.00"/></div>
        </div>
        <Btn onClick={add} color="green" style={{width:"100%"}}>+ ADICIONAR LANÇAMENTO</Btn>
      </Card>

      {filtro!=="Todos"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          <Stat label="Entradas" value={fmt(tE)} color="green"/>
          <Stat label="Saídas" value={fmt(tS)} color="red"/>
          <Stat label="Saldo" value={fmt(tE-tS)} color={tE-tS>=0?"green":"red"}/>
        </div>
      )}

      <div style={{display:"flex",gap:7,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {meses.map(m=>(
          <button key={m} onClick={()=>setFiltro(m)} style={{background:filtro===m?"var(--green)":"var(--card)",color:filtro===m?"#000":"var(--text-dim)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"var(--font)"}}>{m}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {sorted.length===0&&<Card><div style={{textAlign:"center",color:"var(--text-dim)",padding:16}}>Nenhum lançamento. Adicione acima.</div></Card>}
        {sorted.map(l=>(
          <Card key={l.id} style={{padding:"10px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                  <Badge color={l.tipo==="ENTRADA"?"green":"red"} style={{fontSize:9}}>{l.tipo}</Badge>
                  <span style={{fontSize:10,color:"var(--text-dim)"}}>{l.data} · {l.mes}</span>
                </div>
                <div style={{fontSize:13,fontWeight:600,marginBottom:1}}>{l.descricao}</div>
                <div style={{fontSize:10,color:"var(--text-dim)"}}>{l.categoria}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:14,color:l.tipo==="ENTRADA"?"var(--green)":"var(--red)"}}>{l.tipo==="SAÍDA"?"-":"+"}{fmt(l.valor)}</span>
                <button onClick={()=>del(l.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)"}}><span>🗑</span></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Dividas({data,save}){
  const [novaDiv,setNovaDiv]=useState({credor:"",total:"",pago:0,vencimento:"",tipo:"urgentes"});
  const [editId,setEditId]=useState(null);
  const [editVal,setEditVal]=useState("");
  const tU=data.dividas.urgentes.reduce((s,d)=>s+(d.total-d.pago),0);
  const tA=data.dividas.antigas.reduce((s,d)=>s+(d.total-d.pago),0);
  const addDiv=()=>{if(!novaDiv.credor)return;const e={...novaDiv,id:Date.now(),total:+novaDiv.total,pago:+novaDiv.pago};const t=novaDiv.tipo;save({...data,dividas:{...data.dividas,[t]:[...data.dividas[t],e]}});setNovaDiv({credor:"",total:"",pago:0,vencimento:"",tipo:"urgentes"});};
  const updPago=(tipo,id)=>{save({...data,dividas:{...data.dividas,[tipo]:data.dividas[tipo].map(d=>d.id===id?{...d,pago:+editVal}:d)}});setEditId(null);};
  const delDiv=(tipo,id)=>save({...data,dividas:{...data.dividas,[tipo]:data.dividas[tipo].filter(d=>d.id!==id)}});

  const DCard=({d,tipo})=>{
    const saldo=d.total-d.pago;const pct=d.total>0?(d.pago/d.total)*100:0;
    return(
      <Card style={{padding:"11px 14px",marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontWeight:600,fontSize:13,marginBottom:1}}>{d.credor}</div><div style={{fontSize:10,color:"var(--text-dim)"}}>{d.vencimento}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"var(--mono)",fontWeight:700,fontSize:13,color:saldo>0?"var(--red)":"var(--green)"}}>{fmt(saldo)}</div><div style={{fontSize:10,color:"var(--text-dim)"}}>de {fmt(d.total)}</div></div>
        </div>
        {d.total>0&&<div style={{background:"var(--border)",borderRadius:99,height:3,overflow:"hidden",marginBottom:7}}><div style={{height:"100%",width:`${pct}%`,background:"var(--green)",borderRadius:99}}/></div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:10,color:"var(--green)"}}>Pago: {fmt(d.pago)}</div>
          <div style={{display:"flex",gap:5}}>
            {editId===d.id?(
              <><Inp type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Total pago" style={{width:130,padding:"4px 7px",fontSize:11}}/><Btn sm color="green" onClick={()=>updPago(tipo,d.id)}>OK</Btn><Btn sm color="red" onClick={()=>setEditId(null)}>X</Btn></>
            ):(
              <><Btn sm color="green" onClick={()=>{setEditId(d.id);setEditVal(d.pago);}}>Atualizar pagamento</Btn><button onClick={()=>delDiv(tipo,d.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)"}}><span>🗑</span></button></>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return(
    <div className="fi">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
        <Stat label="Urgentes" value={fmt(tU)} color="red" icon={AlertTriangle}/>
        <Stat label="Antigas" value={fmt(tA)} color="orange" icon={Clock}/>
        <Stat label="Total" value={fmt(tU+tA)} color="red" icon={DollarSign}/>
      </div>
      <Card style={{marginBottom:18}}>
        <Sec icon={PlusCircle} color="yellow">Adicionar Dívida</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><Lbl>Credor</Lbl><Inp value={novaDiv.credor} onChange={e=>setNovaDiv(f=>({...f,credor:e.target.value}))} placeholder="Nome do credor"/></div>
          <div><Lbl>Tipo</Lbl><Sel value={novaDiv.tipo} options={[{v:"urgentes",l:"Urgente"},{v:"antigas",l:"Antiga / Negociar"}]} onChange={e=>setNovaDiv(f=>({...f,tipo:e.target.value}))}/></div>
          <div><Lbl>Valor Total (R$)</Lbl><Inp type="number" value={novaDiv.total} onChange={e=>setNovaDiv(f=>({...f,total:e.target.value}))} placeholder="0.00"/></div>
          <div><Lbl>Vencimento / Obs</Lbl><Inp value={novaDiv.vencimento} onChange={e=>setNovaDiv(f=>({...f,vencimento:e.target.value}))} placeholder="Ex: Dia 30"/></div>
        </div>
        <Btn onClick={addDiv} color="yellow" style={{width:"100%"}}>+ ADICIONAR DÍVIDA</Btn>
      </Card>
      <div style={{marginBottom:18}}><Sec icon={AlertTriangle} color="red">🔴 Urgentes</Sec>{data.dividas.urgentes.map(d=><DCard key={d.id} d={d} tipo="urgentes"/>)}</div>
      <div><Sec icon={Clock} color="orange">🟡 Antigas — Negociar</Sec>{data.dividas.antigas.map(d=><DCard key={d.id} d={d} tipo="antigas"/>)}</div>
    </div>
  );
}

function Historico({data,save}){
  const [form,setForm]=useState({mes:mesAtual(),entradas:"",saidas:"",pagoDividas:"",reserva:"",obs:""});
  const add=()=>{if(!form.mes)return;save({...data,historico:[...data.historico,{...form,id:Date.now(),entradas:+form.entradas,saidas:+form.saidas,pagoDividas:+form.pagoDividas,reserva:+form.reserva}]});setForm({mes:"",entradas:"",saidas:"",pagoDividas:"",reserva:"",obs:""});};
  const del=(id)=>save({...data,historico:data.historico.filter(h=>h.id!==id)});
  const sorted=[...data.historico].sort((a,b)=>b.id-a.id);
  return(
    <div className="fi">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
        <Stat label="Total Reservado" value={fmt(data.historico.reduce((s,h)=>s+h.reserva,0))} color="green" icon={Wallet}/>
        <Stat label="Total Pago Dívidas" value={fmt(data.historico.reduce((s,h)=>s+h.pagoDividas,0))} color="yellow" icon={CheckCircle}/>
      </div>
      <Card style={{marginBottom:18}}>
        <Sec icon={PlusCircle} color="yellow">Fechar Mês</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div><Lbl>Mês/Ano</Lbl><Inp value={form.mes} onChange={e=>setForm(f=>({...f,mes:e.target.value}))} placeholder="Mai/2025"/></div>
          <div><Lbl>Total Entradas (R$)</Lbl><Inp type="number" value={form.entradas} onChange={e=>setForm(f=>({...f,entradas:e.target.value}))} placeholder="0.00"/></div>
          <div><Lbl>Total Saídas (R$)</Lbl><Inp type="number" value={form.saidas} onChange={e=>setForm(f=>({...f,saidas:e.target.value}))} placeholder="0.00"/></div>
          <div><Lbl>Pago de Dívidas (R$)</Lbl><Inp type="number" value={form.pagoDividas} onChange={e=>setForm(f=>({...f,pagoDividas:e.target.value}))} placeholder="0.00"/></div>
          <div><Lbl>Guardado Reserva (R$)</Lbl><Inp type="number" value={form.reserva} onChange={e=>setForm(f=>({...f,reserva:e.target.value}))} placeholder="0.00"/></div>
          <div><Lbl>Observações</Lbl><Inp value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} placeholder="Ex: Uber ajudou muito"/></div>
        </div>
        <Btn onClick={add} color="yellow" style={{width:"100%"}}>✅ FECHAR MÊS</Btn>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {sorted.length===0&&<Card><div style={{textAlign:"center",color:"var(--text-dim)",padding:16}}>Nenhum mês fechado ainda.</div></Card>}
        {sorted.map(h=>{const s=h.entradas-h.saidas;return(
          <Card key={h.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontWeight:700,fontSize:14,color:"var(--yellow)"}}>{h.mes}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <Badge color={s>=0?"green":"red"}>{s>=0?"+":""}{fmt(s)}</Badge>
                <button onClick={()=>del(h.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)"}}><span>🗑</span></button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7}}>
              {[{l:"Entradas",v:h.entradas,c:"green"},{l:"Saídas",v:h.saidas,c:"red"},{l:"Dívidas",v:h.pagoDividas,c:"orange"},{l:"Reserva",v:h.reserva,c:"blue"}].map(({l,v,c})=>(
                <div key={l} style={{background:"var(--border)",borderRadius:8,padding:"7px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"var(--text-dim)",marginBottom:2,textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontFamily:"var(--mono)",fontWeight:700,color:`var(--${c})`,fontSize:11}}>{fmt(v)}</div>
                </div>
              ))}
            </div>
            {h.obs&&<div style={{marginTop:7,fontSize:11,color:"var(--text-dim)",fontStyle:"italic"}}>💬 {h.obs}</div>}
          </Card>
        );})}
      </div>
    </div>
  );
}

function Metas({data,save}){
  const [novaMeta,setNovaMeta]=useState({acao:"",valor:"",prazo:"",fase:1,status:"pendente"});
  const [novaFase,setNovaFase]=useState({label:"",sub:"",color:"blue"});
  const [showMeta,setShowMeta]=useState(false);
  const [showFase,setShowFase]=useState(false);
  const [editFaseNum,setEditFaseNum]=useState(null);
  const [editFaseD,setEditFaseD]=useState({});
  const fases=data.config.fases;
  const total=data.metas.length;
  const done=data.metas.filter(m=>m.status==="concluido").length;
  const pct=total>0?(done/total)*100:0;
  const sOpts=["pendente","em_andamento","concluido"];
  const sLabel={pendente:"🔴 Pendente",em_andamento:"⏳ Em andamento",concluido:"✅ Concluído"};
  const cOpts=["red","yellow","green","blue","orange","purple"];
  const addM=()=>{if(!novaMeta.acao)return;save({...data,metas:[...data.metas,{...novaMeta,id:Date.now(),fase:+novaMeta.fase,valor:+novaMeta.valor}]});setNovaMeta({acao:"",valor:"",prazo:"",fase:1,status:"pendente"});setShowMeta(false);};
  const delM=(id)=>save({...data,metas:data.metas.filter(m=>m.id!==id)});
  const updS=(id,s)=>save({...data,metas:data.metas.map(m=>m.id===id?{...m,status:s}:m)});
  const addF=()=>{if(!novaFase.label)return;const n=Math.max(0,...fases.map(f=>f.num))+1;save({...data,config:{...data.config,fases:[...fases,{...novaFase,num:n}]}});setNovaFase({label:"",sub:"",color:"blue"});setShowFase(false);};
  const delF=(num)=>save({...data,config:{...data.config,fases:fases.filter(f=>f.num!==num)},metas:data.metas.filter(m=>m.fase!==num)});
  const saveF=(num)=>{save({...data,config:{...data.config,fases:fases.map(f=>f.num===num?{...f,...editFaseD}:f)}});setEditFaseNum(null);};
  return(
    <div className="fi">
      <Card style={{marginBottom:18}}>
        <Sec icon={Target} color="green">Progresso Geral</Sec>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
          <span style={{fontSize:12,color:"var(--text-dim)"}}>{done} de {total} metas</span>
          <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--green)"}}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{background:"var(--border)",borderRadius:99,height:9,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,var(--red),var(--yellow),var(--green))",borderRadius:99,transition:"width .6s ease"}}/>
        </div>
      </Card>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <Btn color="green" sm onClick={()=>setShowMeta(true)} style={{display:"flex",alignItems:"center",gap:4}}><span>＋</span> Nova Meta</Btn>
        <Btn color="purple" sm onClick={()=>setShowFase(true)} style={{display:"flex",alignItems:"center",gap:4}}><span>＋</span> Nova Fase</Btn>
      </div>
      {fases.map(fase=>{
        const metas=data.metas.filter(m=>m.fase===fase.num);const d=metas.filter(m=>m.status==="concluido").length;
        return(
          <div key={fase.num} style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              {editFaseNum===fase.num?(
                <div style={{flex:1,display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto auto",gap:6,alignItems:"center"}}>
                  <Inp value={editFaseD.label||fase.label} onChange={e=>setEditFaseD(f=>({...f,label:e.target.value}))} style={{fontSize:11,padding:"5px 8px"}}/>
                  <Inp value={editFaseD.sub||fase.sub} onChange={e=>setEditFaseD(f=>({...f,sub:e.target.value}))} placeholder="período" style={{fontSize:11,padding:"5px 8px"}}/>
                  <Sel value={editFaseD.color||fase.color} options={cOpts} onChange={e=>setEditFaseD(f=>({...f,color:e.target.value}))} style={{fontSize:11,padding:"5px 8px"}}/>
                  <button onClick={()=>saveF(fase.num)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--green)"}}><span>💾</span></button>
                  <button onClick={()=>setEditFaseNum(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)"}}><span>✕</span></button>
                </div>
              ):(
                <>
                  <div><div style={{fontWeight:700,fontSize:13,color:`var(--${fase.color})`}}>{fase.label}</div><div style={{fontSize:10,color:"var(--text-dim)"}}>{fase.sub}</div></div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Badge color={fase.color}>{d}/{metas.length}</Badge>
                    <button onClick={()=>{setEditFaseNum(fase.num);setEditFaseD({});}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)"}}><span>✏️</span></button>
                    <button onClick={()=>delF(fase.num)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)"}}><span>🗑</span></button>
                  </div>
                </>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {metas.length===0&&<div style={{fontSize:11,color:"var(--text-dim)",padding:"6px 0"}}>Nenhuma meta nesta fase.</div>}
              {metas.map(meta=>(
                <Card key={meta.id} style={{padding:"10px 14px",opacity:meta.status==="concluido"?.6:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:3,textDecoration:meta.status==="concluido"?"line-through":"none"}}>{meta.acao}</div>
                      <div style={{display:"flex",gap:7,alignItems:"center"}}>
                        {meta.valor>0&&<span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--blue)"}}>{fmt(meta.valor)}</span>}
                        {meta.prazo&&<span style={{fontSize:10,color:"var(--text-dim)"}}>⏱ {meta.prazo}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <Sel value={meta.status} options={sOpts.map(s=>({v:s,l:sLabel[s]}))} onChange={e=>updS(meta.id,e.target.value)} style={{width:155,fontSize:11,padding:"4px 7px"}}/>
                      <button onClick={()=>delM(meta.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)"}}><span>🗑</span></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
      {showMeta&&(
        <Modal title="➕ Nova Meta" onClose={()=>setShowMeta(false)} color="green">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Lbl>Ação / Descrição</Lbl><Inp value={novaMeta.acao} onChange={e=>setNovaMeta(f=>({...f,acao:e.target.value}))} placeholder="Ex: Pagar cartão Nubank"/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Lbl>Valor (R$)</Lbl><Inp type="number" value={novaMeta.valor} onChange={e=>setNovaMeta(f=>({...f,valor:e.target.value}))} placeholder="0.00"/></div>
              <div><Lbl>Prazo</Lbl><Inp value={novaMeta.prazo} onChange={e=>setNovaMeta(f=>({...f,prazo:e.target.value}))} placeholder="Ex: Dia 30"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><Lbl>Fase</Lbl><Sel value={novaMeta.fase} options={fases.map(f=>({v:f.num,l:f.label}))} onChange={e=>setNovaMeta(f=>({...f,fase:+e.target.value}))}/></div>
              <div><Lbl>Status</Lbl><Sel value={novaMeta.status} options={sOpts.map(s=>({v:s,l:sLabel[s]}))} onChange={e=>setNovaMeta(f=>({...f,status:e.target.value}))}/></div>
            </div>
            <Btn onClick={addM} color="green" style={{width:"100%",marginTop:4}}>+ ADICIONAR META</Btn>
          </div>
        </Modal>
      )}
      {showFase&&(
        <Modal title="➕ Nova Fase" onClose={()=>setShowFase(false)} color="purple">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Lbl>Nome da Fase</Lbl><Inp value={novaFase.label} onChange={e=>setNovaFase(f=>({...f,label:e.target.value}))} placeholder="Ex: FASE 4 — Expansão"/></div>
            <div><Lbl>Período / Subtítulo</Lbl><Inp value={novaFase.sub} onChange={e=>setNovaFase(f=>({...f,sub:e.target.value}))} placeholder="Ex: 180 a 360 dias"/></div>
            <div><Lbl>Cor</Lbl><Sel value={novaFase.color} options={cOpts} onChange={e=>setNovaFase(f=>({...f,color:e.target.value}))}/></div>
            <Btn onClick={addF} color="purple" style={{width:"100%",marginTop:4}}>+ CRIAR FASE</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Config({data,save}){
  const cfg=data.config;
  const [newCE,setNewCE]=useState("");
  const [newCS,setNewCS]=useState("");
  const [loc,setLoc]=useState({metaReceita:cfg.metaReceita,metaReserva:cfg.metaReserva,metaCapitalGiro:cfg.metaCapitalGiro});
  const [saved,setSaved]=useState(false);
  const saveMetas=()=>{save({...data,config:{...cfg,...loc}});setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const addCE=()=>{if(!newCE||cfg.catsEntrada.includes(newCE))return;save({...data,config:{...cfg,catsEntrada:[...cfg.catsEntrada,newCE]}});setNewCE("");};
  const delCE=(c)=>save({...data,config:{...cfg,catsEntrada:cfg.catsEntrada.filter(x=>x!==c)}});
  const addCS=()=>{if(!newCS||cfg.catsSaida.includes(newCS))return;save({...data,config:{...cfg,catsSaida:[...cfg.catsSaida,newCS]}});setNewCS("");};
  const delCS=(c)=>save({...data,config:{...cfg,catsSaida:cfg.catsSaida.filter(x=>x!==c)}});
  const exportData=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`luciano-salomao-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);};
  return(
    <div className="fi">
      <Card style={{marginBottom:18}}>
        <Sec icon={Target} color="yellow">Metas Financeiras</Sec>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[{label:"Meta de Receita Mensal (R$)",key:"metaReceita",color:"yellow"},{label:"Meta Reserva de Emergência (R$)",key:"metaReserva",color:"green"},{label:"Meta Capital de Giro (R$)",key:"metaCapitalGiro",color:"blue"}].map(({label,key,color})=>(
            <div key={key}><Lbl>{label}</Lbl>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <Inp type="number" value={loc[key]} onChange={e=>setLoc(f=>({...f,[key]:+e.target.value}))} style={{color:`var(--${color})`}}/>
                <span style={{fontFamily:"var(--mono)",fontSize:13,color:`var(--${color})`,fontWeight:700,minWidth:120}}>{fmt(loc[key])}</span>
              </div>
            </div>
          ))}
          <Btn onClick={saveMetas} color={saved?"green":"yellow"} style={{marginTop:4}}>{saved?"✅ Salvo!":"💾 Salvar Metas"}</Btn>
        </div>
      </Card>

      <Card style={{marginBottom:18}}>
        <Sec icon={TrendingUp} color="green">Categorias de Entrada</Sec>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {cfg.catsEntrada.map(cat=>(
            <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"var(--green-dim)",border:"1px solid var(--green)25",borderRadius:8}}>
              <span style={{fontSize:12,color:"var(--green)"}}>{cat}</span>
              <button onClick={()=>delCE(cat)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)"}}><span>🗑</span></button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:7}}><Inp value={newCE} onChange={e=>setNewCE(e.target.value)} placeholder="Nova categoria" onKeyDown={e=>e.key==="Enter"&&addCE()}/><Btn color="green" sm onClick={addCE} style={{whiteSpace:"nowrap"}}>+ Add</Btn></div>
      </Card>

      <Card style={{marginBottom:18}}>
        <Sec icon={TrendingDown} color="red">Categorias de Saída</Sec>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {cfg.catsSaida.map(cat=>(
            <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"var(--red-dim)",border:"1px solid var(--red)25",borderRadius:8}}>
              <span style={{fontSize:12,color:"var(--red)"}}>{cat}</span>
              <button onClick={()=>delCS(cat)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--red)"}}><span>🗑</span></button>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:7}}><Inp value={newCS} onChange={e=>setNewCS(e.target.value)} placeholder="Nova categoria" onKeyDown={e=>e.key==="Enter"&&addCS()}/><Btn color="red" sm onClick={addCS} style={{whiteSpace:"nowrap"}}>+ Add</Btn></div>
      </Card>

      <Card>
        <Sec icon={Download} color="blue">Backup dos Dados</Sec>
        <div style={{fontSize:12,color:"var(--text-dim)",marginBottom:14,lineHeight:1.6}}>
          Exporte seus dados como arquivo JSON. Para restaurar, use o botão <strong style={{color:"var(--orange)"}}>Import</strong> no topo do app. Faça backup regularmente — os dados ficam salvos neste navegador/dispositivo.
        </div>
        <Btn color="blue" onClick={exportData} style={{display:"flex",alignItems:"center",gap:6}}><span>⬇️</span> Exportar Dados Agora</Btn>
        <div style={{marginTop:10,padding:"9px 12px",background:"var(--border)",borderRadius:8,fontSize:11,color:"var(--text-dim)"}}>
          ⚠️ Se trocar de dispositivo ou limpar o navegador, os dados são perdidos sem o backup.
        </div>
      </Card>
    </div>
  );
}
