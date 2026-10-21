// Collects every line the app speaks (after names are removed), by opening app/ in a headless browser
// and visiting each screen in Hebrew and English, as boy/girl, dog/cat, simple/advanced.
// Output: tools/voice/lines.json  [{lang, key, text}]
// Usage: node tools/voice/harvest.js   (CHROMIUM_PATH=/path/to/chromium for a local browser)
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const ROOT = path.resolve(__dirname, '../..'), APP = path.join(ROOT, 'app');
(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const pg = await (await b.newContext({ viewport: { width: 390, height: 780 } })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route('**/*', r => {
    const u = new URL(r.request().url()); if (u.host !== 'app.test') return r.abort();
    let f = decodeURIComponent(u.pathname.replace(/^\/app\//, '')); if (!f || f.endsWith('/')) f += 'index.html';
    const fp = path.join(APP, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: '' });
    let body = fs.readFileSync(fp);
    if (f === 'index.html') body = body.toString().replace('const ptFlush=', 'window.__X=()=>({S,go,VOX,LC,speak});const ptFlush=');
    r.fulfill({ body, contentType: f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream' });
  });
  await pg.addInitScript(() => { window.__lines = new Map(); speechSynthesis.speak = () => {}; speechSynthesis.cancel = () => {}; });
  await pg.goto('http://app.test/app/'); await pg.waitForTimeout(800);
  await pg.evaluate(() => { const {S:__S,VOX:__VOX}=__X(); __VOX.hook = (l, t) => { const k = __VOX.key(l, t); if (!__lines.has(k)) __lines.set(k, { lang: l, key: k, text: t }); }; __S.sound = true; __S.sayName = false; window.__S=__S; window.__go=__X().go; window.__LC=__X().LC; window.__speak=__X().speak; });
  const SCREENS = ['home', 'play', 'learnhub', 'me', 'game', 'care', 'dress', 'mem', 'course', 'translate', 'color', 'album', 'coll', 'train', 'safety', 'stars', 'prof', 'story', 'cert', 'real', 'about', 'parent', 'pstats', 'played', 'newu', 'login'];
  const SEL = '.bubble,p,h1,h2,h3,li,.note,.face,.tag,.badge,.sample,.bar,.sci,button';
  const readAll = () => pg.evaluate(sel => { document.querySelectorAll('#app ' + sel.split(',').join(',#app ')).forEach(el => { const t = el.innerText || el.getAttribute('aria-label') || ''; if (t.trim()) __speak(t, null, true); }); }, SEL);
  for (const lang of ['he', 'en']) for (const g of ['f', 'm']) for (const animal of ['dog', 'cat']) for (const mode of ['simple', 'full']) {
    await pg.evaluate(([lang, g, animal, mode]) => { __S.lang = lang; const u = __S.users[0]; u.g = g; u.animal = animal; u.mode = mode; u.age = mode === 'simple' ? 5 : 9; __S.who = u.id; }, [lang, g, animal, mode]);
    for (const sc of SCREENS) { await pg.evaluate(sc => { try { __go(sc) } catch (e) {} }, sc); await pg.waitForTimeout(120); await readAll(); }
    // every learning card and the daily stories
    const cats = await pg.evaluate(() => [...new Set(__LC.map(x => x.c))]);
    for (const c of cats) { const n = await pg.evaluate(c => __LC.filter(x => x.c === c).length, c);
      for (let i = 0; i < n; i++) { await pg.evaluate(([c, i]) => { __S.lr = { c, i, quiz: null }; __go('learn'); }, [c, i]); await pg.waitForTimeout(60); await readAll(); } }
    for (let i = 0; i < 8; i++) { await pg.evaluate(i => { __S.stI = i; __go('story'); }, i); await pg.waitForTimeout(60); await readAll(); }
  }
  const lines = await pg.evaluate(() => [...__lines.values()]);
  lines.sort((a, b) => (a.lang + a.text).localeCompare(b.lang + b.text));
  fs.writeFileSync(path.join(__dirname, 'lines.json'), JSON.stringify(lines, null, 1));
  const chars = lines.reduce((s, l) => s + l.text.length, 0);
  console.log('lines', lines.length, 'he', lines.filter(l => l.lang === 'he').length, 'chars', chars, 'errors', errs.slice(0, 3));
  await b.close();
})();
