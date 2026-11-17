import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';
const base=process.env.PORTFOLIO_BASE_URL||'http://localhost:5174';
const email=`demo-${Date.now()}@example.test`;
const password='DemoPassword!2026';
const call=async(path,method='GET',data,token)=>{
 const r=await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:data?JSON.stringify(data):undefined});
 const result=await r.json();if(!r.ok)throw new Error(`${path}: ${JSON.stringify(result)}`);return result;
};
const {token}=await call('/auth/register','POST',{email,password});
const a=await call('/courses','POST',{title:'Java e Spring Boot',totalLessons:32},token);
const b=await call('/courses','POST',{title:'Arquitetura de Microsserviços',totalLessons:24},token);
const c=await call('/courses','POST',{title:'SQL e Banco de Dados',totalLessons:18},token);
await call(`/courses/${a.id}/progress`,'PUT',{completedLessons:21},token);
await call(`/courses/${b.id}/progress`,'PUT',{completedLessons:12},token);
await call(`/courses/${c.id}/progress`,'PUT',{completedLessons:18},token);
await call('/goal','PUT',{weeklyMinutes:720},token);
const date=new Date();
for(let i=12;i>=0;i-=1){const d=new Date(date);d.setDate(date.getDate()-i);
 const studiedOn=d.toLocaleDateString('en-CA');
 await call('/sessions','POST',{courseId:i%2?a.id:b.id,topic:['Spring Security e JWT','JPA e Repository','RabbitMQ e mensageria','Testes com JUnit'][i%4],minutes:30+(i%5)*18,studiedOn},token);
}
await call('/notes','POST',{courseId:a.id,title:'Injeção de dependências',content:'O Spring gerencia o ciclo de vida dos beans e resolve dependências pelo construtor.'},token);
let browser;
for(const channel of ['chrome','msedge']){try{browser=await chromium.launch({channel,headless:true});break;}catch{}}
if(!browser)throw new Error('Chrome ou Edge nao encontrado para captura Playwright');
try{const page=await browser.newPage({viewport:{width:1536,height:1050},deviceScaleFactor:1});
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.evaluate(t=>localStorage.setItem('token',t),token);
 await page.reload({waitUntil:'networkidle'});
 await page.locator('text=Java e Spring Boot').first().waitFor({timeout:20000});
 const out=fileURLToPath(new URL('../../docs/images/funcionamento.png',import.meta.url));
 mkdirSync(dirname(out),{recursive:true});
 await page.screenshot({path:out,fullPage:true,animations:'disabled'});
 console.log('Captura real do frontend concluida.');
}finally{await browser.close();}
