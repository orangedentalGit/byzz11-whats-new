/* =============================================================================
   byzz 11 — Bewegungslogik

   Leitgedanke: Das Deck ist EINE Kamerafahrt, kein Stapel Folien.
   Vorwaerts kommt der neue Inhalt aus der Tiefe auf den Betrachter zu, waehrend
   der alte nach hinten wegfaellt. Rueckwaerts ist das exakt gespiegelt — wie man
   eine Folie verlaesst, bestimmt, wie man in die naechste hineinkommt.

   Der Hintergrund bewegt sich NIE von allein. Er verschiebt sich ausschliesslich
   als Folge eines Folienwechsels und steht danach still. Dauerbewegung ohne
   Anlass liest sich als Zappeln, nicht als Ruhe.

   Kostenregeln, die hier eingehalten werden:
     - Blur nur auf .slide-inner, nie auf Einzelelementen. Maximal zwei Ebenen
       gleichzeitig (abgehende + ankommende Folie).
     - Screenshots blenden ueber eine vorgeblurte Zwillingsebene ein. Animiert
       wird deren opacity; der Blur selbst ist statisch und wird einmal gerastert.
     - will-change wird direkt vor dem Tween gesetzt und im onComplete
       zurueckgenommen. filter endet auf 'none', nicht auf blur(0px) — sonst
       bleibt die Filter-Pipeline aktiv.
   ========================================================================== */
(function (w) {
  'use strict';

  var T = {};
  var g = w.gsap;

  /* Blur-Obergrenze auf der 1920er Buehne. Die Buehnenskalierung skaliert sie
     optisch mit, deshalb hier ein fester Pixelwert. */
  var BLUR_IN = 11;
  var BLUR_OUT = 8;

  /* ------------------------------------------------------------ Helfer */

  function mark(el, props) {
    if (!el) return;
    g.set(el, { willChange: props });
  }
  function unmark(el) {
    if (!el) return;
    g.set(el, { willChange: 'auto' });
  }
  /** filter vollstaendig entfernen statt auf blur(0px) stehen zu lassen. */
  function clearFilter(el) {
    if (el) el.style.filter = '';
  }

  function anims(slide) {
    return slide.querySelectorAll('[data-anim]');
  }

  /* --------------------------------------------------- Screenshot-Panels */

  /** Panels scharfstellen: die weiche Zwillingsebene blendet aus. */
  T.focusShots = function (slide, tl, at, fast) {
    var softs = slide.querySelectorAll('.shot__soft');
    if (!softs.length) return;
    if (fast) {
      g.set(softs, { opacity: 0, scale: 1 });
      return;
    }
    g.set(softs, { opacity: 1, scale: 1.05 });
    mark(softs, 'opacity, transform');
    tl.to(softs, {
      opacity: 0,
      scale: 1,
      duration: 0.78,
      ease: 'power2.out',
      onComplete: function () { unmark(softs); },
    }, at);
  };

  /** Beim Verlassen wieder aufweichen — das Panel tritt in den Hintergrund. */
  T.blurShots = function (slide, tl, at, fast) {
    var softs = slide.querySelectorAll('.shot__soft');
    if (!softs.length || fast) return;
    mark(softs, 'opacity, transform');
    tl.to(softs, { opacity: 1, scale: 1.03, duration: 0.3, ease: 'power2.in' }, at);
  };

  /* ------------------------------------------------------------ Eintritt */

  T.enter = function (slide, dir, fast) {
    var inner = slide.querySelector('.slide-inner');
    var kids = anims(slide);
    var tl = g.timeline();
    var back = dir < 0;

    if (fast) {
      g.set(inner, { opacity: 1, scale: 1, filter: 'none' });
      g.set(kids, { opacity: 1, y: 0 });
      T.focusShots(slide, tl, 0, true);
      tl.to({}, { duration: 0.12 });
      return tl;
    }

    mark(inner, 'transform, opacity, filter');

    /* Vorwaerts: aus der Tiefe nach vorn (kleiner -> normal).
       Rueckwaerts: von vorn zurueck auf die Ebene (groesser -> normal).
       Das Vorzeichen der Skalierung traegt die Richtung. */
    tl.fromTo(inner,
      { opacity: 0, scale: back ? 1.035 : 0.968, filter: 'blur(' + BLUR_IN + 'px)' },
      {
        opacity: 1, scale: 1, filter: 'blur(0px)',
        duration: 0.62, ease: 'power3.out',
        onComplete: function () { clearFilter(inner); unmark(inner); },
      }, 0);

    if (kids.length) {
      mark(kids, 'transform, opacity');
      tl.fromTo(kids,
        { opacity: 0, y: back ? -22 : 26 },
        {
          opacity: 1, y: 0,
          duration: 0.55, ease: 'power3.out',
          stagger: 0.045,
          onComplete: function () { unmark(kids); },
        }, 0.1);
    }

    /* Das Panel wird etwas spaeter scharf als der Text steht — es hat mehr
       Gewicht und darf sich langsamer setzen. */
    T.focusShots(slide, tl, 0.14, false);

    return tl;
  };

  /* ------------------------------------------------------------- Austritt */

  T.exit = function (slide, dir, fast) {
    var inner = slide.querySelector('.slide-inner');
    var tl = g.timeline();
    var back = dir < 0;

    if (fast) {
      tl.to(inner, { opacity: 0, duration: 0.11, ease: 'none' }, 0);
      return tl;
    }

    mark(inner, 'transform, opacity, filter');
    T.blurShots(slide, tl, 0, false);

    tl.to(inner, {
      opacity: 0,
      scale: back ? 0.972 : 1.03,
      filter: 'blur(' + BLUR_OUT + 'px)',
      duration: 0.38, ease: 'power2.in',
      onComplete: function () { clearFilter(inner); unmark(inner); },
    }, 0);

    return tl;
  };

  /* ------------------------------------------------- Hintergrund als Traeger */

  /* Die Aurora wandert ueber das gesamte Deck als eine einzige langsame Fahrt.
     Position kommt deterministisch aus dem Folienindex — kein Zufall, damit
     Vor- und Rueckwaertsnavigation exakt dieselben Zustaende treffen. */
  function auroraState(i, total, isDivider) {
    var t = total > 1 ? i / (total - 1) : 0;
    var wide = isDivider ? 1.22 : 1;
    return {
      warm: {
        x: -260 + Math.sin(t * 4.1 + 0.4) * 620 + t * 380,
        y: -180 + Math.cos(t * 3.2 + 1.1) * 300,
        s: (isDivider ? 1.3 : 1.0) * wide,
        o: isDivider ? 1 : 0.82,
      },
      amber: {
        x: 1180 - Math.cos(t * 3.6) * 520,
        y: 560 + Math.sin(t * 4.6 + 2.0) * 300,
        s: 0.95 * wide,
        o: isDivider ? 0.9 : 0.7,
      },
      cool: {
        x: 640 + Math.cos(t * 2.4 + 0.9) * 780,
        y: 820 - Math.sin(t * 3.0 + 0.3) * 420,
        s: 1.05,
        o: 0.85,
      },
    };
  }

  T.moveAurora = function (i, total, isDivider, fast) {
    var st = auroraState(i, total, isDivider);
    var d = fast ? 0.18 : 0.95;
    [['warm', '.bloom--warm'], ['amber', '.bloom--amber'], ['cool', '.bloom--cool']].forEach(function (p) {
      var el = document.querySelector('#aurora ' + p[1]);
      if (!el) return;
      var s = st[p[0]];
      g.to(el, { x: s.x, y: s.y, scale: s.s, opacity: s.o, duration: d, ease: 'power2.out', overwrite: 'auto' });
    });
  };

  /* Das Signature-Zeichen steht fest rechts und vertikal mittig (Position in
     deck.css). Es wandert NICHT — auf Trennern tritt es hervor, auf
     Inhaltsfolien blendet es zurueck, bleibt aber sichtbar. Nur Deckkraft
     bewegt sich; ein wanderndes Zeichen zieht den Blick vom Inhalt weg. */
  var BLOB_DIVIDER = 0.11;
  var BLOB_SLIDE = 0.035;   /* auf Inhaltsfolien liegt es hinter Text und
                               Schaubildern — mehr wuerde mitlesen wollen. */

  T.moveBlob = function (isDivider, fast) {
    var el = document.getElementById('blobmark');
    if (!el) return;
    g.to(el, {
      opacity: isDivider ? BLOB_DIVIDER : BLOB_SLIDE,
      duration: fast ? 0.2 : 1.05,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  /* ------------------------------------------------------------ Fragmente */

  /* Zeiger, der von Schritt zu Schritt unter die jeweils aktive Schaltflaeche
     im Screenshot wandert. data-pointer haelt die Ziel-x in Buehnenkoordinaten,
     eine Angabe je Schritt; das Element selbst steht bei left:0.

     Bewegt wird ausschliesslich transform:translateX. Das ist mit Absicht die
     einzige Bewegung: ein dauerhaft wippender Zeiger waere Leerlaufbewegung
     und wuerde den Blick auch dann binden, wenn nichts passiert. */
  function pointerAt(slide, idx) {
    var el = slide.querySelector('[data-pointer]');
    if (!el) return null;
    var xs = el.getAttribute('data-pointer').split(',');
    var x = parseFloat(xs[Math.min(idx, xs.length - 1)]);
    return isNaN(x) ? null : { el: el, x: x };
  }

  T.movePointer = function (slide, idx, fast) {
    var p = pointerAt(slide, idx);
    if (!p) return;
    g.to(p.el, {
      x: p.x,
      duration: fast ? 0.14 : 0.5,
      ease: 'power3.inOut',
      overwrite: 'auto',
    });
  };

  /* Sequenzfolien: drei Screenshots blenden an derselben Stelle uebereinander.
     Auch hier laeuft nur opacity — die vorgeblurte Ebene liefert die Weichheit. */
  T.showFragment = function (slide, idx, fast) {
    var items = slide.querySelectorAll('.seq__item');
    var steps = slide.querySelectorAll('.step');
    var i;

    for (i = 0; i < steps.length; i++) steps[i].classList.toggle('is-on', i === idx);
    T.movePointer(slide, idx, fast);

    if (!items.length) {
      /* Einfache Fragmentfolien: Elemente mit data-frag="n" erscheinen ab n. */
      var frags = slide.querySelectorAll('[data-frag]');
      for (i = 0; i < frags.length; i++) {
        var need = parseInt(frags[i].getAttribute('data-frag'), 10);
        var on = idx >= need;
        g.to(frags[i], {
          opacity: on ? 1 : 0,
          y: on ? 0 : 18,
          duration: fast ? 0.12 : 0.44,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
      return;
    }

    for (i = 0; i < items.length; i++) {
      var active = i === idx;
      items[i].classList.toggle('is-on', active);
      var soft = items[i].querySelector('.shot__soft');
      g.to(items[i], {
        opacity: active ? 1 : 0,
        duration: fast ? 0.12 : 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      if (soft) {
        if (active && !fast) {
          g.fromTo(soft, { opacity: 1, scale: 1.05 },
            { opacity: 0, scale: 1, duration: 0.62, ease: 'power2.out', overwrite: 'auto' });
        } else {
          g.set(soft, { opacity: 0, scale: 1 });
        }
      }
    }
  };

  /** Anfangszustand einer Folie beim Betreten setzen (Fragment 0). */
  T.resetFragments = function (slide) {
    var frags = slide.querySelectorAll('[data-frag]');
    for (var i = 0; i < frags.length; i++) {
      g.set(frags[i], { opacity: 0, y: 18 });
    }
    var items = slide.querySelectorAll('.seq__item');
    for (i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-on', i === 0);
      g.set(items[i], { opacity: i === 0 ? 1 : 0 });
    }
    var steps = slide.querySelectorAll('.step');
    for (i = 0; i < steps.length; i++) steps[i].classList.toggle('is-on', i === 0);
    var p = pointerAt(slide, 0);
    if (p) g.set(p.el, { x: p.x });
  };

  /* ----------------------------------------------------------- Echtes Glas */

  /* backdrop-filter erst einschalten, wenn die Folie steht. Waehrend des
     Uebergangs bewegt sich der Hintergrund, und jede Bewegung dahinter
     verwirft den Snapshot des Effekts in jedem einzelnen Frame. */
  T.liveGlass = function (slide) {
    var els = slide.querySelectorAll('.glass');
    for (var i = 0; i < els.length; i++) els[i].classList.add('glass-live');
  };
  T.deadGlass = function (slide) {
    var els = slide.querySelectorAll('.glass');
    for (var i = 0; i < els.length; i++) els[i].classList.remove('glass-live');
  };

  w.BYZZ = w.BYZZ || {};
  w.BYZZ.transitions = T;
})(window);
