// Records every harvested line once with Azure neural voices and writes small MP3 files the app plays
// instead of the phone's voice. Only fixed app text is sent (children's names are already removed).
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION. Optional: VOICE_HE (default he-IL-HilaNeural), VOICE_EN (default en-US-AnaNeural).
// Usage: node tools/voice/record.js        (keeps existing files, records only new lines)
const fs = require('fs'), path = require('path');
const KEY = process.env.AZURE_SPEECH_KEY, REGION = process.env.AZURE_SPEECH_REGION;
if (!KEY || !REGION) { console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION'); process.exit(1); }
const VOICE = { he: process.env.VOICE_HE || 'he-IL-HilaNeural', en: process.env.VOICE_EN || 'en-US-AnaNeural' };
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'src/web/voice');
fs.mkdirSync(OUT, { recursive: true });
const lines = JSON.parse(fs.readFileSync(path.join(__dirname, 'lines.json'), 'utf8'))
  .filter(l => /[A-Za-zא-ת]{2}/.test(l.text) && !/#[0-9a-f]{3}/i.test(l.text) && l.text.length <= 600);
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function rec(l) {
  const f = path.join(OUT, l.key + '.mp3'); if (fs.existsSync(f)) return 'kept';
  const lang = l.lang === 'en' ? 'en-US' : 'he-IL';
  const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${VOICE[l.lang]}"><prosody rate="-4%">${esc(l.text)}</prosody></voice></speak>`;
  for (let a = 0; a < 4; a++) {
    const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'little-trainers-voice' }, body: ssml });
    if (r.ok) { fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); return 'new'; }
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 1500 * (a + 1))); continue; }
    throw new Error(r.status + ' ' + (await r.text()).slice(0, 200));
  }
  throw new Error('gave up on ' + l.key);
}
(async () => {
  const n = { kept: 0, new: 0 }; let i = 0;
  const work = async () => { while (i < lines.length) { const l = lines[i++]; n[await rec(l)]++; } };
  await Promise.all([work(), work(), work(), work()]);
  const want = new Set(lines.map(l => l.key)), man = {};
  for (const f of fs.readdirSync(OUT)) { const k = f.replace(/\.mp3$/, ''); if (!f.endsWith('.mp3')) continue; if (want.has(k)) man[k] = 1; else fs.unlinkSync(path.join(OUT, f)); }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(man));
  const chars = lines.reduce((s, l) => s + l.text.length, 0);
  console.log(`lines ${lines.length}, new ${n.new}, kept ${n.kept}, characters ${chars}, voices ${VOICE.he} / ${VOICE.en}`);
})().catch(e => { console.error(e.message); process.exit(1); });
