import {normalizeBanners} from './banners.mjs';
import defaults from './defaults.json' with { type: 'json' };
/** Upgrade only newly introduced fields; leave existing validation failures intact. */
function normalizeEditorSection(key, value, related = {}) {
  if(key==='banners')return normalizeBanners(value);
  const doc = structuredClone(value);
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return doc;
  if (key === 'seo') for (const name of ['keywords', 'robots', 'author', 'themeColor', 'socialTitle', 'socialDescription', 'siteName', 'locale']) if (doc[name] === undefined) doc[name] = defaults.seo[name];
  if (key === 'statistics' && Array.isArray(doc.items)) doc.items = Array.from({length:5}, (_,i) => doc.items[i] ?? structuredClone(defaults.statistics.items[i]));
  if (key === 'products') {
    if (doc.categories === undefined) doc.categories = structuredClone(related.equipment?.categories || defaults.equipment.categories);
    if (doc.menuHeading === undefined) doc.menuHeading = related.navigation?.productsLabel || defaults.navigation.productsLabel;
  }
  if (key === 'testimonials' && Array.isArray(doc.items)) doc.items = doc.items.map(item => item && typeof item === 'object' ? { title:'', description:'', ...item } : item);
  return doc;
}
function youtubeId(input) {
  const text = String(input || '').trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  const source = text.startsWith('<iframe') ? text.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] : text;
  if (!source) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)) id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(embed|shorts|live)\//.test(url.pathname) ? url.pathname.split('/')[2] : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export { normalizeEditorSection, youtubeId };
