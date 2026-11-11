'use strict';
/* ComboLive · página de descargas (JS vanilla, sin dependencias).
   Secciones: 1) releases de GitHub  2) navegación y reveal  3) maqueta del hero  4) panel del editor.
   Cómo verlo: la maqueta del hero se reordena sola cada ~2,8 s; el panel del editor responde a clics. */

/* ============ 1) Releases de GitHub ============ */
const OWNER = 'FARS1803', REPO = 'combolive';
const API = `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=15`, PAGE = `https://github.com/${OWNER}/${REPO}/releases`;
const $ = (id) => document.getElementById(id);
const dls = Array.from(document.querySelectorAll('[data-dl]'));
const setLinks = (href) => dls.forEach((a) => { a.href = href; });
const enable = () => dls.forEach((a) => a.removeAttribute('aria-disabled'));
const setLabels = (tag) => dls.forEach((a) => {
  const l = a.querySelector('.dl-label');
  if (l) l.textContent = a.classList.contains('btn-sm') ? 'Descargar' : (tag ? `Descargar ${tag} para Windows` : 'Descargar para Windows');
});
const mb = (n) => (n / 1048576).toFixed(0) + ' MB';
const when = (s) => { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }); };
const setup = (r) => (r.assets || []).find((a) => /setup.*\.exe$/i.test(a.name));
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, '.');

$('allrel').href = PAGE; $('allrel2').href = PAGE;
setLinks(PAGE + '/latest');

(async () => {
  const fail = (msg) => {
    $('meta').textContent = msg; $('meta-hero').textContent = msg;
    $('history').textContent = '—'; setLabels(''); enable();
  };
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 9000);
    const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' }, signal: ctl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rels = (await res.json()).filter((r) => !r.draft && !r.prerelease && setup(r));
    if (!rels.length) { fail('Aún no hay ninguna versión publicada.'); return; }
    const cur = rels[0], a = setup(cur);
    setLinks(a.browser_download_url); setLabels(cur.tag_name); enable();
    $('ver').textContent = `Versión ${cur.tag_name}`;
    const date = when(cur.published_at);
    $('meta').textContent = `${a.name} · ${mb(a.size)}` + (date ? ` · publicada el ${date}` : '')
      + (a.digest ? ` · ${a.digest.replace(':', ' ').slice(0, 19)}…` : '');
    if (a.digest) $('meta').title = a.digest;
    $('meta-hero').textContent = `${cur.tag_name} · ${mb(a.size)} · Windows 10/11 (64 bits)`;
    if (cur.body && cur.body.trim()) { $('notes').textContent = cur.body.trim(); $('notes-box').hidden = false; }
    const old = rels.slice(1);
    if (!old.length) $('history').textContent = 'Todavía no hay versiones anteriores.';
    else $('history').replaceChildren(...old.map((r) => {
      const d = document.createElement('div'); d.className = 'rel';
      const l = document.createElement('a'); l.href = setup(r).browser_download_url; l.textContent = r.tag_name;
      const s = document.createElement('span'); s.textContent = when(r.published_at);
      d.append(l, s); return d;
    }));
  } catch (e) {
    fail('No se pudo consultar GitHub ahora mismo. El botón te lleva a la página de versiones.');
  }
})();

/* ============ 2) Navegación, reveal y pausa fuera de pantalla ============ */
const root = document.documentElement;
const reduce = root.classList.contains('reduce');
const nav = $('nav');
let scrolled = false, tick = false;
const onScroll = () => {
  if (tick) return; tick = true;
  requestAnimationFrame(() => { tick = false; const s = scrollY > 8; if (s !== scrolled) { scrolled = s; nav.classList.toggle('scrolled', s); } });
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const hooks = new Map(); // elemento [data-live] -> callback(visible)
const live = Array.from(document.querySelectorAll('[data-live]'));
const revealEls = Array.from(document.querySelectorAll('.reveal'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    e.target.classList.toggle('is-live', e.isIntersecting);
    const f = hooks.get(e.target); if (f) f(e.isIntersecting);
  }), { rootMargin: '60px' });
  live.forEach((el) => io.observe(el));
  const rv = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  revealEls.forEach((el) => rv.observe(el));
} else {
  live.forEach((el) => { el.classList.add('is-live'); const f = hooks.get(el); if (f) f(true); });
  revealEls.forEach((el) => el.classList.add('in'));
}

/* ============ Utilidades de maqueta ============ */
// Animaciones de entrada de las alertas (WAAPI: transform/opacity, fuera del hilo principal)
const E = 'cubic-bezier(.23,1,.32,1)';
const ANIM = {
  bounce: [{ transform: 'translateY(-140%) scale(.8)', opacity: 0, easing: E }, { transform: 'translateY(8%) scale(1.06)', opacity: 1, offset: .14, easing: E }, { transform: 'translateY(-3%) scale(.99)', offset: .24, easing: E }, { transform: 'none', opacity: 1, offset: .32 }, { transform: 'none', opacity: 1, offset: .84, easing: E }, { transform: 'translateY(-30%) scale(.95)', opacity: 0 }],
  zoom: [{ transform: 'scale(.3)', opacity: 0, easing: E }, { transform: 'scale(1.08)', opacity: 1, offset: .12, easing: E }, { transform: 'scale(1)', offset: .22 }, { transform: 'scale(1)', opacity: 1, offset: .84, easing: E }, { transform: 'scale(.88)', opacity: 0 }],
  slide: [{ transform: 'translateX(-130%)', opacity: 0, easing: E }, { transform: 'translateX(0)', opacity: 1, offset: .2 }, { transform: 'translateX(0)', opacity: 1, offset: .84, easing: E }, { transform: 'translateX(130%)', opacity: 0 }],
  flip: [{ transform: 'perspective(600px) rotateX(-90deg)', opacity: 0, easing: E }, { transform: 'perspective(600px) rotateX(0)', opacity: 1, offset: .2 }, { transform: 'perspective(600px) rotateX(0)', opacity: 1, offset: .84, easing: E }, { transform: 'perspective(600px) rotateX(90deg)', opacity: 0 }],
};
const play = (el, type, dur) => {
  if (!el.animate) { el.style.opacity = 1; return; }
  el.getAnimations().forEach((a) => a.cancel());
  el.animate(ANIM[type] || ANIM.bounce, { duration: dur, fill: 'both' });
};
const bold = (t) => { const b = document.createElement('b'); b.textContent = t; return b; };
const setAlert = (el, user, gift, qty, coins) => {
  el.replaceChildren(bold(user), ' envió ', bold(gift), ` ×${qty} · ${fmt(coins)} 🪙`);
};
// Generador pseudoaleatorio determinista (la maqueta es igual en cada carga)
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const r = (a, b) => a + rnd() * (b - a);

/* ============ 3) Maqueta del hero ============ */
if (!reduce) {
  document.querySelectorAll('[data-hearts]').forEach((box) => {
    const h = box.closest('[data-surface]').dataset.surface === 'h';
    for (let i = 0; i < +box.dataset.hearts; i++) {
      const s = document.createElement('span'); s.className = 'heart'; s.textContent = '♥';
      s.style.cssText = `--x:${h ? r(18, 60).toFixed(0) : r(50, 88).toFixed(0)}%;--s:${r(.9, 1.5).toFixed(2)}em;--d:${(i * .75 + r(0, .4)).toFixed(2)}s;--dx:${r(-1.8, 1.8).toFixed(1)}em`;
      box.append(s);
    }
  });
  const cols = ['#ff5fd0', '#8a7cff', '#ffd54a', '#5be7c4', '#ffffff'];
  document.querySelectorAll('[data-confetti]').forEach((box) => {
    for (let i = 0; i < +box.dataset.confetti; i++) {
      const s = document.createElement('span'); s.className = 'cf';
      s.style.cssText = `--x:${r(4, 96).toFixed(0)}%;--c:${cols[i % cols.length]};--d:${r(0, .5).toFixed(2)}s;--dx:${r(-2.5, 2.5).toFixed(1)}em;--r:${r(-720, 720).toFixed(0)}deg`;
      box.append(s);
    }
  });
}

const stage = $('stage');
const rows = Array.from(document.querySelectorAll('#rank .rk'));
const alerts = Array.from(stage.querySelectorAll('.ov-alert .txt'));
const alertBoxes = Array.from(stage.querySelectorAll('.ov-alert'));
const combos = Array.from(stage.querySelectorAll('.cmb'));
const fills = Array.from(stage.querySelectorAll('.g-fill'));
const pcts = Array.from(stage.querySelectorAll('.g-pct'));
const INIT = [4200, 3600, 3100, 2500, 1700];
const score = INIT.slice();
rows.forEach((row) => { const f = document.createElement('span'); f.className = 'fl'; row.prepend(f); });

const layout = () => {
  const order = score.map((v, i) => i).sort((a, b) => score[b] - score[a]);
  order.forEach((u, pos) => { rows[u].style.setProperty('--i', pos); rows[u].querySelector('.pos').textContent = pos + 1; rows[u].classList.toggle('first', pos === 0); });
};
const tween = (el, from, to, ms) => {
  const t0 = performance.now();
  const f = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
};
const setScore = (u, to, ms) => { const el = rows[u].querySelector('.sc'); tween(el, score[u], to, ms); score[u] = to; };
const setGoal = (p) => { fills.forEach((f) => f.style.setProperty('--p', p)); pcts.forEach((t) => { t.textContent = Math.round(p * 100) + '%'; }); };
const popCombo = (n) => combos.forEach((c) => {
  c.textContent = '×' + n;
  if (c.animate) c.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.3)', offset: .45 }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
});

// Guion en bucle: [índice de usuario, nombre, regalo, cantidad, monedas, % de meta, combo]
const EV = [[0, 'Ana', 'Galaxy', 3, 1200, .18, 4], [2, 'Mía', 'León', 1, 1500, .38, 5], [3, 'Kai', 'Corazón', 5, 2300, .62, 6], [4, 'Noa', 'Galaxy', 2, 3300, .84, 7], [1, 'Leo', 'Rosa', 10, 2500, 1, 8]];
let n = 0;
const step = () => {
  const k = n % EV.length, [u, name, gift, qty, coins, pct, cmb] = EV[k];
  if (k === 0 && n > 0) { INIT.forEach((v, i) => setScore(i, v, 700)); layout(); }   // reinicio del ciclo
  alerts.forEach((t) => setAlert(t, name, gift, qty, coins));
  alertBoxes.forEach((b) => play(b, 'bounce', 2600));
  setScore(u, score[u] + coins, 900);
  layout();
  const fl = rows[u].querySelector('.fl');
  if (fl.animate) fl.animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 0 }], { duration: 1200, easing: 'ease-out' });
  setGoal(k === 0 && n > 0 ? .18 : pct);
  popCombo(cmb);
  if (pct === 1) { stage.classList.add('burst'); setTimeout(() => stage.classList.remove('burst'), 2200); }
  n++;
  return k === EV.length - 1 ? 4200 : 2800;
};
let timer = 0, running = false;
const loop = () => { if (!running) return; timer = setTimeout(loop, step()); };
const start = () => { if (running || reduce) return; running = true; timer = setTimeout(loop, 500); };
const stop = () => { running = false; clearTimeout(timer); };
let stageVisible = false;
hooks.set(stage.closest('[data-live]'), (v) => { stageVisible = v; v ? start() : stop(); });
document.addEventListener('visibilitychange', () => { document.hidden ? stop() : stageVisible && start(); });

if (reduce) { // versión estática: estado final legible
  [[0, 5400], [1, 6100], [2, 4600], [3, 4800], [4, 5000]].forEach(([u, v]) => { score[u] = v; rows[u].querySelector('.sc').textContent = fmt(v); });
  layout(); setGoal(.72); alerts.forEach((t) => setAlert(t, 'Ana', 'Galaxy', 3, 1200)); combos.forEach((c) => { c.textContent = '×8'; });
}

/* ============ 4) Panel del editor (maqueta interactiva) ============ */
const panel = $('panel'), pv = panel.querySelector('.pv-alert');
const pvTxt = pv.querySelector('.txt');
setAlert(pvTxt, 'Ana', 'Galaxy', 3, 1200);
let pTimer = 0;
const replay = () => { clearTimeout(pTimer); if (!reduce) { play(pv, panel.dataset.anim, 3200); pTimer = setTimeout(replay, 4000); } };
panel.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
  panel.dataset.theme = b.dataset.theme;
  panel.querySelectorAll('[data-theme]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  replay();
}));
panel.querySelectorAll('[data-anim]').forEach((b) => b.addEventListener('click', () => {
  panel.dataset.anim = b.dataset.anim;
  panel.querySelectorAll('[data-anim]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  replay();
}));
$('pv-test').addEventListener('click', replay);
hooks.set(panel, (v) => { if (v) replay(); else { clearTimeout(pTimer); } });
