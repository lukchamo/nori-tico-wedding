// Coreografías del reel (sitio local con datos de demostración ficticios).
const MOB = { vw: 390, vh: 844, dpr: 2, mobile: true, settle: 1500 };
const DESK = { vw: 1440, vh: 900, dpr: 1.5, cursor: true, settle: 1500, mouseStart: [980, 520] };
const NOSNAP = 'html{scroll-snap-type:none!important;scroll-behavior:auto!important}';
const ADMIN = [{ name: 'nt_admin', value: process.env.ADMIN_TOKEN || '', domain: '127.0.0.1', path: '/', httpOnly: true, secure: false }];
const PHOTO = "(async()=>{const b=await (await fetch('/lookbook/m-midi-salvia.jpg')).blob();const f=new File([b],'mi-outfit.jpg',{type:'image/jpeg'});const dt=new DataTransfer();dt.items.add(f);const i=document.querySelector('input[type=file]');i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));})()";

module.exports = {
  inv: { ...MOB, css: NOSNAP, page: 'i/demo-laura?preview=1', steps: [
    { wait: 2200 }, { click: 'button.inv-env-btn' }, { wait: 2800 },
    { scroll: '#historia', dur: 2600 }, { wait: 1500 },
    { scroll: '#ceremonia', dur: 2600 }, { wait: 1600 },
    { scroll: '#itinerario', dur: 2200 }, { wait: 1100 },
    { scroll: '#regalo', dur: 2200 }, { wait: 500 }, { click: '.inv-gift-env' }, { wait: 2600 },
  ] },
  rsvp: { ...MOB, css: NOSNAP, page: 'i/demo-laura?preview=1', steps: [
    { wait: 300 }, { click: 'button.inv-env-btn' }, { wait: 2800 },
    { scroll: '#confirmar', dur: 1800 }, { wait: 700 },
    { click: '.inv-confirm .inv-btn-solid' }, { wait: 900 },
    { click: '.inv-rsvp-row .inv-pill-solid' }, { wait: 1000 },
    { type: ['#rsvp-msg', '¡Felicitaciones! Allá estaremos 💛'], dur: 1800 }, { wait: 500 },
    { click: '.inv-form button[type=submit]' }, { wait: 3800 },
  ] },
  ases: { ...MOB, page: 'asesoras?i=demo-laura', steps: [
    { wait: 2000 }, { click: '.adv-start .adv-option' }, { wait: 9000 },
    { eval: 'window.scrollTo(0, document.body.scrollHeight)' }, { wait: 1500 },
    { click: '.adv-carousel .adv-look' }, { wait: 2600 },
    { click: '.adv-lightbox-arrow.right' }, { wait: 1700 },
    { click: '.adv-lightbox-close' }, { wait: 800 },
    { ripple: '.adv-attach' }, { eval: PHOTO }, { wait: 1800 },
    { click: '.adv-send' }, { wait: 10000 },
    { eval: 'window.scrollTo(0, document.body.scrollHeight)' }, { wait: 2600 },
  ] },
  'admin-dash': { ...MOB, cookies: ADMIN, page: 'admin', steps: [
    { wait: 1600 }, { scroll: 0.28, dur: 3200 }, { wait: 1000 }, { scroll: 0.6, dur: 3000 }, { wait: 1300 },
  ] },
  'admin-guest': { ...MOB, cookies: ADMIN, page: 'admin/invitados/66', steps: [
    { wait: 1500 }, { click: '.adm-hero .adm-btn.wa' }, { wait: 1600 },
    { scroll: '.adm-composer', dur: 2000 }, { wait: 500 },
    { type: ['textarea[name=body]', 'Ubicarlos cerca de la pista 💃'], dur: 1700 }, { wait: 400 },
    { click: 'form.adm-composer button[type=submit]' }, { wait: 2600 }, { wait: 1200 },
  ] },
  mesas: { ...DESK, cookies: ADMIN, page: 'admin/mesas', steps: [
    { wait: 1400 },
    { tap: 'button', text: 'Crear plano sugerido', dur: 800 }, { wait: 1700 },
    { tap: 'button', text: 'Propuesta de ubicación', dur: 700 }, { wait: 800 },
    { tap: 'button', text: 'Generar propuesta', dur: 600 }, { wait: 1900 },
    { tap: 'button', text: 'Otra propuesta', dur: 700 }, { wait: 1500 },
    { tap: 'button', text: 'Aplicar', dur: 600 }, { wait: 1500 },
    { tap: '.fp-table', text: 'Mesa 1', dur: 800 }, { wait: 900 },
    { tap: 'button[aria-label="Más sillas"]', dur: 900 }, { wait: 600 },
    { tap: 'button[aria-label="Más sillas"]', dur: 200 }, { wait: 1400 },
    { tap: '.floor-tabs button', text: 'Por mesa', dur: 900 }, { wait: 2400 },
  ] },
};
