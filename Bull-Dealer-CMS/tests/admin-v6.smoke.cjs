const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.BULL_PLAYWRIGHT_PATH || 'playwright');
const {registry, validateSection, resolveContent} = require('../apps/api/dist/cms/content.js');
const defaults = require('../apps/content/defaults.json');
const output = path.resolve(__dirname, '../artifacts/admin-v6');
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
  await page.goto('http://127.0.0.1:5194/admin/content');
  await page.locator('.section-row').first().waitFor();
  const labels=['SEO','Header','Banners','Statistics','About us','Products','Service','Videos & testimonials','News & updates','Contact','Footer'];
  assert.deepEqual(await page.locator('.section-row-copy>strong').allTextContents(),labels);
  assert.equal(await page.getByText('All sections',{exact:true}).count(),0);
  for(const label of ['Single dealer','Dealer override','Dealer groups','Active'])assert.equal(await page.getByRole('button',{name:label,exact:true}).count(),0);
  assert.equal(await page.getByRole('combobox',{name:'Choose dealer'}).locator('option').count(),4);
  await page.screenshot({path:path.join(output,'all-content.png'),fullPage:true});
  await page.getByRole('button',{name:'State & district',exact:true}).click();
  await page.getByLabel('State',{exact:true}).selectOption('Bihar');
  await page.getByLabel('District',{exact:true}).selectOption('Patna');
  assert.equal(await page.getByRole('combobox',{name:'Choose dealer'}).locator('option').count(),2);
  await page.getByRole('combobox',{name:'Choose dealer'}).selectOption('1');
  await page.screenshot({path:path.join(output,'location-filter.png')});
  await page.locator('.section-row').filter({has:page.getByText('SEO',{exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Title',{exact:true}).fill('Tara location-selected SEO');await save();
  assert.equal(writes.at(-1).ownerId,1);assert.equal(writes.at(-1).layer,'OVERRIDE');
  await page.getByRole('button',{name:'Close popup'}).click();
  await page.locator('.section-row').filter({has:page.getByText('Statistics',{exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();
  await page.locator('.array-editor .content-table tbody tr').first().waitFor();assert.equal(await page.locator('.array-editor .content-table tbody tr').count(),4);
  await page.getByRole('button',{name:'Close popup'}).click();
  await page.locator('.section-row').filter({has:page.getByText('Products',{exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Product content',{exact:true}).selectOption('backhoe');
  await page.getByLabel('Heading',{exact:true}).fill('BACKHOE EDITED');await save();
  await page.getByLabel('Product content',{exact:true}).selectOption('skid');
  await page.getByLabel('Heading',{exact:true}).fill('SKID EDITED');await save();
  await page.screenshot({path:path.join(output,'product-selector.png')});
  await page.getByRole('button',{name:'Close popup'}).click();
  await page.locator('.section-row').filter({has:page.getByText('Videos & testimonials',{exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();
  await page.locator('.array-editor .content-table tbody tr').first().getByRole('button',{name:'Edit',exact:true}).click();let popup=page.getByRole('dialog').last();
  await popup.getByLabel('Description',{exact:true}).fill(Array.from({length:10},(_,i)=>'Paragraph '+i+' about reliable performance.').join('\n'));
  assert.ok(await popup.getByLabel('Description',{exact:true}).evaluate(el=>el.clientHeight>200));
  await page.screenshot({path:path.join(output,'adaptive-text.png')});
  rejectNext=true;await popup.getByRole('button',{name:'Save item'}).click();await popup.getByRole('alert').filter({hasText:'Save unavailable'}).waitFor();assert.ok(await popup.isVisible());await popup.getByRole('button',{name:'Save item'}).click();await page.getByRole('dialog').last().getByText('Changes published.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Close popup'}).click();
  await page.getByRole('button',{name:'All dealers',exact:true}).click();
  await page.locator('.section-row').filter({has:page.getByText('Header',{exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();await page.screenshot({path:path.join(output,'logo-upload.png')});await page.locator('input[type=file]').setInputFiles(path.join(__dirname,'../apps/web/public/Asset/Images/Service.png'));await page.getByText('Uploaded. Save changes to update the website.',{exact:true}).waitFor();await save();assert.equal(writes.at(-1).document.dealerLogo,'/admin/brand/bull-machine-logo.webp');assert.equal(writes.at(-1).layer,'COMMON');
  await page.getByRole('button',{name:'Close popup'}).click();
  await page.locator('.section-row').filter({has:page.getByText('SEO',{exact:true})}).getByRole('button',{name:'View',exact:true}).click();
  assert.ok(await page.getByLabel('Title',{exact:true}).isDisabled());assert.equal(await page.getByRole('button',{name:'Save',exact:true}).count(),0);await page.getByRole('button',{name:'Close popup'}).click();
  assert.equal(await page.locator('.section-tabs').count(),0);
  await page.getByRole('link',{name:'Dealers',exact:true}).click();
  await page.getByRole('button',{name:'Edit Tara Auto Hub Pvt. Ltd.',exact:true}).click();await page.locator('.dealer-section-tabs').waitFor();assert.equal(await page.locator('.dealer-section-tabs button').count(),11);await page.getByRole('button',{name:'Close popup'}).click();
  await page.getByRole('button',{name:'State & district',exact:true}).click();
  await page.getByLabel('State',{exact:true}).selectOption('Bihar');await page.getByLabel('District',{exact:true}).selectOption('Gaya');
  assert.equal(await page.locator('.dealers-table tbody tr').count(),1);
  await page.getByRole('button',{name:'Edit location',exact:true}).click();popup=page.getByRole('dialog');
  await popup.getByLabel('District',{exact:true}).fill('Nalanda');await popup.getByRole('button',{name:'Save location'}).click();
  await page.getByText('Dealer location updated.',{exact:true}).waitFor();
  assert.equal(dealers.find(d=>d.id===2).district,'Nalanda');
  await page.getByRole('button',{name:'All dealers',exact:true}).click();
  await page.getByRole('link',{name:'Employees',exact:true}).click();await page.getByRole('cell',{name:'Arun',exact:true}).waitFor();assert.equal(await page.locator('.header-path').innerText(),'Employees');await page.getByRole('button',{name:'View',exact:true}).click();await page.getByRole('dialog',{name:'Arun',exact:true}).waitFor();await page.getByRole('button',{name:'Close popup'}).click();
  await page.getByRole('link',{name:'Dashboard',exact:true}).click();await page.locator('.header-path').getByText('Dashboard',{exact:true}).waitFor();assert.equal(await page.locator('.header-path').innerText(),'Dashboard');
  await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5194/admin/content');
  await page.locator('.section-row').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.section-row').filter({has:page.getByText('About us',{exact:true})}).getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByLabel('Text',{exact:true}).waitFor();await page.screenshot({path:path.join(output,'mobile-popup.png')});
  await page.getByRole('button',{name:'Close popup'}).click();
  await page.screenshot({path:path.join(output,'mobile-content.png'),fullPage:true});
  const web=await context.newPage();await web.goto('http://127.0.0.1:5193/');await web.getByText('BACKHOE EDITED',{exact:true}).waitFor();await web.getByText('SKID EDITED',{exact:true}).waitFor();
  await web.locator('.products-menu-trigger').first().click();assert.equal(await web.locator('#products-panel .products-menu-card').count(),4);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({result:'passed',liveDatabase:false,checks:['section order','two audience modes','state and district filtering','header dealer selector','dealer/common scope save','table section popups','read-only View','dealer-only tabs','logo upload','item save error and retry','Employees table','header titles','four statistics','product content selector','adaptive paragraph inputs','dealer geography save','mobile overflow','four public menu products'],apiValidation:'real validators on mocked content saves'},null,2));
  console.log('PASS V6 browser checks with real API validators and mocked storage.');
 }catch(e){await page.screenshot({path:path.join(output,'failure.png')});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

