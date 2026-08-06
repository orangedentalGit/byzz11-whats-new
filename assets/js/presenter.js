/* =============================================================================
   byzz 11 — Referentenansicht (Taste P)

   Die Notizen stehen ausschliesslich im Referentenfenster und dort dauerhaft —
   nie im Hauptfenster, denn das haengt am Beamer. Kein Umschalten, keine Taste
   dafuer: das Fenster hat genau einen Zweck, und der ist der Sprechtext.

   Unter file:// ist jedes Dokument eine eigene opaque origin. BroadcastChannel,
   localStorage und der Zugriff auf eine zweite lokale Datei fallen damit als
   Kanal zwischen zwei Fenstern aus — in build/probe.html nachgemessen.

   Was funktioniert: ein per window.open('', name) geoeffnetes about:blank-Fenster
   erbt die Origin-Instanz des Openers. Opener und Popup sind damit same-origin,
   das Elternfenster kann w.document direkt aufbauen und aktualisieren. Kein
   Messaging noetig, keine Serialisierung, keine Latenz.

   Fallstricke, die hier behandelt sind:
     - Doctype einmalig per document.write, danach ausschliesslich DOM-API.
       Ohne Doctype laeuft das Popup im Quirks Mode.
     - Keine externen Ressourcen im Popup: CSS als Textknoten, Systemschrift,
       Bilder nur ueber absolut aufgeloeste URLs.
     - Kein Klonen der echten Folie: styleSheet.cssRules wirft bei file://-
       Stylesheets SecurityError. Die Vorschau wird schematisch aufgebaut.
     - Timer rechnet immer Date.now() - start, zaehlt nie hoch. Chrome drosselt
       setInterval in verdeckten Fenstern.
     - Tastendruecke im Popup werden vom Opener aus abgefangen, sonst kann der
       Referent aus seinem Fenster nicht blaettern.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var BYZZ = (w.BYZZ = w.BYZZ || {});

  var win = null;
  var ui = null;
  var t0 = Date.now();
  var ticker = null;

  /* ------------------------------------------------------- Notiz-Zugriff */

  function notesFor(i) {
    var sl = BYZZ.slideAt(i);
    if (!sl) return '';
    var t = sl.querySelector('template.notes');
    return t ? t.innerHTML.trim() : '';
  }
  function titleFor(i) {
    var sl = BYZZ.slideAt(i);
    return sl ? (sl.getAttribute('data-title') || '—') : '—';
  }
  function shotFor(i) {
    var sl = BYZZ.slideAt(i);
    if (!sl) return null;
    var im = sl.querySelector('.shot__frame img, .card__shot');
    if (im && im.getAttribute('src')) return new URL(im.getAttribute('src'), location.href).href;
    return null;
  }
  function fragsFor(i) {
    var sl = BYZZ.slideAt(i);
    return sl ? parseInt(sl.getAttribute('data-fragments') || '0', 10) : 0;
  }

  function clock() {
    var s = Math.floor((Date.now() - t0) / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  /* --------------------------------------------------- Popup-Aufbau (1x) */

  var CSS = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{background:#141210;color:#F3EEE7;font:15px/1.6 "Segoe UI",system-ui,sans-serif;padding:26px 30px}',
    '.top{display:flex;align-items:baseline;gap:18px;border-bottom:1px solid #2E2A25;padding-bottom:16px;margin-bottom:22px}',
    '.pos{font:600 15px/1 ui-monospace,monospace;color:#F68B1A;letter-spacing:.08em}',
    '.ttl{font:600 25px/1.2 "Segoe UI",system-ui,sans-serif;flex:1}',
    '.clk{font:700 34px/1 ui-monospace,monospace;color:#F68B1A;font-variant-numeric:tabular-nums}',
    '.clk small{display:block;font:500 10px/1 ui-monospace,monospace;color:#7E766C;letter-spacing:.14em;margin-top:6px;text-align:right}',
    '.grid{display:grid;grid-template-columns:1fr 340px;gap:28px;align-items:start}',
    'h4{font:600 10px/1 ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#8A8177;margin-bottom:12px}',
    '.notes{font-size:19px;line-height:1.62;color:#EDE6DC}',
    '.notes p+p{margin-top:12px}',
    '.notes b,.notes strong{color:#FFB55C;font-weight:600}',
    '.notes code{font:500 16px/1 ui-monospace,monospace;background:#241F1A;color:#FFC98A;padding:2px 6px;border-radius:4px}',
    '.notes ul{margin:10px 0 0 20px}.notes li{margin:6px 0}',
    '.next{background:#1D1A16;border:1px solid #2E2A25;border-radius:12px;padding:18px}',
    '.next .nt{font:600 18px/1.3 "Segoe UI",system-ui,sans-serif;margin-bottom:12px}',
    '.next img{width:100%;border-radius:8px;display:block;background:#000;border:1px solid #2E2A25}',
    '.next .none{color:#6E665D;font-size:13px}',
    '.frag{margin-top:14px;font:500 12px/1 ui-monospace,monospace;color:#8A8177;letter-spacing:.08em}',
    '.frag b{color:#F68B1A}',
    '.keys{margin-top:22px;border-top:1px solid #2E2A25;padding-top:14px;font:500 11px/1.8 ui-monospace,monospace;color:#6E665D;letter-spacing:.06em}',
    '.keys b{color:#A79C8F;font-weight:500}',
  ].join('');

  function build(wx) {
    wx.document.write('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>byzz 11 · Referentenansicht</title></head><body></body></html>');
    wx.document.close();

    var dx = wx.document;
    var st = dx.createElement('style');
    st.appendChild(dx.createTextNode(CSS));
    dx.head.appendChild(st);

    function el(tag, cls, parent) {
      var n = dx.createElement(tag);
      if (cls) n.className = cls;
      (parent || dx.body).appendChild(n);
      return n;
    }

    var top = el('div', 'top');
    var pos = el('span', 'pos', top);
    var ttl = el('div', 'ttl', top);
    var clk = el('div', 'clk', top);
    var clkT = dx.createTextNode('00:00');
    clk.appendChild(clkT);
    var clkS = el('small', null, clk);
    clkS.textContent = 'LAUFZEIT · R SETZT ZURÜCK';

    var grid = el('div', 'grid');
    var left = el('div', null, grid);
    var right = el('div', null, grid);

    el('h4', null, left).textContent = 'Notizen';
    var notes = el('div', 'notes', left);

    var nextBox = el('div', 'next', right);
    el('h4', null, nextBox).textContent = 'Als nächstes';
    var nextT = el('div', 'nt', nextBox);
    var nextImg = el('img', null, nextBox);
    var nextNone = el('div', 'none', nextBox);
    var frag = el('div', 'frag', right);

    var keys = el('div', 'keys');
    keys.innerHTML =
      '<b>← →</b> blättern &nbsp; <b>F</b> Vollbild &nbsp; <b>O</b> Übersicht &nbsp; ' +
      '<b>B</b> Weichzeichnung &nbsp; <b>R</b> Timer zurücksetzen';

    /* Tasten im Popup an die Deck-Logik des Openers weiterreichen. */
    dx.addEventListener('keydown', function (e) {
      if (e.key === 'r' || e.key === 'R') { t0 = Date.now(); e.preventDefault(); return; }
      BYZZ.handleKey(e);
    });

    return { doc: dx, pos: pos, ttl: ttl, clkT: clkT, notes: notes,
             nextT: nextT, nextImg: nextImg, nextNone: nextNone, frag: frag };
  }

  /* ------------------------------------------------------------ Aktualisieren */

  function paint() {
    if (!alive()) return;
    var i = BYZZ.current();
    var n = BYZZ.slideCount();

    ui.pos.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    ui.ttl.textContent = titleFor(i);
    ui.notes.innerHTML = notesFor(i) || '<span style="color:#6E665D">Keine Notiz hinterlegt.</span>';

    var fc = fragsFor(i);
    ui.frag.innerHTML = fc > 1
      ? 'SCHRITT <b>' + (BYZZ.state.frag + 1) + '</b> VON ' + fc
      : '';

    if (i + 1 < n) {
      ui.nextT.textContent = titleFor(i + 1);
      var src = shotFor(i + 1);
      if (src) { ui.nextImg.src = src; ui.nextImg.style.display = 'block'; ui.nextNone.textContent = ''; }
      else { ui.nextImg.removeAttribute('src'); ui.nextImg.style.display = 'none'; ui.nextNone.textContent = 'Textfolie'; }
    } else {
      ui.nextT.textContent = 'Ende';
      ui.nextImg.removeAttribute('src');
      ui.nextImg.style.display = 'none';
      ui.nextNone.textContent = '';
    }
  }

  function alive() {
    try { return !!(win && !win.closed && win.document && ui && ui.doc === win.document); }
    catch (e) { return false; }
  }

  function open() {
    try {
      /* Nur aus einer Benutzergeste heraus — sonst greift der Popup-Blocker. */
      win = w.open('', 'byzz-presenter', 'width=1240,height=820,left=40,top=40');
      if (!win) { BYZZ.hint && BYZZ.hint('Popup blockiert — bitte für diese Seite erlauben'); return; }
      ui = build(win);
      clearInterval(ticker);
      ticker = setInterval(function () {
        if (!alive()) { clearInterval(ticker); return; }
        try { ui.clkT.nodeValue = clock(); } catch (e) { clearInterval(ticker); }
      }, 500);
      paint();
      try { win.focus(); } catch (e) {}
    } catch (e) {
      BYZZ.hint && BYZZ.hint('Referentenansicht nicht verfügbar');
    }
  }

  BYZZ.onSlide = function () { paint(); };

  w.addEventListener('pagehide', function () {
    try { if (win && !win.closed) win.close(); } catch (e) {}
  });

  BYZZ.presenter = { open: open, isOpen: alive };
})(window, document);
