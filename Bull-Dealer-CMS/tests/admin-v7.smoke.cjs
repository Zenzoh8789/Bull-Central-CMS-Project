const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.BULL_PLAYWRIGHT_PATH || 'playwright');
const {registry, validateSection, resolveContent} = require('../apps/api/dist/cms/content.js');
const defaults = require('../apps/content/defaults.json');
const output = path.resolve(__dirname, '../artifacts/admin-v7');
const actor = {id:1,name:'Admin',role:'SUPER_ADMIN',cms_entered:true};
const dealer={id:1,name:'Tara Auto Hub Pvt. Ltd.',location:'Bihar',address:'Patna, Bihar',about:'Sales and service',active:true,domains:['tara.example.com']};
let drafts=[],writes=[],rejectNext=false;
let dealers=[{...dealer,state:'Bihar',district:'Patna'},{...dealer,id:2,name:'Gaya Dealer',state:'Bihar',district:'Gaya'},{...dealer,id:3,name:'Chennai Dealer',state:'Tamil Nadu',district:'Chennai'}];
const content=()=>resolveContent(drafts.map(d=>({...d,section_key:d.section_key}))).content;
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.addInitScript(user=>sessionStorage.setItem('bull-session',JSON.stringify({token:'ui-test',user})),actor);
 await context.route('**/api/**', async route=>{
  const req=route.request(), endpoint=new URL(req.url()).pathname;
  const reply=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  if(endpoint==='/api/auth/me')return reply(actor);
  if(endpoint==='/api/site')return reply({dealer,products:content().products.items,mode:'cms',content:content(),sources:{}});
  if(endpoint==='/api/products')return reply(content().products.items);
  if(endpoint.endsWith('/registry'))return reply(registry());
  if(endpoint.endsWith('/dealers'))return reply(dealers);
  if(/\/dealers\/\d+$/.test(endpoint) && req.method()==='PUT'){const body=req.postDataJSON();const id=Number(endpoint.split('/').pop());dealers=dealers.map(d=>d.id===id?{...d,...body}:d);return reply({id});}
  if(endpoint.endsWith('/groups'))return reply([{id:11,name:'South region',dealerIds:[1]}]);
  if(endpoint.endsWith('/employees'))return reply([{id:1,name:'Arun',department:'Operations',active:true}]);
  if(endpoint.endsWith('/activity'))return reply([]);
  if(endpoint.endsWith('/media'))return reply(req.method()==='POST'?{url:'/admin/brand/bull-machine-logo.webp'}:[]);
  if(endpoint.endsWith('/resolved'))return reply({dealer,content:content(),sources:{}});
  if(endpoint.endsWith('/drafts')){
    if(req.method()==='GET')return reply(drafts);
    if(rejectNext){rejectNext=false;return reply({message:'Save unavailable. Please retry.'},503);}
    const body=req.postDataJSON();let document;
    try{document=validateSection(body.section,body.document);}catch(error){return reply({message:error.message},400);}
    writes.push(body);const saved={id:drafts.length+1,layer:body.layer,owner_id:body.ownerId,section_key:body.section,document,revision:body.expectedRevision+1,remove_override:body.removeOverride,published:true};
    drafts=[...drafts.filter(d=>d.layer!==saved.layer||d.owner_id!==saved.owner_id||d.section_key!==saved.section_key),saved];return reply(saved);
  }
  return reply({message:'Unexpected request '+endpoint},404);
 });
 await context.route('**/Asset/**',async route=>{
  const file=path.join(__dirname,'../apps/web/public',decodeURIComponent(new URL(route.request().url()).pathname));
  return fs.existsSync(file)?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const tab=name=>page.locator('.dealer-section-tabs').getByRole('button',{name,exact:true}).click();
 const save=async()=>{await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Changes published.',{exact:true}).waitFor();};
 try{
 await page.goto('http://127.0.0.1:5194/admin/content?section=banners');
 await page.locator('.array-editor tbody tr').first().waitFor();
 assert.equal(await page.locator('dialog[open]').count(),0);
 assert.equal(await page.locator('.section-index,.section-tabs,.header-dealer,.header-dealer-logo').count(),0);
 assert.equal(await page.locator('.sidebar-common').getByRole('link',{name:'Header',exact:true}).count(),0);
 await page.screenshot({path:path.join(output,'inline-banners.png')});
 await page.locator('.array-editor tbody tr').first().getByRole('button',{name:'Edit',exact:true}).click();
 let popup=page.getByRole('dialog');await popup.waitFor();assert.ok(await popup.evaluate(el=>el.getBoundingClientRect().width<=961));
 await popup.getByLabel('Alt',{exact:true}).fill('Updated banner description');await popup.getByRole('button',{name:'Save item'}).click();await page.getByText('Changes published.',{exact:true}).waitFor();assert.equal(writes.at(-1).document.items[0].alt,'Updated banner description');
 await page.getByRole('link',{name:'SEO',exact:true}).click();await page.getByLabel('Title',{exact:true}).waitFor();assert.equal(await page.locator('dialog[open]').count(),0);
 await page.getByRole('button',{name:'State & district',exact:true}).click();await page.getByLabel('State',{exact:true}).selectOption('Bihar');await page.getByLabel('District',{exact:true}).selectOption('Patna');await page.getByLabel('Choose dealer',{exact:true}).selectOption('1');await page.getByLabel('Title',{exact:true}).fill('Selected dealer SEO');await save();assert.equal(writes.at(-1).ownerId,1);
 await page.getByRole('link',{name:'Dealers',exact:true}).click();await page.locator('.dealers-table tbody tr').first().waitFor();assert.equal(await page.locator('.location-filter').count(),0);assert.equal(await page.locator('.dealers-table tbody tr').count(),3);
 await page.getByRole('button',{name:'Edit Tara Auto Hub Pvt. Ltd.',exact:true}).click();await page.locator('.dealer-section-tabs').waitFor();await tab('Header');await page.locator('.logo-upload-layout').waitFor();assert.ok(await page.getByRole('dialog').evaluate(el=>el.getBoundingClientRect().width<=961));await page.screenshot({path:path.join(output,'medium-dealer-popup.png')});await page.getByRole('button',{name:'Close popup'}).click();
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5194/admin/content?section=banners');await page.locator('.array-editor tbody tr').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'mobile-inline.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({result:'passed',liveDatabase:false,checks:['inline common sections','no preview index','header controls removed','Header only inside dealer editor','medium dialogs','item saving','location dealer selection','dealer page ignores shared filters','mobile overflow']},null,2));console.log('PASS V7 browser checks');
 }catch(e){await page.screenshot({path:path.join(output,'failure.png')});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
