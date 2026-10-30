# Reel de felicitación de CooWeb (9:16)

Video vertical de ~72 s para Norida & Agustín: felicitación de CooWeb y recorrido por las funciones de la invitación digital.
Publicado en `https://noridayagustin.com/de-cooweb` (MP4 en R2: `nori-tico-media/cooweb/`).

- **Voz:** ElevenLabs `eleven_v4`, voz "Carlos – Premium Latin American Spanish Narrator" (toma B, 68 s). Guion en `guion.txt` (se escribe "Cuweb" para la pronunciación; en pantalla va "CooWeb").
- **Música:** ElevenLabs `eleven_music_v2_5`, instrumental romántica con toque caribeño.
- **Clips:** grabaciones reales del sitio en local con **datos de demostración ficticios** (`demo-seed.py`), con tiempo virtual (`capture.cjs`, coreografías en `choreo.cjs`).
- **Composición:** `stage.html` (GSAP, 1080×1920) + `segs.js` (segmentos de clip y zoom de cámara) + `subs.json` (subtítulos palabra a palabra, quemados en el video).

## Regenerar

1. `wrangler dev` con la base local cargada con `demo-seed.py` (no usar la base real).
2. `ADMIN_TOKEN=<cookie nt_admin local> node capture.cjs --choreo choreo.cjs --name inv --out clips/inv.mp4 --base http://127.0.0.1:8787/` (uno por clip).
3. Recodificar clips (`-g 5`), copiar a `img/` las fotos de `public/assets` y `public/og/invitacion.jpg` y miniaturas del lookbook (`lb-*.jpg`).
4. `node render.cjs video --stage stage.html --clips clips-seek --out out/video-noaudio.mp4 --workers 3`
5. Mezcla voz + música (ducking, −16 LUFS) y codificación H.264 + AAC.
