"""Builds the app twice from the same sources.

dist/index.html  - single file for the Claude artifact (three.js and fonts from CDNs)
app/             - standalone web app for GitHub Pages and the Android build:
                   local three.js and fonts (no outside requests), manifest, service worker, icons
"""
import json, os, shutil, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
R = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()

ICON = R('icon180.b64').strip()
I18N = 'const I18N_EN=' + json.dumps(json.load(open(os.path.join(HERE, 'i18n_en.json'), encoding='utf-8')), ensure_ascii=False) + ';\n'
JS = I18N + R('engine.js') + '\n' + R('nikud.js') + '\n' + R('avatar3d.js').replace('/*BREEDS*/', R('breeds.js')) + '\n' + R('app.js') + '\n'
CSS = R('styles.css')
META = '''<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="מאלפים קטנים"><meta name="application-name" content="מאלפים קטנים"><meta name="theme-color" content="#2e7cf6">'''
FAV = '''<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='80'%3E🐶%3C/text%3E%3C/svg%3E">'''

# ---------- 1. Claude artifact ----------
dist = ('<title>מאלפים קטנים</title>\n' + META + '\n<link rel="apple-touch-icon" href="data:image/png;base64,' + ICON + '">\n' + FAV + '\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;500;700&family=Rubik:wght@400;500;700&family=Varela+Round&display=swap" rel="stylesheet">\n'
        '<style>\n' + CSS + '</style>\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n'
        '<div id="app" lang="he" dir="rtl"></div>\n<script>\n' + JS + '</script>\n')
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'index.html'), 'w', encoding='utf-8').write(dist)

# ---------- 2. standalone app (GitHub Pages + Android) ----------
APP = os.path.join(ROOT, 'app')
WEB = os.path.join(HERE, 'web')
for sub in ('fonts', 'vendor', 'icons'):
    shutil.rmtree(os.path.join(APP, sub), ignore_errors=True)
    shutil.copytree(os.path.join(WEB, sub), os.path.join(APP, sub))
FONTS = []
for fam, file, weights in (('Noto Sans Hebrew', 'noto-sans-hebrew', (400, 500, 700)), ('Rubik', 'rubik', (400, 500, 700)), ('Varela Round', 'varela-round', (400,))):
    for w in weights:
        for sub, rng in (('hebrew', 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F'), ('latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')):
            FONTS.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;src:url(fonts/%s-%s-%d-normal.woff2) format('woff2');unicode-range:%s}" % (fam, w, file, sub, w, rng))
app_html = ('<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<title>מאלפים קטנים</title>\n' + META + '\n'
            '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/icon-192.png">\n'
            '<style>\n' + '\n'.join(FONTS) + '\nhtml,body{margin:0}\n' + CSS + '</style>\n</head>\n<body>\n'
            '<div id="app" lang="he" dir="rtl"></div>\n<script src="vendor/three.min.js"></script>\n<script>\n' + JS + '</script>\n'
            "<script>if('serviceWorker' in navigator&&location.protocol==='https:'&&!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()))navigator.serviceWorker.register('sw.js').catch(function(){})</script>\n"
            '</body>\n</html>\n')
open(os.path.join(APP, 'index.html'), 'w', encoding='utf-8').write(app_html)
manifest = {"name": "מאלפים קטנים", "short_name": "מאלפים קטנים", "description": "Little Trainers – learn to train a dog and understand dogs and cats",
            "lang": "he", "dir": "rtl", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
            "background_color": "#e4f2ff", "theme_color": "#2e7cf6",
            "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                      {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                      {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
json.dump(manifest, open(os.path.join(APP, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
files = ['./', 'index.html', 'manifest.webmanifest', 'vendor/three.min.js'] + ['icons/' + f for f in sorted(os.listdir(os.path.join(APP, 'icons')))] + ['fonts/' + f for f in sorted(os.listdir(os.path.join(APP, 'fonts'))) if f.endswith('.woff2')]
ver = hashlib.sha1(app_html.encode('utf-8')).hexdigest()[:10]
sw = ("const V='lt-%s',F=%s;\n" % (ver, json.dumps(files)) +
      "self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});\n"
      "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});\n"
      "self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;\n"
      "  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put('index.html',c));return r}).catch(()=>caches.match('index.html')));return}\n"
      "  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});\n")
open(os.path.join(APP, 'sw.js'), 'w', encoding='utf-8').write(sw)
if os.path.exists(os.path.join(WEB, 'privacy.html')):
    shutil.copy(os.path.join(WEB, 'privacy.html'), os.path.join(APP, 'privacy.html'))
print('dist', len(dist), '| app', len(app_html), '| sw', ver)
