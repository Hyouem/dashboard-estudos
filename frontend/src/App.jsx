import React, {useEffect,useState} from 'react';
import {Activity,BookOpen,CalendarDays,CheckCircle2,Clock3,GraduationCap,LogOut,Plus,Target,TrendingUp} from 'lucide-react';
import {AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from 'recharts';
const today=()=>new Date().toLocaleDateString('en-CA');
const minutes=n=>`${Math.round(Number(n||0)/60*10)/10} h`;
async function api(path,token,method='GET',body){
 const r=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(d?.error||`Erro HTTP ${r.status}`);return d;
}
export default function App(){
 const [token,setToken]=useState(localStorage.getItem('token')||'');
 const [email,setEmail]=useState('');const [pass,setPass]=useState('');const [register,setRegister]=useState(false);
 const [error,setError]=useState('');const [dashboard,setDashboard]=useState(null);
 const [courses,setCourses]=useState([]);const [sessions,setSessions]=useState([]);const [notes,setNotes]=useState([]);
 const [course,setCourse]=useState({title:'',totalLessons:12});
 const [session,setSession]=useState({courseId:'',topic:'',minutes:45,studiedOn:today()});
 const [note,setNote]=useState({courseId:'',title:'',content:''});
 const [goal,setGoal]=useState(420);const [from,setFrom]=useState('');const [to,setTo]=useState('');
 async function refresh(t=token){if(!t)return;
   try{const query=(from||to)?'?'+new URLSearchParams({...from?{from}:{},...to?{to}:{}}):'';
     const [d,c,s,n]=await Promise.all([api('/dashboard'+query,t),api('/courses',t),api('/sessions',t),api('/notes',t)]);
     setDashboard(d);setCourses(c);setSessions(s);setNotes(n);setGoal(d.weekly_target);
     setSession(old=>({...old,courseId:old.courseId||c[0]?.id||''}));setNote(old=>({...old,courseId:old.courseId||c[0]?.id||''}));setError('');
   }catch(e){setError(e.message);if(e.message.includes('401'))logout();}}
 useEffect(()=>{if(token)refresh(token);},[token,from,to]);
 function logout(){localStorage.removeItem('token');setToken('');}
 async function authenticate(e){e.preventDefault();setError('');try{
   const d=await api('/auth/'+(register?'register':'login'),null,'POST',{email,password:pass});
   localStorage.setItem('token',d.token);setToken(d.token);setPass('');
 }catch(e){setError(e.message);}}
 async function mutate(path,method,body,after){setError('');try{await api(path,token,method,body);if(after)after();await refresh();}catch(e){setError(e.message);}}
 if(!token)return <div className="auth"><div className="eyebrow">Projeto 14/52</div><h1>Seu aprendizado,<br/>em perspectiva.</h1><p className="sub">Cursos, metas e consistência em um só lugar.</p>
   <form onSubmit={authenticate} className="stack"><div><label>E-mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" required/></div>
   <div><label>Senha (mín. 8 caracteres)</label><input type="password" minLength="8" value={pass} onChange={e=>setPass(e.target.value)} required/></div>
   {error&&<div className="error">{error}</div>}<button className="primary">{register?'Criar conta':'Entrar no dashboard'}</button>
   <button type="button" className="secondary" onClick={()=>setRegister(!register)}>{register?'Já tenho conta':'Criar minha conta'}</button></form></div>;
 const data=dashboard?.daily?.map(d=>({day:String(d.day).slice(5),minutes:Number(d.minutes)}))||[];
 const progress=Math.min(100,Math.round(100*Number(dashboard?.weekly_minutes||0)/Math.max(1,Number(dashboard?.weekly_target||420))));
 return <div className="app"><aside className="side"><div className="brand">study<b>flow.</b></div><div className="tag">Learning analytics</div>
   <nav className="nav"><div className="nav-item"><Activity size={17}/> Visão geral</div><div className="nav-item nav-muted"><BookOpen size={17}/> Trilhas de estudo</div><div className="nav-item nav-muted"><Clock3 size={17}/> Sessões e notas</div><div className="nav-item nav-muted"><Target size={17}/> Metas semanais</div></nav>
   <div className="side-bottom">Java 25 · Spring Boot 3.5.7<br/>PostgreSQL · React<button className="secondary smallbtn" style={{display:'block',marginTop:14}} onClick={logout}><LogOut size={12}/> Sair</button></div></aside>
   <main className="main"><div className="top"><div><div className="eyebrow">PAINEL DE ESTUDOS</div><h1>Seu progresso em foco <span style={{color:'#6aebbd'}}>✦</span></h1><p className="sub">Acompanhe sua evolução e mantenha o ritmo.</p></div><div className="row"><input aria-label="Data inicial" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{maxWidth:160}}/><input aria-label="Data final" type="date" value={to} onChange={e=>setTo(e.target.value)} style={{maxWidth:160}}/></div></div>
   {error&&<div className="error">{error}</div>}
   <div className="grid4"><div className="metric"><small>Tempo estudado no período</small><div className="value">{minutes(dashboard?.total_minutes)}</div><div className="foot">Horas de estudo registradas</div></div>
   <div className="metric"><small>Trilhas cadastradas</small><div className="value">{dashboard?.course_count||0}</div><div className="foot">Cursos sob acompanhamento</div></div>
   <div className="metric"><small>Trilhas concluídas</small><div className="value">{dashboard?.completed_courses||0}</div><div className="foot">Progresso persistido</div></div>
   <div className="metric"><small>Meta da semana</small><div className="value">{progress}%</div><div className="foot">{minutes(dashboard?.weekly_minutes)} / {minutes(dashboard?.weekly_target)}</div></div></div>
   <div className="layout"><div className="card"><div className="linehead"><h2>Atividade de estudos</h2><span className="pill"><TrendingUp size={12}/> evolução diária</span></div>
   <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6f8eff" stopOpacity=".42"/><stop offset="95%" stopColor="#6f8eff" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#2c3b52" strokeDasharray="3 5"/><XAxis dataKey="day" stroke="#899cb6" fontSize={11}/><YAxis stroke="#899cb6" fontSize={11}/><Tooltip contentStyle={{background:'#121d30',border:'1px solid #43536b',borderRadius:12}}/><Area type="monotone" dataKey="minutes" name="Minutos" stroke="#7b9bff" strokeWidth={3} fill="url(#studyGradient)"/></AreaChart></ResponsiveContainer></div>
   <div className="hint">O gráfico considera somente sessões do período selecionado e os dados persistidos no banco.</div></div>
   <div className="card"><div className="linehead"><h2><Target size={17}/> Meta semanal</h2><span className="pill">{progress}%</span></div>
   <div style={{fontFamily:'Outfit',fontSize:31,fontWeight:700,marginTop:9}}>{Number(dashboard?.weekly_minutes||0)} <span className="muted" style={{fontSize:15}}>/ {goal} min</span></div><div className="bar-bg"><div className="bar-fill" style={{width:progress+'%'}}/></div>
   <p className="hint">{dashboard?.recommendation}</p><form className="row" onSubmit={e=>{e.preventDefault();mutate('/goal','PUT',{weeklyMinutes:Number(goal)});}}><input aria-label="Meta em minutos" type="number" min="1" max="10080" value={goal} onChange={e=>setGoal(e.target.value)}/><button className="primary">Salvar meta</button></form>
   </div></div>
   <div className="layout"><div className="card"><div className="linehead"><h2>Trilhas em andamento</h2><span className="pill">{courses.length} cursos</span></div><div className="statlist">{courses.length?courses.map(c=>{const percent=Math.round(c.completed_lessons*100/c.total_lessons);return <div key={c.id}><div className="statline"><strong>{c.title}</strong><span className="muted">{c.completed_lessons}/{c.total_lessons} · {percent}%</span></div><div className="bar-bg"><div className="bar-fill" style={{width:percent+'%'}}/></div><div className="row" style={{marginTop:7,justifyContent:'flex-end'}}><button className="secondary smallbtn" onClick={()=>mutate('/courses/'+c.id+'/progress','PUT',{completedLessons:Math.min(c.total_lessons,c.completed_lessons+1)})}><CheckCircle2 size={12}/> +1 aula</button></div></div>;}):<p className="empty">Cadastre sua primeira trilha.</p>}</div>
   <form className="row" style={{marginTop:20}} onSubmit={e=>{e.preventDefault();mutate('/courses','POST',{title:course.title,totalLessons:Number(course.totalLessons)},()=>setCourse({title:'',totalLessons:12}));}}><input aria-label="Curso" placeholder="Nova trilha (ex.: Spring Boot)" value={course.title} onChange={e=>setCourse({...course,title:e.target.value})} required/><input aria-label="Total de aulas" type="number" min="1" max="10000" style={{maxWidth:96}} value={course.totalLessons} onChange={e=>setCourse({...course,totalLessons:e.target.value})}/><button className="primary" title="Adicionar trilha"><Plus size={17}/></button></form></div>
   <div className="card"><h2><Clock3 size={17}/> Registrar sessão</h2><form className="stack" onSubmit={e=>{e.preventDefault();mutate('/sessions','POST',{...session,minutes:Number(session.minutes)},()=>setSession({...session,topic:''}));}}>
   <div><label>Trilha</label><select aria-label="Trilha da sessão" value={session.courseId} onChange={e=>setSession({...session,courseId:e.target.value})}><option value="">Escolha uma trilha</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
   <div><label>O que estudou?</label><input value={session.topic} onChange={e=>setSession({...session,topic:e.target.value})} placeholder="Ex.: Injeção de dependência" required/></div>
   <div className="formrow"><div><label>Duração (min)</label><input type="number" min="1" max="1440" value={session.minutes} onChange={e=>setSession({...session,minutes:e.target.value})}/></div><div><label>Data</label><input type="date" value={session.studiedOn} onChange={e=>setSession({...session,studiedOn:e.target.value})}/></div></div><button className="primary" disabled={!courses.length}>Registrar estudo</button></form></div></div>
   <div className="layout"><div className="card"><h2><CalendarDays size={17}/> Sessões recentes</h2>{sessions.slice(0,5).map(s=><div className="listrow" key={s.id}><div className="statline"><strong>{s.topic}</strong><span className="good">{s.minutes} min</span></div><div className="hint">{s.course_title} · {String(s.studied_on).slice(0,10)}</div></div>)}{!sessions.length&&<p className="empty">Nenhuma sessão registrada.</p>}</div>
   <div className="card"><h2><BookOpen size={17}/> Anotações</h2>{notes.slice(0,2).map(n=><div className="listrow" key={n.id}><strong>{n.title}</strong><div className="hint">{n.course_title} · {n.content.slice(0,110)}</div></div>)}<form className="stack" style={{marginTop:14}} onSubmit={e=>{e.preventDefault();mutate('/notes','POST',note,()=>setNote({...note,title:'',content:''}));}}><select value={note.courseId} onChange={e=>setNote({...note,courseId:e.target.value})}><option value="">Selecione um curso</option>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select><input placeholder="Título da anotação" value={note.title} onChange={e=>setNote({...note,title:e.target.value})}/><textarea placeholder="Conteúdo" value={note.content} onChange={e=>setNote({...note,content:e.target.value})}/><button className="secondary" disabled={!courses.length}>Adicionar anotação</button></form></div></div>
   <div className="footnote">Projeto 14/52 · Autenticação JWT · Isolamento de dados por usuário · Dashboard baseado em registros reais</div></main></div>;
}
