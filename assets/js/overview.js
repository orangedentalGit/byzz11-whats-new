/* =============================================================================
   byzz 11 — Folienuebersicht (Taste O)

   Zeigt ein Raster aller Folien mit Titel, Nummer und Abschnitt. Klick springt.
   Bewusst textbasiert statt mit Miniaturbildern: echte Vorschaubilder wuerden
   entweder 35 gerenderte Ebenen gleichzeitig verlangen oder eine Canvas-Kopie,
   und Canvas ist unter file:// nach dem Zeichnen lokaler Bilder tainted.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var BYZZ = (w.BYZZ = w.BYZZ || {});
  var root, grid, built = false;

  var SEC = { 1: '01 · Unter der Haube', 2: '02 · Menüpunkte', 3: '03 · Features', 4: '04 · byzz app' };

  function build() {
    root = d.getElementById('overview');
    grid = root.querySelector('.ov-grid');
    var n = BYZZ.slideCount();

    for (var i = 0; i < n; i++) {
      var sl = BYZZ.slideAt(i);
      var b = d.createElement('button');
      b.type = 'button';
      b.className = 'ov-i';
      b.setAttribute('data-i', String(i));

      var num = d.createElement('span');
      num.className = 'ov-n';
      num.textContent = String(i + 1).padStart(2, '0');
      b.appendChild(num);

      b.appendChild(d.createTextNode(sl.getAttribute('data-title') || '—'));

      var sec = sl.getAttribute('data-section');
      if (sec && SEC[sec]) {
        var s = d.createElement('span');
        s.className = 'ov-s';
        s.textContent = SEC[sec];
        b.appendChild(s);
      }
      grid.appendChild(b);
    }

    grid.addEventListener('click', function (e) {
      var t = e.target.closest('.ov-i');
      if (!t) return;
      BYZZ.go(parseInt(t.getAttribute('data-i'), 10));
      close();
    });
    built = true;
  }

  function sync() {
    var cur = BYZZ.current();
    var items = grid.querySelectorAll('.ov-i');
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('is-cur', i === cur);
    var act = items[cur];
    if (act) act.scrollIntoView({ block: 'nearest' });
  }

  function open() { if (!built) build(); sync(); root.classList.add('is-on'); }
  function close() { if (root) root.classList.remove('is-on'); }
  function toggle() { if (!built) build(); root.classList.contains('is-on') ? close() : open(); }

  BYZZ.overview = { open: open, close: close, toggle: toggle };
})(window, document);
