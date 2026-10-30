# Boda Norida & Agustín — invitación + backoffice de invitados

Invitación digital (recreación fiel de la tarjeta original en HTML) convertida a **Next.js 16** y desplegada en **Cloudflare Workers** con **OpenNext**, base de datos **D1 + Drizzle ORM**, asistente de outfits con **Workers AI** y un **backoffice tipo CRM** para gestionar invitados.

Producción: **https://noridayagustin.com** (dominio propio del Worker; `www.noridayagustin.com` y `nori-tico-wedding.lc-45e.workers.dev` redirigen con 308 al dominio principal).

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Invitación completa (sobre animado, historia, cuenta regresiva, ceremonia, recepción, itinerario, código de vestimenta, confirmación, lluvia de sobres). Acepta los enlaces antiguos `?nombre=…&cupos=…`. En escritorio (≥ 960 px) se muestra en dos columnas: panel fijo con nombres, fecha, cuenta regresiva y menú de secciones a la izquierda, y la tarjeta a la derecha. |
| `/i/[código]` | Invitación personalizada: nombre en el sobre, cupos asignados, confirmación por persona y registro de aperturas. `?preview=1` no cuenta como apertura. |
| `/participacion` | Tarjeta de participación (versión informativa, sin confirmación). |
| `/asesoras` | Asistente "Gabriela y Valentina, asesoras de outfits" (Workers AI · Mistral Small 3.1, texto e imagen, en streaming): opciones guiadas para tocar, respuestas con carrusel de looks del lookbook, visor ampliado con prendas y "cómo combinarlo", galería completa con filtros y análisis de la foto del outfit (se optimiza en el navegador y no se guarda). `?i=código` lo personaliza y lo enlaza al invitado. |
| `/admin` | Backoffice (PIN de 4 dígitos): resumen, embudo, invitados, ficha con comentarios, actividad, chats de la IA, exportar CSV. |
| `/de-cooweb` | Regalo de CooWeb para los novios: reel vertical de felicitación (72 s) que explica las funciones de la invitación, con descarga para WhatsApp y en alta calidad. Fuentes del video en `video/reel-cooweb/`. |
| `/media/*` | Archivos pesados servidos desde R2 (`nori-tico-media`, binding `MEDIA`) con soporte de Range; `?descargar` fuerza la descarga. |

Todo el sitio es **no-index**: `<meta name="robots" content="noindex, nofollow">`, cabecera `X-Robots-Tag` (páginas y archivos estáticos vía `public/_headers`) y `robots.txt` que solo deja pasar a los bots de vista previa (WhatsApp, Facebook, Telegram…). Las imágenes Open Graph están en `public/og/` (1200×630).

## Música: «Mi Bendición» (Spotify)

La tarjeta (`/`, `/i/[código]` y `/participacion`) reproduce su canción con el **reproductor oficial de Spotify** (iFrame API), en una barra «Nuestra canción» abajo.

- Suena al tocar el sobre: ese toque es el que permite al navegador reproducir audio. Si el navegador no lo deja (algunos iPhone), aparece «Toca ▶ para escucharla» sobre el reproductor.
- Quien tiene sesión de Spotify en ese navegador escucha la canción completa; los demás, el fragmento de 30 s que da Spotify, que se repite al terminar.
- El botón «Música» de arriba pausa o retoma, y la × de la barra la pausa y la cierra. La elección se recuerda en el navegador del invitado. Se pausa si el invitado cambia de pestaña.
- La canción sale de `WEDDING.spotifyUrl` en `lib/config.ts`.

## Backoffice (CRM)

- **Acceso:** PIN de 4 dígitos guardado como secreto del Worker (`ADMIN_PASSWORD`). 5 intentos fallidos por IP bloquean 15 minutos. Sesión en cookie firmada (30 días); si cambias el PIN, todas las sesiones se cierran.
- **Embudo por invitación:** Por enviar → Enviada → Vista → Confirmada / No asiste.
- **Enviar por WhatsApp:** abre `wa.me` con el mensaje y el enlace personalizado y marca la invitación como enviada.
- **Ficha del invitado:** datos editables, personas del grupo (asiste / no / ?), respuesta manual, enlace, y **línea de tiempo con comentarios** (fijar, eliminar) junto con aperturas, envíos, confirmaciones, mensajes de los invitados y consultas a la IA.
- **Actividad:** feed general con filtros y comentarios generales del equipo.
- **Exportar CSV** con estado, asistentes, mesa, mensajes y enlaces.
- **Mesas (`/admin/mesas`):** plano 2D del salón con mesas redondas, rectangulares y de novios, y elementos (pista de baile, DJ, bar, buffet, torta, photobooth, lluvia de sobres, entrada, plantas). Se arrastran, rotan y duplican; cada mesa tiene botones grandes de **+ Silla / − Silla**. Los invitados (o grupos completos) se arrastran a una mesa o silla, o se toca el invitado y luego la mesa (ideal en celular); arrastrar a alguien sentado a otra silla intercambia lugares. Vista **Por mesa** imprimible, deshacer/rehacer (Ctrl+Z), guardado automático en D1 y **propuestas aleatorias de ubicación** que mantienen juntos a los grupos y agrupan por categoría (con opción de agregar las mesas que falten). El plano se guarda como un documento JSON versionado (`floor_plans`) y la ficha de cada invitado muestra su mesa y silla.

Cambiar el PIN:

```bash
npx wrangler secret put ADMIN_PASSWORD
```

## Desarrollo

```bash
npm install
echo "ADMIN_PASSWORD=1234" > .dev.vars      # PIN local
npm run db:migrate:local
npm run preview                              # build OpenNext + wrangler dev en :8787
```

`NODE_ENV=production` va fijado en los scripts de build: si el entorno trae `NODE_ENV=development`, el build de Next falla.

Base de datos:

```bash
npm run db:generate          # nueva migración desde db/schema.ts
npm run db:migrate:remote    # aplicarla en D1 de producción
```

Despliegue:

```bash
npm run deploy
```

## Datos de invitados

Los CSV exportados de Google Sheets contienen teléfonos, por eso viven en `data/private/` (ignorado por git). Para regenerar la carga inicial:

```bash
node scripts/build-seed.mjs data/private/detalle.csv data/private/telefonos.csv data/private/seed.sql
npx wrangler d1 execute DB --remote --file data/private/seed.sql
```

El script agrupa por invitado principal, cruza teléfonos y cupos de ambas hojas, y deja notas fijadas en la ficha cuando hay diferencias (teléfono alterno, sin teléfono…). Ojo: ejecutarlo sobre una base con datos duplica las invitaciones.

Lookbook del asistente (26 fotos generadas con FLUX.2 en Workers AI; datos en `lib/lookbook.ts`, prompts en `scripts/lookbook-prompts.tsv`):

```bash
scripts/gen-lookbook.sh            # genera las que falten
scripts/gen-lookbook.sh m-boho-azul # regenera una
```

Imágenes OG e íconos (Playwright):

```bash
node scripts/render-og.mjs
```

## Estructura

```
app/                 rutas (invitación, participación, asesoras, admin, api)
components/          tarjeta (invitation/), chat (advisors/), backoffice (admin/)
db/schema.ts         tablas Drizzle: invitations, guests, activities, chat_messages, login_attempts
drizzle/             migraciones SQL para D1
lib/                 config de la boda, consultas, auth por PIN, IA, formato
public/assets        fotos e íconos originales de la tarjeta
```
