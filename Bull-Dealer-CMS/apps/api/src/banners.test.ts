import test from 'node:test';
import assert from 'node:assert/strict';
import defaults from '@bull/content';
import { normalizeBanners, bannerMatches, bannerSlides, indianStates, publishLabel } from '@bull/content/banners';
import { validateSection } from './cms/content';
const entry=()=>({...normalizeBanners(defaults.banners),items:[{image:'/one.png',alt:'Launch',url:'',title:'Launch',images:['/one.png','/two.png','/three.png'],states:['Tamil Nadu','Kerala']}]});
test('legacy banners retain images and become All States entries',()=>{const legacy={...defaults.banners,items:[{image:'/existing.webp',alt:'Existing banner',url:''}]};const doc=validateSection('banners',legacy) as any;assert.equal(doc.items.length,1);assert.deepEqual(doc.items[0].states,['ALL']);assert.equal(doc.items[0].images[0],legacy.items[0].image);assert.equal(doc.items[0].enabled,true);});
test('banner validation accepts three images and rejects four, none and unsafe image links',()=>{assert.doesNotThrow(()=>validateSection('banners',entry()));for(const images of [[],['/1','/2','/3','/4'],['javascript:alert(1)'],['https://user:password@example.com/image.png']]){const doc=entry();doc.items[0].images=images;assert.throws(()=>validateSection('banners',doc));}});
test('banner targeting validates all 36 Indian states and UTs',()=>{assert.equal(indianStates.length,36);assert.equal(new Set(indianStates).size,36);const doc=entry();for(const states of [[],['Unknown'],['ALL','Kerala'],['Kerala','Kerala']]){doc.items[0].states=states;assert.throws(()=>validateSection('banners',doc));}doc.items[0].states=indianStates;assert.doesNotThrow(()=>validateSection('banners',doc));assert.equal(publishLabel(indianStates),'All States');});
test('targeted banners match dealer state and never leak to unknown locations',()=>{const item=entry().items[0];assert.ok(bannerMatches(item,{state:'Tamil Nadu'}));assert.ok(bannerMatches(item,{location:'Tamilnadu'}));assert.ok(!bannerMatches(item,{state:'Karnataka'}));assert.ok(!bannerMatches(item,{}));assert.ok(bannerMatches({...item,states:['ALL']},{}));});
test('banner groups render every image with the title as accessible text',()=>{assert.deepEqual(bannerSlides(entry()).map(i=>i.image),['/one.png','/two.png','/three.png']);assert.ok(bannerSlides(entry()).every(i=>i.alt==='Launch'));});

test('status is compatible with legacy records and inactive entries never render',()=>{
 const doc=entry();doc.items[0].enabled=false;
 const saved=validateSection('banners',doc);assert.equal(saved.items[0].enabled,false);assert.deepEqual(bannerSlides(saved),[]);
 const legacy=entry();const snapshot=structuredClone(legacy);assert.equal(normalizeBanners(legacy).items[0].enabled,true);assert.deepEqual(legacy,snapshot);
 assert.throws(()=>validateSection('banners',{...doc,items:[{...doc.items[0],enabled:'ACTIVE'}]}));
});
test('image-list records gain legacy fields without losing their three images',()=>{
 const doc={...entry(),items:[{title:'Saved banner',images:['/one.png','/two.png','/three.png'],states:['ALL']}]};
 const saved=validateSection('banners',doc);assert.equal(saved.items[0].image,'/one.png');assert.equal(saved.items[0].alt,'Saved banner');assert.equal(saved.items[0].url,'');assert.equal(saved.items[0].images.length,3);
});
test('missing database banner content stays empty instead of returning seeded records',()=>{assert.deepEqual(defaults.banners.items,[]);});

test('targeted banners use the same legacy state aliases as dealer selection',()=>{
 const item={...entry().items[0],states:['Bihar']};assert.ok(bannerMatches(item,{state:'',location:'Patna, BR'}));assert.ok(bannerMatches(item,{state:' Bihar ',location:'Unknown'}));assert.ok(!bannerMatches(item,{location:'Unknown'}));
});
