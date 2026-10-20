# מאלפים קטנים · Little Trainers

A kids' app for learning to train a dog and understand dogs and cats. Built for Romi and Lia.
Single self-contained HTML page (Hebrew RTL + English), 3D characters with three.js r128, all data stored on the device (localStorage).

Live (private) version: https://claude.ai/artifact/NVrmaA6HFmeni4Zn9YKoKf

Web app (works offline, installable): https://xsprite85-bit.github.io/Little-Trainers/
Privacy policy (draft): https://xsprite85-bit.github.io/Little-Trainers/app/privacy.html

## Build

```bash
python3 src/build.py
```

It writes two outputs from the same sources:
- `dist/index.html` – one file for the Claude artifact (three.js and fonts from CDNs)
- `app/` – the standalone web app for GitHub Pages and Android: local three.js and fonts (no outside requests), manifest, service worker, icons, privacy page

## Android

Capacitor project in `android/` (app id `com.tinkerdoodle.littletrainers`), with the `@capacitor-community/text-to-speech` plugin because Android WebView has no speech synthesis, and the microphone permission.
Every push to `main` that touches the app runs **Actions → Android build**, which uploads a debug APK (install on a phone for testing) and an **unsigned** release AAB. Signing for Google Play is added once the developer account exists.

Locally: `npm ci && npm run android:sync`, then open `android/` in Android Studio.

## Source layout (`src/`)

| File | What it holds |
|---|---|
| `app.js` | All screens, state, users, games, care, wardrobe, learning cards, parents area, i18n runtime |
| `avatar3d.js` | three.js scene, poodle + cat rigs, poses/tricks, clothes, fetch, snapshots |
| `breeds.js` | Detailed dog breeds (Labrador, Golden, Shih Tzu) and the tricolour pattern; injected into `avatar3d.js` at `/*BREEDS*/` |
| `engine.js` | Sound analysis (excitement/emotion estimate) and example sounds |
| `nikud.js` | Hebrew niqqud dictionary (`NK`, `NKP`) |
| `styles.css` | All styles |
| `i18n_en.json` | Hebrew → English dictionary, keyed by Hebrew text without niqqud; applied at runtime to the DOM and to speech |
| `icon180.b64` | Home-screen icon (PNG, base64) |
| `build.py` | Builds `dist/index.html` and `app/` |
| `web/` | Static files for `app/`: fonts (OFL), three.js r128 (MIT), icons, privacy page |

## Adding UI text

Write it in Hebrew in `app.js`, then add the same string (without niqqud) and its English translation to `i18n_en.json`. English mode translates on screen and in speech; no Hebrew should remain on English screens.

## Data

Saved per device under the localStorage key `animal-translator.v1`: users, stars, progress, play time, wardrobe, album photos, "our dog" card. Nothing is sent anywhere. Backup/restore is in the grown-ups area.

## Planning docs

- PRD: https://claude.ai/code/artifact/7e7c241d-5d2c-446c-b052-b0e3e57f3702
- Future Work: https://claude.ai/code/artifact/ac82adbf-7351-4324-a448-313533db147d
