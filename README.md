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
Every push to `main` that touches the app runs **Actions → Android build**, which uploads a debug APK (install on a phone for testing) and a release AAB. The `versionCode` is the Actions run number, so every upload is higher than the last.

### Signing the release AAB

The release AAB is signed with the Play **upload key** when these four repository secrets exist (Settings → Secrets and variables → Actions); without them it stays unsigned:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the `.jks` file, base64-encoded (`base64 -w0 upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias, e.g. `upload` |
| `ANDROID_KEY_PASSWORD` | key password |

Create the key once with `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`, keep the file and passwords somewhere safe, and turn on Play App Signing so Google holds the app signing key (a lost upload key can then be reset through Play support).

Locally: `npm ci && npm run android:sync`, then open `android/` in Android Studio.

## Recorded voice (optional)

The phone's Hebrew voice makes many mistakes, so the app can play pre-recorded clips instead. `tools/voice/harvest.js` opens the app in a headless browser and collects every line it speaks (children's names are removed first), and `tools/voice/record.js` records each line once with an Azure neural voice into `src/web/voice/` (MP3 + `manifest.json`). At runtime `speak()` plays the clip when one exists and falls back to the device voice otherwise, so lines with a custom pet name still work. Nothing is sent anywhere while the app runs.

To record: add the `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` secrets, then run **Actions → Record voice** (choose Hila or Avri). It commits the clips and starts a new Android build. The Claude artifact keeps using the device voice.

## Store assets

`store/` holds the Google Play graphics: framed screenshots in Hebrew and English (`screens/`, 1080×1920), the feature graphic (1024×500) and a 512×512 icon. The listing texts and rating answers are in the store listing doc.

## Source layout (`src/`)

| File | What it holds |
|---|---|
| `app.js` | All screens, state, users, games, care, wardrobe, learning cards, parents area, i18n runtime |
| `avatar3d.js` | three.js scene, poodle + cat rigs, poses/tricks, clothes, fetch, snapshots |
| `breeds.js` | Detailed dog breeds (Labrador, Beagle, Golden, Dachshund, Shih Tzu), all cat breeds (tabby, Siamese, black, British shorthair, calico, Persian, tuxedo, Maine Coon) and their colour patterns; injected into `avatar3d.js` at `/*BREEDS*/` |
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
