/* =============================================================================
   byzz 11 — Deck-Engine

   Navigationsmodell: `target` wird bei jedem Tastendruck sofort gesetzt, ein
   rAF-Koaleszierer wendet hoechstens einen Schritt pro Frame an. Vor jedem
   neuen Uebergang wird ein laufender per progress(1).kill() auf seinen
   Endzustand gezogen — so stapelt sich beim schnellen Durchklicken nichts.

   Liegt der letzte Wechsel weniger als 220 ms zurueck, laeuft eine reduzierte
   Variante: nur opacity, kein Blur, kein Stagger. Beim Loslassen der Taste
   kommt die volle Choreografie zurueck. Uebersprungene Folien werden nie
   animiert, sondern nur durchgereicht.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var BYZZ = (w.BYZZ = w.BYZZ || {});
  var T = BYZZ.transitions;

  var FAST_MS = 220;

  var S = {
    slides: [],
    i: 0,             // aktuell sichtbare Folie
    target: 0,        // gewuenschte Folie
    frag: 0,          // Fragmentzeiger innerhalb der Folie
    tl: null,         // laufende Uebergangs-Timeline
    lastNav: 0,
    busy: false,
    queued: false,
    jumpBuf: '',
    jumpTimer: null,
  };
  BYZZ.state = S;

  /* ------------------------------------------------------ Buehnenskalierung */

  /* Der Inhaltsrahmen bleibt starr 1920x1080 und wird mit min() eingepasst —
     nichts wird verzerrt oder beschnitten. Die Buehne darum herum wird
     zusaetzlich so weit aufgezogen, dass sie nach derselben Skalierung genau
     das Fenster deckt. Dadurch laufen Aurora und Korn bis an die Fensterkante,
     statt an einer sichtbaren Kante zu enden und einen hellen Balken
     stehenzulassen. Bei genau 16:9 kommt 1920x1080 heraus. */
  function fit() {
    var s = Math.min(w.innerWidth / 1920, w.innerHeight / 1080);
    var root = d.documentElement;
    root.style.setProperty('--scale', String(s));
    root.style.setProperty('--stage-w', Math.max(1920, Math.ceil(w.innerWidth / s)) + 'px');
    root.style.setProperty('--stage-h', Math.max(1080, Math.ceil(w.innerHeight / s)) + 'px');
  }

  /* ------------------------------------------------------------- Kopfzeile */

  var SECTIONS = {
    1: 'Neues unter der Haube',
    2: 'Neue Menüpunkte',
    3: 'Neue Features',
    4: 'byzz app',
  };

  function decorate(slide, idx) {
    var inner = slide.querySelector('.slide-inner');
    if (!inner || slide.hasAttribute('data-bare')) return;

    var sec = slide.getAttribute('data-section');
    if (sec && !slide.querySelector('.eyebrow')) {
      var e = d.createElement('div');
      e.className = 'eyebrow';
      e.innerHTML = '<b>' + String(sec).padStart(2, '0') + '</b><i>·</i>' + (SECTIONS[sec] || '');
      inner.appendChild(e);
    }
    if (!slide.querySelector('.counter')) {
      var c = d.createElement('div');
      c.className = 'counter';
      c.innerHTML = '<em>' + String(idx + 1).padStart(2, '0') + '</em> / ' + String(S.slides.length).padStart(2, '0');
      inner.appendChild(c);
    }
  }

  /* ---------------------------------------------------------------- Medien */

  function mediaEnter(slide) {
    var v = slide.querySelectorAll('video');
    for (var i = 0; i < v.length; i++) {
      try { v[i].currentTime = 0; v[i].play().catch(function () {}); } catch (e) {}
    }
  }
  function mediaLeave(slide) {
    var v = slide.querySelectorAll('video');
    for (var i = 0; i < v.length; i++) { try { v[i].pause(); } catch (e) {} }
  }

  /* Nachbarbilder dekodieren, damit beim Sichtbarwerden kein Ein-Frame-Blitz
     entsteht. Unter file:// ist das billig — die Dateien liegen lokal. */
  function warm(idx) {
    [idx - 1, idx + 1, idx + 2].forEach(function (n) {
      var sl = S.slides[n];
      if (!sl) return;
      var im = sl.querySelectorAll('img');
      for (var i = 0; i < im.length; i++) {
        if (im[i].decode) im[i].decode().catch(function () {});
      }
    });
  }

  /* --------------------------------------------------------------- Anzeige */

  function fragCount(slide) {
    var n = parseInt(slide.getAttribute('data-fragments') || '0', 10);
    return isNaN(n) ? 0 : n;
  }

  function applyProgress() {
    var p = S.slides.length > 1 ? S.i / (S.slides.length - 1) : 1;
    var bar = d.getElementById('progress');
    if (bar) w.gsap.to(bar, { scaleX: p, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  }

  function show(next, dir, fast) {
    var cur = S.slides[S.i];
    var nx = S.slides[next];
    if (!nx) return;

    if (S.tl) { S.tl.progress(1).kill(); S.tl = null; }

    if (cur && cur !== nx) {
      T.deadGlass(cur);
      mediaLeave(cur);
      cur.classList.add('is-leaving');
      var out = T.exit(cur, dir, fast);
      out.eventCallback('onComplete', function () {
        cur.classList.remove('is-active', 'is-leaving');
      });
    }

    S.i = next;
    S.frag = 0;
    nx.classList.add('is-active');
    T.resetFragments(nx);

    var isDiv = nx.hasAttribute('data-divider');
    T.moveAurora(next, S.slides.length, isDiv, fast);
    T.moveBlob(isDiv, fast);

    var tl = T.enter(nx, dir, fast);
    tl.eventCallback('onComplete', function () {
      T.liveGlass(nx);
      S.busy = false;
      pump();
    });
    S.tl = tl;
    S.busy = true;

    mediaEnter(nx);
    applyProgress();
    warm(next);
    BYZZ.onSlide && BYZZ.onSlide(next, S.frag);
  }

  /* Koaleszierer: hoechstens ein Schritt pro Frame, uebersprungene Folien
     werden ohne Animation durchgereicht. */
  function pump() {
    if (S.queued) return;
    if (S.target === S.i) return;
    S.queued = true;
    requestAnimationFrame(function () {
      S.queued = false;
      if (S.target === S.i) return;
      var dir = S.target > S.i ? 1 : -1;
      var gap = Math.abs(S.target - S.i);
      var now = performance.now();
      var fast = gap > 1 || now - S.lastNav < FAST_MS;
      S.lastNav = now;

      /* Bei mehreren Schritten auf einmal nur die Zielfolie animieren. */
      var next = gap > 1 ? S.target : S.i + dir;
      show(next, dir, fast);
    });
  }

  function go(n) {
    n = Math.max(0, Math.min(S.slides.length - 1, n));
    S.target = n;
    pump();
  }

  /* ------------------------------------------------------------ Navigation */

  function next() {
    var slide = S.slides[S.i];
    var fc = fragCount(slide);
    if (S.frag < fc - 1) {
      S.frag++;
      T.showFragment(slide, S.frag, performance.now() - S.lastNav < FAST_MS);
      S.lastNav = performance.now();
      BYZZ.onSlide && BYZZ.onSlide(S.i, S.frag);
      return;
    }
    go(S.target === S.i ? S.i + 1 : S.target + 1);
  }

  function prev() {
    var slide = S.slides[S.i];
    if (S.frag > 0) {
      S.frag--;
      T.showFragment(slide, S.frag, performance.now() - S.lastNav < FAST_MS);
      S.lastNav = performance.now();
      BYZZ.onSlide && BYZZ.onSlide(S.i, S.frag);
      return;
    }
    var t = S.target === S.i ? S.i - 1 : S.target - 1;
    go(t);
    /* Rueckwaerts auf eine Fragmentfolie: deren letzten Zustand zeigen. */
    var back = S.slides[Math.max(0, t)];
    if (back && fragCount(back) > 1) {
      setTimeout(function () {
        if (S.i !== Math.max(0, t)) return;
        S.frag = fragCount(back) - 1;
        T.showFragment(back, S.frag, false);
        BYZZ.onSlide && BYZZ.onSlide(S.i, S.frag);
      }, 60);
    }
  }

  /* Alle laufenden Tweens sofort auf ihren Endzustand ziehen.
     Der Screenshot-Pruefstand braucht den gesetzten Zustand, nicht eine
     Momentaufnahme mitten in der Bewegung. Im Vortrag nie aufgerufen. */
  BYZZ.settle = function () {
    try {
      /* Der dritte Parameter MUSS true sein — sonst bleiben verschachtelte
         Timelines aussen vor, und genau deren onComplete blendet die
         abgehende Folie aus. */
      w.gsap.globalTimeline.getChildren(true, true, true).forEach(function (t) {
        try { t.progress(1, false); } catch (e) {}
      });
    } catch (e) {}

    /* Danach hart normalisieren: genau eine Folie sichtbar, in ihrem Endzustand.
       Der Pruefstand soll den gesetzten Zustand fotografieren, nicht das
       Ergebnis eines Wettlaufs. */
    for (var i = 0; i < S.slides.length; i++) {
      var sl = S.slides[i];
      var inner = sl.querySelector('.slide-inner');
      if (i === S.i) {
        sl.classList.add('is-active');
        sl.classList.remove('is-leaving');
        if (inner) w.gsap.set(inner, { opacity: 1, scale: 1, clearProps: 'filter,willChange' });
        var kids = sl.querySelectorAll('[data-anim]');
        if (kids.length) w.gsap.set(kids, { opacity: 1, y: 0, clearProps: 'willChange' });
        var softs = sl.querySelectorAll('.shot__soft');
        if (softs.length) w.gsap.set(softs, { opacity: 0, scale: 1 });
      } else {
        sl.classList.remove('is-active', 'is-leaving');
      }
    }

    var h = d.getElementById('hint');
    if (h) h.classList.remove('is-on');
  };

  BYZZ.next = next;
  BYZZ.prev = prev;
  BYZZ.go = go;
  BYZZ.slideCount = function () { return S.slides.length; };
  BYZZ.slideAt = function (n) { return S.slides[n]; };
  BYZZ.current = function () { return S.i; };

  /* -------------------------------------------------------------- Bedienung */

  function toggleFullscreen() {
    if (d.fullscreenElement) { d.exitFullscreen(); return; }
    var el = d.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
  }

  function hint(text) {
    var h = d.getElementById('hint');
    if (!h) return;
    h.textContent = text;
    h.classList.add('is-on');
    clearTimeout(hint._t);
    hint._t = setTimeout(function () { h.classList.remove('is-on'); }, 1800);
  }
  BYZZ.hint = hint;

  function onKey(e) {
    if (e.defaultPrevented) return;

    /* Ziffern sammeln -> Enter springt. */
    if (e.key >= '0' && e.key <= '9') {
      S.jumpBuf += e.key;
      hint('Folie ' + S.jumpBuf + ' — Enter');
      clearTimeout(S.jumpTimer);
      S.jumpTimer = setTimeout(function () { S.jumpBuf = ''; }, 2000);
      return;
    }
    if (e.key === 'Enter' && S.jumpBuf) {
      go(parseInt(S.jumpBuf, 10) - 1);
      S.jumpBuf = '';
      e.preventDefault();
      return;
    }

    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Spacebar':
        next(); e.preventDefault(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace':
        prev(); e.preventDefault(); break;
      case 'ArrowDown': next(); e.preventDefault(); break;
      case 'ArrowUp': prev(); e.preventDefault(); break;
      case 'Home': go(0); e.preventDefault(); break;
      case 'End': go(S.slides.length - 1); e.preventDefault(); break;
      case 'f': case 'F': toggleFullscreen(); e.preventDefault(); break;
      case 'b': case 'B':
        d.body.classList.toggle('no-blur');
        hint(d.body.classList.contains('no-blur') ? 'Weichzeichnung aus' : 'Weichzeichnung an');
        e.preventDefault(); break;
      case 'o': case 'O':
        BYZZ.overview && BYZZ.overview.toggle(); e.preventDefault(); break;
      /* Fuer Notizen gibt es bewusst keine Taste: sie stehen dauerhaft im
         Referentenfenster (P) und nie im Hauptfenster, das am Beamer haengt. */
      case 'p': case 'P':
        BYZZ.presenter && BYZZ.presenter.open(); e.preventDefault(); break;
      case 'Escape':
        BYZZ.overview && BYZZ.overview.close();
        break;
      default: break;
    }
  }
  BYZZ.handleKey = onKey;

  function onClick(e) {
    if (e.target.closest && e.target.closest('#overview, a, button, video')) return;
    if (e.clientX < w.innerWidth * 0.14) prev(); else next();
  }

  /* ------------------------------------------------------------- Vorladen */

  function preload(cb) {
    var imgs = [].slice.call(d.querySelectorAll('#stage img'));
    var boot = d.getElementById('boot');
    var bar = boot && boot.querySelector('.b-bar i');
    var n = 0;
    var fired = false;

    /* Genau EINMAL weiterreichen. Ohne diese Sperre feuert das Sicherheitsnetz
       unten zusaetzlich zum regulaeren Abschluss — und startet das Deck mitten
       im Vortrag ein zweites Mal auf Folie 1. */
    function done() {
      if (fired) return;
      fired = true;
      cb();
    }

    if (!imgs.length) return done();

    function step() {
      n++;
      if (bar) bar.style.width = Math.round((n / imgs.length) * 100) + '%';
      if (n >= imgs.length) done();
    }
    imgs.forEach(function (im) {
      if (im.complete && im.naturalWidth) {
        (im.decode ? im.decode() : Promise.resolve()).then(step, step);
      } else {
        im.addEventListener('load', step, { once: true });
        im.addEventListener('error', step, { once: true });
      }
    });
    /* Sicherheitsnetz: nie laenger als 6 s auf dem Ladeschirm haengen. */
    setTimeout(done, 6000);
  }

  /* ----------------------------------------------------------------- Start */

  function boot() {
    if (!w.gsap) {
      /* Ohne GSAP bleibt das Deck vorfuehrbar — nur ohne Bewegung. */
      d.body.classList.add('no-anim');
      var all = d.querySelectorAll('.slide');
      for (var i = 0; i < all.length; i++) all[i].style.display = i === 0 ? 'block' : 'none';
      return;
    }

    S.slides = [].slice.call(d.querySelectorAll('#stage .slide'));
    S.slides.forEach(decorate);

    fit();
    w.addEventListener('resize', fit);

    d.addEventListener('keydown', onKey);
    d.addEventListener('click', onClick);
    d.addEventListener('contextmenu', function (e) {
      /* Rechtsklick = zurueck, praktisch mit Praesentationsfernbedienungen. */
      e.preventDefault(); prev();
    });

    /* Wischgesten fuer Touchscreens. */
    var tx = 0, ty = 0;
    d.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    d.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    }, { passive: true });

    var boot0 = d.getElementById('boot');
    preload(function () {
      if (boot0 && !boot0.classList.contains('is-done')) {
        boot0.classList.add('is-done');
        setTimeout(function () { boot0.style.display = 'none'; }, 520);
      }
      var start = 0;
      var hash = parseInt((location.hash || '').replace('#', ''), 10);
      if (!isNaN(hash) && hash >= 1 && hash <= S.slides.length) start = hash - 1;
      S.i = -1; S.target = start;
      show(start, 1, false);
      hint('← → blättern · F Vollbild · O Übersicht · P Referent');
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
