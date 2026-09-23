const assert = require('node:assert/strict');
const http = require('node:http');
function request(path, {method='GET',host='localhost',body}={}) { return new Promise((resolve,reject)=>{
 const req=http.request({hostname:'127.0.0.1',port:3000,path,method,headers:{Host:host,'content-type':'application/json'}},res=>{let text='';res.on('data',d=>text+=d);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(text)}))});req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body));
});}
(async()=>{
 const site=await request('/api/site');assert.equal(site.status,200);assert.equal(site.body.products.length,4);assert.equal(site.body.mode,'demo');
 const catalogue=await request('/api/products');assert.equal(catalogue.status,200);assert.deepEqual(catalogue.body.filter(p=>p.showInMenu).sort((a,b)=>a.menuOrder-b.menuOrder).map(p=>p.id),['sd76','hd76','av490']);
 const detail=await request('/api/products/sd76');assert.equal(detail.status,200);assert.equal(detail.body.id,'sd76');
 const missing=await request('/api/products/missing');assert.equal(missing.status,404);
 const foreign=await request('/api/products',{host:'unknown-dealer.example'});assert.equal(foreign.status,404);
 const unknown=await request('/api/site',{host:'unknown-dealer.example'});assert.equal(unknown.status,404);
 const invalid=await request('/api/enquiries',{method:'POST',body:{name:'A',phone:'bad',product:'Fake',consent:false}});assert.equal(invalid.status,400);
 const preview=await request('/api/enquiries',{method:'POST',body:{name:'Test Customer',phone:'9999999999',product:'Help me choose',email:'',message:'Local smoke test',consent:true}});assert.equal(preview.status,503);
 const web=await fetch('http://localhost:5173/api/site');assert.equal(web.status,200);
 console.log('PASS: menu ordering, product details, missing products, unknown-domain isolation, validation, demo rejection, API proxy');
})().catch(e=>{console.error(e);process.exitCode=1});

