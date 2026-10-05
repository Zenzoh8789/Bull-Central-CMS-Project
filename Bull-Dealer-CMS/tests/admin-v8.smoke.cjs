const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.BULL_PLAYWRIGHT_PATH || 'playwright');
const {registry, validateSection, resolveContent} = require('../apps/api/dist/cms/content.js');
const defaults = require('../apps/content/defaults.json');
const output = path.resolve(__dirname, '../artifacts/admin-v8');
const actor = {id:1,name:'Admin',role:'SUPER_ADMIN',cms_entered:true};
const dealer={id:1,name:'Tara Auto Hub Pvt. Ltd.',location:'Bihar',address:'Patna, Bihar',about:'Sales and service',active:true,domains:['tara.example.com']};
let drafts=[],writes=[],rejectNext=false,uploads=0;let publicState='Tamil Nadu';
let dealers=[{...dealer,state:'Bihar',district:'Patna'},{...dealer,id:2,name:'Gaya Dealer',state:'Bihar',district:'Gaya'},{...dealer,id:3,name:'Chennai Dealer',state:'Tamil Nadu',district:'Chennai'}];
const {bannerMatches}=require('../apps/content/banners.js');
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
  if(endpoint==='/api/site'){const c=content();c.banners.items=c.banners.items.filter(i=>bannerMatches(i,{state:publicState}));return reply({dealer,products:c.products.items,mode:'cms',content:c,sources:{}});}
  if(endpoint==='/api/products')return reply(content().products.items);
  if(endpoint.endsWith('/registry'))return reply(registry());
  if(endpoint.endsWith('/dealers'))return reply(dealers);
  if(/\/dealers\/\d+$/.test(endpoint) && req.method()==='PUT'){const body=req.postDataJSON();const id=Number(endpoint.split('/').pop());dealers=dealers.map(d=>d.id===id?{...d,...body}:d);return reply({id});}
  if(endpoint.endsWith('/groups'))return reply([{id:11,name:'South region',dealerIds:[1]}]);
  if(endpoint.endsWith('/employees'))return reply([{id:1,name:'Arun',department:'Operations',active:true}]);
  if(endpoint.endsWith('/activity'))return reply([]);
  if(endpoint.endsWith('/media'))return reply(req.method()==='POST'?{url:'/Asset/Images/Service.png?upload='+ (++uploads)}:[]);
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
 await page.goto('http://127.0.0.1:5194/admin/content?section=banners');await page.locator('.banner-table tbody tr').first().waitFor();assert.deepEqual(await page.locator('.banner-table th').allTextContents(),['#','Image','Title','Publish','Actions']);
 await page.getByRole('button',{name:'Add Item',exact:true}).click();let popup=page.getByRole('dialog');await popup.getByLabel('Title',{exact:true}).fill('Regional launch');
 const image=path.join(__dirname,'../apps/web/public/Asset/Images/Service.png');
 await popup.getByLabel('Banner images',{exact:true}).setInputFiles([image,image,image,image]);await popup.getByRole('alert').filter({hasText:'Maximum 3'}).waitFor();assert.equal(uploads,0);
 await popup.getByLabel('Banner images',{exact:true}).setInputFiles([image,image,image]);await popup.locator('.banner-previews img').nth(2).waitFor();await popup.getByRole('button',{name:'Save banner'}).waitFor();assert.equal(uploads,3);
 assert.equal(await popup.locator('.banner-state-list input').count(),36);
 await popup.getByLabel('Search states and UTs').fill('tamil');await popup.getByLabel('Tamil Nadu',{exact:true}).check();await popup.getByLabel('Search states and UTs').fill('kerala');await popup.getByLabel('Kerala',{exact:true}).check();await popup.getByLabel('Search states and UTs').fill('');
 await page.screenshot({path:path.join(output,'banner-form.png')});rejectNext=true;await popup.getByRole('button',{name:'Save banner'}).click();await popup.getByRole('alert').filter({hasText:'Save unavailable'}).waitFor();await popup.getByRole('button',{name:'Save banner'}).click();await page.getByText('Changes published.',{exact:true}).waitFor();assert.equal(writes.at(-1).document.items.length,4);
 let row=page.locator('.banner-table tbody tr').filter({hasText:'Regional launch'});assert.ok((await row.innerText()).includes('Tamil Nadu, Kerala'));await row.getByRole('button',{name:'View',exact:true}).click();await popup.getByLabel('Title',{exact:true}).waitFor();assert.ok(await popup.getByLabel('Title',{exact:true}).isDisabled());assert.equal(await popup.locator('.banner-previews img').count(),3);await popup.getByRole('button',{name:'Close',exact:true}).click();
 await row.getByRole('button',{name:'Edit',exact:true}).click();assert.equal(await popup.getByLabel('Title',{exact:true}).inputValue(),'Regional launch');assert.ok(await popup.getByLabel('Tamil Nadu',{exact:true}).isChecked());assert.ok(await popup.getByLabel('Kerala',{exact:true}).isChecked());await popup.getByRole('button',{name:'Remove image 2'}).click();await popup.getByRole('button',{name:'Save banner'}).click();await page.getByText('Changes published.',{exact:true}).waitFor();assert.equal(writes.at(-1).document.items[3].images.length,2);
 const web=await context.newPage();await web.goto('http://127.0.0.1:5193/');await web.locator('.banner-image').first().waitFor();assert.equal(await web.locator('.banner-image').count(),5);publicState='Karnataka';await web.reload();await web.locator('.banner-image').first().waitFor();assert.equal(await web.locator('.banner-image').count(),3);
 await row.getByRole('button',{name:'Edit',exact:true}).click();await popup.getByLabel('All States',{exact:true}).check();await popup.getByRole('button',{name:'Save banner'}).click();await page.getByText('Changes published.',{exact:true}).waitFor();assert.ok((await row.innerText()).includes('All States'));await page.screenshot({path:path.join(output,'banner-list.png')});
 await page.setViewportSize({width:390,height:844});await row.getByRole('button',{name:'Edit',exact:true}).click();await popup.getByLabel('Title',{exact:true}).waitFor();assert.ok(await popup.evaluate(el=>el.scrollWidth<=el.clientWidth));await page.screenshot({path:path.join(output,'mobile-banner.png')});await popup.getByRole('button',{name:'Cancel',exact:true}).click();
 page.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Delete Regional launch',exact:true}).click();await page.getByText('Changes published.',{exact:true}).waitFor();assert.equal(writes.at(-1).document.items.length,3);assert.equal(writes.filter(w=>w.section!=='banners').length,0);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({result:'passed',liveDatabase:false,checks:['legacy banners','three-image upload and limit','all 36 searchable states and UTs','multiple states','save error retry','view read-only','edit restores images title states','image removal','targeted public slides','All States','delete','mobile dialog']},null,2));console.log('PASS banner management browser checks');
 }catch(e){await page.screenshot({path:path.join(output,'failure.png')});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
