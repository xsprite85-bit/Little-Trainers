head='''<title>מאלפים קטנים</title>
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="מאלפים קטנים"><meta name="application-name" content="מאלפים קטנים"><meta name="theme-color" content="#2e7cf6">
<link rel="apple-touch-icon" href="data:image/png;base64,ICON180">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='80'%3E🐶%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;500;700&family=Rubik:wght@400;500;700&family=Varela+Round&display=swap" rel="stylesheet">
<style>
'''
import json
I18N='const I18N_EN='+json.dumps(json.load(open('i18n_en.json')),ensure_ascii=False)+';\n'
head=head.replace('ICON180',open('icon180.b64').read().strip())
html=head+open('styles.css').read()+'''</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<div id="app" lang="he" dir="rtl"></div>
<script>
'''+I18N+open('engine.js').read()+'\n'+open('nikud.js').read()+'\n'+open('avatar3d.js').read().replace('/*BREEDS*/',open('breeds.js').read())+'\n'+open('app.js').read()+'\n</script>\n'
open('../dist/index.html','w').write(html)
print(len(html))
